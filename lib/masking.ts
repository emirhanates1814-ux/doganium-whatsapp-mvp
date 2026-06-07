export function maskTckn(value?: string | null): string | null {
  if (!value) return null;
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 11) return "***";
  return `${digits.slice(0, 3)}*****${digits.slice(-3)}`;
}

export function maskDocumentSerial(value?: string | null): string | null {
  if (!value) return null;
  if (value.length <= 4) return "***";
  return `${value.slice(0, 2)}***${value.slice(-2)}`;
}

export function maskBirthDate(value?: string | null): string | null {
  if (!value) return null;
  const match = value.match(/(\d{2})[./-](\d{2})[./-](\d{4})/);
  if (!match) return "**.**.****";
  return `**.**.${match[3]}`;
}

export function normalizePhone(value: string): string {
  return value.replace(/\D/g, "");
}
