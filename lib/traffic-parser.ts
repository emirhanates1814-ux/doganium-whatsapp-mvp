import type { ParsedTrafficRequest } from "@/types/traffic";

const requiredFields: Array<keyof ParsedTrafficRequest> = [
  "tckn",
  "plate",
  "documentSerialNo",
  "birthDate",
];

export function parseTrafficMessage(message: string): ParsedTrafficRequest {
  const normalized = normalizeText(message);

  const tckn = findValue(
    normalized,
    /(?:\bTCKN\b|\bTC\b|T\.C\.?|KIMLIK(?:\s+NO)?)\s*[:=-]?\s*(\d{11})/i,
  );

  const plate = findValue(
    normalized,
    /(?:PLAKA)\s*[:=-]?\s*([0-9]{2}\s*[A-Z]{1,3}\s*[0-9]{2,5})/i,
  );

  const documentSerialNo = findValue(
    normalized,
    /(?:BELGE\s+SERI\s+NO|SERI\s+NO|BELGE\s+NO|BELGE|SERI)\s*[:=-]?\s*([A-Z0-9-]{3,30})/i,
  );

  const birthDate = findValue(
    normalized,
    /(?:DOGUM\s+TARIHI|DOGUM|DT)\s*[:=-]?\s*([0-9]{1,2}[./-][0-9]{1,2}[./-][0-9]{4}|[0-9]{4}[./-][0-9]{1,2}[./-][0-9]{1,2})/i,
  );

  return {
    tckn: normalizeTckn(tckn),
    plate: normalizePlate(plate),
    documentSerialNo: normalizeDocumentSerial(documentSerialNo),
    birthDate: normalizeBirthDate(birthDate),
  };
}

export function getMissingTrafficFields(parsed: ParsedTrafficRequest): string[] {
  return requiredFields.filter((field) => !parsed[field]);
}

function findValue(message: string, pattern: RegExp): string | undefined {
  return message.match(pattern)?.[1]?.trim();
}

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[ıİ]/g, (char) => (char === "ı" ? "i" : "I"))
    .toUpperCase()
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeTckn(value?: string): string | undefined {
  const digits = value?.replace(/\D/g, "") ?? "";
  return digits.length === 11 ? digits : undefined;
}

function normalizePlate(value?: string): string | undefined {
  const plate = value?.replace(/\s+/g, "").toUpperCase() ?? "";
  return /^[0-9]{2}[A-Z]{1,3}[0-9]{2,5}$/.test(plate) ? plate : undefined;
}

function normalizeDocumentSerial(value?: string): string | undefined {
  const serial = value?.replace(/\s+/g, "").toUpperCase() ?? "";
  return /^[A-Z0-9-]{3,30}$/.test(serial) ? serial : undefined;
}

function normalizeBirthDate(value?: string): string | undefined {
  if (!value) return undefined;

  const parts = value.split(/[./-]/).map((part) => Number(part));
  if (parts.length !== 3 || parts.some((part) => Number.isNaN(part))) return undefined;

  const [first, second, third] = parts;
  const year = first > 1900 ? first : third;
  const month = first > 1900 ? second : second;
  const day = first > 1900 ? third : first;

  if (!isValidDate(year, month, day)) return undefined;

  return [
    String(year).padStart(4, "0"),
    String(month).padStart(2, "0"),
    String(day).padStart(2, "0"),
  ].join("-");
}

function isValidDate(year: number, month: number, day: number): boolean {
  if (year < 1900 || year > new Date().getFullYear()) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;

  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}
