"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.progressStore = void 0;
exports.processBatches = processBatches;
const ai_service_1 = require("./ai.service");
const BATCH_SIZE = 15;
const MAX_RETRIES = 4;
const DELAY_BETWEEN_BATCHES_MS = 4000;
// Simple in-memory progress store, keyed by a job ID
exports.progressStore = new Map();
function chunkArray(arr, size) {
    const chunks = [];
    for (let i = 0; i < arr.length; i += size) {
        chunks.push(arr.slice(i, i + size));
    }
    return chunks;
}
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
function extractRetryDelaySeconds(errorMessage) {
    const match = errorMessage.match(/try again in ([\d.]+)s/i);
    return match ? parseFloat(match[1]) : null;
}
async function processBatches(rows, jobId) {
    const batches = chunkArray(rows, BATCH_SIZE);
    const allRecords = [];
    let totalSkipped = 0;
    let failedBatches = 0;
    if (jobId) {
        exports.progressStore.set(jobId, { current: 0, total: batches.length, done: false });
    }
    for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        let attempt = 0;
        let success = false;
        while (attempt < MAX_RETRIES && !success) {
            try {
                const { records, skippedCount } = await (0, ai_service_1.extractCrmRecords)(batch);
                allRecords.push(...records);
                totalSkipped += skippedCount;
                success = true;
            }
            catch (err) {
                attempt++;
                const message = err instanceof Error ? err.message : String(err);
                console.error(`Batch ${i + 1}/${batches.length} attempt ${attempt} failed:`, message);
                if (attempt >= MAX_RETRIES) {
                    failedBatches++;
                    totalSkipped += batch.length;
                }
                else {
                    const retryDelay = extractRetryDelaySeconds(message);
                    const waitMs = retryDelay ? (retryDelay + 1) * 1000 : 8000 * attempt;
                    await sleep(waitMs);
                }
            }
        }
        if (jobId) {
            exports.progressStore.set(jobId, { current: i + 1, total: batches.length, done: false });
        }
        if (i < batches.length - 1) {
            await sleep(DELAY_BETWEEN_BATCHES_MS);
        }
    }
    if (jobId) {
        exports.progressStore.set(jobId, { current: batches.length, total: batches.length, done: true });
        // Clean up after a delay so memory doesn't grow forever
        setTimeout(() => exports.progressStore.delete(jobId), 60000);
    }
    return {
        imported: allRecords,
        totalImported: allRecords.length,
        totalSkipped,
        failedBatches,
    };
}
//# sourceMappingURL=batch.service.js.map