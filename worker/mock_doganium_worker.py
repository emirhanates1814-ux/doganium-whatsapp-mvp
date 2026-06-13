import argparse
import json
import time
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT_DIR / ".data"
JOBS_PATH = DATA_DIR / "traffic-jobs.json"
RESULTS_PATH = DATA_DIR / "traffic-results.json"


def read_json(path: Path, fallback):
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    if not path.exists():
        write_json(path, fallback)
        return fallback

    content = path.read_text(encoding="utf-8").strip()
    if not content:
        return fallback

    return json.loads(content)


def write_json(path: Path, value) -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def now_iso() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


def find_job(jobs: list[dict], job_id: str | None) -> dict | None:
    if job_id:
        return next((job for job in jobs if job.get("id") == job_id), None)

    pending_jobs = [job for job in jobs if job.get("status") == "pending"]
    pending_jobs.sort(key=lambda job: str(job.get("createdAt", "")))
    return pending_jobs[0] if pending_jobs else None


def update_job(jobs: list[dict], job_id: str, status: str, error_message: str | None = None) -> None:
    for job in jobs:
        if job.get("id") == job_id:
            job["status"] = status
            job["updatedAt"] = now_iso()
            if error_message:
                job["errorMessage"] = error_message
            elif "errorMessage" in job:
                del job["errorMessage"]
            return
    raise RuntimeError(f"Job not found: {job_id}")


def normalize_results(raw_results) -> dict:
    if isinstance(raw_results, dict):
        return raw_results

    if isinstance(raw_results, list):
        return {
            str(result["jobId"]): result
            for result in raw_results
            if isinstance(result, dict) and result.get("jobId")
        }

    return {}


def save_mock_result(results: dict, job_id: str) -> None:
    current_time = now_iso()
    existing = results.get(job_id)
    result = {
        "jobId": job_id,
        "quotes": [
            {
                "company": "Mock Sigorta",
                "premium": 12345.67,
                "currency": "TRY",
                "description": "Mock trafik teklifi",
            },
            {
                "company": "Ares Test Sigorta",
                "premium": 14750.0,
                "currency": "TRY",
                "description": "Alternatif mock teklif",
            },
            {
                "company": "Ornek Sigorta",
                "premium": 18000.0,
                "currency": "TRY",
                "description": "Yuksek mock teklif",
            },
        ],
        "cheapestPremium": 12345.67,
        "highestPremium": 18000.0,
        "summary": "Mock teklif sonucu",
        "createdAt": existing.get("createdAt") if existing else current_time,
        "updatedAt": current_time,
    }

    results[job_id] = result


def main() -> int:
    parser = argparse.ArgumentParser(description="Run a local mock traffic quote job.")
    parser.add_argument("job_id", nargs="?", default=None)
    parser.add_argument("--job-id", dest="job_id_option", default=None)
    args = parser.parse_args()

    job_id = args.job_id_option or args.job_id
    jobs = read_json(JOBS_PATH, [])
    results = normalize_results(read_json(RESULTS_PATH, {}))
    job = find_job(jobs, job_id)

    if not job:
        print(json.dumps({"ok": True, "job": None}, ensure_ascii=False))
        return 0

    selected_job_id = str(job["id"])
    update_job(jobs, selected_job_id, "running")
    write_json(JOBS_PATH, jobs)

    time.sleep(1)

    save_mock_result(results, selected_job_id)
    write_json(RESULTS_PATH, results)

    update_job(jobs, selected_job_id, "completed")
    write_json(JOBS_PATH, jobs)

    print(
        json.dumps(
            {
                "ok": True,
                "jobId": selected_job_id,
                "status": "completed",
                "resultSaved": True,
            },
            ensure_ascii=False,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
