from dataclasses import dataclass, asdict
from typing import Optional, Any


@dataclass
class Job:
    id: str
    customer_phone: str
    tckn: str
    plate: str
    document_serial_no: str
    birth_date: str
    status: str


@dataclass
class QuoteResult:
    cheapestCompany: str
    cheapestPrice: float
    highestCompany: Optional[str] = None
    highestPrice: Optional[float] = None
    recommendedCompany: Optional[str] = None
    recommendedPrice: Optional[float] = None
    pdfUrl: Optional[str] = None
    raw: Optional[Any] = None

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)
