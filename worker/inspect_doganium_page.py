import base64
import hashlib
import json
import os
import random
import re
import socket
import struct
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any
from urllib.parse import urlparse


JsonDict = dict[str, Any]

DEVTOOLS_HOST = "127.0.0.1"
DEVTOOLS_PORT = 9222
OUTPUT_PATH = Path(__file__).resolve().parent.parent / ".logs" / "doganium-page-inspect.json"
EMAIL_RE = re.compile(r"[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}")
PHONE_RE = re.compile(r"(?<!\d)(?:\+?\d[\s().-]?){9,}\d(?!\d)")
TOKEN_RE = re.compile(r"(?i)\b(?:token|secret|password|pass|auth|otp|code)=([^&\s]+)")


def emit(payload: JsonDict, exit_code: int = 0) -> None:
    payload = redact_sensitive_strings(payload)
    sys.stdout.write(json.dumps(payload, ensure_ascii=False, indent=2))
    sys.stdout.write("\n")
    raise SystemExit(exit_code)


def redact_sensitive_text(value: str) -> str:
    value = EMAIL_RE.sub("[MASKED]", value)
    value = PHONE_RE.sub("[MASKED]", value)
    value = TOKEN_RE.sub(lambda match: match.group(0).split("=", 1)[0] + "=[MASKED]", value)
    return value


def redact_sensitive_strings(value: Any) -> Any:
    if isinstance(value, str):
        return redact_sensitive_text(value)
    if isinstance(value, list):
        return [redact_sensitive_strings(item) for item in value]
    if isinstance(value, dict):
        return {key: redact_sensitive_strings(item) for key, item in value.items()}
    return value


def fetch_targets(port: int = DEVTOOLS_PORT) -> list[JsonDict]:
    url = f"http://{DEVTOOLS_HOST}:{port}/json/list"
    try:
        with urllib.request.urlopen(url, timeout=3) as response:
            data = json.loads(response.read().decode("utf-8"))
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError, OSError) as exc:
        emit(
            {
                "ok": False,
                "stage": "DEVTOOLS_NOT_AVAILABLE",
                "message": f"Chrome DevTools endpoint is not reachable at {url}.",
                "error": str(exc),
            },
            2,
        )

    if not isinstance(data, list):
        emit(
            {
                "ok": False,
                "stage": "DEVTOOLS_BAD_RESPONSE",
                "message": "Chrome DevTools /json/list did not return a list.",
            },
            2,
        )

    return [target for target in data if isinstance(target, dict)]


def choose_doganium_target(targets: list[JsonDict]) -> JsonDict | None:
    pages = [
        target
        for target in targets
        if target.get("type") == "page" and target.get("webSocketDebuggerUrl")
    ]
    if not pages:
        return None

    def score(target: JsonDict) -> int:
        title = str(target.get("title") or "").lower()
        url = str(target.get("url") or "").lower()
        text = f"{title} {url}"
        value = 0
        if "doganium" in text or "doğanium" in text:
            value += 100
        if "hizli" in text or "hızlı" in text:
            value += 20
        if "teklif" in text or "poliçe" in text or "police" in text:
            value += 15
        if "login" in text or "giris" in text or "giriş" in text:
            value += 8
        if url and not url.startswith(("devtools://", "chrome://", "edge://")):
            value += 1
        return value

    return sorted(pages, key=score, reverse=True)[0]


class CdpWebSocket:
    def __init__(self, websocket_url: str, timeout: float = 8.0) -> None:
        self.websocket_url = websocket_url
        self.timeout = timeout
        self.sock: socket.socket | None = None
        self.next_id = 1

    def __enter__(self) -> "CdpWebSocket":
        self.connect()
        return self

    def __exit__(self, _exc_type: Any, _exc: Any, _tb: Any) -> None:
        self.close()

    def connect(self) -> None:
        parsed = urlparse(self.websocket_url)
        if parsed.scheme != "ws":
            raise RuntimeError(f"Unsupported WebSocket scheme: {parsed.scheme}")

        host = parsed.hostname or DEVTOOLS_HOST
        port = parsed.port or DEVTOOLS_PORT
        path = parsed.path or "/"
        if parsed.query:
            path += f"?{parsed.query}"

        key = base64.b64encode(os.urandom(16)).decode("ascii")
        request = (
            f"GET {path} HTTP/1.1\r\n"
            f"Host: {host}:{port}\r\n"
            "Upgrade: websocket\r\n"
            "Connection: Upgrade\r\n"
            f"Sec-WebSocket-Key: {key}\r\n"
            "Sec-WebSocket-Version: 13\r\n"
            "Origin: http://127.0.0.1\r\n"
            "\r\n"
        )

        sock = socket.create_connection((host, port), timeout=self.timeout)
        sock.settimeout(self.timeout)
        sock.sendall(request.encode("ascii"))
        response = self._read_http_response(sock)

        accept_seed = (key + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11").encode("ascii")
        expected_accept = base64.b64encode(hashlib.sha1(accept_seed).digest()).decode("ascii")
        if " 101 " not in response.split("\r\n", 1)[0] or expected_accept not in response:
            sock.close()
            raise RuntimeError("Chrome DevTools WebSocket handshake failed")

        self.sock = sock

    def close(self) -> None:
        if self.sock:
            try:
                self.sock.close()
            finally:
                self.sock = None

    def command(self, method: str, params: JsonDict | None = None) -> JsonDict:
        command_id = self.next_id
        self.next_id += 1
        self._send_json({"id": command_id, "method": method, "params": params or {}})

        deadline = time.time() + self.timeout
        while time.time() < deadline:
            message = self._read_json()
            if message.get("id") == command_id:
                if "error" in message:
                    raise RuntimeError(json.dumps(message["error"], ensure_ascii=False))
                return message
        raise TimeoutError(f"CDP command timeout: {method}")

    def evaluate(self, expression: str) -> Any:
        response = self.command(
            "Runtime.evaluate",
            {
                "expression": expression,
                "awaitPromise": True,
                "returnByValue": True,
                "userGesture": False,
            },
        )
        result = response.get("result", {})
        if "exceptionDetails" in result:
            raise RuntimeError(json.dumps(result["exceptionDetails"], ensure_ascii=False))
        return result.get("result", {}).get("value")

    @staticmethod
    def _read_http_response(sock: socket.socket) -> str:
        data = b""
        while b"\r\n\r\n" not in data:
            chunk = sock.recv(4096)
            if not chunk:
                break
            data += chunk
        return data.decode("iso-8859-1", errors="replace")

    def _send_json(self, payload: JsonDict) -> None:
        self._send_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")))

    def _send_text(self, text: str) -> None:
        if not self.sock:
            raise RuntimeError("WebSocket is not connected")

        payload = text.encode("utf-8")
        frame = bytearray([0x81])
        length = len(payload)
        if length < 126:
            frame.append(0x80 | length)
        elif length <= 65535:
            frame.append(0x80 | 126)
            frame.extend(struct.pack("!H", length))
        else:
            frame.append(0x80 | 127)
            frame.extend(struct.pack("!Q", length))

        mask = random.randbytes(4) if hasattr(random, "randbytes") else os.urandom(4)
        frame.extend(mask)
        frame.extend(bytes(byte ^ mask[index % 4] for index, byte in enumerate(payload)))
        self.sock.sendall(frame)

    def _read_json(self) -> JsonDict:
        data = json.loads(self._read_text())
        return data if isinstance(data, dict) else {}

    def _read_text(self) -> str:
        if not self.sock:
            raise RuntimeError("WebSocket is not connected")

        chunks: list[bytes] = []
        while True:
            header = self._recv_exact(2)
            first, second = header[0], header[1]
            opcode = first & 0x0F
            masked = bool(second & 0x80)
            length = second & 0x7F

            if length == 126:
                length = struct.unpack("!H", self._recv_exact(2))[0]
            elif length == 127:
                length = struct.unpack("!Q", self._recv_exact(8))[0]

            mask = self._recv_exact(4) if masked else b""
            payload = self._recv_exact(length) if length else b""
            if masked:
                payload = bytes(byte ^ mask[index % 4] for index, byte in enumerate(payload))

            if opcode == 0x8:
                raise RuntimeError("WebSocket closed by server")
            if opcode in (0x1, 0x0):
                chunks.append(payload)
                if first & 0x80:
                    return b"".join(chunks).decode("utf-8")
            elif opcode == 0x9:
                self._send_pong(payload)

    def _send_pong(self, payload: bytes) -> None:
        if not self.sock:
            return
        frame = bytearray([0x8A])
        frame.append(0x80 | len(payload))
        mask = os.urandom(4)
        frame.extend(mask)
        frame.extend(bytes(byte ^ mask[index % 4] for index, byte in enumerate(payload)))
        self.sock.sendall(frame)

    def _recv_exact(self, length: int) -> bytes:
        if not self.sock:
            raise RuntimeError("WebSocket is not connected")

        data = b""
        while len(data) < length:
            chunk = self.sock.recv(length - len(data))
            if not chunk:
                raise RuntimeError("Unexpected WebSocket EOF")
            data += chunk
        return data


INSPECT_EXPRESSION = r"""
(() => {
  const keywords = ['EGM', 'Trafik', 'Rapor', 'PDF', 'Sorgula', 'Poliçe', 'Teklif'];
  const secretPattern = /email|password|pass|auth|code|otp|token|secret|phone|tel/i;
  const visible = (el) => {
    const style = window.getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    return style && style.display !== 'none' && style.visibility !== 'hidden' &&
      Number(style.opacity || '1') > 0 && rect.width > 0 && rect.height > 0;
  };
  const textOf = (el) => (el.innerText || el.textContent || el.value || '').replace(/\s+/g, ' ').trim();
  const attr = (el, name) => el.getAttribute(name) || '';
  const isSensitiveInput = (el) => {
    const tag = el.tagName.toLowerCase();
    const type = (attr(el, 'type') || '').toLowerCase();
    const haystack = [type, el.id, attr(el, 'name'), attr(el, 'placeholder'), attr(el, 'aria-label')].join(' ');
    return ['input', 'select', 'textarea'].includes(tag) && (type === 'hidden' || secretPattern.test(haystack));
  };
  const maskIfSensitive = (el, value) => {
    if (isSensitiveInput(el)) return '[MASKED]';
    if (!value) return '';
    return String(value).slice(0, 160);
  };
  const elementInfo = (el) => ({
    tagName: el.tagName.toLowerCase(),
    text: maskIfSensitive(el, textOf(el)),
    id: el.id || '',
    name: attr(el, 'name'),
    type: attr(el, 'type'),
    href: secretPattern.test(attr(el, 'href')) ? '[MASKED]' : attr(el, 'href').slice(0, 240),
    placeholder: attr(el, 'placeholder'),
    ariaLabel: attr(el, 'aria-label'),
    value: maskIfSensitive(el, el.value || ''),
  });
  const visibleElements = (selector) => Array.from(document.querySelectorAll(selector)).filter(visible).map(elementInfo);
  const snippets = [];
  const walker = document.createTreeWalker(document.body || document.documentElement, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    const parent = node.parentElement;
    if (!parent || !visible(parent)) continue;
    const text = (node.nodeValue || '').replace(/\s+/g, ' ').trim();
    if (!text) continue;
    if (keywords.some((keyword) => text.toLocaleLowerCase('tr-TR').includes(keyword.toLocaleLowerCase('tr-TR')))) {
      snippets.push(text.slice(0, 240));
    }
    if (snippets.length >= 80) break;
  }
  return {
    title: document.title || '',
    url: location.href || '',
    visibleButtons: visibleElements('button, input[type="button"], input[type="submit"]'),
    visibleLinks: visibleElements('a[href]'),
    visibleInputs: visibleElements('input, textarea, select'),
    keywordTextSnippets: snippets,
  };
})()
"""


def inspect_page(target: JsonDict) -> JsonDict:
    websocket_url = str(target.get("webSocketDebuggerUrl") or "")
    with CdpWebSocket(websocket_url) as cdp:
        value = cdp.evaluate(INSPECT_EXPRESSION)
    return value if isinstance(value, dict) else {}


def write_output(payload: JsonDict) -> None:
    payload = redact_sensitive_strings(payload)
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT_PATH.open("w", encoding="utf-8") as handle:
        json.dump(payload, handle, ensure_ascii=False, indent=2)
        handle.write("\n")


def has_mfa_dom(page: JsonDict) -> bool:
    for item in page.get("visibleInputs", []):
        if not isinstance(item, dict):
            continue
        text = " ".join(str(item.get(key) or "") for key in ("id", "name")).lower()
        if "authcode" in text or "auth" in text or "code" in text or "otp" in text:
            return True

    for item in page.get("visibleButtons", []):
        if not isinstance(item, dict):
            continue
        text = str(item.get("text") or "").lower()
        if "doğrulama yap" in text or "dogrulama yap" in text or "doğrulama" in text or "dogrulama" in text:
            return True

    return False


def stage_for_page(page: JsonDict) -> str:
    if has_mfa_dom(page):
        return "MANUAL_MFA_REQUIRED"

    url = str(page.get("url", ""))
    normalized = url.lower()
    if "/login/twofactor" in normalized:
        return "MANUAL_MFA_REQUIRED"
    if "/login/login2" in normalized:
        return "LOGIN_PAGE_INSPECTED"
    return "DOGANIUM_PAGE_INSPECTED"


def main() -> None:
    targets = fetch_targets()
    target = choose_doganium_target(targets)
    if not target:
        payload = {
            "ok": False,
            "stage": "DOGANIUM_TARGET_NOT_FOUND",
            "message": "No active Doganium page target was found in Chrome DevTools.",
            "devtoolsUrl": f"http://{DEVTOOLS_HOST}:{DEVTOOLS_PORT}",
            "targets": targets,
        }
        write_output(payload)
        emit(payload, 2)

    try:
        page = inspect_page(target)
        page_url = str(page.get("url", ""))
        payload = {
            "ok": True,
            "stage": stage_for_page(page),
            "devtoolsUrl": f"http://{DEVTOOLS_HOST}:{DEVTOOLS_PORT}",
            "target": {
                "id": target.get("id"),
                "type": target.get("type"),
                "title": target.get("title"),
                "url": target.get("url"),
            },
            "page": {
                "title": page.get("title", ""),
                "url": page_url,
            },
            "visibleButtons": page.get("visibleButtons", []),
            "visibleLinks": page.get("visibleLinks", []),
            "visibleInputs": page.get("visibleInputs", []),
            "keywordTextSnippets": page.get("keywordTextSnippets", []),
            "outputPath": str(OUTPUT_PATH),
        }
    except Exception as exc:
        payload = {
            "ok": False,
            "stage": "DOGANIUM_PAGE_INSPECT_FAILED",
            "message": "Failed to inspect the selected Doganium page target.",
            "error": str(exc),
            "target": {
                "id": target.get("id"),
                "type": target.get("type"),
                "title": target.get("title"),
                "url": target.get("url"),
            },
            "outputPath": str(OUTPUT_PATH),
        }
        write_output(payload)
        emit(payload, 2)

    write_output(payload)
    emit(payload)


if __name__ == "__main__":
    main()
