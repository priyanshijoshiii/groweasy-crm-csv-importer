# AI-Powered CRM CSV Importer

An intelligent CSV importer that accepts leads from *any* CSV layout — Facebook Lead Exports, Google Ads Exports, Excel sheets, real estate CRM exports, or manually created spreadsheets — and uses an LLM to map them into a standardized CRM format.

## How It Works (Flow)

1. **Upload** — User uploads a CSV via drag & drop or file picker (max 5MB).
2. **Preview** — The CSV is parsed client-side and shown in a responsive, virtualized table (sticky headers, horizontal/vertical scroll, smooth performance even on large files). No AI call happens yet — this is a pure preview of the raw file.
3. **Confirm** — User clicks Confirm. Only now does the frontend send the parsed rows to the backend.
4. **AI Extraction** — The backend batches the rows and sends them to an LLM with a schema-constrained prompt, asking it to map arbitrary column names/layouts into the fixed CRM field set below. Real-time progress is shown as batches complete.
5. **Result** — The backend returns structured JSON, validated and cross-checked against business rules in code (not just AI instruction-following). The frontend displays a second table showing successfully imported records, individually listed skipped records with specific reasons, and totals, with color-coded status pills.

```
Upload → Parse (client) → Preview table (virtualized) → Confirm →
POST /api/extract → Batch rows → LLM extraction → Zod validation +
code-enforced business rules → Return { imported, skipped, totalImported, totalSkipped } →
Result table (virtualized) + individually listed skipped records
```

## Tech Stack

| Layer | Choice |
|---|---|
| Frontend Framework | Next.js (App Router) + TypeScript |
| Backend Framework | Node.js + Express (separate service) |
| Styling | Tailwind CSS v4 (with class-based dark mode) |
| CSV Parsing | papaparse |
| Table UI | @tanstack/react-table + @tanstack/react-virtual |
| AI Provider | Cerebras API (`gpt-oss-120b`) |
| Validation | Zod |
| Testing | Vitest |
| Containerization | Docker + Docker Compose |
| Deployment | Vercel (frontend) + Railway (backend) |

### Why a separate Express backend instead of Next.js API routes?
A standalone Express service keeps the AI extraction logic, batching, and retry handling fully decoupled from the frontend framework, deployed and scaled independently. It also mirrors how this kind of workload is commonly structured in production: a thin frontend, and a backend service responsible for anything involving secrets, external API calls, and heavier processing.

### Why Cerebras?
Cerebras offers a genuinely free tier (no credit card) with strong throughput for structured JSON extraction tasks, making it well-suited for a batch-processing workload under free-tier constraints. The architecture is provider-agnostic. Swapping to any OpenAI-compatible endpoint (OpenAI, Groq, etc.) requires changing only the API endpoint and model name in `backend/src/services/ai.service.ts`.

## CRM Field Schema

| Field | Description |
|---|---|
| `created_at` | Lead creation date (must parse via `new Date(created_at)`) |
| `name` | Lead name |
| `email` | Primary email (validated for correct format) |
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
- If multiple emails exist, use the first, append the rest to `crm_note`.
- If multiple mobile numbers exist, use the first, append the rest to `crm_note`.
- Country codes (e.g. `+91`) are extracted separately from the mobile number when present in the source.
- A record with **neither** a valid email **nor** a mobile number is skipped, and shown individually in the result view with a specific reason (e.g. "No email or mobile number found", or a schema-level reason like "email: Invalid email format"). This is **enforced in code**, not just via AI prompt instruction, as a safety net against LLM inconsistency. The AI is instructed to return an object for every input row rather than silently omitting any, so the skip decision is made deterministically by validation logic, not by the model's own judgment.
- `crm_status` and `data_source` must only use the allowed enum values above, or be left blank. `data_source` is additionally **cross-checked against the original row's raw values in code**. If the AI-suggested source doesn't literally appear in the source data, it's blanked out automatically, preventing hallucinated or loosely inferred matches (e.g. an ad named "Eden Park Promo" incorrectly matching `eden_park`).
- Email fields are validated for proper format (not just presence) via Zod, so a non-empty but invalid value (e.g. a plain word instead of an email address) does not falsely count as a valid contact method.
- Output remains valid CSV-compatible JSON: line breaks inside field values are escaped, and the model is instructed to keep output as strictly valid JSON.
- Batching is size-aware, not just row-count-based. Batches are split further whenever accumulated field content approaches the model's practical output limit, which significantly reduces the risk of response truncation on datasets with unusually long free-text fields (verified against a real-world dataset with long, multi-value fields).

## Getting Started

### Option A: Run with Docker (recommended)

Prerequisites: Docker Desktop installed and running.

1. Clone the repo:
   ```bash
   git clone <your-repo-url>
   cd groweasy-crm-csv-importer
   ```
2. Create a `.env` file in the project root:
   ```
   CEREBRAS_API_KEY=your_key_here
   ```
3. Run:
   ```bash
   docker compose up --build
   ```
4. Visit `http://localhost:3000`. The backend runs on `http://localhost:5000`.

### Option B: Run locally without Docker

Prerequisites: Node.js 18+, a Cerebras API key ([cloud.cerebras.ai](https://cloud.cerebras.ai)).

**Backend:**
```bash
cd backend
npm install
```
Create `backend/.env`:
```
CEREBRAS_API_KEY=your_key_here
PORT=5000
```
```bash
npm run dev
```

**Frontend** (in a separate terminal):
```bash
cd frontend
npm install
```
Create `frontend/.env.local`:
```
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
```
```bash
npm run dev
```

Visit `http://localhost:3000`.

### Running Tests
```bash
cd backend
npm test
```
Covers the core business-rule enforcement: skip-rule logic (including specific skip reasons), email format validation, `data_source` hallucination guarding, and schema validation rejection.

## Project Structure
```
groweasy-crm-csv-importer/
├── frontend/
│   ├── app/
│   │   ├── page.tsx                # Upload -> preview -> confirm -> result flow
│   │   ├── layout.tsx               # Root layout, dark mode flash-prevention script
│   │   └── globals.css
│   ├── components/
│   │   ├── CsvUploader.tsx          # Drag & drop / file picker, validation
│   │   ├── PreviewTable.tsx         # Virtualized raw CSV preview
│   │   ├── ResultTable.tsx          # Virtualized results, status pills, skipped-records view, search
│   │   └── Logo.tsx
│   ├── lib/
│   │   ├── api.ts                   # Backend API calls (extraction + progress polling)
│   │   └── types.ts                 # Shared TypeScript types
│   ├── Dockerfile
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── index.ts                 # Express app entry point (trust proxy, rate limiting, CORS)
│   │   ├── routes/
│   │   │   └── extract.route.ts
│   │   ├── controllers/
│   │   │   └── extract.controller.ts
│   │   ├── services/
│   │   │   ├── ai.service.ts        # LLM prompt + call + validation enforcement
│   │   │   ├── ai.service.test.ts   # Unit tests
│   │   │   └── batch.service.ts     # Batching, retry/backoff, progress tracking
│   │   └── schemas/
│   │       └── crmRecord.schema.ts  # Zod schema, including email format validation
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
├── README.md
└── .gitignore
```

## API

### `POST /api/extract`
Rate limited to 20 requests per 15 minutes per IP. Accepts a maximum of 1000 rows per request.

**Request body:**
```json
{
  "rows": [ { "any": "column", "names": "here" } ],
  "jobId": "optional-uuid-for-progress-tracking"
}
```

**Response:**
```json
{
  "imported": [ { "created_at": "...", "name": "...", "...": "..." } ],
  "skipped": [ { "row": { "...": "..." }, "reason": "No email or mobile number found" } ],
  "totalImported": 42,
  "totalSkipped": 3,
  "failedBatches": 0
}
```

### `GET /api/extract/progress/:jobId`
**Response:**
```json
{ "current": 3, "total": 5, "done": false }
```
Used by the frontend to poll and display live batch progress during processing.

## Testing Notes
Tested against multiple differently-shaped sample CSVs:
- A Facebook Lead Ads-style export (`campaign_name`, `ad_name`, `phone_number`, differently-formatted country codes)
- Manually created spreadsheets with inconsistent, informal column names
- Records containing multiple emails/phone numbers in a single field
- Records missing both email and mobile (correctly skipped, with reason shown)
- Records with an invalid, non-empty email value (correctly rejected via format validation, not just presence checking)
- A messy, realistic multi-field dataset with long text fields, to verify batching stays within token limits without truncating AI responses
- A larger real-world dataset (~500 rows) to validate multi-batch pacing and progress tracking; a moderate multi-batch dataset (~50 rows across multiple batches) was confirmed processing cleanly end-to-end under current rate-limit pacing

## Bonus Features Implemented
- [x] Drag & drop upload
- [x] Progress indicators during AI processing (real per-batch progress, polled live)
- [x] Retry mechanism for failed AI batches (parses actual rate-limit retry delays from API responses)
- [x] Virtualized tables for large CSVs (both preview and result tables)
- [x] Dark mode (persisted via localStorage, no flash-of-wrong-theme on reload)
- [x] Unit tests (Vitest, covering core business rules)
- [x] Docker setup (`docker compose up` runs the full stack)
- [x] Deployment (Vercel + Railway)
- [x] Well-written README with setup instructions
- [ ] Streaming or incremental parsing

## Known Limitations
- Very large CSVs (500+ rows) may take longer to process, since AI batches are intentionally paced to respect the free-tier LLM API's rate limits (requests-per-minute caps). The architecture supports arbitrary file sizes. Processing time scales with API constraints, not application design.
- The `data_source` field relies on an exact value match (normalized for case, spacing, hyphens, and underscores) between the AI's suggestion and one of the original row's column values, enforced in code as a safety net against LLM hallucination. This correctly handles formatting variations (e.g. "Leads On Demand" vs `leads_on_demand`) while still rejecting loose or partial matches (e.g. a campaign called "Eden Park Promo" does not falsely match `eden_park`).
- Progress tracking (`/api/extract/progress/:jobId`) uses an in-memory store on the server. This is sufficient for a single-instance deployment, but would not survive a server restart or scale correctly across multiple backend instances in a multi-host setup. A production version would use Redis or similar shared state instead.