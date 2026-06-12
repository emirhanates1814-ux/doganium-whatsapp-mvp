import json
import os
import sys
import time
from typing import Any, Dict, List

import requests


def emit(payload: Dict[str, Any], exit_code: int = 0) -> None:
    sys.stdout.write(json.dumps(payload, ensure_ascii=False, indent=2))
    sys.stdout.write("\n")
    raise SystemExit(exit_code)


def fetch_targets(port: int, attempts: int = 20, delay: float = 0.5) -> List[Dict[str, Any]]:
    url = f"http://127.0.0.1:{port}/json/list"
    last_error = None

    for _ in range(attempts):
        try:
            response = requests.get(url, timeout=2)
            response.raise_for_status()
            data = response.json()
            if isinstance(data, list):
                return data
            last_error = f"Unexpected response type: {type(data).__name__}"
        except Exception as exc:
            last_error = str(exc)
        time.sleep(delay)

    emit(
        {
            "ok": False,
            "stage": "DOGANIUM_DEVTOOLS_NOT_READY",
            "message": "Doganium DevTools portu hazÄ±r deÄŸil. Doganium'u --remote-debugging-port=9222 ile baÅŸlat.",
            "port": port,
            "error": last_error,
        },
        2,
    )


def main() -> None:
    port = int(os.environ.get("DOGANIUM_DEVTOOLS_PORT", "9222"))
    targets = fetch_targets(port)
    page_targets = [target for target in targets if target.get("type") == "page"]

    login_like = []
    for target in page_targets:
        title = str(target.get("title") or "")
        url = str(target.get("url") or "")
        if "login" in url.lower() or "giriÅŸ" in title.lower() or "doganium" in title.lower() or "doanium" in title.lower():
            login_like.append(target)

    emit(
        {
            "ok": True,
            "stage": "DEVTOOLS_READY",
            "message": "Doganium DevTools portu hazÄ±r. Manuel giriÅŸ/MFA sonrasÄ±nda otomasyon adÄ±mÄ±na geÃ§ilebilir.",
            "port": port,
            "targetCount": len(targets),
            "pageTargetCount": len(page_targets),
            "loginLikeTargetCount": len(login_like),
            "targets": page_targets,
            "nextAction": "GiriÅŸ sayfasÄ± aÃ§Ä±ksa kullanÄ±cÄ± adÄ±/ÅŸifre/MFA akÄ±ÅŸÄ± iÃ§in selector veya pencere kontrolÃ¼ baÄŸlanacak.",
        }
    )


if __name__ == "__main__":
    main()
