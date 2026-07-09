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

  parsed.forEach((item, index) => {
    const validation = crmRecordSchema.safeParse(item);
    if (!validation.success) return;

    const record = validation.data;

    // Enforce the skip rule in code, not just via prompt instruction.
    const hasEmail = record.email && record.email.trim() !== "";
    const hasMobile =
      record.mobile_without_country_code &&
      record.mobile_without_country_code.trim() !== "";

    if (!hasEmail && !hasMobile) {
      return; // skip records with neither email nor mobile
    }

    // Enforce data_source accuracy in code: only keep it if that exact
    // value genuinely appears somewhere in the original row's data.
    // Otherwise the AI is pattern-matching/guessing — blank it out.
    if (record.data_source) {
      const originalRow = rows[index];
      const originalValues = originalRow
        ? Object.values(originalRow).join(" ").toLowerCase()
        : "";
      if (!originalValues.includes(record.data_source.toLowerCase())) {
        record.data_source = "";
      }
    }

    validRecords.push(record);
  });

  return {
    records: validRecords,
    skippedCount: rows.length - validRecords.length,
  };
}  