import type { ParsedTrafficRequest, TrafficParseField, TrafficParseResult } from "@/types/traffic";

const requiredFields: TrafficParseField[] = ["tckn", "plate", "documentSerial", "birthDate"];

export function parseTrafficMessage(message: string): TrafficParseResult {
  const normalized = normalizeText(message ?? "");
  const errors: string[] = [];

  const rawTckn = findValue(
    normalized,
    /(?:\bTCKN\b|\bTC\b|T\s*\.?\s*C\s*\.?|\bKIMLIK(?:\s+NO)?)\s*[:=-]?\s*([0-9\-\s]{10,20})/i,
  );
  const rawPlate = findValue(
    normalized,
    /(?:PLAKA)\s*[:=-]?\s*([0-9]{2}\s*[A-Z]{1,3}\s*[0-9]{2,5})/i,
  );
  const rawDocumentSerial = findValue(
    normalized,
    /(?:RUHSAT\s+SERI\s+NO|BELGE\s+SERI\s+NO|BELGE\s+NO|SERI\s+NO|BELGE|SERI)\s*[:=-]?\s*([A-Z0-9-]{3,30})/i,
  );
  const rawBirthDate = findValue(
    normalized,
    /(?:DOGUM\s+TARIHI|DOGUM|D\s*\.?\s*T\s*\.?)\s*[:=-]?\s*([0-9]{1,2}[./-][0-9]{1,2}[./-][0-9]{4}|[0-9]{4}[./-][0-9]{1,2}[./-][0-9]{1,2})/i,
  );

  const data = {
    tckn: normalizeTckn(rawTckn),
    plate: normalizePlate(rawPlate),
    documentSerial: normalizeDocumentSerial(rawDocumentSerial),
    birthDate: normalizeBirthDate(rawBirthDate),
  };

  if (rawTckn && !data.tckn) errors.push("TCKN must be 11 digits.");
  if (rawPlate && !data.plate) errors.push("Plate format is invalid.");
  if (rawBirthDate && !data.birthDate) errors.push("Birth date format is invalid.");

  const missingFields = requiredFields.filter((field) => !data[field]);

  return {
    ok: missingFields.length === 0 && errors.length === 0,
    data,
    missingFields,
    errors,
  };
}

export function getMissingTrafficFields(parsed: ParsedTrafficRequest): string[] {
  return requiredFields.filter((field) => !parsed[field]);
}

export function normalizeTrafficInput(input: ParsedTrafficRequest): ParsedTrafficRequest {
  const documentSerial = input.documentSerial ?? input.documentSerialNo;
  const normalizedDocumentSerial = normalizeDocumentSerial(documentSerial);

  return {
    tckn: normalizeTckn(input.tckn),
    plate: normalizePlate(input.plate),
    documentSerial: normalizedDocumentSerial,
    documentSerialNo: normalizedDocumentSerial,
    birthDate: normalizeBirthDate(input.birthDate),
  };
}

function findValue(message: string, pattern: RegExp): string | undefined {
  return message.match(pattern)?.[1]?.trim();
}

function normalizeText(value: string): string {
  return value
    .replace(/\u0131/g, "i")
    .replace(/\u0130/g, "I")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
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

  const isYearFirst = parts[0] > 1900;
  const year = isYearFirst ? parts[0] : parts[2];
  const month = parts[1];
  const day = isYearFirst ? parts[2] : parts[0];

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
