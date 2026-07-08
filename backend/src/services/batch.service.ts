import { extractCrmRecords } from "./ai.service";
import { CrmRecord } from "../schemas/crmRecord.schema";

const BATCH_SIZE = 10;
const MAX_RETRIES = 4;
const DELAY_BETWEEN_BATCHES_MS = 3000;

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

export async function processBatches(rows: Record<string, string>[]) {
  const batches = chunkArray(rows, BATCH_SIZE);
  const allRecords: CrmRecord[] = [];
  let totalSkipped = 0;
  let failedBatches = 0;

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    let attempt = 0;
    let success = false;

    while (attempt < MAX_RETRIES && !success) {
      try {
        const { records, skippedCount } = await extractCrmRecords(batch);
        allRecords.push(...records);
        totalSkipped += skippedCount;
        success = true;
      } catch (err) {
        attempt++;
        console.error(`Batch ${i + 1}/${batches.length} attempt ${attempt} failed:`, err instanceof Error ? err.message : err);
        if (attempt >= MAX_RETRIES) {
          failedBatches++;
          totalSkipped += batch.length;
        } else {
          // Exponential backoff: wait longer on each retry to let the rate limit window clear
          await sleep(5000 * attempt);
        }
      }
    }

    // Pace ourselves between batches, even on success, to stay under TPM limits
    if (i < batches.length - 1) {
      await sleep(DELAY_BETWEEN_BATCHES_MS);
    }
  }

  return {
    imported: allRecords,
    totalImported: allRecords.length,
    totalSkipped,
    failedBatches,
  };
}