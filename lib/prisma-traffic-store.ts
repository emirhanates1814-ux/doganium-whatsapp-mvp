import "server-only";

import { randomUUID } from "crypto";
import { prisma } from "./prisma";
import type {
  CreateLocalTrafficJobInput,
  ListLocalTrafficJobsFilters,
  LocalTrafficJob,
  LocalTrafficJobResult,
} from "./local-traffic-store";
import type { TrafficJobResultPayload, TrafficRequestJobStatus } from "@/types/traffic";

export async function createTrafficJob(input: CreateLocalTrafficJobInput): Promise<LocalTrafficJob> {
  const now = new Date();
  const job = await prisma.trafficJob.create({
    data: {
      id: randomUUID(),
      customerPhone: input.customerPhone,
      customerName: input.customerName ?? null,
      tckn: input.tckn ?? null,
      plate: input.plate ?? null,
      documentSerial: input.documentSerial ?? null,
      birthDate: input.birthDate ?? null,
      rawMessage: input.rawMessage ?? null,
      source: input.source ?? "manual",
      status: input.status ?? "pending",
      createdAt: now,
      updatedAt: now,
      events: {
        create: {
          id: randomUUID(),
          type: "created",
          message: `Job created from ${input.source ?? "manual"}.`,
          createdAt: now,
        },
      },
    },
  });

  return mapJob(job);
}

export async function listTrafficJobs(
  filters: ListLocalTrafficJobsFilters = {},
): Promise<LocalTrafficJob[]> {
  const jobs = await prisma.trafficJob.findMany({
    where: filters.status ? { status: filters.status } : undefined,
    orderBy: { createdAt: "desc" },
    take: Math.min(Math.max(filters.limit ?? 50, 1), 500),
  });

  return jobs.map(mapJob);
}

export async function getTrafficJob(id: string): Promise<LocalTrafficJob | null> {
  const job = await prisma.trafficJob.findUnique({ where: { id } });
  return job ? mapJob(job) : null;
}

export async function updateTrafficJobStatus(
  id: string,
  status: TrafficRequestJobStatus,
  extra: { errorMessage?: string | null } = {},
): Promise<LocalTrafficJob | null> {
  const existing = await prisma.trafficJob.findUnique({ where: { id } });
  if (!existing) return null;

  const job = await prisma.trafficJob.update({
    where: { id },
    data: {
      status,
      errorMessage:
        extra.errorMessage === undefined ? existing.errorMessage : extra.errorMessage,
      updatedAt: new Date(),
      events: {
        create: {
          id: randomUUID(),
          type: `status:${status}`,
          message: extra.errorMessage ?? null,
          createdAt: new Date(),
        },
      },
    },
  });

  return mapJob(job);
}

export async function saveTrafficJobResult(
  id: string,
  result: TrafficJobResultPayload,
): Promise<LocalTrafficJobResult> {
  const now = new Date();
  const existing = await prisma.trafficJobResult.findUnique({ where: { jobId: id } });
  const quotes = result.quotes ?? [];
  const cheapestPremium = result.cheapestPremium ?? calculateCheapest(quotes);
  const highestPremium = result.highestPremium ?? calculateHighest(quotes);

  const saved = await prisma.trafficJobResult.upsert({
    where: { jobId: id },
    create: {
      id: randomUUID(),
      jobId: id,
      quotesJson: JSON.stringify(quotes),
      cheapestPremium,
      highestPremium,
      summary: result.summary ?? null,
      createdAt: now,
      updatedAt: now,
    },
    update: {
      quotesJson: JSON.stringify(quotes),
      cheapestPremium,
      highestPremium,
      summary: result.summary ?? null,
      updatedAt: now,
    },
  });

  await prisma.trafficJobEvent.create({
    data: {
      id: randomUUID(),
      jobId: id,
      type: "result_saved",
      message: "Quote result saved.",
      metadataJson: JSON.stringify({ resultId: saved.id, replaced: Boolean(existing) }),
      createdAt: now,
    },
  });

  return mapResult(saved);
}

export async function getTrafficJobResult(id: string): Promise<LocalTrafficJobResult | null> {
  const result = await prisma.trafficJobResult.findUnique({ where: { jobId: id } });
  return result ? mapResult(result) : null;
}

type PrismaTrafficJob = Awaited<ReturnType<typeof prisma.trafficJob.findUnique>>;
type PrismaTrafficJobResult = Awaited<ReturnType<typeof prisma.trafficJobResult.findUnique>>;

function mapJob(job: NonNullable<PrismaTrafficJob>): LocalTrafficJob {
  return {
    id: job.id,
    customerPhone: job.customerPhone,
    customerName: job.customerName ?? undefined,
    tckn: job.tckn ?? undefined,
    plate: job.plate ?? undefined,
    documentSerial: job.documentSerial ?? undefined,
    birthDate: job.birthDate ?? undefined,
    rawMessage: job.rawMessage ?? undefined,
    source: normalizeSource(job.source),
    status: normalizeStatus(job.status),
    errorMessage: job.errorMessage ?? undefined,
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
  };
}

function mapResult(result: NonNullable<PrismaTrafficJobResult>): LocalTrafficJobResult {
  return {
    jobId: result.jobId,
    quotes: parseQuotes(result.quotesJson),
    cheapestPremium: result.cheapestPremium,
    highestPremium: result.highestPremium,
    summary: result.summary,
    createdAt: result.createdAt.toISOString(),
    updatedAt: result.updatedAt.toISOString(),
  };
}

function parseQuotes(value: string): TrafficJobResultPayload["quotes"] {
  try {
    const parsed = JSON.parse(value) as TrafficJobResultPayload["quotes"];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalizeSource(value: string): LocalTrafficJob["source"] {
  if (value === "manual" || value === "whatsapp" || value === "test") return value;
  return "manual";
}

function normalizeStatus(value: string): TrafficRequestJobStatus {
  if (
    value === "pending" ||
    value === "running" ||
    value === "waiting_mfa" ||
    value === "completed" ||
    value === "failed" ||
    value === "cancelled"
  ) {
    return value;
  }

  return "pending";
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
