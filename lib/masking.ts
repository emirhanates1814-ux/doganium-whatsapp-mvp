export function maskTckn(value?: string | null): string | null {
  if (!value) return null;
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 11) return "***";
  return `${digits.slice(0, 3)}******${digits.slice(-2)}`;
}

export function maskDocumentSerial(value?: string | null): string | null {
  if (!value) return null;
  const normalized = value.trim().toUpperCase();
  if (normalized.length <= 4) return "***";
  return `${normalized.slice(0, 2)}****${normalized.slice(-2)}`;
}

export function maskBirthDate(value?: string | null): string | null {
  if (!value) return null;

  const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) return `**.**.${isoMatch[1]}`;

  const localMatch = value.match(/^(\d{2})[./-](\d{2})[./-](\d{4})$/);
  if (localMatch) return `**.**.${localMatch[3]}`;

  return "**.**.****";
}

export function normalizePhone(value: string): string {
  return value.replace(/\D/g, "");
}
