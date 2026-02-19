# Technology Stack

**Analysis Date:** 2026-02-18

## Languages

**Primary:**
- Python 3.14.2 - Backend application, core automation logic

## Runtime

**Environment:**
- Python 3.14.2 (local development)

**Package Manager:**
- pip (implicit via requirements.txt)
- Lockfile: No lockfile present (requirements.txt only)

## Frameworks

**Core:**
- FastAPI 0.115.5 - REST API server for dashboard and automation control

**Feed/Content Parsing:**
- feedparser 6.0.10 - RSS feed parsing for Upwork job listings

**Scheduling:**
- APScheduler 3.10.4 - Scheduled task execution (feed polling intervals)

**API Client:**
- Anthropic 0.38.0 - Claude API client for proposal generation

**Server:**
- Uvicorn 0.30.0 - ASGI web server for FastAPI

## Key Dependencies

**Critical:**
- anthropic 0.38.0 - Enables core proposal generation via Claude API
- feedparser 6.0.10 - Enables RSS feed monitoring for job discovery
- fastapi 0.115.5 - Provides REST API interface for dashboard and automation control
- requests 2.31.0 - HTTP client for external API calls

**Infrastructure:**
- python-dotenv 1.0.0 - Environment variable management from .env files
- uvicorn 0.30.0 - ASGI server for running FastAPI application
- apscheduler 3.10.4 - Background job scheduling for feed polling cycles

## Configuration

**Environment:**
- Configured via `.env` file (see `.env.example` for template)
- Supports override of feed URLs, budget thresholds, proposal limits via environment

**Key Configuration (config.py):**
- `CLAUDE_API_KEY` - Claude API authentication
- `CLAUDE_MODEL` - Model selection (currently: claude-3-5-sonnet-20241022)
- `FEED_POLL_INTERVAL` - Interval between RSS feed polls (30 minutes)
- `UPWORK_FEEDS` - List of RSS feed URLs to monitor
- `BUDGET_FILTERS` - Budget thresholds for job filtering
- `KEYWORD_BLACKLIST` - Job keywords that disqualify jobs
- `KEYWORD_WHITELIST` - Job keywords that score positively
- `PROPOSAL_MAX_CHARS` - Maximum proposal length (1000 chars)
- `API_HOST` - API server binding (0.0.0.0)
- `API_PORT` - API server port (8000)

## Database

**Type:** SQLite
- Location: `upwork.db` (created at project root on first run)
- Schema initialization: `db/schema.sql`
- Tables: jobs, proposals, feed_log with indexed lookups

## Platform Requirements

**Development:**
- Python 3.14.2
- pip for dependency installation
- Access to Upwork RSS feeds (public)
- Valid Anthropic Claude API key

**Production:**
- Python 3.14.2 runtime
- Internet access for Upwork RSS feeds
- Internet access for Anthropic Claude API
- Persistent storage for SQLite database

---

*Stack analysis: 2026-02-18*
