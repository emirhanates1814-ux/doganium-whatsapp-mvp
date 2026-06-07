from abc import ABC, abstractmethod
from models import Job, QuoteResult

class DoganiumAdapter(ABC):
    @abstractmethod
    def run_traffic_quote(self, job: Job) -> QuoteResult:
        raise NotImplementedError

class MockDoganiumAdapter(DoganiumAdapter):
    def run_traffic_quote(self, job: Job) -> QuoteResult:
        # MVP geliştirme aşamasında Doganium olmadan uçtan uca akışı test eder.
        return QuoteResult(
            cheapestCompany="Örnek Sigorta A.Ş.",
            cheapestPrice=8420.50,
            highestCompany="Örnek Maksimum Sigorta",
            highestPrice=12750.00,
            recommendedCompany="Örnek Sigorta A.Ş.",
            recommendedPrice=8420.50,
            pdfUrl=None,
            raw={
                "mode": "mock",
                "plate": job.plate,
                "note": "Bu sonuç Doganium gerçek RPA entegrasyonu bağlanmadan üretilmiş test sonucudur."
            },
        )

class PyWinAutoDoganiumAdapter(DoganiumAdapter):
    def __init__(self, settings: dict):
        self.settings = settings

    def run_traffic_quote(self, job: Job) -> QuoteResult:
        # Bu katman gerçek Doganium ekranı görüldükten sonra tamamlanacak.
        # Gerekli bilgiler:
        # - Doganium executable path
        # - login pencere başlığı
        # - kullanıcı adı input automation id/name
        # - şifre input automation id/name
        # - EGM Sorgula button automation id/name
        # - Trafik Sorgula button automation id/name
        # - TCKN / Plaka / Seri No / Doğum Tarihi input selectorları
        # - Trafiği Raporla button selectorı
        # - PDF indirme konumu ve dosya adı davranışı
        try:
            from pywinauto.application import Application
        except ImportError as exc:
            raise RuntimeError("pywinauto kurulu değil. pip install -r requirements.txt çalıştırın.") from exc

        raise NotImplementedError(
            "Gerçek Doganium RPA adapter henüz selector bilgileri olmadan tamamlanamaz. "
            "Önce worker mode=mock ile akışı test edin; sonra inspect.exe ile selectorları çıkarın."
        )

def create_adapter(settings: dict) -> DoganiumAdapter:
    mode = settings.get("mode", "mock")
    if mode == "mock":
        return MockDoganiumAdapter()
    if mode == "pywinauto":
        return PyWinAutoDoganiumAdapter(settings)
    raise ValueError(f"Bilinmeyen worker mode: {mode}")
