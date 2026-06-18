import "server-only";

import { randomUUID } from "crypto";
import { appendFile, mkdir, readFile } from "fs/promises";
import path from "path";

export const runtimeLogLevels = ["info", "success", "warning", "error"] as const;
export const runtimeLogSources = [
  "system",
  "whatsapp",
  "website",
  "dashboard",
  "doganium",
  "worker",
  "quote",
  "whatsapp_message",
] as const;

export type RuntimeLogLevel = (typeof runtimeLogLevels)[number];
export type RuntimeLogSource = (typeof runtimeLogSources)[number];

export type RuntimeLogEvent = {
  id: string;
  ts: string;
  level: RuntimeLogLevel;
  source: RuntimeLogSource;
  jobId?: string;
  plate?: string;
  title: string;
  message: string;
  meta?: Record<string, unknown>;
};

export type RuntimeLogInput = {
  level: RuntimeLogLevel;
  source: RuntimeLogSource;
  jobId?: string | null;
  plate?: string | null;
  title: string;
  message: string;
  meta?: Record<string, unknown> | null;
};

const logsDir = path.join(process.cwd(), ".logs");
const eventsPath = path.join(logsDir, "app-events.jsonl");
const sensitiveKeyPattern =
  /password|passwd|passphrase|pwd|otp|auth|code|token|secret|cookie|credential|session|api[-_]?key|access[-_]?key/i;
const sensitiveAssignmentPattern =
  /\b(password|passwd|passphrase|pwd|otp|authenticator(?:\s+code)?|authorization|bearer|token|secret|cookie|credential|session|api[-_ ]?key|access[-_ ]?key)\b\s*[:=]\s*("[^"]*"|'[^']*'|[^\s,;]+)/gi;
const bearerPattern = /\bBearer\s+[A-Za-z0-9._~+/=-]+/gi;
const otpPattern = /\b(otp|authenticator(?:\s+code)?)\b\s+\d{4,10}\b/gi;
const emailPattern = /[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g;
const phonePattern = /(?<!\d)(?:\+?\d[\s().-]?){9,}\d(?!\d)/g;
const maxMetaDepth = 5;
const maxArrayItems = 50;
const maxObjectEntries = 50;

export async function appendRuntimeLog(input: RuntimeLogInput): Promise<RuntimeLogEvent> {
  const event = createSafeEvent(input);

  try {
    await mkdir(logsDir, { recursive: true });
    await appendFile(eventsPath, `${JSON.stringify(event)}\n`, "utf8");
  } catch (error) {
    console.error("Runtime log append failed:", getErrorSummary(error));
  }

  return event;
}

export async function readRuntimeLogs(limit = 100): Promise<RuntimeLogEvent[]> {
  const safeLimit = clampLimit(limit);

  try {
    const content = await readFile(eventsPath, "utf8");
    const events: RuntimeLogEvent[] = [];
    const lines = content.split(/\r?\n/);

    for (let index = lines.length - 1; index >= 0 && events.length < safeLimit; index -= 1) {
      const line = lines[index]?.trim();
      if (!line) continue;

      try {
        const parsed = JSON.parse(line) as unknown;
        const event = parseSafeEvent(parsed);
        if (event) events.push(event);
      } catch {
        // A partial or malformed JSONL line must not break the log viewer.
      }
    }

    return events;
  } catch (error) {
    if (!isMissingFileError(error)) {
      console.error("Runtime log read failed:", getErrorSummary(error));
    }
    return [];
  }
}

function createSafeEvent(input: RuntimeLogInput): RuntimeLogEvent {
  const event: RuntimeLogEvent = {
    id: randomUUID(),
    ts: new Date().toISOString(),
    level: input.level,
    source: input.source,
    title: sanitizeText(input.title).slice(0, 120),
    message: sanitizeText(input.message).slice(0, 500),
  };

  // jobId is an internal identifier. Keep its safe characters intact instead of
  // applying email/phone masking, which can corrupt numeric ID segments.
  const jobId = sanitizeJobId(input.jobId);
  const plate = sanitizePlate(input.plate);
  if (jobId) event.jobId = jobId;
  if (plate) event.plate = plate;
  if (input.meta) event.meta = sanitizeMeta(input.meta);

  return event;
}

function parseSafeEvent(value: unknown): RuntimeLogEvent | null {
  if (!isRecord(value)) return null;
  if (!runtimeLogLevels.includes(value.level as RuntimeLogLevel)) return null;
  if (!runtimeLogSources.includes(value.source as RuntimeLogSource)) return null;
  if (typeof value.id !== "string" || typeof value.ts !== "string") return null;
  if (typeof value.title !== "string" || typeof value.message !== "string") return null;
  if (Number.isNaN(Date.parse(value.ts))) return null;

  const event: RuntimeLogEvent = {
    id: sanitizeIdentifier(value.id, 80) || randomUUID(),
    ts: new Date(value.ts).toISOString(),
    level: value.level as RuntimeLogLevel,
    source: value.source as RuntimeLogSource,
    title: sanitizeText(value.title).slice(0, 120),
    message: sanitizeText(value.message).slice(0, 500),
  };

  const jobId = sanitizeJobId(value.jobId);
  const plate = sanitizePlate(value.plate);
  if (jobId) event.jobId = jobId;
  if (plate) event.plate = plate;
  if (isRecord(value.meta)) event.meta = sanitizeMeta(value.meta);

  return event;
}

function sanitizeMeta(
  meta: Record<string, unknown>,
  depth = 0,
): Record<string, unknown> {
  if (depth >= maxMetaDepth) return { truncated: true };

  return Object.fromEntries(
    Object.entries(meta)
      .slice(0, maxObjectEntries)
      .map(([key, value]) => [
        sanitizeText(key).slice(0, 80),
        sensitiveKeyPattern.test(key) ? "[MASKED]" : sanitizeValue(value, depth + 1),
      ]),
  );
}

function sanitizeValue(value: unknown, depth: number): unknown {
  if (typeof value === "string") return sanitizeText(value).slice(0, 500);
  if (typeof value === "number" || typeof value === "boolean" || value === null) return value;
  if (Array.isArray(value)) {
    if (depth >= maxMetaDepth) return "[TRUNCATED]";
    return value.slice(0, maxArrayItems).map((item) => sanitizeValue(item, depth + 1));
  }
  if (isRecord(value)) return sanitizeMeta(value, depth);
  return String(value ?? "").slice(0, 100);
}

function sanitizeText(value: unknown): string {
  return String(value ?? "")
    .replace(sensitiveAssignmentPattern, (_match, label: string) => `${label}=[MASKED]`)
    .replace(bearerPattern, "[MASKED]")
    .replace(otpPattern, (_match, label: string) => `${label}=[MASKED]`)
    .replace(emailPattern, "[MASKED_EMAIL]")
    .replace(phonePattern, "[MASKED_PHONE]");
}

function sanitizeIdentifier(value: unknown, maxLength: number): string {
  return sanitizeText(value).replace(/[\r\n\t]/g, " ").trim().slice(0, maxLength);
}

function sanitizeJobId(value: unknown): string {
  return String(value ?? "").replace(/[^A-Za-z0-9_:.\-]/g, "").slice(0, 120);
}

function sanitizePlate(value: unknown): string {
  return String(value ?? "").replace(/[^A-Za-z0-9]/g, "").slice(0, 16).toUpperCase();
}

function clampLimit(value: number): number {
  if (!Number.isFinite(value)) return 100;
  return Math.min(Math.max(Math.trunc(value) || 100, 1), 500);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function isMissingFileError(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: unknown }).code === "ENOENT",
  );
}

function getErrorSummary(error: unknown): string {
  if (error instanceof Error) return sanitizeText(error.message).slice(0, 300);
  return sanitizeText(error).slice(0, 300);
}
