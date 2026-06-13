import "server-only";

import { randomUUID } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import type { TrafficRequestJobStatus, TrafficJobResultPayload } from "@/types/traffic";

export type LocalTrafficJobSource = "manual" | "whatsapp" | "test";

export type LocalTrafficJob = {
  id: string;
  customerPhone: string;
  customerName?: string;
  tckn?: string;
  plate?: string;
  documentSerial?: string;
  birthDate?: string;
  rawMessage?: string;
  source: LocalTrafficJobSource;
  status: TrafficRequestJobStatus;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
};

export type LocalTrafficJobResult = TrafficJobResultPayload & {
  jobId: string;
  createdAt: string;
  updatedAt: string;
};

type LocalTrafficJobResultsById = Record<string, LocalTrafficJobResult>;

export type CreateLocalTrafficJobInput = {
  customerPhone: string;
  customerName?: string | null;
  tckn?: string | null;
  plate?: string | null;
  documentSerial?: string | null;
  birthDate?: string | null;
  rawMessage?: string | null;
  source?: LocalTrafficJobSource;
  status?: TrafficRequestJobStatus;
};

export type ListLocalTrafficJobsFilters = {
  status?: TrafficRequestJobStatus;
  limit?: number;
};

const dataDir = path.join(process.cwd(), ".data");
const jobsPath = path.join(dataDir, "traffic-jobs.json");
const resultsPath = path.join(dataDir, "traffic-results.json");

export async function createTrafficJob(input: CreateLocalTrafficJobInput): Promise<LocalTrafficJob> {
  const jobs = await readJobs();
  const now = new Date().toISOString();
  const job: LocalTrafficJob = {
    id: randomUUID(),
    customerPhone: input.customerPhone,
    customerName: input.customerName ?? undefined,
    tckn: input.tckn ?? undefined,
    plate: input.plate ?? undefined,
    documentSerial: input.documentSerial ?? undefined,
    birthDate: input.birthDate ?? undefined,
    rawMessage: input.rawMessage ?? undefined,
    source: input.source ?? "manual",
    status: input.status ?? "pending",
    createdAt: now,
    updatedAt: now,
  };

  jobs.push(job);
  await writeJsonFile(jobsPath, jobs);
  return job;
}

export async function listTrafficJobs(
  filters: ListLocalTrafficJobsFilters = {},
): Promise<LocalTrafficJob[]> {
  const limit = Math.min(Math.max(filters.limit ?? 50, 1), 500);
  const jobs = await readJobs();

  return jobs
    .filter((job) => (filters.status ? job.status === filters.status : true))
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .slice(0, limit);
}

export async function getTrafficJob(id: string): Promise<LocalTrafficJob | null> {
  const jobs = await readJobs();
  return jobs.find((job) => job.id === id) ?? null;
}

export async function updateTrafficJobStatus(
  id: string,
  status: TrafficRequestJobStatus,
  extra: { errorMessage?: string | null } = {},
): Promise<LocalTrafficJob | null> {
  const jobs = await readJobs();
  const index = jobs.findIndex((job) => job.id === id);

  if (index === -1) return null;

  jobs[index] = {
    ...jobs[index],
    status,
    updatedAt: new Date().toISOString(),
  };

  if (extra.errorMessage) {
    jobs[index].errorMessage = extra.errorMessage;
  } else if (extra.errorMessage === null) {
    delete jobs[index].errorMessage;
  }

  await writeJsonFile(jobsPath, jobs);
  return jobs[index];
}

export async function saveTrafficJobResult(
  id: string,
  result: TrafficJobResultPayload,
): Promise<LocalTrafficJobResult> {
  const results = await readResults();
  const now = new Date().toISOString();
  const existing = results[id];
  const normalized: LocalTrafficJobResult = {
    jobId: id,
    quotes: result.quotes ?? [],
    cheapestPremium: result.cheapestPremium ?? calculateCheapest(result.quotes ?? []),
    highestPremium: result.highestPremium ?? calculateHighest(result.quotes ?? []),
    summary: result.summary ?? null,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  results[id] = normalized;
  await writeJsonFile(resultsPath, results);
  return normalized;
}

export async function getTrafficJobResult(id: string): Promise<LocalTrafficJobResult | null> {
  const results = await readResults();
  return results[id] ?? null;
}

async function readJobs(): Promise<LocalTrafficJob[]> {
  return readJsonFile<LocalTrafficJob[]>(jobsPath, []);
}

async function readResults(): Promise<LocalTrafficJobResultsById> {
  const raw = await readJsonFile<LocalTrafficJobResultsById | LocalTrafficJobResult[]>(
    resultsPath,
    {},
  );

  if (Array.isArray(raw)) {
    return raw.reduce<LocalTrafficJobResultsById>((byId, result) => {
      if (result.jobId) byId[result.jobId] = result;
      return byId;
    }, {});
  }

  return raw;
}

async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  await ensureDataDir();

  try {
    const content = await readFile(filePath, "utf8");
    if (!content.trim()) return fallback;
    return JSON.parse(content) as T;
  } catch (error) {
    if (isNodeError(error) && error.code === "ENOENT") {
      await writeJsonFile(filePath, fallback);
      return fallback;
    }

    throw error;
  }
}

async function writeJsonFile(filePath: string, value: unknown): Promise<void> {
  await ensureDataDir();
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function ensureDataDir(): Promise<void> {
  await mkdir(dataDir, { recursive: true });
}

function calculateCheapest(quotes: TrafficJobResultPayload["quotes"]): number | null {
  return quotes.reduce<number | null>((min, quote) => {
    return min === null || quote.premium < min ? quote.premium : min;
  }, null);
}

function calculateHighest(quotes: TrafficJobResultPayload["quotes"]): number | null {
  return quotes.reduce<number | null>((max, quote) => {
    return max === null || quote.premium > max ? quote.premium : max;
  }, null);
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}
