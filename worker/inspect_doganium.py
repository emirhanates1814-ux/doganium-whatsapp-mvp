import argparse
import csv
import subprocess
from io import StringIO
from pathlib import Path
from typing import Iterable, Literal, Optional

from pywinauto import Desktop
from pywinauto.application import Application


Backend = Literal["uia", "win32"]

OUTPUT_DIR = Path(__file__).resolve().parent / "inspect-output"
OUTPUT_PATH = OUTPUT_DIR / "doganium-ui-tree.txt"
EXCLUDED_TITLE_CLASSES = {"Chrome_WidgetWin_1"}
EXCLUDED_TITLE_TEXTS = ("visual studio code",)


def main() -> None:
    parser = argparse.ArgumentParser(description="Doganium UI Automation inspect helper")
    parser.add_argument("--list-windows", action="store_true", help="List open top-level windows")
    parser.add_argument("--title", help="Dump a window whose title contains this text")
    parser.add_argument("--process-name", help="Dump windows for the given process name")
    parser.add_argument("--pid", type=int, help="Connect directly to this process id")
    parser.add_argument("--backend", choices=["uia", "win32"], default="uia", help="pywinauto backend")
    parser.add_argument("--dump-all", action="store_true", help="Dump all visible top-level windows")
    args = parser.parse_args()

    backend = args.backend

    if args.pid:
        lines = dump_by_pid(args.pid, backend)
    elif args.process_name:
        lines = dump_by_process_name(args.process_name, backend)
    else:
        desktop = Desktop(backend=backend)
        if args.title:
            lines = dump_window_by_title(desktop, args.title, backend)
        elif args.dump_all:
            lines = dump_all_windows(desktop, backend)
        else:
            lines = list_windows(desktop, backend)

    write_output(lines)


def list_windows(desktop: Desktop, backend: Backend) -> list[str]:
    lines = [f"Open windows ({backend})", "==================", ""]

    for window in desktop.windows():
        info = safe_element_info(window)
        lines.append(format_window_summary(info))

    return lines


def dump_by_pid(pid: int, preferred_backend: Backend) -> list[str]:
    errors: list[str] = []

    for backend in ordered_backends(preferred_backend):
        try:
            app = Application(backend=backend).connect(process=pid, timeout=10)
            windows = app.windows()
            if not windows:
                errors.append(f"{backend}: PID {pid} için pencere bulunamadı.")
                continue

            lines = [
                f"PID match: {pid}",
                f"Backend: {backend}",
                f"Output: {OUTPUT_PATH}",
                "",
            ]
            lines.extend(dump_windows(windows, backend))
            return lines
        except Exception as exc:
            errors.append(f"{backend}: {type(exc).__name__}: {exc}")

    return [f"PID {pid} için pencereye bağlanılamadı.", "", *errors]


def dump_by_process_name(process_name: str, backend: Backend) -> list[str]:
    matches = find_process_ids_by_name(process_name)

    if not matches:
        return [f"'{process_name}' process name ile eşleşen süreç bulunamadı."]

    all_windows = []
    desktop = Desktop(backend=backend)
    match_pids = {match["pid"] for match in matches}

    for window in desktop.windows():
        info = safe_element_info(window)
        if info["process_id_int"] in match_pids:
            all_windows.append(window)

    if not all_windows:
        lines = [
            f"Process bulundu ama {backend} backend ile top-level pencere yakalanamadı.",
            "Eşleşen processler:",
        ]
        lines.extend(
            f"- pid={match['pid']} process={match['name']} title={match['title']}" for match in matches
        )
        lines.append("Öneri: --pid <pid> veya --backend win32 deneyin.")
        return lines

    lines = [
        f"Process match: {process_name}",
        f"Backend: {backend}",
        f"Output: {OUTPUT_PATH}",
        "",
    ]
    lines.extend(dump_windows(all_windows, backend))
    return lines


def dump_window_by_title(desktop: Desktop, title: str, backend: Backend) -> list[str]:
    title_lower = title.lower()
    candidates = []

    for window in desktop.windows():
        info = safe_element_info(window)
        window_text = info["window_text"]
        if title_lower in window_text.lower() and not should_exclude_title_candidate(info, title):
            candidates.append(window)

    if not candidates:
        return [f"'{title}' başlığını içeren pencere bulunamadı."]

    if len(candidates) > 1:
        lines = [f"Ambiguous match: '{title}' için birden fazla pencere bulundu.", ""]
        lines.extend(format_window_summary(safe_element_info(candidate)) for candidate in candidates)
        lines.append("")
        lines.append("Daha net seçim için --process-name Doganium.FormUI veya --pid <pid> kullanın.")
        return lines

    window = candidates[0]
    info = safe_element_info(window)
    lines = [
        f"Window match: {info['window_text']}",
        f"Backend: {backend}",
        f"Output: {OUTPUT_PATH}",
        "",
    ]
    lines.extend(dump_control_tree(window))
    return lines


def dump_all_windows(desktop: Desktop, backend: Backend) -> list[str]:
    lines = [f"All top-level windows ({backend})", "==========================", ""]
    lines.extend(dump_windows(desktop.windows(), backend))
    return lines


def dump_windows(windows: Iterable, backend: Backend) -> list[str]:
    lines: list[str] = []

    for window in windows:
        info = safe_element_info(window)
        lines.append(format_window_summary(info))
        lines.extend(dump_control_tree(window))
        lines.append("")

    if not lines:
        return [f"{backend} backend ile pencere bulunamadı."]

    return lines


def dump_control_tree(root) -> list[str]:
    lines: list[str] = []
    walk_control(root, lines, depth=0)
    return lines


def walk_control(control, lines: list[str], depth: int) -> None:
    info = safe_element_info(control)
    indent = "  " * depth
    lines.append(
        f"{indent}- control_type={info['control_type']} | "
        f"window_text={info['window_text']} | "
        f"automation_id={info['automation_id']} | "
        f"class_name={info['class_name']} | "
        f"rectangle={info['rectangle']} | "
        f"enabled={info['enabled']} | visible={info['visible']}"
    )

    for child in safe_children(control):
        walk_control(child, lines, depth + 1)


def find_process_ids_by_name(process_name: str) -> list[dict[str, str | int]]:
    requested = normalize_process_name(process_name)

    try:
        result = subprocess.run(
            ["tasklist", "/v", "/fo", "csv"],
            capture_output=True,
            text=True,
            check=True,
            encoding="utf-8",
            errors="replace",
        )
    except Exception:
        return []

    rows = csv.DictReader(StringIO(result.stdout))
    matches: list[dict[str, str | int]] = []

    for row in rows:
        image_name = row.get("Image Name", "")
        pid_text = row.get("PID", "")
        if normalize_process_name(image_name) != requested:
            continue

        try:
            pid = int(pid_text)
        except ValueError:
            continue

        matches.append(
            {
                "pid": pid,
                "name": image_name,
                "title": row.get("Window Title", ""),
            }
        )

    return matches


def normalize_process_name(value: str) -> str:
    normalized = value.strip().lower()
    if normalized.endswith(".exe"):
        normalized = normalized[:-4]
    return normalized


def ordered_backends(preferred_backend: Backend) -> list[Backend]:
    fallback_backend: Backend = "win32" if preferred_backend == "uia" else "uia"
    return [preferred_backend, fallback_backend]


def should_exclude_title_candidate(info: dict[str, str | int], title: str) -> bool:
    title_is_doganium = "dogan" in title.lower() or "doğ" in title.lower()
    if not title_is_doganium:
        return False

    class_name = str(info["class_name"])
    window_text = str(info["window_text"]).lower()
    return class_name in EXCLUDED_TITLE_CLASSES or any(text in window_text for text in EXCLUDED_TITLE_TEXTS)


def safe_children(control) -> Iterable:
    try:
        return control.children()
    except Exception:
        return []


def safe_element_info(control) -> dict[str, str | int]:
    element_info = getattr(control, "element_info", None)
    control_type = safe_attr(element_info, "control_type")
    class_name = safe_attr(element_info, "class_name")
    process_id = safe_int_attr(element_info, "process_id")

    return {
        "control_type": control_type,
        "window_text": safe_window_text(control_type, class_name, control),
        "automation_id": safe_attr(element_info, "automation_id"),
        "class_name": class_name,
        "rectangle": str(safe_rectangle(control)),
        "enabled": str(safe_bool_call(control, "is_enabled")),
        "visible": str(safe_bool_call(control, "is_visible")),
        "process_id": str(process_id) if process_id else "",
        "process_id_int": process_id,
    }


def format_window_summary(info: dict[str, str | int]) -> str:
    return " | ".join(
        [
            f"pid={info['process_id']}",
            f"class={info['class_name']}",
            f"title={info['window_text']}",
        ]
    )


def safe_window_text(control_type: str, class_name: str, control) -> str:
    if is_sensitive_control(control_type, class_name):
        return "[redacted]"

    return safe_text(control)


def is_sensitive_control(control_type: str, class_name: str) -> bool:
    combined = f"{control_type} {class_name}".lower()
    return "password" in combined


def safe_text(control) -> str:
    try:
        return sanitize_text(control.window_text())
    except Exception:
        return ""


def sanitize_text(value: Optional[str]) -> str:
    if not value:
        return ""

    normalized = value.replace("\r", " ").replace("\n", " ").strip()
    return normalized if normalized else ""


def safe_attr(element_info, name: str) -> str:
    if element_info is None:
        return ""

    try:
        value = getattr(element_info, name)
    except Exception:
        return ""

    return "" if value is None else str(value)


def safe_int_attr(element_info, name: str) -> int:
    value = safe_attr(element_info, name)
    try:
        return int(value)
    except ValueError:
        return 0


def safe_rectangle(control) -> str:
    try:
        return control.rectangle()
    except Exception:
        return ""


def safe_bool_call(control, method_name: str) -> bool:
    try:
        method = getattr(control, method_name)
        return bool(method())
    except Exception:
        return False


def write_output(lines: list[str]) -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    content = "\n".join(lines)
    print(content)
    OUTPUT_PATH.write_text(content + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
