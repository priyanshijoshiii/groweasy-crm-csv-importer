import { Request, Response } from "express";
import { processBatches } from "../services/batch.service";

export async function handleExtract(req: Request, res: Response) {
  try {
    const { rows } = req.body;

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ error: "No CSV rows provided." });
    }

    const result = await processBatches(rows);
    return res.status(200).json(result);
  } catch (err) {
    console.error("Extraction error:", err);
    return res.status(500).json({ error: "Failed to process CSV extraction." });
  }
}