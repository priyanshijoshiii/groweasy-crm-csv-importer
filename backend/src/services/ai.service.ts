import { crmRecordSchema, CrmRecord } from "../schemas/crmRecord.schema";

const SYSTEM_PROMPT = `You are a CRM data extraction engine for GrowEasy.

You will receive an array of raw CSV rows as JSON objects. Column names are NOT fixed — they may come from Facebook Lead Exports, Google Ads Exports, Excel sheets, real estate CRM exports, or manually created spreadsheets. Your job is to intelligently map each row into GrowEasy's exact CRM format below, regardless of the original column names.

Return ONLY a valid JSON array. No markdown, no explanation, no code fences.

Each output object must have exactly these fields:
- created_at: lead creation date, must be parseable by JavaScript's new Date()
- name: lead name
- email: primary email
- country_code: the country code if present in the source phone number (e.g. "+91"). If a phone number includes a country code prefix (like +91, +1, 91-, etc.), extract it separately here and put ONLY the remaining digits in mobile_without_country_code. If no country code is present in the source, leave this blank.
- mobile_without_country_code: mobile number without the country code
- company: company name
- city: city
- state: state
- country: country
- lead_owner: lead owner
- crm_status: MUST be exactly one of: "GOOD_LEAD_FOLLOW_UP", "DID_NOT_CONNECT", "BAD_LEAD", "SALE_DONE", or "" if unclear
- crm_note: remarks, follow-up notes, extra phone numbers, extra emails, or any useful info that doesn't fit elsewhere
- data_source: This field maps to GrowEasy's specific internal project names. ONLY set this if a column value is an EXACT, LITERAL match (case-insensitive) to one of: "leads_on_demand", "meridian_tower", "eden_park", "varah_swamy", "sarjapur_plots". Campaign names, ad names, or form names that merely CONTAIN similar-sounding words (e.g. an ad called "Eden Park Promo") are NOT matches — do not infer or guess based on partial text similarity. If no column value is an exact match to the list, you MUST leave this as "" (empty string).
- possession_time: property possession time, if present
- description: additional description

RULES:
1. If multiple emails exist in a row, use the first as "email" and append the rest to crm_note.
2. If multiple mobile numbers exist, use the first as mobile_without_country_code and append the rest to crm_note.
3. Still return an object for every single input row, even if a row has neither an email nor a mobile number. Leave those fields as "" in that case — do not omit any row from the output array. Skipping decisions are handled separately, not by you.
4. Leave a field as "" (empty string) if you cannot confidently determine it. Never invent data.
5. Do not introduce raw line breaks inside any field value — escape them as \\n if needed.
6. Any double-quote characters that appear inside a string value MUST be escaped as \" so the output remains valid JSON. Never leave an unescaped quote inside a field value.

Return a JSON array with exactly one object per input row, in the same order as the input — the output array length must always match the input array length.`;

export interface SkippedRecord {
  row: Record<string, string>;
  reason: string;
}

export function validateAndEnforceRecords(
  parsed: unknown[],
  rows: Record<string, string>[]
): { validRecords: CrmRecord[]; skipped: SkippedRecord[] } {
  const validRecords: CrmRecord[] = [];
  const skipped: SkippedRecord[] = [];

  parsed.forEach((item, index) => {
    const originalRow = rows[index] || {};
    const validation = crmRecordSchema.safeParse(item);

    if (!validation.success) {
      const firstIssue = validation.error.issues[0];
      const reason = firstIssue
        ? `${firstIssue.path.join(".")}: ${firstIssue.message}`
        : "AI response did not match expected format";
      skipped.push({ row: originalRow, reason });
      return;
    }

    const record = validation.data;

    // Enforce "no raw line breaks" rule in code, not just via prompt instruction.
    // Only applied to genuinely freeform fields — crm_status and data_source
    // are constrained enums and can't contain line breaks by definition.
    const freeformFields: (keyof CrmRecord)[] = [
      "name",
      "company",
      "city",
      "state",
      "country",
      "crm_note",
      "possession_time",
      "description",
      "lead_owner",
    ];
    freeformFields.forEach((key) => {
      const value = record[key];
      if (typeof value === "string") {
        (record as Record<string, string>)[key] = value.replace(/\r?\n/g, "\\n");
      }
    });


    const hasEmail = record.email && record.email.trim() !== "";
    const hasMobile =
      record.mobile_without_country_code &&
      record.mobile_without_country_code.trim() !== "";

    if (!hasEmail && !hasMobile) {
      skipped.push({ row: originalRow, reason: "No email or mobile number found" });
      return;
    }

    if (record.data_source) {
      const originalValues = Object.values(originalRow).join(" ").toLowerCase();
      if (!originalValues.includes(record.data_source.toLowerCase())) {
        record.data_source = "";
      }
    }

    validRecords.push(record);
  });

  return { validRecords, skipped };
}

export async function extractCrmRecords(
  rows: Record<string, string>[]
): Promise<{ records: CrmRecord[]; skipped: SkippedRecord[] }> {
  const userPrompt = `Here are the raw CSV rows:\n${JSON.stringify(rows)}`;

  const cerebrasResponse = await fetch("https://api.cerebras.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.CEREBRAS_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-oss-120b",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.2,
      max_tokens: 4096,
    }),
  });

  if (!cerebrasResponse.ok) {
    const errText = await cerebrasResponse.text();
    throw new Error(`Cerebras API error (${cerebrasResponse.status}): ${errText}`);
  }

  const cerebrasData = await cerebrasResponse.json();
  const responseText: string = cerebrasData.choices?.[0]?.message?.content?.trim() || "";

  const cleaned = responseText
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "");

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    throw new Error(`AI returned invalid JSON: ${(err as Error).message}`);
  }

  if (!Array.isArray(parsed)) {
    throw new Error("AI response was not a JSON array");
  }

  const { validRecords, skipped } = validateAndEnforceRecords(parsed, rows);

    return {
      records: validRecords,
      skipped,
    };
}