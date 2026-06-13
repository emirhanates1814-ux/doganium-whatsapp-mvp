import base64
import hashlib
import json
import os
import random
import socket
import struct
import sys
import time
import urllib.error
import urllib.request
from typing import Any, Dict, List, Optional
from urllib.parse import urlparse


JsonDict = Dict[str, Any]


def emit(payload: JsonDict, exit_code: int = 0) -> None:
    sys.stdout.write(json.dumps(payload, ensure_ascii=False, indent=2))
    sys.stdout.write("\n")
    raise SystemExit(exit_code)


def project_root() -> str:
    return os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))


def read_desktop_settings() -> JsonDict:
    settings_path = os.path.join(project_root(), ".desktop", "settings.json")
    if not os.path.exists(settings_path):
        return {}

    try:
        with open(settings_path, "r", encoding="utf-8") as handle:
            data = json.load(handle)
            return data if isinstance(data, dict) else {}
    except Exception:
        return {}


def fetch_targets(port: int, attempts: int = 20, delay: float = 0.5) -> List[JsonDict]:
    url = f"http://127.0.0.1:{port}/json/list"
    last_error = None

    for _ in range(attempts):
        try:
            with urllib.request.urlopen(url, timeout=2) as response:
                data = json.loads(response.read().decode("utf-8"))
                if isinstance(data, list):
                    return [target for target in data if isinstance(target, dict)]
                last_error = f"Unexpected response type: {type(data).__name__}"
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError, OSError) as exc:
            last_error = str(exc)
        time.sleep(delay)

    emit(
        {
            "ok": False,
            "stage": "DOGANIUM_DEVTOOLS_NOT_READY",
            "message": "Doganium DevTools portu hazır değil. Doganium'u --remote-debugging-port=9222 ile başlatın.",
            "port": port,
            "error": last_error,
        },
        2,
    )
    return []


def choose_page_target(targets: List[JsonDict]) -> Optional[JsonDict]:
    page_targets = [target for target in targets if target.get("type") == "page" and target.get("webSocketDebuggerUrl")]
    if not page_targets:
        return None

    def score(target: JsonDict) -> int:
        title = str(target.get("title") or "").lower()
        url = str(target.get("url") or "").lower()
        value = 0
        if "doganium" in title or "doğanium" in title or "doganium" in url:
            value += 10
        if "login" in url or "login" in title:
            value += 8
        if "hızlı teklif" in title or "hizli teklif" in title:
            value += 4
        return value

    return sorted(page_targets, key=score, reverse=True)[0]


class CdpWebSocket:
    def __init__(self, websocket_url: str, timeout: float = 5.0) -> None:
        self.websocket_url = websocket_url
        self.timeout = timeout
        self.sock: Optional[socket.socket] = None
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

        host = parsed.hostname or "127.0.0.1"
        port = parsed.port or 80
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

    def command(self, method: str, params: Optional[JsonDict] = None) -> JsonDict:
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

    def evaluate(self, expression: str, timeout: float = 5.0) -> Any:
        previous_timeout = self.timeout
        self.timeout = timeout
        try:
            response = self.command(
                "Runtime.evaluate",
                {
                    "expression": expression,
                    "awaitPromise": True,
                    "returnByValue": True,
                    "userGesture": True,
                },
            )
        finally:
            self.timeout = previous_timeout

        result = response.get("result", {}).get("result", {})
        if "exceptionDetails" in response.get("result", {}):
            raise RuntimeError(json.dumps(response["result"]["exceptionDetails"], ensure_ascii=False))
        return result.get("value")

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
        text = self._read_text()
        data = json.loads(text)
        return data if isinstance(data, dict) else {}

    def _read_text(self) -> str:
        if not self.sock:
            raise RuntimeError("WebSocket is not connected")

        chunks: List[bytes] = []
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
        length = len(payload)
        frame.append(0x80 | length)
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
  const visible = (el) => {
    const style = window.getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    return style && style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity || '1') > 0 && rect.width > 0 && rect.height > 0;
  };
  const elementData = (el) => ({
    tagName: el.tagName,
    type: el.getAttribute('type') || '',
    id: el.id || '',
    name: el.getAttribute('name') || '',
    placeholder: el.getAttribute('placeholder') || '',
    ariaLabel: el.getAttribute('aria-label') || '',
    innerText: (el.innerText || el.value || '').slice(0, 120),
    className: typeof el.className === 'string' ? el.className : '',
    isVisible: visible(el)
  });
  const elements = Array.from(document.querySelectorAll('input, button, a')).map(elementData);
  const bodyText = (document.body && document.body.innerText || '').toLowerCase();
  return {
    title: document.title,
    url: location.href,
    elements,
    mfaDetected: /otp|mfa|authenticator|google authenticator|doğrulama|dogrulama|kod|code/.test(bodyText)
  };
})()
"""


def login_expression(username: str, password: str) -> str:
    credentials = json.dumps({"username": username, "password": password}, ensure_ascii=False)
    return f"""
(() => {{
  const credentials = {credentials};
  const visible = (el) => {{
    const style = window.getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    return style && style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity || '1') > 0 && rect.width > 0 && rect.height > 0;
  }};
  const inputs = Array.from(document.querySelectorAll('input')).filter(visible);
  const textScore = (el) => {{
    const value = [
      el.type || '',
      el.id || '',
      el.name || '',
      el.placeholder || '',
      el.getAttribute('aria-label') || '',
      el.className || ''
    ].join(' ').toLowerCase();
    let score = 0;
    if (/user|kullan|email|e-?posta|mail|login/.test(value)) score += 8;
    if (/tc|tckn|kimlik/.test(value)) score += 3;
    if ((el.type || '').toLowerCase() === 'text') score += 2;
    if ((el.type || '').toLowerCase() === 'email') score += 4;
    return score;
  }};
  const passwordInput = inputs.find((el) => (el.type || '').toLowerCase() === 'password');
  const usernameInput = inputs
    .filter((el) => el !== passwordInput && !['hidden','checkbox','radio','submit','button'].includes((el.type || '').toLowerCase()))
    .sort((a, b) => textScore(b) - textScore(a))[0];

  const setValue = (el, value) => {{
    if (!el) return false;
    el.focus();
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(el, value);
    el.dispatchEvent(new Event('input', {{ bubbles: true }}));
    el.dispatchEvent(new Event('change', {{ bubbles: true }}));
    return true;
  }};

  const usernameFilled = setValue(usernameInput, credentials.username);
  const passwordFilled = setValue(passwordInput, credentials.password);
  const buttons = Array.from(document.querySelectorAll('button, input[type=submit], a')).filter(visible);
  const buttonScore = (el) => {{
    const value = [
      el.innerText || '',
      el.value || '',
      el.id || '',
      el.name || '',
      el.className || '',
      el.getAttribute('aria-label') || ''
    ].join(' ').toLowerCase();
    let score = 0;
    if (/giriş|giris|login|oturum|submit|sign in/.test(value)) score += 10;
    if (el.tagName === 'BUTTON') score += 2;
    return score;
  }};
  const submitButton = buttons.sort((a, b) => buttonScore(b) - buttonScore(a))[0];
  if (submitButton) submitButton.click();

  return {{
    usernameFound: Boolean(usernameInput),
    passwordFound: Boolean(passwordInput),
    usernameFilled,
    passwordFilled,
    submitClicked: Boolean(submitButton),
    submitText: submitButton ? (submitButton.innerText || submitButton.value || '').slice(0, 80) : ''
  }};
}})()
"""


def inspect_page(cdp: CdpWebSocket) -> JsonDict:
    value = cdp.evaluate(INSPECT_EXPRESSION)
    return value if isinstance(value, dict) else {}


def main() -> None:
    port = int(os.environ.get("DOGANIUM_DEVTOOLS_PORT", "9222"))
    targets = fetch_targets(port)
    target = choose_page_target(targets)
    if not target:
        emit(
            {
                "ok": False,
                "stage": "DOGANIUM_TARGET_NOT_FOUND",
                "message": "Doganium DevTools içinde uygun page target bulunamadı.",
                "targets": targets,
            },
            2,
        )

    websocket_url = str(target.get("webSocketDebuggerUrl") or "")
    settings = read_desktop_settings()
    username = str(settings.get("doganiumUsername") or "").strip()
    password = str(settings.get("doganiumPassword") or "")

    with CdpWebSocket(websocket_url, timeout=8.0) as cdp:
        inspected = inspect_page(cdp)
        if not username or not password:
            emit(
                {
                    "ok": True,
                    "stage": "LOGIN_PAGE_INSPECTED",
                    "message": "Login page inspected. Credentials are missing in .desktop/settings.json.",
                    "port": port,
                    "targets": [target],
                    "elements": inspected.get("elements", []),
                    "page": {
                        "title": inspected.get("title"),
                        "url": inspected.get("url"),
                        "mfaDetected": inspected.get("mfaDetected"),
                    },
                }
            )

        login_result = cdp.evaluate(login_expression(username, password))
        time.sleep(2)
        after_submit = inspect_page(cdp)

    if after_submit.get("mfaDetected"):
        emit(
            {
                "ok": True,
                "stage": "MANUAL_MFA_REQUIRED",
                "message": "Username/password submitted. Manual MFA is required.",
                "loginResult": login_result,
                "page": {
                    "title": after_submit.get("title"),
                    "url": after_submit.get("url"),
                },
            }
        )

    emit(
        {
            "ok": True,
            "stage": "LOGIN_SUBMITTED_OR_READY",
            "message": "Login submit attempted. Check Doganium window.",
            "loginResult": login_result,
            "page": {
                "title": after_submit.get("title"),
                "url": after_submit.get("url"),
                "mfaDetected": after_submit.get("mfaDetected"),
            },
        }
    )


if __name__ == "__main__":
    main()
