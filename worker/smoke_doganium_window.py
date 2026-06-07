from config import load_settings
from doganium_adapter import PyWinAutoDoganiumAdapter


def main() -> None:
    settings = load_settings()
    adapter = PyWinAutoDoganiumAdapter(settings)
    adapter._connect_or_start_app()
    adapter._restore_and_focus_window()
    adapter._move_window_to_known_position(100, 100, 1200, 750)
    print("Smoke test başarılı")


if __name__ == "__main__":
    main()
