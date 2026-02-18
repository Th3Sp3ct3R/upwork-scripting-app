# 🚀 Upwork Auto-Apply System

Intelligent Upwork proposal system that monitors job feeds, generates custom proposals via Claude API, and queues them for human approval before sending.

**Human-in-the-loop by design** — quality over volume.

---

## Architecture

```
RSS Feed Monitor → Job Filter → Claude Proposal Generator → Review Queue → Send
```

- **Feed Monitor**: Polls 5 Upwork RSS feeds every 30 minutes
- **Job Filter**: Scores jobs based on budget, keywords, and relevance
- **Proposal Generator**: Creates custom proposals using Claude API
- **Review Queue**: Human approves/rejects before sending
- **Sender**: Exports proposals for manual copy-paste to Upwork

---

## Stack

- **Backend**: FastAPI + SQLite
- **Frontend**: Single-page HTML/CSS/JS (no build step)
- **AI**: Anthropic Claude API
- **Scheduling**: APScheduler (background jobs)

---

## Setup

### 1. Install Dependencies

```bash
cd /Users/growthgod/.openclaw/workspace/upwork_scripting_app
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env and add your Claude API key
```

Get your API key from: https://console.anthropic.com/

### 3. Initialize Database

```bash
python -c "from db.database import init_db; init_db()"
```

This creates `upwork.db` with all tables.

---

## Usage

### Start the Backend

```bash
python main.py
```

This runs FastAPI on `http://localhost:8000`

### Open the Dashboard

```bash
open http://localhost:8000/dashboard/index.html
```

Or navigate to the file directly in your browser.

---

## Workflow

### 1. Run a Fetch Cycle

Click **"Run Cycle"** button in dashboard (or API):

```bash
curl -X POST http://localhost:8000/api/run-cycle
```

This:
- Fetches all 5 RSS feeds
- Filters jobs (budget + keywords)
- Generates proposals for qualifying jobs

### 2. Review Proposals

**Queue** tab shows all pending proposals:
- Job title + budget
- Your generated proposal text
- Action buttons

**Keyboard shortcuts**:
- **A**: Approve current proposal
- **R**: Reject current proposal

### 3. Export & Send

Click **"Export"** → exports approved proposals to `/exports/YYYY-MM-DD/` folder

Each file contains:
- Job URL
- Proposal text (copy-paste ready)
- Budget & description for reference

**To submit**:
1. Open the job URL
2. Copy proposal text from export file
3. Paste into Upwork's proposal form
4. Submit

---

## Configuration

Edit `config.py` to customize:

**Budget Filters** (minimum thresholds):
```python
BUDGET_FILTERS = {
    "fixed_min": 150,    # Minimum fixed price
    "hourly_min": 25,    # Minimum hourly rate
}
```

**Keyword Filtering**:
```python
KEYWORD_BLACKLIST = [
    "wordpress theme",
    "logo design",
    "full-time",
]

KEYWORD_WHITELIST = [
    "automation",
    "python",
    "api",
    "scraping",
]
```

**Daily Limit**:
```python
LIMITS = {
    "max_proposals_per_day": 20,
    "poll_interval_minutes": 30,
}
```

---

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/run-cycle` | Trigger fetch + filter + generate |
| `GET` | `/api/queue` | List pending proposals |
| `GET` | `/api/jobs` | List all jobs |
| `POST` | `/api/proposal/{id}/approve` | Approve a proposal |
| `POST` | `/api/proposal/{id}/reject` | Reject a proposal |
| `PUT` | `/api/proposal/{id}` | Edit proposal text |
| `GET` | `/api/stats` | Dashboard statistics |
| `POST` | `/api/export-approved` | Export approved proposals |

---

## Database Schema

### Jobs Table
- `id` — Upwork job ID (unique)
- `title`, `description`, `budget`, `category`
- `url`, `posted_at`, `fetched_at`
- `status` — new | filtered_out | pending_proposal | proposal_ready

### Proposals Table
- `id` — Auto-increment
- `job_id` — FK to jobs
- `proposal_text` — Your generated proposal
- `status` — pending | approved | rejected | sent
- `generated_at`, `approved_at`, `sent_at`

### Feed Log Table
- Tracks each feed poll cycle
- New job count, duplicates, errors

---

## Proposal Generation

Claude generates proposals with:

1. **Custom opening** — References specific job details (not generic)
2. **Relevant experience** — Mentions your automation platform background
3. **Specific question** — Engages client about project details
4. **Concise** — Under 200 words (clients don't read walls of text)
5. **Professional tone** — Confident, direct, no fluff

Example generated proposal:
```
I see you need a Zapier workflow to sync leads between your CRM and email list — 
I built an Instagram automation system that handles exactly this type of data 
pipeline across 200+ accounts.

I can set this up in 1-2 days. What's your current lead volume, and do you need 
any custom field mapping?
```

---

## Revenue Model

| Metric | Target |
|--------|--------|
| Proposals/day | 10 |
| Response rate | 10-15% |
| Close rate | 30-40% of responses |
| Avg project | $400 |
| Projects/week | 1-2 |
| Monthly revenue | $2,000-4,000 |

**Ramp**:
- Month 1: Test filters, optimize proposal tone
- Month 2: Build case studies from wins
- Month 3: Raise rates to $75-100/hr
- Month 4: Target $5-8K/month

---

## Future Enhancements

### Phase 2: Automation
- Playwright auto-fill for proposal submission (browser bot)
- Slack notifications for high-score jobs
- Multi-profile support (run for clients)

### Phase 3: Intelligence
- Feedback loop: track which proposals get responses
- Category performance analytics
- Proposal opening effectiveness scoring
- Automated profile optimizer

### Phase 4: SaaS
- Multi-user dashboard
- Sell access to other freelancers at $49/month
- Revenue model: $5-10K/month

---

## Troubleshooting

### "Database locked" error
SQLite is blocking concurrent writes. Ensure only one API instance is running.

### Proposals not generating
Check:
1. Database is initialized
2. `.env` has valid `CLAUDE_API_KEY`
3. Jobs exist with status = `pending_proposal`
4. Claude API account has credits

### Dashboard not updating
Check browser console (F12) for errors. Ensure backend is running on `:8000`.

---

## Project Structure

```
upwork_scripting_app/
├── main.py                 # FastAPI backend
├── config.py              # Configuration
├── requirements.txt       # Dependencies
├── .env.example          # Environment template
├── db/
│   ├── schema.sql        # Database schema
│   └── database.py       # DB helpers
├── modules/
│   ├── feed_monitor.py   # RSS feed polling
│   ├── job_filter.py     # Job filtering & scoring
│   ├── proposal_generator.py  # Claude API integration
│   └── sender.py         # Export proposals
├── dashboard/
│   └── index.html        # React-less dashboard
├── exports/              # Approved proposals (auto-created)
└── upwork.db            # SQLite database (auto-created)
```

---

## License

MIT — Use for your own freelancing operations.

---

## Contact

Built by Sp3ct3R for The Architect.
