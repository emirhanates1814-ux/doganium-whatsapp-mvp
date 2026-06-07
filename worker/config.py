import json
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent


def load_settings() -> dict[str, Any]:
    path = ROOT / "settings.json"
    if not path.exists():
        raise FileNotFoundError(
            "worker/settings.json bulunamadı. settings.example.json dosyasını settings.json olarak kopyalayın."
        )

    with path.open("r", encoding="utf-8") as file:
        return json.load(file)
