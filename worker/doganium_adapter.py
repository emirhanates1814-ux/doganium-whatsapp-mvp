from abc import ABC, abstractmethod
from typing import Any

from models import Job, QuoteResult


class DoganiumAdapter(ABC):
    @abstractmethod
    def run_traffic_quote(self, job: Job) -> QuoteResult:
        raise NotImplementedError


class MockDoganiumAdapter(DoganiumAdapter):
    def run_traffic_quote(self, job: Job) -> QuoteResult:
        return QuoteResult(
            cheapestCompany="Test Sigorta",
            cheapestPrice=12500,
            highestCompany="Örnek Sigorta",
            highestPrice=18500,
            recommendedCompany="Test Sigorta",
            recommendedPrice=12500,
            pdfUrl=None,
            raw={"mode": "mock", "plate": job.plate},
        )


class PyWinAutoDoganiumAdapter(DoganiumAdapter):
    def __init__(self, settings: dict[str, Any]):
        self.settings = settings
        self.doganium_settings = settings.get("doganium", {})

    def run_traffic_quote(self, job: Job) -> QuoteResult:
        try:
            from pywinauto.application import Application
        except ImportError as exc:
            raise RuntimeError("pywinauto kurulu değil. pip install -r requirements.txt çalıştırın.") from exc

        _ = Application
        self._open_app()
        self._login()
        self._fill_customer_inputs(job)
        self._query_egm()
        self._query_traffic()
        self._export_traffic_report()
        self._download_pdf()

        raise RuntimeError(
            "PyWinAuto Doganium adapter iskeleti hazır, ancak gerçek selectorlar henüz tanımlanmadı. "
            "Worker mode=mock ile akışı test edin; selectorlar çıkarıldıktan sonra bu metotlar tamamlanmalı."
        )

    def _open_app(self) -> None:
        # TODO: appPath ile Doganium uygulamasını aç.
        pass

    def _login(self) -> None:
        # TODO: kullanıcı adı/şifre alanlarını selector ile doldur.
        pass

    def _fill_customer_inputs(self, job: Job) -> None:
        # TODO: TCKN, plaka, belge seri no ve doğum tarihi inputlarını doldur.
        _ = job

    def _query_egm(self) -> None:
        # TODO: EGM Sorgula aksiyonunu selector ile çalıştır.
        pass

    def _query_traffic(self) -> None:
        # TODO: Trafik Sorgula aksiyonunu selector ile çalıştır.
        pass

    def _export_traffic_report(self) -> None:
        # TODO: Trafiği Raporla aksiyonunu selector ile çalıştır.
        pass

    def _download_pdf(self) -> None:
        # TODO: PDF indirme klasörünü izle ve dosyayı doğrula.
        pass


def create_adapter(settings: dict[str, Any]) -> DoganiumAdapter:
    mode = settings.get("mode", "mock")
    if mode == "mock":
        return MockDoganiumAdapter()
    if mode == "pywinauto":
        return PyWinAutoDoganiumAdapter(settings)
    raise ValueError(f"Bilinmeyen worker mode: {mode}")
