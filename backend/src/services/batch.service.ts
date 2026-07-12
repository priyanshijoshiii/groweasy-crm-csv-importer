import { extractCrmRecords, SkippedRecord } from "./ai.service";
import { CrmRecord } from "../schemas/crmRecord.schema";

const BATCH_SIZE = 8;
const MAX_RETRIES = 4;
const DELAY_BETWEEN_BATCHES_MS = 4000;

// Simple in-memory progress store, keyed by a job ID
export const progressStore = new Map<string, { current: number; total: number; done: boolean }>();

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractRetryDelaySeconds(errorMessage: string): number | null {
  const match = errorMessage.match(/try again in ([\d.]+)s/i);
  return match ? parseFloat(match[1]!) : null;
}

export async function processBatches(rows: Record<string, string>[], jobId?: string) {
  const batches = chunkArray(rows, BATCH_SIZE);
  const allRecords: CrmRecord[] = [];
  const allSkipped: SkippedRecord[] = [];
  let failedBatches = 0;

  if (jobId) {
    progressStore.set(jobId, { current: 0, total: batches.length, done: false });
  }

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i]!;
    let attempt = 0;
    let success = false;

    while (attempt < MAX_RETRIES && !success) {
      try {
        const { records, skipped } = await extractCrmRecords(batch);
        allRecords.push(...records);
        allSkipped.push(...skipped);
        success = true;
      } catch (err) {
        attempt++;
        const message = err instanceof Error ? err.message : String(err);
        console.error(`Batch ${i + 1}/${batches.length} attempt ${attempt} failed:`, message);

        if (attempt >= MAX_RETRIES) {
          failedBatches++;
          batch.forEach((row) =>
            allSkipped.push({ row, reason: "AI processing failed after retries" })
          );
        } else {
          const retryDelay = extractRetryDelaySeconds(message);
          const waitMs = retryDelay ? (retryDelay + 1) * 1000 : 8000 * attempt;
          await sleep(waitMs);
        }
      }
    }

    if (jobId) {
      progressStore.set(jobId, { current: i + 1, total: batches.length, done: false });
    }

    if (i < batches.length - 1) {
      await sleep(DELAY_BETWEEN_BATCHES_MS);
    }
  }

  if (jobId) {
    progressStore.set(jobId, { current: batches.length, total: batches.length, done: true });
    // Clean up after a delay so memory doesn't grow forever
    setTimeout(() => progressStore.delete(jobId), 60000);
  }

  return {
    imported: allRecords,
    totalImported: allRecords.length,
    skipped: allSkipped,
    totalSkipped: allSkipped.length,
    failedBatches,
  };
}