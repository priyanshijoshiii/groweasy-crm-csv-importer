import type { CsvRow, ExtractResponse } from "./types";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

export async function extractCrmRecords(rows: CsvRow[]): Promise<ExtractResponse> {
  const response = await fetch(`${BACKEND_URL}/api/extract`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rows }),
  });

  if (!response.ok) {
    throw new Error(`Extraction failed: ${response.status}`);
  }

  return response.json();
}