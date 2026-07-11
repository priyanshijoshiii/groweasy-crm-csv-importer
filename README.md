# AI-Powered CRM CSV Importer

An intelligent CSV importer that accepts leads from *any* CSV layout — Facebook Lead Exports, Google Ads Exports, Excel sheets, real estate CRM exports, or manually created spreadsheets — and uses an LLM to map them into a standardized CRM format.

## How It Works (Flow)

1. **Upload** — User uploads a CSV via drag & drop or file picker (max 5MB).
2. **Preview** — The CSV is parsed client-side and shown in a responsive, virtualized table (sticky headers, horizontal/vertical scroll, smooth performance even on large files). No AI call happens yet — this is a pure preview of the raw file.
3. **Confirm** — User clicks Confirm. Only now does the frontend send the parsed rows to the backend.
4. **AI Extraction** — The backend batches the rows and sends them to an LLM with a schema-constrained prompt, asking it to map arbitrary column names/layouts into the fixed CRM field set below. Real-time progress is shown as batches complete.
5. **Result** — The backend returns structured JSON, validated and cross-checked against business rules in code (not just AI instruction-following). The frontend displays a second table showing successfully imported records, skipped records, and totals — with color-coded status pills matching GrowEasy's product UI.

```
Upload → Parse (client) → Preview table (virtualized) → Confirm →
POST /api/extract → Batch rows → LLM extraction → Zod validation +
code-enforced business rules → Return { imported, skipped, totalImported, totalSkipped } →
Result table (virtualized)
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
The assignment's tech stack explicitly lists Node.js + Express for the backend. While Next.js API routes would also satisfy the functional requirements (and are themselves Node.js under the hood), a standalone Express service was built to match the stated stack precisely, deployed independently on Railway.

### Why Cerebras over OpenAI/Gemini/Claude?
Cerebras offers a genuinely free tier (no credit card) with strong throughput for structured JSON extraction tasks, making it well-suited for a batch-processing workload under free-tier constraints. The architecture is provider-agnostic — swapping to any OpenAI-compatible endpoint (OpenAI, Groq, etc.) requires changing only the API endpoint and model name in `backend/src/services/ai.service.ts`.

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
- Country codes (e.g. `+91`) are extracted separately from the mobile number when present in the source.
- If a record has **neither** an email **nor** a mobile number → skip it. **Enforced in code**, not just via AI prompt instruction, as a safety net against LLM inconsistency.
- `crm_status` and `data_source` must only use the allowed enum values above, or be left blank. `data_source` is additionally **cross-checked against the original row's raw values in code** — if the AI-suggested source doesn't literally appear in the source data, it's blanked out automatically, preventing hallucinated/inferred matches (e.g. an ad named "Eden Park Promo" incorrectly matching `eden_park`).
- Output must remain valid CSV-compatible JSON (no unescaped line breaks).

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
Covers the core business-rule enforcement: skip-rule logic, `data_source` hallucination guarding, and schema validation rejection.

## Project Structure
```
groweasy-crm-csv-importer/
├── frontend/
│   ├── app/
│   │   ├── page.tsx                # Upload → preview → confirm → result flow
│   │   ├── layout.tsx               # Root layout, dark mode flash-prevention script
│   │   └── globals.css
│   ├── components/
│   │   ├── CsvUploader.tsx          # Drag & drop / file picker, validation
│   │   ├── PreviewTable.tsx         # Virtualized raw CSV preview
│   │   └── ResultTable.tsx          # Virtualized results with status pills
│   ├── lib/
│   │   ├── api.ts                   # Backend API calls (extraction + progress polling)
│   │   └── types.ts                 # Shared TypeScript types
│   ├── Dockerfile
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── index.ts                 # Express app entry point
│   │   ├── routes/
│   │   │   └── extract.route.ts
│   │   ├── controllers/
│   │   │   └── extract.controller.ts
│   │   ├── services/
│   │   │   ├── ai.service.ts        # LLM prompt + call + validation enforcement
│   │   │   ├── ai.service.test.ts   # Unit tests
│   │   │   └── batch.service.ts     # Batching, retry/backoff, progress tracking
│   │   └── schemas/
│   │       └── crmRecord.schema.ts  # Zod schema
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
├── README.md
└── .gitignore
```

## API

### `POST /api/extract`
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
- Records missing both email and mobile (correctly skipped)
- A 49-row real-world dataset to verify multi-batch pacing and progress tracking under free-tier API rate limits

## Bonus Features Implemented
- [x] Drag & drop upload
- [x] Progress indicators during AI processing (real per-batch progress, polled live)
- [x] Retry mechanism for failed AI batches (parses actual rate-limit retry delays from API responses)
- [x] Virtualized tables for large CSVs (both preview and result tables)
- [x] Dark mode (persisted via localStorage, no flash-of-wrong-theme on reload)
- [x] Unit tests (Vitest, covering core business rules)
- [x] Docker setup (`docker-compose up` runs the full stack)
- [x] Deployment (Vercel + Railway)
- [x] Well-written README with setup instructions
- [ ] Streaming or incremental parsing

## Known Limitations
- Very large CSVs (500+ rows) may take longer to process, since AI batches are intentionally paced to respect the free-tier LLM API's rate limits (requests-per-minute caps). The architecture supports arbitrary file sizes — processing time scales with API constraints, not application design. A paid API tier would remove this constraint with no code changes beyond adjusting batch pacing.
- The `data_source` field relies on an exact literal match between the AI's suggestion and the original row's raw text, enforced in code as a safety net against LLM hallucination. This is intentionally conservative — it may occasionally leave `data_source` blank in edge cases where a genuine match exists but is phrased very differently in the source data.
- Progress tracking (`/api/extract/progress/:jobId`) uses an in-memory store on the server. This is sufficient for this assignment's single-instance deployment, but would not survive a server restart or scale correctly across multiple backend instances in a production multi-host setup — a production version would use Redis or similar shared state instead.
- The `/api/extract` endpoint accepts a maximum of 1000 rows per request and is rate-limited (20 requests per 15 minutes per IP) to protect the underlying metered LLM API key.
