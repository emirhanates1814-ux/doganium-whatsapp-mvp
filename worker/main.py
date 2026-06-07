import time
import traceback
from api_client import ApiClient
from config import load_settings
from doganium_adapter import create_adapter


def main() -> None:
    settings = load_settings()
    app_settings = settings["app"]
    client = ApiClient(
        base_url=app_settings["baseUrl"],
        worker_api_key=app_settings["workerApiKey"],
    )
    adapter = create_adapter(settings)
    poll_seconds = int(app_settings.get("pollSeconds", 5))

    print("Doganium worker başladı. İş bekleniyor...")

    while True:
        try:
            job = client.get_next_job()
            if not job:
                time.sleep(poll_seconds)
                continue

            print(f"İş alındı: {job.id} / {job.plate}")
            result = adapter.run_traffic_quote(job)
            client.submit_result(job.id, result)
            print(f"İş tamamlandı: {job.id}")

        except KeyboardInterrupt:
            print("Worker durduruldu.")
            break
        except Exception as exc:
            print("Worker hatası:", exc)
            traceback.print_exc()
            # Job id bilinmeyen genel hatalarda worker devam eder.
            time.sleep(poll_seconds)


if __name__ == "__main__":
    main()
