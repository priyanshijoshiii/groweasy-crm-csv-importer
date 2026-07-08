import { crmRecordSchema, CrmRecord } from "../schemas/crmRecord.schema";

const SYSTEM_PROMPT = `You are a CRM data extraction engine for GrowEasy.

You will receive an array of raw CSV rows as JSON objects. Column names are NOT fixed — they may come from Facebook Lead Exports, Google Ads Exports, Excel sheets, real estate CRM exports, or manually created spreadsheets. Your job is to intelligently map each row into GrowEasy's exact CRM format below, regardless of the original column names.

Return ONLY a valid JSON array. No markdown, no explanation, no code fences.

Each output object must have exactly these fields:
- created_at: lead creation date, must be parseable by JavaScript's new Date()
- name: lead name
- email: primary email
- country_code: country code (e.g. "+91")
- mobile_without_country_code: mobile number without the country code
- company: company name
- city: city
- state: state
- country: country
- lead_owner: lead owner
- crm_status: MUST be exactly one of: "GOOD_LEAD_FOLLOW_UP", "DID_NOT_CONNECT", "BAD_LEAD", "SALE_DONE", or "" if unclear
- crm_note: remarks, follow-up notes, extra phone numbers, extra emails, or any useful info that doesn't fit elsewhere
- data_source: ONLY set this if the input data explicitly contains a recognizable source name (like a column literally named "source", "lead source", "campaign", or similar, containing one of these exact values). MUST be exactly one of: "leads_on_demand", "meridian_tower", "eden_park", "varah_swamy", "sarjapur_plots". If there is NO explicit source information in the input row, you MUST leave this as "" (empty string). NEVER guess or assume a data_source value.
- possession_time: property possession time, if present
- description: additional description

RULES:
1. If multiple emails exist in a row, use the first as "email" and append the rest to crm_note.
2. If multiple mobile numbers exist, use the first as mobile_without_country_code and append the rest to crm_note.
3. If a row has NEITHER an email NOR a mobile number, DO NOT include it in the output array at all — it must be skipped.
4. Leave a field as "" (empty string) if you cannot confidently determine it. Never invent data.
5. Do not introduce raw line breaks inside any field value — escape them as \\n if needed.

Return a JSON array, one object per valid input row, in the same order as the input.`;

export async function extractCrmRecords(
  rows: Record<string, string>[]
): Promise<{ records: CrmRecord[]; skippedCount: number }> {
  const userPrompt = `Here are the raw CSV rows:\n${JSON.stringify(rows, null, 2)}`;

  const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.2,
    }),
  });

  if (!groqResponse.ok) {
    const errText = await groqResponse.text();
    throw new Error(`Groq API error (${groqResponse.status}): ${errText}`);
  }

  const groqData = await groqResponse.json();
  const responseText: string = groqData.choices?.[0]?.message?.content?.trim() || "";

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

const validRecords: CrmRecord[] = [];

  for (const item of parsed) {
    const validation = crmRecordSchema.safeParse(item);
    if (!validation.success) continue;

    const record = validation.data;

    // Enforce the skip rule in code, not just via prompt instruction —
    // don't trust the AI alone for a business-critical rule.
    const hasEmail = record.email && record.email.trim() !== "";
    const hasMobile =
      record.mobile_without_country_code &&
      record.mobile_without_country_code.trim() !== "";

    if (!hasEmail && !hasMobile) {
      continue; // skip records with neither email nor mobile
    }

    validRecords.push(record);
  }

  return {
    records: validRecords,
    skippedCount: rows.length - validRecords.length,
  };
}  