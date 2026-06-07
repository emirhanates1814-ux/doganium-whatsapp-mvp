from config import load_settings
from doganium_adapter import PyWinAutoDoganiumAdapter


def main() -> None:
    settings = load_settings()
    adapter = PyWinAutoDoganiumAdapter(settings)

    if not adapter.login_with_saved_credentials():
        raise RuntimeError("Login click smoke test başarısız")

    print("Login click smoke test başarılı")


if __name__ == "__main__":
    main()
