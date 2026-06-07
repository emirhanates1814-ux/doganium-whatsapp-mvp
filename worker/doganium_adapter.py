import ctypes
import csv
import subprocess
import time
from abc import ABC, abstractmethod
from ctypes import wintypes
from io import StringIO
from pathlib import Path
from typing import Any, Iterable, Optional

from models import Job, QuoteResult


class DoganiumAdapter(ABC):
    @abstractmethod
    def run_traffic_quote(self, job: Job) -> QuoteResult:
        raise NotImplementedError


class MockDoganiumAdapter(DoganiumAdapter):
    def run_traffic_quote(self, job: Job) -> QuoteResult:
        return QuoteResult(
            cheapestCompany="Test Sigorta",
            cheapestPrice=12500,
            highestCompany="Örnek Sigorta",
            highestPrice=18500,
            recommendedCompany="Test Sigorta",
            recommendedPrice=12500,
            pdfUrl=None,
            raw={"mode": "mock", "plate": job.plate},
        )


class PyWinAutoDoganiumAdapter(DoganiumAdapter):
    def __init__(self, settings: dict[str, Any]):
        self.settings = settings
        self.doganium_settings = settings.get("doganium", {})
        self.process_name = str(self.doganium_settings.get("processName", "Doganium.FormUI"))
        self.backend = str(self.doganium_settings.get("backend", "uia"))
        self._main_window = None

    def run_traffic_quote(self, job: Job) -> QuoteResult:
        self._connect_or_start_app()
        self._restore_and_focus_window()
        self._move_window_to_known_position()
        self._login()
        self._fill_customer_inputs(job)
        self._query_egm()
        self._query_traffic()
        self._export_traffic_report()
        self._download_pdf()

        raise RuntimeError(
            "PyWinAuto Doganium adapter iskeleti hazır, ancak gerçek koordinatlar henüz tanımlanmadı. "
            "Önce smoke ve coordinate-probe ile pencere/koordinatları doğrulayın."
        )

    def login_with_saved_credentials(self) -> bool:
        coordinates = self._get_login_button_coordinates()

        try:
            self._connect_or_start_app()
            self._restore_and_focus_window()
            self._move_window_to_known_position(100, 100, 1200, 750)
            self._click_relative(coordinates["x"], coordinates["y"])
            self._wait(5)
            return True
        except Exception:
            return False

    def _connect_or_start_app(self):
        window = self._find_main_window()
        if window is not None:
            self._main_window = window
            return window

        app_path_value = self.doganium_settings.get("appPath")
        if not app_path_value:
            raise RuntimeError("Doganium penceresi bulunamadı ve settings.json doganium.appPath boş.")

        app_path = Path(str(app_path_value))
        if not app_path.exists():
            raise RuntimeError(f"Doganium appPath bulunamadı: {app_path}")

        from pywinauto.application import Application

        Application(backend=self.backend).start(str(app_path))

        deadline = time.time() + 30
        while time.time() < deadline:
            window = self._find_main_window()
            if window is not None:
                self._main_window = window
                return window
            time.sleep(1)

        raise RuntimeError("Doganium başlatıldı ancak ana pencere bulunamadı.")

    def _find_main_window(self):
        pids = self._find_process_ids(self.process_name)
        if not pids:
            return None

        for backend in self._ordered_backends():
            window = self._find_desktop_window_for_pids(pids, backend)
            if window is not None:
                return window

            window = self._find_application_window_for_pids(pids, backend)
            if window is not None:
                return window

        return None

    def _restore_and_focus_window(self) -> None:
        window = self._get_main_window()
        hwnd = self._get_window_handle(window)

        if hwnd and self._restore_and_focus_by_handle(hwnd):
            time.sleep(0.5)
            return

        restore = getattr(window, "restore", None)
        if callable(restore):
            try:
                restore()
            except Exception:
                pass

        set_focus = getattr(window, "set_focus", None)
        if callable(set_focus):
            try:
                set_focus()
            except Exception:
                pass

        time.sleep(0.5)

    def _move_window_to_known_position(
        self,
        x: int = 100,
        y: int = 100,
        width: int = 1200,
        height: int = 750,
    ) -> None:
        window = self._get_main_window()
        hwnd = self._get_window_handle(window)

        if hwnd and self._move_window_by_handle(hwnd, x, y, width, height):
            time.sleep(0.5)
            return

        move_window = getattr(window, "move_window", None)
        if callable(move_window):
            try:
                move_window(x, y, width, height, repaint=True)
                time.sleep(0.5)
                return
            except Exception:
                pass

        raise RuntimeError("Doganium pencere handle alinamadi; pencere tasinamadi.")

    @staticmethod
    def _get_window_handle(window: Any) -> int:
        handle = None
        try:
            handle = getattr(window, "handle", None)
        except Exception:
            handle = None

        resolved_handle = PyWinAutoDoganiumAdapter._coerce_handle(handle)
        if resolved_handle:
            return resolved_handle

        try:
            element_info = getattr(window, "element_info", None)
            if element_info is not None:
                handle = getattr(element_info, "handle", None)
        except Exception:
            handle = None

        return PyWinAutoDoganiumAdapter._coerce_handle(handle)

    @staticmethod
    def _coerce_handle(handle: Any) -> int:
        if callable(handle):
            try:
                handle = handle()
            except Exception:
                return 0

        try:
            return int(handle) if handle else 0
        except (TypeError, ValueError):
            return 0

    @staticmethod
    def _get_user32() -> Any:
        user32 = ctypes.windll.user32
        user32.ShowWindowAsync.argtypes = [wintypes.HWND, ctypes.c_int]
        user32.ShowWindowAsync.restype = wintypes.BOOL
        user32.MoveWindow.argtypes = [
            wintypes.HWND,
            ctypes.c_int,
            ctypes.c_int,
            ctypes.c_int,
            ctypes.c_int,
            wintypes.BOOL,
        ]
        user32.MoveWindow.restype = wintypes.BOOL
        user32.SetForegroundWindow.argtypes = [wintypes.HWND]
        user32.SetForegroundWindow.restype = wintypes.BOOL
        return user32

    @staticmethod
    def _restore_and_focus_by_handle(hwnd: int) -> bool:
        try:
            user32 = PyWinAutoDoganiumAdapter._get_user32()
            user32.ShowWindowAsync(hwnd, 9)
            user32.SetForegroundWindow(hwnd)
            return True
        except Exception:
            return False

    @staticmethod
    def _move_window_by_handle(hwnd: int, x: int, y: int, width: int, height: int) -> bool:
        try:
            user32 = PyWinAutoDoganiumAdapter._get_user32()
            user32.ShowWindowAsync(hwnd, 9)
            moved = user32.MoveWindow(hwnd, x, y, width, height, True)
            user32.SetForegroundWindow(hwnd)
            return bool(moved)
        except Exception:
            return False

    def _click_relative(self, x: int, y: int) -> None:
        from pywinauto import mouse

        screen_x, screen_y = self._relative_to_screen(x, y)
        mouse.click(button="left", coords=(screen_x, screen_y))

    def _double_click_relative(self, x: int, y: int) -> None:
        from pywinauto import mouse

        screen_x, screen_y = self._relative_to_screen(x, y)
        mouse.double_click(button="left", coords=(screen_x, screen_y))

    def _type_text(self, text: str) -> None:
        from pywinauto import keyboard

        keyboard.send_keys(text, with_spaces=True, pause=0.01)

    def _hotkey(self, *keys: str) -> None:
        from pywinauto import keyboard

        if not keys:
            return

        keyboard.send_keys(self._format_hotkey(keys))

    def _press_key(self, key: str) -> None:
        from pywinauto import keyboard

        keyboard.send_keys(self._format_key(key))

    def _wait(self, seconds: float) -> None:
        time.sleep(seconds)

    def _clear_and_type(self, text: str) -> None:
        self._hotkey("ctrl", "a")
        self._press_key("backspace")
        self._type_text(text)

    def _get_login_button_coordinates(self) -> dict[str, int]:
        coordinates = self.doganium_settings.get("coordinates")
        if not isinstance(coordinates, dict):
            raise RuntimeError("doganium.coordinates.loginButton ayarı eksik.")

        login_button = coordinates.get("loginButton")
        if not isinstance(login_button, dict):
            raise RuntimeError("doganium.coordinates.loginButton ayarı eksik.")

        x = login_button.get("x")
        y = login_button.get("y")
        if not isinstance(x, int) or not isinstance(y, int):
            raise RuntimeError("doganium.coordinates.loginButton ayarı eksik.")

        return {"x": x, "y": y}

    def _login(self) -> None:
        # TODO: coordinate-probe ile kullanıcı adı, şifre ve giriş butonu koordinatları çıkarılacak.
        pass

    def _fill_customer_inputs(self, job: Job) -> None:
        # TODO: coordinate-probe ile TCKN, plaka, belge seri no ve doğum tarihi koordinatları çıkarılacak.
        _ = job

    def _query_egm(self) -> None:
        # TODO: EGM Sorgula koordinatı tanımlanacak.
        pass

    def _query_traffic(self) -> None:
        # TODO: Trafik Sorgula koordinatı tanımlanacak.
        pass

    def _export_traffic_report(self) -> None:
        # TODO: Trafiği Raporla koordinatı tanımlanacak.
        pass

    def _download_pdf(self) -> None:
        # TODO: PDF indirme klasörü izlenecek.
        pass

    def _get_main_window(self):
        if self._main_window is None:
            self._main_window = self._connect_or_start_app()
        return self._main_window

    def _relative_to_screen(self, x: int, y: int) -> tuple[int, int]:
        window = self._get_main_window()
        rectangle = window.rectangle()
        return rectangle.left + x, rectangle.top + y

    def _find_process_ids(self, process_name: str) -> list[int]:
        requested = self._normalize_process_name(process_name)

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
        pids: list[int] = []

        for row in rows:
            image_name = row.get("Image Name", "")
            if self._normalize_process_name(image_name) != requested:
                continue

            try:
                pids.append(int(row.get("PID", "")))
            except ValueError:
                continue

        return pids

    def _find_desktop_window_for_pids(self, pids: Iterable[int], backend: str):
        try:
            from pywinauto import Desktop

            pid_set = set(pids)
            for window in Desktop(backend=backend).windows():
                process_id = getattr(window.element_info, "process_id", None)
                if process_id in pid_set:
                    return window
        except Exception:
            return None

        return None

    def _find_application_window_for_pids(self, pids: Iterable[int], backend: str):
        from pywinauto.application import Application

        for pid in pids:
            try:
                app = Application(backend=backend).connect(process=pid, timeout=10)
                windows = app.windows()
                if windows:
                    return windows[0]
            except Exception:
                continue

        return None

    def _ordered_backends(self) -> list[str]:
        fallback = "win32" if self.backend == "uia" else "uia"
        return [self.backend, fallback]

    @staticmethod
    def _normalize_process_name(value: str) -> str:
        normalized = value.strip().lower()
        if normalized.endswith(".exe"):
            normalized = normalized[:-4]
        return normalized

    @staticmethod
    def _format_hotkey(keys: tuple[str, ...]) -> str:
        modifiers = []
        normal_keys = []

        for key in keys:
            key_lower = key.lower()
            if key_lower in ("ctrl", "control"):
                modifiers.append("^")
            elif key_lower == "shift":
                modifiers.append("+")
            elif key_lower == "alt":
                modifiers.append("%")
            else:
                normal_keys.append(key)

        if not normal_keys:
            return "".join(modifiers)

        return "".join(modifiers) + PyWinAutoDoganiumAdapter._format_key(normal_keys[-1])

    @staticmethod
    def _format_key(key: str) -> str:
        key_upper = key.upper()
        special_keys = {
            "ENTER",
            "TAB",
            "ESC",
            "ESCAPE",
            "BACKSPACE",
            "DELETE",
            "UP",
            "DOWN",
            "LEFT",
            "RIGHT",
            "HOME",
            "END",
        }

        if key_upper == "ESCAPE":
            key_upper = "ESC"

        if key_upper in special_keys or key_upper.startswith("F"):
            return "{" + key_upper + "}"

        return key


def create_adapter(settings: dict[str, Any]) -> DoganiumAdapter:
    mode = settings.get("mode", "mock")
    if mode == "mock":
        return MockDoganiumAdapter()
    if mode == "pywinauto":
        return PyWinAutoDoganiumAdapter(settings)
    raise ValueError(f"Bilinmeyen worker mode: {mode}")
