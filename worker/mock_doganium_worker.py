import argparse
import json
import re
import time
import uuid
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT_DIR / ".data"
JOBS_PATH = DATA_DIR / "traffic-jobs.json"
RESULTS_PATH = DATA_DIR / "traffic-results.json"
MOCK_PDF_DIR = DATA_DIR / "mock-pdfs"
LOGS_DIR = ROOT_DIR / ".logs"
EVENTS_PATH = LOGS_DIR / "app-events.jsonl"
SENSITIVE_TEXT_PATTERN = re.compile(
    r"\b(password|passwd|passphrase|pwd|otp|authenticator(?:\s+code)?|authorization|bearer|token|secret|cookie|credential|session|api[-_ ]?key)\b\s*[:=]\s*(\"[^\"]*\"|'[^']*'|[^\s,;]+)",
    re.IGNORECASE,
)


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


def sanitize_text(value, max_length: int) -> str:
    text = str(value or "").replace("\r", " ").replace("\n", " ").replace("\t", " ")
    text = SENSITIVE_TEXT_PATTERN.sub(lambda match: f"{match.group(1)}=[MASKED]", text)
    return text[:max_length]


def sanitize_plate(value) -> str:
    return re.sub(r"[^A-Za-z0-9]", "", str(value or ""))[:16].upper()


def sanitize_job_id(value) -> str:
    # Internal job IDs keep numeric runs intact; phone masking does not apply here.
    return re.sub(r"[^A-Za-z0-9_:.\-]", "", str(value or ""))[:120]


def append_runtime_log(
    level: str,
    source: str,
    title: str,
    message: str,
    job_id: str | None = None,
    plate: str | None = None,
    meta: dict | None = None,
) -> None:
    event = {
        "id": str(uuid.uuid4()),
        "ts": now_iso(),
        "level": level,
        "source": source,
        "title": sanitize_text(title, 120),
        "message": sanitize_text(message, 500),
    }
    if job_id:
        safe_job_id = sanitize_job_id(job_id)
        if safe_job_id:
            event["jobId"] = safe_job_id
    if plate:
        safe_plate = sanitize_plate(plate)
        if safe_plate:
            event["plate"] = safe_plate
    if meta:
        event["meta"] = {
            sanitize_text(key, 80): sanitize_text(value, 200)
            if isinstance(value, str)
            else value
            for key, value in list(meta.items())[:50]
            if not re.search(
                r"password|passwd|pwd|otp|auth|token|secret|cookie|credential|session|api[-_]?key",
                key,
                re.IGNORECASE,
            )
        }

    try:
        LOGS_DIR.mkdir(parents=True, exist_ok=True)
        with EVENTS_PATH.open("a", encoding="utf-8", newline="\n") as log_file:
            log_file.write(json.dumps(event, ensure_ascii=False, separators=(",", ":")) + "\n")
    except OSError:
        # Runtime logging must never stop the local worker.
        pass


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


def create_mock_pdf(job_id: str) -> str:
    safe_filename = sanitize_job_id(job_id).replace(":", "_") or "mock-quote"
    pdf_path = MOCK_PDF_DIR / f"{safe_filename}.pdf"
    MOCK_PDF_DIR.mkdir(parents=True, exist_ok=True)

    content = b"BT /F1 16 Tf 72 720 Td (Ares Mock Traffic Quote PDF) Tj ET"
    objects = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",
        b"<< /Length " + str(len(content)).encode("ascii") + b" >>\nstream\n" + content + b"\nendstream",
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    ]
    pdf = bytearray(b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n")
    offsets = [0]
    for index, body in enumerate(objects, start=1):
        offsets.append(len(pdf))
        pdf.extend(f"{index} 0 obj\n".encode("ascii"))
        pdf.extend(body)
        pdf.extend(b"\nendobj\n")

    xref_offset = len(pdf)
    pdf.extend(f"xref\n0 {len(objects) + 1}\n".encode("ascii"))
    pdf.extend(b"0000000000 65535 f \n")
    for offset in offsets[1:]:
        pdf.extend(f"{offset:010d} 00000 n \n".encode("ascii"))
    pdf.extend(
        f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\nstartxref\n{xref_offset}\n%%EOF\n".encode(
            "ascii"
        )
    )
    pdf_path.write_bytes(pdf)
    return pdf_path.relative_to(ROOT_DIR).as_posix()


def save_mock_result(results: dict, job_id: str, pdf_path: str) -> None:
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
                "pdfPath": pdf_path,
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
    append_runtime_log(
        "info",
        "worker",
        "Mock worker started",
        "Local mock Doganium worker started and checked the pending queue.",
        job_id=job_id,
    )

    try:
        jobs = read_json(JOBS_PATH, [])
        results = normalize_results(read_json(RESULTS_PATH, {}))
        job = find_job(jobs, job_id)

        if not job:
            print(json.dumps({"ok": True, "job": None}, ensure_ascii=False))
            return 0

        selected_job_id = str(job["id"])
        plate = job.get("plate")
        append_runtime_log(
            "info",
            "worker",
            "Local job picked",
            "Mock worker picked a pending traffic quote job.",
            job_id=selected_job_id,
            plate=plate,
        )
        update_job(jobs, selected_job_id, "running")
        write_json(JOBS_PATH, jobs)

        time.sleep(1)

        pdf_path = create_mock_pdf(selected_job_id)
        append_runtime_log(
            "success",
            "quote",
            "PDF placeholder created",
            "Mock worker created a local placeholder quote PDF.",
            job_id=selected_job_id,
            plate=plate,
        )

        save_mock_result(results, selected_job_id, pdf_path)
        write_json(RESULTS_PATH, results)
        append_runtime_log(
            "success",
            "quote",
            "Quote PDF path saved",
            "The placeholder PDF path was saved on the cheapest mock quote.",
            job_id=selected_job_id,
            plate=plate,
        )
        append_runtime_log(
            "success",
            "quote",
            "Mock quote generated",
            "Mock worker generated and saved three local traffic quotes.",
            job_id=selected_job_id,
            plate=plate,
            meta={"quoteCount": 3},
        )

        update_job(jobs, selected_job_id, "completed")
        write_json(JOBS_PATH, jobs)
        append_runtime_log(
            "success",
            "worker",
            "Local job completed",
            "Mock quote result is ready and the local job is completed.",
            job_id=selected_job_id,
            plate=plate,
        )

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
    except Exception as error:
        append_runtime_log(
            "error",
            "worker",
            "Mock worker error",
            sanitize_text(error, 300),
            job_id=job_id,
        )
        print(
            json.dumps(
                {"ok": False, "error": sanitize_text(error, 300)},
                ensure_ascii=False,
            )
        )
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
