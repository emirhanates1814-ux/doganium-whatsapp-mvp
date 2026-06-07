import type { TrafficQuoteResult } from "@/types/traffic";

const missingFieldLabels: Record<string, string> = {
  tckn: "T.C. Kimlik No",
  plate: "Plaka",
  documentSerialNo: "Belge / Seri No",
  birthDate: "Doğum Tarihi",
};

export function buildMissingFieldsMessage(missingFields: string[]): string {
  return [
    "Merhaba, trafik sigortası teklifinizi hazırlayabilmemiz için bazı bilgiler eksik görünüyor.",
    "",
    "Lütfen aşağıdaki formatta gönderiniz:",
    "",
    ...missingFields.map((field) => `${missingFieldLabels[field] ?? field}:`),
    "",
    "Bilgileri tamamladığınızda teklif sürecinizi başlatacağız.",
  ].join("\n");
}

export function buildQuoteReadyMessage(result: TrafficQuoteResult): string {
  const lines = [
    "Merhaba, trafik sigortası teklif çalışmanız tamamlandı.",
    "",
    `En uygun teklif: ${result.cheapestCompany} - ${formatTry(result.cheapestPrice)}`,
  ];

  if (result.highestCompany && result.highestPrice) {
    lines.push(`En yüksek teklif: ${result.highestCompany} - ${formatTry(result.highestPrice)}`);
  }

  if (result.recommendedCompany && result.recommendedPrice) {
    lines.push(`Önerilen seçenek: ${result.recommendedCompany} - ${formatTry(result.recommendedPrice)}`);
  }

  lines.push(
    "",
    "Devam etmek isterseniz ödeme işlemi için size güvenli ödeme bağlantısı daha sonra gönderilecektir.",
    "Güvenliğiniz için kart numarası, son kullanma tarihi veya CVV bilgilerinizi WhatsApp üzerinden paylaşmayınız.",
  );

  return lines.join("\n");
}

function formatTry(value: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 2,
  }).format(value);
}
