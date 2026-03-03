# Architecture

**Analysis Date:** 2026-02-18

## Pattern Overview

**Overall:** Pipeline + Human-in-the-Loop

The Upwork Auto-Apply system follows a **staged pipeline architecture** with manual human approval gates. Data flows through distinct phases (fetch → filter → generate → review → export) with clear transitions between stages. Each phase is independently callable and uses a shared SQLite database as state store.

**Key Characteristics:**
- **Phase-based pipeline**: Fetch → Filter → Generate → Approve → Export
- **Database-driven state machine**: Job and proposal status fields guide workflow
- **Human approval gates**: No automatic submission; human reviews all proposals before export
- **Modular components**: Each phase is independently executable and testable
- **Configuration-driven filtering**: Keywords, budgets, and limits centralized in `config.py`

## Layers

**Feed Monitor Layer:**
- Purpose: Continuously poll Upwork RSS feeds for new job postings
- Location: `modules/feed_monitor.py`
- Contains: RSS parsing, job extraction, deduplication logic
- Depends on: `feedparser` (external), SQLite database via `db.database`
- Used by: `main.py` /api/run-cycle endpoint, manual invocation

**Job Filter Layer:**
- Purpose: Score and classify jobs based on budget, keywords, and relevance
- Location: `modules/job_filter.py`
- Contains: Budget extraction, whitelist/blacklist matching, relevance scoring (0-10)
- Depends on: `config.py` (keywords, budget thresholds), SQLite database
- Used by: `main.py` /api/run-cycle endpoint, filters jobs with status='new'

**Proposal Generation Layer:**
- Purpose: Use Claude API to generate custom, job-specific proposals
- Location: `modules/proposal_generator.py`
- Contains: Claude API calls, system prompt management, JSON parsing, daily rate limiting
- Depends on: `anthropic` SDK, `config.py`, SQLite database, Claude API key from .env
- Used by: `main.py` /api/run-cycle endpoint, generates for jobs with status='pending_proposal'

**API & Control Layer:**
- Purpose: HTTP endpoints for human review, approval/rejection, statistics, and manual cycle triggering
- Location: `main.py`
- Contains: FastAPI application, CORS middleware, 12 REST endpoints, startup initialization
- Depends on: `fastapi`, all three pipeline modules, database layer
- Used by: Dashboard (HTML/JS) via fetch(), manual curl requests, cron/scheduled triggers

**Database & Persistence Layer:**
- Purpose: SQLite store for jobs, proposals, and feed logs with transactional semantics
- Location: `db/database.py` (connection/query helpers), `db/schema.sql` (schema definition)
- Contains: Connection pooling via `get_db()`, parameterized query execution, row factory for dict-like access
- Depends on: SQLite3 standard library
- Used by: All other layers for state persistence and reads

**Export & Delivery Layer:**
- Purpose: Format approved proposals into human-readable text files for manual Upwork submission
- Location: `modules/sender.py`
- Contains: File formatting, directory creation, proposal staging, status marking
- Depends on: File system (creates `/exports/{YYYY-MM-DD}/` directories), database layer
- Used by: `main.py` /api/export-approved endpoint, triggered manually when ready to send

## Data Flow

**Complete Job Lifecycle:**

1. **Fetch Phase** (`monitor_feeds()`)
   - Polls 5 configured Upwork RSS feeds
   - Extracts job_id, title, description, budget, category, URL, posted_at
   - Checks if job_id already exists in `jobs` table
   - Inserts new jobs with status='new'
   - Logs to `feed_log` table (new count, duplicates, errors)

2. **Filter Phase** (`filter_all_new_jobs()`)
   - Selects all jobs WHERE status='new'
   - For each job:
     - Checks blacklist keywords (hard reject: "wordpress theme", "logo design", etc.)
     - Checks budget >= minimum (fixed $150+ or hourly $25+)
     - Scores whitelist keywords (0-10 points: "python", "api", "automation", etc.)
   - Updates job status:
     - Blacklist match → status='filtered_out', filter_reason='blacklist_match'
     - Budget fail → status='filtered_out', filter_reason='low_budget'
     - Score < 2 → status='filtered_out', filter_reason='low_score'
     - Score >= 2 → status='pending_proposal', filter_score={score}

3. **Generate Phase** (`generate_all_pending()`)
   - Selects all jobs WHERE status='pending_proposal' (ordered by filter_score DESC)
   - For each job (up to daily limit):
     - Calls Claude API with system prompt + job context
     - Parses Claude's JSON response (proposal, opening_hook, relevant_experience)
     - Inserts into `proposals` table with status='pending'
     - Updates job to status='proposal_ready'
     - Checks daily limit (`LIMITS['max_proposals_per_day']`); stops if reached

4. **Review Phase** (Human in Dashboard)
   - User visits `/dashboard/index.html` or calls /api/queue
   - Displays all proposals WHERE status='pending'
   - User clicks Approve or Reject:
     - Approve → status='approved', approved_at=now
     - Reject → status='rejected'
   - User can edit proposal text via PUT /api/proposal/{id}

5. **Export Phase** (`export_approved_proposals()`)
   - Selects all proposals WHERE status='approved' AND sent_at IS NULL
   - For each proposal:
     - Creates file: `/exports/{YYYY-MM-DD}/{id:04d}_{job_slug}.txt`
     - Formats with job details, proposal text, and submission instructions
     - Updates proposal to status='sent', sent_at=now

6. **Manual Upwork Submission**
   - User opens exported file
   - User copies proposal text
   - User pastes into Upwork's proposal form
   - User submits (outside this system)

**State Management:**

Jobs table tracks workflow state via `status` field:
```
new → pending_proposal → proposal_ready
  ↓            ↓
filtered_out (terminal)
```

Proposals table tracks approval state via `status` field:
```
pending → approved → sent
   ↓        ↓
rejected (terminal)
```

Each transition is explicit and auditable. Timestamps (`fetched_at`, `generated_at`, `approved_at`, `sent_at`) track when each phase occurred.

## Key Abstractions

**Pipeline Module Pattern:**
- Purpose: Encapsulate each workflow phase as a module with clear entry points
- Examples: `modules/feed_monitor.py`, `modules/job_filter.py`, `modules/proposal_generator.py`, `modules/sender.py`
- Pattern: Single public function (`monitor_feeds()`, `filter_all_new_jobs()`, etc.) with private helpers. Modules independently import database layer and config.

**Database Query Abstraction:**
- Purpose: Centralize SQLite connection handling and parameterized query execution
- Examples: `exec_query(query, params=None, fetch=False)` in `db/database.py`
- Pattern: Always use `?` placeholders for parameters, never string interpolation. `fetch=True` returns rows as dicts, `fetch=False` commits and returns rowcount.

**Config-Driven Filtering:**
- Purpose: Allow tweaking job selection criteria without code changes
- Examples: `KEYWORD_WHITELIST`, `KEYWORD_BLACKLIST`, `BUDGET_FILTERS` in `config.py`
- Pattern: All filtering rules live in `config.py`. Modules read from config at runtime; no hardcoding.

**Status-Driven Workflow:**
- Purpose: Use database status fields as state machine, not in-memory flags
- Examples: Job/Proposal `status` columns drive which pipeline phase processes them
- Pattern: Each phase selects WHERE status={previous_phase_output}, updates status={next_phase_input}. Idempotent and resumable.

## Entry Points

**API Server (FastAPI):**
- Location: `main.py` (lines 17-223)
- Triggers: `python main.py` or `uvicorn main:app`
- Responsibilities: HTTP server, routing, CORS headers, database initialization on startup

**Manual Cycle Trigger:**
- Location: POST `/api/run-cycle` endpoint in `main.py` (lines 182-204)
- Triggers: Manual HTTP request, curl, dashboard button
- Responsibilities: Orchestrates feed_monitor → filter → generate in sequence; returns counts of filtered/generated

**Feed Monitor Standalone:**
- Location: `modules/feed_monitor.py` (lines 99-100)
- Triggers: `python modules/feed_monitor.py`, scheduled cron job, or API call
- Responsibilities: Polls RSS feeds, deduplicates, inserts new jobs

**Job Filter Standalone:**
- Location: `modules/job_filter.py` (lines 130-131)
- Triggers: `python modules/job_filter.py` or API call
- Responsibilities: Filters all status='new' jobs, updates statuses and scores

**Proposal Generator Standalone:**
- Location: `modules/proposal_generator.py` (lines 149-150)
- Triggers: `python modules/proposal_generator.py` or API call
- Responsibilities: Generates proposals for status='pending_proposal' jobs with Claude

**Export Approved:**
- Location: `modules/sender.py` (lines 101-102)
- Triggers: `python modules/sender.py` or `/api/export-approved` endpoint
- Responsibilities: Formats approved proposals, creates files in /exports/, marks as sent

**Dashboard:**
- Location: `dashboard/index.html`
- Triggers: HTTP request to `/dashboard/index.html`
- Responsibilities: Displays stats and proposal queue, provides UI for approve/reject

## Error Handling

**Strategy:** Fail loudly, log extensively, continue with other items

**Patterns:**

1. **Feed Parsing Errors** (`feed_monitor.py`, lines 12-21):
   - Try/catch around feedparser.parse()
   - Log warning if feed.bozo flag set (malformed XML)
   - Return None; calling function skips that feed and logs to feed_log
   - System continues with next feed

2. **Missing Data** (`feed_monitor.py`, lines 23-39):
   - Try/catch around entry extraction
   - Use .get() with defaults for optional fields
   - Return None if extraction fails; calling function counts as error
   - Job entry skipped without crashing pipeline

3. **API Failures** (`proposal_generator.py`, lines 83-123):
   - Try/catch around client.messages.create()
   - Catch json.JSONDecodeError separately (malformed response)
   - Catch generic Exception for network/timeout errors
   - Log error, return False; calling function moves to next job
   - Failed proposals NOT inserted; job stays status='pending_proposal'

4. **Database Errors** (`db/database.py`, lines 26-45):
   - Try/finally around cursor execution ensures connection closes
   - No explicit error re-raise; exceptions propagate to caller
   - Caller (each module) must handle database exceptions

5. **HTTP Errors** (`main.py`, lines 41-204):
   - FastAPI endpoints raise HTTPException(status_code=..., detail=...)
   - /api/run-cycle catches Exception and raises HTTPException 500
   - /api/job/{id}, /api/proposal/{id} raise 404 if not found

6. **Rate Limiting** (`proposal_generator.py`, lines 48-50):
   - Check count_sent_today() before generating
   - Log warning and return False if limit reached
   - No exception; pipeline stops gracefully

## Cross-Cutting Concerns

**Logging:**
- Framework: Python `logging` module via `logger = logging.getLogger(__name__)`
- Pattern: All modules configure `logging.basicConfig(level=logging.INFO)` at import time
- Emojis for visual scanning: ✅ (success), ❌ (filtered), 📡 (fetch), 🔍 (filter), 🤖 (generate), 📤 (export)
- All phases log entry/exit and key decisions (blacklist match, budget check, score, API call)

**Validation:**
- Budget extraction: `extract_budget_amount()` uses regex to parse strings like "$150-300", "$50/hr"
- Blacklist/Whitelist: Simple substring matching in lowercased text (case-insensitive)
- Claude JSON: Strict `json.loads()` on response; fails if malformed (not lenient)
- API inputs: FastAPI automatic validation for path/query parameters via type hints

**Authentication:**
- API key: Claude API key read from `.env` via `config.CLAUDE_API_KEY`
- No user authentication: Dashboard publicly accessible (localhost only by default via CORS)
- No database auth: SQLite file; relies on OS filesystem permissions

**Configuration:**
- Single source of truth: `config.py`
- Overridable via `.env`: Claude API key required; budget/limits optional
- No reloading: Config read at module import time; changes require restart
- Immutable at runtime: Modules read config once, don't listen for changes
