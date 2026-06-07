from pathlib import Path
from models import QuoteResult


def parse_doganium_pdf(path: str | Path) -> QuoteResult:
    # Doganium PDF örneği görüldükten sonra regex/tablo çıkarma burada netleşecek.
    # İlk hedef: şirket adı + fiyat kolonlarını okumak.
    try:
        import pdfplumber
    except ImportError as exc:
        raise RuntimeError("pdfplumber kurulu değil. pip install -r requirements.txt çalıştırın.") from exc

    pdf_path = Path(path)
    if not pdf_path.exists():
        raise FileNotFoundError(f"PDF bulunamadı: {pdf_path}")

    text_parts: list[str] = []
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            text_parts.append(page.extract_text() or "")

    raw_text = "\n".join(text_parts)
    raise NotImplementedError(
        "PDF parser Doganium gerçek PDF örneği ile tamamlanmalı. "
        f"Okunan karakter sayısı: {len(raw_text)}"
    )
