# AI-Powered CRM CSV Importer

An intelligent CSV importer that accepts leads from *any* CSV layout — Facebook Lead Exports, Google Ads Exports, Excel sheets, real estate CRM exports, or manually created spreadsheets — and uses an LLM to map them into a standardized CRM format.

Built for GrowEasy's Software Developer assignment.

## How It Works (Flow)

1. **Upload** — User uploads a CSV via drag & drop or file picker.
2. **Preview** — The CSV is parsed client-side and shown in a responsive table (sticky headers, horizontal/vertical scroll). No AI call happens yet — this is a pure preview of the raw file.
3. **Confirm** — User clicks Confirm. Only now does the frontend send the parsed rows to the backend.
4. **AI Extraction** — The backend batches the rows and sends them to an LLM with a schema-constrained prompt, asking it to map arbitrary column names/layouts into the fixed CRM field set below.
5. **Result** — The backend returns structured JSON. The frontend displays a second table showing successfully imported records, skipped records, and totals.

```
Upload → Parse (client) → Preview table → Confirm →
POST /api/extract → Batch rows → LLM extraction → Zod validation →
Return { imported, skipped, totalImported, totalSkipped } → Result table
```

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js (App Router) + TypeScript |
| Styling | Tailwind CSS |
| CSV Parsing | papaparse |
| Table UI | @tanstack/react-table |
| AI | Gemini / OpenAI / Claude (pluggable — see `lib/ai.ts`) |
| Validation | Zod |
| Deployment | Vercel |

## CRM Field Schema

| Field | Description |
|---|---|
| `created_at` | Lead creation date (must parse via `new Date(created_at)`) |
| `name` | Lead name |
| `email` | Primary email |
| `country_code` | Country code |
| `mobile_without_country_code` | Mobile number |
| `company` | Company name |
| `city` | City |
| `state` | State |
| `country` | Country |
| `lead_owner` | Lead owner |
| `crm_status` | One of: `GOOD_LEAD_FOLLOW_UP`, `DID_NOT_CONNECT`, `BAD_LEAD`, `SALE_DONE` |
| `crm_note` | Remarks, follow-ups, extra emails/numbers, anything unmapped |
| `data_source` | One of: `leads_on_demand`, `meridian_tower`, `eden_park`, `varah_swamy`, `sarjapur_plots` (blank if no confident match) |
| `possession_time` | Property possession time |
| `description` | Additional description |

### Extraction Rules
- If multiple emails exist → use the first, append the rest to `crm_note`.
- If multiple mobile numbers exist → use the first, append the rest to `crm_note`.
- If a record has **neither** an email **nor** a mobile number → skip it.
- `crm_status` and `data_source` must only use the allowed enum values above, or be left blank.
- Output must remain valid CSV-compatible JSON (no unescaped line breaks).

## Getting Started

### Prerequisites
- Node.js 18+
- An API key for your chosen LLM provider (Gemini / OpenAI / Anthropic)

### Installation
```bash
git clone <your-repo-url>
cd <repo-name>
npm install
```

### Environment Variables
Create a `.env.local` file in the root:
```bash
# Choose one based on lib/ai.ts provider
GEMINI_API_KEY=your_key_here
# OPENAI_API_KEY=your_key_here
# ANTHROPIC_API_KEY=your_key_here
```

### Run Locally
```bash
npm run dev
```
Visit `http://localhost:3000`.

### Build
```bash
npm run build
npm start
```

## Project Structure
```
├── app/
│   ├── page.tsx                # Upload + preview + confirm UI
│   ├── api/
│   │   └── extract/route.ts    # Batches rows, calls AI, validates, returns JSON
│   └── layout.tsx
├── components/
│   ├── CsvUploader.tsx
│   ├── PreviewTable.tsx
│   └── ResultTable.tsx
├── lib/
│   ├── ai.ts                    # LLM client + prompt construction
│   ├── schema.ts                # Zod schema for CRM record validation
│   └── batch.ts                 # Batching + retry logic
├── public/
└── README.md
```

## API

### `POST /api/extract`
**Request body:**
```json
{
  "rows": [ { "any": "column", "names": "here" }, ... ]
}
```

**Response:**
```json
{
  "imported": [ { "created_at": "...", "name": "...", "...": "..." } ],
  "skipped": [ { "reason": "no email or mobile", "row": { ... } } ],
  "totalImported": 42,
  "totalSkipped": 3
}
```

## Testing Notes
Tested against differently-shaped sample CSVs:
- Facebook Lead Export format
- Manually created spreadsheet with inconsistent column names
- Records containing multiple emails/phone numbers in a single field
- Records missing both email and mobile (expected to be skipped)

## Bonus Features Implemented
- [ ] Drag & drop upload
- [ ] Progress indicators during AI processing
- [ ] Retry mechanism for failed AI batches
- [ ] Virtualized table for large CSVs
- [ ] Dark mode
- [ ] Docker setup
- [ ] Unit tests

*(Check off as implemented before submission.)*

## Submission
- **Hosted app:** _add Vercel URL here_
- **GitHub repo:** _add repo URL here_
- **Position applied for:** Software Developer Intern
