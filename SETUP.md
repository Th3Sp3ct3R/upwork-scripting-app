# Upwork Auto-Apply System — Setup Guide

## Prerequisites

- Python 3.9+
- Anthropic API key (Claude)
- ~15 minutes

---

## Installation

### 1. Navigate to project

```bash
cd /Users/growthgod/.openclaw/workspace/upwork_scripting_app
```

### 2. Create virtual environment

```bash
python3 -m venv venv
source venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Setup environment variables

```bash
cp .env.example .env
```

Edit `.env` and add your Claude API key:
```
CLAUDE_API_KEY=sk-ant-...
```

Get your key from: https://console.anthropic.com/account/keys

### 5. Initialize database

The database auto-initializes on first run, but you can manually init:

```bash
python -c "from db.database import init_db; init_db()"
```

This creates `upwork.db` with all tables and indexes.

---

## Running the System

### Start Server

```bash
python main.py
```

Output:
```
INFO:root:🎯 Starting Upwork Auto-Apply System
INFO:root:📡 API Server: http://0.0.0.0:8000
INFO:root:🔧 Initializing Upwork Auto-Apply System...
INFO:root:✅ Database initialized at /path/to/upwork.db
INFO:root:⏰ Scheduler started (cycle every 30 min)
INFO:root:✅ System ready
```

### Test the API

```bash
# In another terminal
curl http://localhost:8000/health
# {"status":"ok"}

curl http://localhost:8000/api/stats
# {"new_jobs":0,"filtered_out":0,"pending_proposal":0,...}
```

### Manual Cycle (Testing)

```bash
curl -X POST http://localhost:8000/api/cycle/run
```

This runs:
1. Monitor feeds → fetch new jobs
2. Filter jobs → score against whitelist/blacklist
3. Generate proposals → Claude API creates personalized text

---

## Configuration

### Default Settings (config.py)

**Feed Monitoring**
- Polls every **30 minutes**
- Monitors 5 Upwork RSS feeds (landing pages, python, scraping, zapier, API)

**Job Filtering**
- Fixed price: minimum **$150**
- Hourly: minimum **$25/hr**
- Rejects jobs with no budget

**Whitelist Keywords** (points-based)
- automation, python, script, api, integrate
- landing page, webflow, react, next.js
- scraping, pipeline, workflow, zapier, make.com
- Min score to proceed: **2 keywords**

**Proposal Generation**
- Max length: **1000 characters**
- Tone: professional but personable
- Claude model: 3.5 Sonnet (latest)

### Customize

Edit `config.py`:

```python
# More aggressive filtering (higher keyword score needed)
FILTER_WHITELIST_MIN_SCORE = 3

# Increase budget minimum
BUDGET_FILTERS = {
    "fixed_min": 250,  # $250+ only
    "hourly_min": 35,  # $35/hr only
    "allow_no_budget": False,
}

# Add your own keywords
KEYWORD_WHITELIST.extend([
    "your skill here",
    "another specialty",
])

# Poll more/less frequently (in minutes)
FEED_POLL_INTERVAL = 15  # Check every 15 min instead of 30
```

---

## API Overview

### GET /api/jobs

Get all jobs with their current status.

```bash
curl http://localhost:8000/api/jobs

# Response:
{
  "jobs": [
    {
      "id": "12345",
      "title": "Build landing page",
      "budget": "$300",
      "status": "pending_proposal",
      "filter_score": 3,
      ...
    }
  ]
}
```

Filter by status:
```bash
curl "http://localhost:8000/api/jobs?status=pending_proposal"
```

Status values: `new`, `filtered_out`, `pending_proposal`, `proposal_ready`, `approved`, `sent`

### GET /api/proposals

Get all proposals (with linked job info).

```bash
curl http://localhost:8000/api/proposals

# Response:
{
  "proposals": [
    {
      "id": 1,
      "job_id": "12345",
      "title": "Build landing page",
      "proposal_text": "Hi! I saw you need...",
      "status": "pending",
      "generated_at": "2026-02-18T03:21:58",
      ...
    }
  ]
}
```

Filter by status:
```bash
curl "http://localhost:8000/api/proposals?status=pending"
```

Status values: `pending`, `approved`, `rejected`, `sent`

### POST /api/proposals/{id}/approve

Approve a proposal (marks as ready to send).

```bash
curl -X POST "http://localhost:8000/api/proposals/1/approve?notes=Looks+great"

# Response:
{
  "status": "approved",
  "proposal_id": 1
}
```

### POST /api/proposals/{id}/reject

Reject a proposal.

```bash
curl -X POST "http://localhost:8000/api/proposals/1/reject?notes=Not+interested"

# Response:
{
  "status": "rejected",
  "proposal_id": 1
}
```

### POST /api/cycle/run

Manually trigger a full monitoring cycle.

```bash
curl -X POST http://localhost:8000/api/cycle/run

# Runs: Monitor feeds → Filter jobs → Generate proposals
```

### GET /api/stats

System statistics.

```bash
curl http://localhost:8000/api/stats

# Response:
{
  "new_jobs": 5,
  "filtered_out": 12,
  "pending_proposal": 3,
  "proposal_ready": 2,
  "proposals_pending": 2,
  "proposals_approved": 0,
  "proposals_sent": 0
}
```

---

## Monitoring

### Watch logs

```bash
# Terminal 1: Run server
python main.py

# Terminal 2: Monitor logs in real-time
tail -f upwork.db  # (or check console output)
```

### Sample log output

```
2026-02-18 03:21:45 - modules.feed_monitor - INFO - 🔄 Starting feed monitor cycle...
2026-02-18 03:21:45 - modules.feed_monitor - INFO - 📡 Fetching: https://www.upwork.com/ab/feed/jobs/rss?q=landing+page...
2026-02-18 03:21:48 - modules.feed_monitor - INFO - ✅ New job: Build responsive landing page for SaaS...
2026-02-18 03:21:48 - modules.feed_monitor - INFO - 📊 Feed summary: 2 new, 8 duplicates
2026-02-18 03:21:48 - modules.job_filter - INFO - 🎯 Starting job filter cycle...
2026-02-18 03:21:48 - modules.job_filter - INFO - 📋 Processing 2 new jobs...
2026-02-18 03:21:48 - modules.job_filter - INFO - 🔍 Filtering: Build responsive landing page...
2026-02-18 03:21:48 - modules.job_filter - INFO - ✅ Budget OK: Fixed price: $500 (meets min $150)
2026-02-18 03:21:48 - modules.job_filter - INFO - 📊 Whitelist score: 3 (matched: landing page, react, api)
2026-02-18 03:21:48 - modules.job_filter - INFO - ✅ PASS: Score 3 >= 2
2026-02-18 03:21:48 - modules.job_filter - INFO - ✅ Filter cycle complete: 1 passed, 1 filtered
2026-02-18 03:21:55 - modules.proposal_generator - INFO - 📝 Starting proposal generation cycle...
2026-02-18 03:21:55 - modules.proposal_generator - INFO - 📋 Generating proposals for 1 jobs...
2026-02-18 03:21:55 - modules.proposal_generator - INFO - 🤖 Generating proposal for: Build responsive landing page...
2026-02-18 03:21:58 - modules.proposal_generator - INFO - ✅ Proposal generated (756 chars)
2026-02-18 03:21:58 - modules.proposal_generator - INFO - 💾 Proposal saved for job ab123cd
2026-02-18 03:21:58 - modules.proposal_generator - INFO - ✨ Proposal generation cycle complete: 1 generated, 0 failed
```

---

## Database Inspection

### View jobs in SQLite

```bash
# Open SQLite shell
sqlite3 upwork.db

# List all jobs
SELECT id, title, budget, status, filter_score FROM jobs;

# Count by status
SELECT status, COUNT(*) FROM jobs GROUP BY status;

# Exit
.quit
```

### Example queries

```sql
-- High-scoring jobs pending proposals
SELECT id, title, filter_score FROM jobs 
WHERE status = 'pending_proposal' 
ORDER BY filter_score DESC;

-- Proposals waiting for approval
SELECT p.id, j.title, p.generated_at FROM proposals p
JOIN jobs j ON p.job_id = j.id
WHERE p.status = 'pending';

-- Recent feed activity
SELECT feed_url, fetched_at, new_jobs FROM feed_log
ORDER BY fetched_at DESC
LIMIT 10;
```

---

## Troubleshooting

### Port already in use

If port 8000 is taken:

```python
# Edit config.py
API_PORT = 8001  # or another port
```

### Claude API error

```
Error: 401 Unauthorized
```

- Check CLAUDE_API_KEY in `.env`
- Verify key from: https://console.anthropic.com/account/keys
- Ensure key has sufficient quota

### No jobs fetched

- Upwork RSS feeds sometimes delay
- Try manual cycle: `curl -X POST http://localhost:8000/api/cycle/run`
- Check if feeds are accessible in browser

### Database corruption

If you see "database is locked":

```bash
# Stop the server (Ctrl+C)
# Then:
rm upwork.db
python main.py  # Will reinitialize
```

---

## Next Steps

1. **Run the system** — let it monitor feeds for a few cycles
2. **Review proposals** — check `/api/proposals?status=pending` to see Claude's work
3. **Test approval flow** — approve/reject proposals to understand the workflow
4. **Customize filters** — adjust `config.py` based on what jobs you're getting
5. **Build dashboard** — Phase 2: React frontend for easier proposal review

---

## Questions?

Check `README.md` for full documentation.

