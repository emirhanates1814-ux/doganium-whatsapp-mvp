import ctypes
import time
from ctypes import wintypes

from config import load_settings
from doganium_adapter import PyWinAutoDoganiumAdapter


class Point(ctypes.Structure):
    _fields_ = [("x", wintypes.LONG), ("y", wintypes.LONG)]


def get_cursor_position() -> tuple[int, int]:
    point = Point()
    ctypes.windll.user32.GetCursorPos(ctypes.byref(point))
    return int(point.x), int(point.y)


def main() -> None:
    settings = load_settings()
    adapter = PyWinAutoDoganiumAdapter(settings)
    window = adapter._find_main_window()

    if window is None:
        raise RuntimeError("Doganium.FormUI penceresi bulunamadı. Önce Doganium uygulamasını açın.")

    adapter._main_window = window
    adapter._restore_and_focus_window()
    adapter._move_window_to_known_position(100, 100, 1200, 750)

    print("Coordinate probe başladı. Ctrl+C ile durdurun.")

    while True:
        rectangle = adapter._get_main_window().rectangle()
        screen_x, screen_y = get_cursor_position()
        relative_x = screen_x - rectangle.left
        relative_y = screen_y - rectangle.top
        print(
            f"screenX={screen_x} screenY={screen_y} "
            f"relativeX={relative_x} relativeY={relative_y}"
        )
        time.sleep(1)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("Coordinate probe durduruldu")
