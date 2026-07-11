import { Request, Response } from "express";
import { processBatches, progressStore } from "../services/batch.service";

export async function handleExtract(req: Request, res: Response) {
  try {
    const { rows, jobId } = req.body;

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ error: "No CSV rows provided." });
    }

    const MAX_ROWS = 1000;
    if (rows.length > MAX_ROWS) {
      return res.status(400).json({
        error: `This endpoint accepts a maximum of ${MAX_ROWS} rows per request. Received ${rows.length}.`,
      });
    }

    const result = await processBatches(rows, jobId);
    return res.status(200).json(result);
  } catch (err) {
    console.error("Extraction error:", err);
    return res.status(500).json({ error: "Failed to process CSV extraction." });
  }
}

export function handleProgress(req: Request, res: Response) {
  const jobId = req.params.jobId;
  if (!jobId || Array.isArray(jobId)) {
    return res.status(400).json({ error: "Missing jobId" });
  }
  const progress = progressStore.get(jobId);
  if (!progress) {
    return res.status(404).json({ error: "Job not found" });
  }
  return res.status(200).json(progress);
}