import time

from api_client import ApiClient
from config import load_settings
from doganium_adapter import create_adapter


def main() -> None:
    settings = load_settings()
    client = ApiClient(
        base_url=settings.get("apiBaseUrl", "http://localhost:3000"),
        worker_api_key=settings["workerApiKey"],
    )
    adapter = create_adapter(settings)
    poll_seconds = int(settings.get("pollIntervalSeconds", 5))

    print("İş bekleniyor")

    while True:
        current_job_id = None

        try:
            job = client.get_next_job()
            if not job:
                time.sleep(poll_seconds)
                continue

            current_job_id = job.id
            print(f"İş alındı: {job.id}")
            result = adapter.run_traffic_quote(job)
            client.submit_result(job.id, result)
            print(f"İş tamamlandı: {job.id}")

        except KeyboardInterrupt:
            print("Worker durduruldu")
            break
        except Exception as exc:
            safe_message = str(exc)[:500]
            print(f"Hata oluştu: {safe_message}")

            if current_job_id:
                try:
                    client.submit_error(current_job_id, safe_message)
                except Exception as submit_exc:
                    print(f"Hata durumu API'ye yazılamadı: {str(submit_exc)[:300]}")

            time.sleep(poll_seconds)


if __name__ == "__main__":
    main()
