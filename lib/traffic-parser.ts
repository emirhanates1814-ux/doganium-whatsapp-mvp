import { z } from "zod";
import type { ParsedTrafficRequest } from "@/types/traffic";

const tcknSchema = z.string().regex(/^\d{11}$/);
const plateSchema = z.string().min(5).max(10);
const serialSchema = z.string().min(3).max(30);
const birthDateSchema = z.string().regex(/^\d{2}[./-]\d{2}[./-]\d{4}$/);

export function parseTrafficMessage(message: string): ParsedTrafficRequest {
  const normalized = message
    .replace(/[ıİ]/g, (char) => (char === "ı" ? "i" : "I"))
    .replace(/\s+/g, " ")
    .trim();

  const tckn = normalized.match(/(?:tckn|tc|t\.c\.?|kimlik|kimlik no)[:\s-]*([0-9]{11})/i)?.[1];

  const plate = normalized.match(/(?:plaka)[:\s-]*([0-9]{2}\s?[A-ZÇĞIİÖŞÜ]{1,3}\s?[0-9]{2,5})/i)?.[1];

  const documentSerialNo = normalized.match(
    /(?:belge seri no|belge no|seri no|seri|belge)[:\s-]*([A-ZÇĞIİÖŞÜ0-9-]{3,30})/i
  )?.[1];

  const birthDate = normalized.match(
    /(?:dogum tarihi|doğum tarihi|dogum|doğum|dt)[:\s-]*([0-9]{2}[./-][0-9]{2}[./-][0-9]{4})/i
  )?.[1];

  return {
    tckn: tcknSchema.safeParse(tckn).success ? tckn : undefined,
    plate: plateSchema.safeParse(plate?.replace(/\s/g, "").toUpperCase()).success
      ? plate?.replace(/\s/g, "").toUpperCase()
      : undefined,
    documentSerialNo: serialSchema.safeParse(documentSerialNo?.toUpperCase()).success
      ? documentSerialNo?.toUpperCase()
      : undefined,
    birthDate: birthDateSchema.safeParse(birthDate).success ? birthDate : undefined
  };
}

export function getMissingTrafficFields(parsed: ParsedTrafficRequest): string[] {
  const missing: string[] = [];
  if (!parsed.tckn) missing.push("T.C. Kimlik No");
  if (!parsed.plate) missing.push("Plaka");
  if (!parsed.documentSerialNo) missing.push("Belge / Seri No");
  if (!parsed.birthDate) missing.push("Doğum Tarihi");
  return missing;
}
