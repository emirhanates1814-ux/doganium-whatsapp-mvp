import type { TrafficQuoteResult } from "@/types/traffic";

export function buildMissingFieldsMessage(missingFields: string[]): string {
  return [
    "Merhaba, trafik sigortası teklifinizi hazırlayabilmemiz için bazı bilgiler eksik görünüyor.",
    "",
    "Lütfen aşağıdaki formatta gönderiniz:",
    "",
    missingFields.includes("T.C. Kimlik No") ? "T.C. Kimlik No:" : null,
    missingFields.includes("Plaka") ? "Plaka:" : null,
    missingFields.includes("Belge / Seri No") ? "Belge / Seri No:" : null,
    missingFields.includes("Doğum Tarihi") ? "Doğum Tarihi:" : null,
    "",
    "Bilgileri tamamladığınızda teklif sürecinizi başlatacağız."
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildQuoteReadyMessage(result: TrafficQuoteResult): string {
  const lines = [
    "Merhaba, trafik sigortası teklif çalışmanız tamamlandı.",
    "",
    `En uygun teklif: ${result.cheapestCompany} - ${formatTry(result.cheapestPrice)}`
  ];

  if (result.highestCompany && result.highestPrice) {
    lines.push(`En yüksek teklif: ${result.highestCompany} - ${formatTry(result.highestPrice)}`);
  }

  if (result.recommendedCompany && result.recommendedPrice) {
    lines.push(`Önerilen seçenek: ${result.recommendedCompany} - ${formatTry(result.recommendedPrice)}`);
  }

  lines.push(
    "",
    "Devam etmek isterseniz ödeme işlemi için size güvenli ödeme bağlantısı gönderilecektir.",
    "Güvenliğiniz için kart numarası, son kullanma tarihi veya CVV bilgilerinizi WhatsApp üzerinden paylaşmayınız."
  );

  return lines.join("\n");
}

function formatTry(value: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 2
  }).format(value);
}
