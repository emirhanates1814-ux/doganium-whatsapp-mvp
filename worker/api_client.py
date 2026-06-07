from typing import Optional

import requests

from models import Job, QuoteResult


class ApiClient:
    def __init__(self, base_url: str, worker_api_key: str):
        self.base_url = base_url.rstrip("/")
        self.headers = {
            "Authorization": f"Bearer {worker_api_key}",
            "x-worker-api-key": worker_api_key,
        }

    def get_next_job(self) -> Optional[Job]:
        response = requests.get(f"{self.base_url}/api/jobs", headers=self.headers, timeout=30)
        response.raise_for_status()
        payload = response.json()
        if not payload.get("job"):
            return None
        return Job(**payload["job"])

    def submit_result(self, request_id: str, result: QuoteResult) -> None:
        response = requests.post(
            f"{self.base_url}/api/jobs",
            headers={**self.headers, "Content-Type": "application/json"},
            json={"requestId": request_id, "status": "parsed", "result": result.to_dict()},
            timeout=30,
        )
        response.raise_for_status()

    def submit_error(self, request_id: str, error_message: str) -> None:
        response = requests.post(
            f"{self.base_url}/api/jobs",
            headers={**self.headers, "Content-Type": "application/json"},
            json={"requestId": request_id, "status": "failed", "errorMessage": error_message[:1000]},
            timeout=30,
        )
        response.raise_for_status()
