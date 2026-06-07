import requests
from typing import Optional
from models import Job, QuoteResult

class ApiClient:
    def __init__(self, base_url: str, worker_api_key: str):
        self.base_url = base_url.rstrip("/")
        self.headers = {"x-worker-api-key": worker_api_key}

    def get_next_job(self) -> Optional[Job]:
        response = requests.get(f"{self.base_url}/api/jobs?mode=worker", headers=self.headers, timeout=30)
        response.raise_for_status()
        payload = response.json()
        if not payload.get("job"):
            return None
        return Job(**payload["job"])

    def submit_result(self, job_id: str, result: QuoteResult) -> None:
        response = requests.post(
            f"{self.base_url}/api/jobs/{job_id}/result",
            headers={**self.headers, "Content-Type": "application/json"},
            json={"status": "parsed", "result": result.to_dict()},
            timeout=30,
        )
        response.raise_for_status()

    def submit_error(self, job_id: str, error_message: str) -> None:
        response = requests.post(
            f"{self.base_url}/api/jobs/{job_id}/result",
            headers={**self.headers, "Content-Type": "application/json"},
            json={"status": "failed", "errorMessage": error_message},
            timeout=30,
        )
        response.raise_for_status()
