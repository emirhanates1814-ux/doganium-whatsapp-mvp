-- CreateTable
CREATE TABLE "TrafficJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerPhone" TEXT NOT NULL,
    "customerName" TEXT,
    "tckn" TEXT,
    "plate" TEXT,
    "documentSerial" TEXT,
    "birthDate" TEXT,
    "rawMessage" TEXT,
    "source" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "errorMessage" TEXT,
    "createdAt" DATETIME NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "TrafficJobResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobId" TEXT NOT NULL,
    "quotesJson" TEXT NOT NULL,
    "cheapestPremium" REAL,
    "highestPremium" REAL,
    "summary" TEXT,
    "createdAt" DATETIME NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TrafficJobResult_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "TrafficJob" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TrafficJobEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT,
    "metadataJson" TEXT,
    "createdAt" DATETIME NOT NULL,
    CONSTRAINT "TrafficJobEvent_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "TrafficJob" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "TrafficJob_status_idx" ON "TrafficJob"("status");

-- CreateIndex
CREATE INDEX "TrafficJob_customerPhone_idx" ON "TrafficJob"("customerPhone");

-- CreateIndex
CREATE INDEX "TrafficJob_plate_idx" ON "TrafficJob"("plate");

-- CreateIndex
CREATE INDEX "TrafficJob_createdAt_idx" ON "TrafficJob"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "TrafficJobResult_jobId_key" ON "TrafficJobResult"("jobId");
