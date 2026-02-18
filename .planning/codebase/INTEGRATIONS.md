# External Integrations

**Analysis Date:** 2026-02-18

## APIs & External Services

**Claude AI (Anthropic):**
- Service: Claude AI API for proposal generation
  - SDK/Client: `anthropic` package (0.38.0)
  - Auth: API key via `CLAUDE_API_KEY` environment variable
  - Model: claude-3-5-sonnet-20241022
  - Integration: `modules/proposal_generator.py` uses `Anthropic` client
  - Purpose: Generates customized Upwork proposals based on job descriptions

**Upwork Job Feeds:**
- Service: Upwork RSS feeds (public, no auth required)
  - Integration: `modules/feed_monitor.py` parses RSS feeds
  - Feeds: Multiple configured feeds in `config.UPWORK_FEEDS`
  - Examples:
    - https://www.upwork.com/ab/feed/jobs/rss?q=landing+page&sort=recency
    - https://www.upwork.com/ab/feed/jobs/rss?q=python+automation&sort=recency
    - https://www.upwork.com/ab/feed/jobs/rss?q=web+scraping&sort=recency
    - https://www.upwork.com/ab/feed/jobs/rss?q=zapier+automation&sort=recency
    - https://www.upwork.com/ab/feed/jobs/rss?q=api+integration&sort=recency
  - Update frequency: Every 30 minutes (configured via `FEED_POLL_INTERVAL`)
  - Parsed by: `feedparser` library

## Data Storage

**Databases:**
- SQLite local database (`upwork.db`)
  - Connection: Direct file-based via `sqlite3` module
  - Client: Python `sqlite3` standard library
  - Location: `db/database.py` handles initialization and queries
  - Tables:
    - `jobs` - Stores fetched Upwork jobs with status tracking
    - `proposals` - Stores generated proposals with approval workflow
    - `feed_log` - Audit log of RSS feed fetches

**File Storage:**
- Local filesystem only
  - Exports directory: `exports/[YYYY-MM-DD]/` for approved proposals
  - One `.txt` file per proposal with job details and formatted proposal text
  - Created by `modules/sender.py` during export

**Caching:**
- None detected

## Authentication & Identity

**Auth Provider:**
- Custom implementation via API key
  - Claude API: Environment variable `CLAUDE_API_KEY`
  - Upwork feeds: Public RSS (no authentication required)

**API Server Auth:**
- No authentication on API endpoints
- CORS configured for `http://localhost:3000` and `http://localhost:3001`
- Located in `main.py` via FastAPI middleware

## Monitoring & Observability

**Error Tracking:**
- Not integrated (local logging only)

**Logs:**
- Python standard `logging` module
- Log level: INFO
- Configured in multiple modules: `main.py`, `modules/feed_monitor.py`, `modules/proposal_generator.py`, `modules/job_filter.py`, `modules/sender.py`

## CI/CD & Deployment

**Hosting:**
- Not specified (self-hosted deployment expected)

**CI Pipeline:**
- Not detected

## Environment Configuration

**Required env vars:**
- `CLAUDE_API_KEY` - Critical for proposal generation

**Optional env vars (supported in .env.example):**
- `UPWORK_FEEDS_CUSTOM` - Override default feed URLs
- `BUDGET_FIXED_MIN` - Minimum fixed-price budget
- `BUDGET_HOURLY_MIN` - Minimum hourly rate
- `MAX_PROPOSALS_PER_DAY` - Daily submission limit

**Secrets location:**
- `.env` file (local, not committed to git)
- Template: `.env.example`

## Webhooks & Callbacks

**Incoming:**
- None detected

**Outgoing:**
- None detected (proposals must be manually submitted to Upwork via browser)

## Manual Submission Flow

**Current Process:**
- Proposals are generated and stored in database with status `pending`
- User reviews proposals via dashboard API endpoints
- User approves proposals via `POST /api/proposal/{proposal_id}/approve`
- Approved proposals are exported to text files via `POST /api/export-approved`
- User manually copies proposal text and submits to Upwork website
- Manually marked as sent via `modules/sender.py`

---

*Integration audit: 2026-02-18*
