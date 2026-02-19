# Upwork Auto-Apply System - Complete Overview

## What This Does

Automates the most tedious part of freelancing: finding jobs + writing proposals.

**Without this system**: Spend 2+ hours daily refreshing Upwork, reading job posts, writing custom proposals.

**With this system**: 
- ✅ System finds relevant jobs automatically (RSS feed polling)
- ✅ System generates personalized proposals with Claude AI
- ✅ You review + approve in dashboard (2 min per job)
- ✅ System exports ready-to-send proposals

---

## How It Works (Simplified)

### Every 30 Minutes:
1. **Feed Monitor** polls 5 Upwork RSS feeds → gets new job listings
2. **Job Filter** checks budget + keywords → keeps only relevant ones
3. **Claude Generator** reads job → writes custom proposal using Claude API

### Every Time You Visit Dashboard:
1. **Review Queue** shows all pending proposals
2. You click **Approve** or **Reject** (takes 2 minutes)
3. Click **Export** when ready → proposals ready to copy-paste to Upwork

### Upwork Submission (Manual):
1. Open exported proposal file
2. Paste into Upwork's proposal form
3. Click submit

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    UPWORK AUTO-APPLY SYSTEM                 │
└─────────────────────────────────────────────────────────────┘

┌──────────────────┐        ┌──────────────────┐
│  UPWORK FEEDS    │        │  YOUR UPWORK     │
│  (RSS, 5 feeds)  │        │  PROFILE DATA    │
└────────┬─────────┘        └──────────────────┘
         │
         v
┌──────────────────────────┐
│   FEED MONITOR (runs     │
│   every 30 min)          │
│   - Polls RSS feeds      │
│   - Deduplicates jobs    │
│   - Inserts into DB      │
└────────┬─────────────────┘
         │
         v
┌──────────────────────────┐
│   JOB FILTER ENGINE      │
│   - Budget threshold     │
│   - Keyword matching     │
│   - Scoring (1-10)       │
│   - Mark status          │
└────────┬─────────────────┘
         │
         v
┌──────────────────────────┐        ┌─────────────────┐
│  CLAUDE PROPOSAL         │───────>│  ANTHROPIC API  │
│  GENERATOR               │        │  (claude-sonnet)│
│  - Reads job details     │        └─────────────────┘
│  - Calls Claude          │
│  - Stores proposal       │
└────────┬─────────────────┘
         │
         v
┌──────────────────────────┐
│   SQLITE DATABASE        │
│   - jobs table           │
│   - proposals table      │
│   - feed_log table       │
└────────┬─────────────────┘
         │
         v
┌──────────────────────────┐        ┌────────────────┐
│   FASTAPI BACKEND        │───────>│   DASHBOARD    │
│   (HTTP API)             │        │   (HTML/JS)    │
│   /api/queue             │        │   - Queue      │
│   /api/stats             │        │   - Stats      │
│   /api/approve           │        │   - Export btn │
│   /api/run-cycle         │        └────────────────┘
└──────────────────────────┘
         │
         v
┌──────────────────────────┐
│   EXPORT FOLDER          │
│   /exports/YYYY-MM-DD/   │
│   - proposal_001.txt     │
│   - proposal_002.txt     │
└──────────────────────────┘
         │
         v
    ┌─────────────┐
    │  YOU COPY   │
    │  & PASTE    │
    │  TO UPWORK  │
    └─────────────┘
```

---

## Database Schema

### 🗄️ `jobs` table

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT PK | Upwork job ID |
| `title` | TEXT | Job title |
| `description` | TEXT | Job description (truncated) |
| `budget` | TEXT | Budget string (e.g., "$150-300") |
| `category` | TEXT | Job category |
| `url` | TEXT | Link to job on Upwork |
| `posted_at` | TIMESTAMP | When job was posted |
| `fetched_at` | TIMESTAMP | When we downloaded it |
| `status` | TEXT | new \| filtered_out \| pending_proposal \| proposal_ready |
| `filter_score` | INT | Relevance score (0-10) |
| `filter_reason` | TEXT | Why filtered out (if applicable) |

### 📋 `proposals` table

| Column | Type | Description |
|--------|------|-------------|
| `id` | INT PK | Auto-increment |
| `job_id` | TEXT FK | Links to jobs.id |
| `proposal_text` | TEXT | The full proposal Claude wrote |
| `status` | TEXT | pending \| approved \| rejected \| sent |
| `generated_at` | TIMESTAMP | When Claude wrote it |
| `approved_at` | TIMESTAMP | When you approved it |
| `sent_at` | TIMESTAMP | When you marked as sent |
| `notes` | TEXT | Your personal notes |

### 📊 `feed_log` table

| Column | Type | Description |
|--------|------|-------------|
| `id` | INT PK | Auto-increment |
| `feed_url` | TEXT | Which RSS feed was polled |
| `fetched_at` | TIMESTAMP | When we polled it |
| `new_jobs` | INT | How many new jobs found |
| `duplicates` | INT | How many already in DB |
| `errors` | TEXT | Any errors during polling |

---

## Key Features

### 1. Smart Filtering
**Budget Threshold**
- Fixed price: minimum $150 (configurable)
- Hourly: minimum $25/hr (configurable)
- Rejects anything below

**Keyword Matching**
- Blacklist: "wordpress theme", "logo design", "data entry", "full-time"
- Whitelist: "automation", "python", "api", "scraping", "landing page"
- Scores jobs on whitelist matches (0-10)
- Only advances jobs with score ≥2

### 2. Claude-Powered Proposals
**System Prompt**
- You can customize to your background
- Includes your skills, experience, specialties
- Claude uses this + job details to write proposal

**Output Quality**
- Specific opening (references job details)
- Shows relevant past experience
- Ends with a question to engage client
- Under 200 words (no fluff)
- Professional but personable tone

**Rate Limiting**
- Max 20 proposals per day (default, configurable)
- Prevents API cost surprises
- Avoids flooding Upwork

### 3. Human-in-the-Loop
**You review every proposal** before sending:
- Can edit text if needed
- Can reject if quality is bad
- Can approve and export for sending

**No silent automation** — You stay in control.

### 4. Dashboard
**One-page interface**:
- 📈 Stats: jobs today, proposals pending, send rate
- 📋 Queue: all pending proposals to review
- ⌨️ Keyboard shortcuts: A=approve, R=reject
- 📤 Export button: downloads approved proposals
- 🚀 Run Cycle: manually trigger fetch+filter+generate

---

## Data Flow Example

### Scenario: New Python API Job Posted

**1. Feed Monitor (30 min mark)**
```
Upwork RSS → New job found
Title: "Build REST API with Python"
Budget: $400 fixed
Description: "Need Flask API for our platform..."
→ Inserted into jobs table with status='new'
```

**2. Job Filter (automatic)**
```
Check budget: $400 > $150 ✅
Check blacklist: no match ✅
Check whitelist: "python" +1, "api" +1, "automation" +1 = score 3 ✅
→ Updated to status='pending_proposal'
```

**3. Claude Proposal Generator (automatic)**
```
Claude reads: title + description + budget
System prompt: "You are a Python expert who..."
Claude writes:
  "I've built Flask APIs for data pipelines at scale — 
   your platform integration is exactly what I specialize in.
   
   Curious — are you using async/await for the workers, or sync?
   I can have v1 ready in 48 hours."

→ Inserted into proposals table with status='pending'
```

**4. You Review (in dashboard)**
```
See proposal in "Queue"
Read Claude's output
Click ✅ Approve
→ Updated to status='approved'
```

**5. Export & Send**
```
Click "Export"
File created: /exports/2024-02-18/0001_build-rest-api-with-python.txt
Copy proposal text
Paste into Upwork form
Manually submit
→ Mark as sent in UI
```

---

## Configuration Reference

### `config.py` - Main Settings

```python
# Claude API
CLAUDE_API_KEY = os.getenv("CLAUDE_API_KEY")
CLAUDE_MODEL = "claude-3-5-sonnet-20241022"

# Feed Monitor
FEED_POLL_INTERVAL = 30  # minutes
UPWORK_FEEDS = [
    "https://www.upwork.com/ab/feed/jobs/rss?q=landing+page&sort=recency",
    "https://www.upwork.com/ab/feed/jobs/rss?q=python+automation&sort=recency",
    # ... 3 more feeds
]

# Job Filtering
BUDGET_FILTERS = {
    "fixed_min": 150,
    "hourly_min": 25,
    "allow_no_budget": False,
}

KEYWORD_BLACKLIST = [
    "wordpress theme",
    "logo design",
    "data entry",
    "full-time",
    "urgent $",
]

KEYWORD_WHITELIST = [
    "automation", "python", "script", "api", "integrate",
    "landing page", "webflow", "react", "scraping",
    # ... more keywords
]

FILTER_WHITELIST_MIN_SCORE = 2  # Minimum score to generate proposal

# Limits
LIMITS = {
    "max_proposals_per_day": 20,
    "poll_interval_minutes": 30,
}
```

### `.env` - Secrets

```env
# Required
CLAUDE_API_KEY=sk-ant-xxxxxx

# Optional overrides
# BUDGET_FIXED_MIN=200
# BUDGET_HOURLY_MIN=30
# MAX_PROPOSALS_PER_DAY=15
```

---

## API Endpoints Reference

All endpoints return JSON.

| Method | Endpoint | Returns | Notes |
|--------|----------|---------|-------|
| POST | `/api/run-cycle` | `{status, jobs_filtered, proposals_generated}` | Triggers full cycle |
| GET | `/api/queue` | Array of proposals | Proposals with status='pending' |
| GET | `/api/jobs?status=pending_proposal` | Array of jobs | Filter by status |
| GET | `/api/proposal/{id}` | Proposal object | Full details |
| POST | `/api/proposal/{id}/approve` | `{status: "approved"}` | Mark for export |
| POST | `/api/proposal/{id}/reject` | `{status: "rejected"}` | Discard |
| PUT | `/api/proposal/{id}` | Updated proposal | Edit before approving |
| GET | `/api/stats` | Dashboard stats | Jobs/proposals counts |
| POST | `/api/export-approved` | `{exported: N}` | Create export files |

---

## Usage Patterns

### Daily Workflow (5 minutes)

```
Morning:
1. Open dashboard (http://localhost:8000/dashboard/index.html)
2. Review Queue tab (2-3 proposals usually)
3. Approve good ones, reject bad ones
4. Click Export
5. Copy-paste 2-3 proposals to Upwork

That's it. Rest runs automatically.
```

### Weekly Optimization (15 minutes)

```
1. Check /exports/ folder - which proposals got responses?
2. Note which job titles/budgets/keywords had success
3. Update KEYWORD_WHITELIST to add winners
4. Update BUDGET_FILTERS if your rates changed
5. Adjust Claude system prompt based on what sells
```

### Monthly Analytics (20 minutes)

```
1. Check database: SELECT COUNT(*) FROM proposals WHERE status='sent';
2. Check responses: Mark jobs that got client responses
3. Calculate: response_rate = responses / sent
4. Update: target categories, keyword weights, budget thresholds
```

---

## Cost Analysis

### API Costs

**Claude API** (primary expense):
- ~$0.30 per proposal generated (using claude-sonnet)
- At 20 proposals/day = $6/day = $180/month
- **Profitable if**: 1 client per 10 proposals ≈ 2 clients/day → $800/day revenue

**Upwork** (if using affiliate):
- Platform takes 5-20% fee
- Your margin: 80-95% of project value

### Revenue Target

| Metric | Value |
|--------|-------|
| Proposals sent/week | 10-15 |
| Response rate | 10% |
| Close rate | 50% (if you're selective) |
| Avg project | $400 |
| Closed/week | 0.5-0.75 |
| Revenue/week | $200-300 |
| Revenue/month | $800-1200 |

**With scaling**: Increase max_proposals_per_day, optimize filters, raise rates.

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "No proposals in queue" | Run `/api/run-cycle` endpoint |
| "Claude API rate limit" | Check API account + billing |
| "Database locked" | Only one backend instance at a time |
| "Proposals all rejected" | Review Claude system prompt — may not match jobs |
| "Too many low-quality proposals" | Increase budget threshold, adjust keywords |
| "No jobs fetching" | Check RSS feeds still work, network connection |

---

## Future Roadmap

### Phase 2: Automation
- [ ] Playwright to auto-fill Upwork proposal form
- [ ] Slack notifications for high-score jobs
- [ ] Email digest of pending proposals

### Phase 3: Intelligence
- [ ] Feedback loop: track which proposals get responses
- [ ] Analytics: category performance, opening effectiveness
- [ ] Auto-optimize Claude prompt based on wins

### Phase 4: SaaS
- [ ] Multi-user support (run for multiple freelancers)
- [ ] Sell as $49/month service
- [ ] Real-time dashboards, advanced analytics

---

## Summary

**This system is**:
- ✅ Autonomous (runs without you)
- ✅ Controllable (you approve everything)
- ✅ Scalable (add more feeds, tweak filters)
- ✅ Profitable (pays for itself quickly)
- ✅ Transparent (you own the code + data)

**To use it**:
1. Clone the repo + install dependencies
2. Add Claude API key to `.env`
3. Start backend: `python main.py`
4. Open dashboard: `http://localhost:8000/dashboard/index.html`
5. Click "Run Cycle"
6. Review queue daily + export/send

**Expected outcome**: 2-4 new clients per month with 10% of the effort.

---

Built by Sp3ct3R for The Architect. 🚀
