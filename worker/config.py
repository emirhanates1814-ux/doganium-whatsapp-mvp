import json
import sys
from pathlib import Path
from typing import Any


def _candidate_settings_paths() -> list[Path]:
    cwd = Path.cwd()

    paths: list[Path] = [
        cwd / "worker" / "settings.json",
        cwd / "settings.json",
    ]

    if getattr(sys, "frozen", False):
        exe_dir = Path(sys.executable).resolve().parent
        paths.extend(
            [
                exe_dir / "settings.json",
                exe_dir.parent / "settings.json",
                exe_dir.parent / "worker" / "settings.json",
            ]
        )
    else:
        module_dir = Path(__file__).resolve().parent
        paths.extend(
            [
                module_dir / "settings.json",
                module_dir.parent / "worker" / "settings.json",
            ]
        )

    unique_paths: list[Path] = []
    for path in paths:
        if path not in unique_paths:
            unique_paths.append(path)

    return unique_paths


def load_settings() -> dict[str, Any]:
    for path in _candidate_settings_paths():
        if path.exists():
            with path.open("r", encoding="utf-8-sig") as file:
                settings = json.load(file)

            worker_api_key = settings.get("workerApiKey")
            if not worker_api_key:
                raise KeyError(
                    f"{path} içinde workerApiKey bulunamadı. "
                    "scripts/setup-worker.ps1 çalıştırın."
                )

            return settings

    searched = "\n".join(str(path) for path in _candidate_settings_paths())
    raise FileNotFoundError(
        "settings.json bulunamadı.\n"
        "Önce proje kökünde şu komutu çalıştırın:\n"
        ".\\scripts\\setup-worker.ps1 -ApiBaseUrl \"http://localhost:3000\" -Mode \"mock\"\n\n"
        f"Aranan yollar:\n{searched}"
    )
