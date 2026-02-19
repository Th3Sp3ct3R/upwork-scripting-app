# Autonomous Upwork System - Quick Start (3 Minutes)

## What This Does

**Fully automatic proposal pipeline:**

```
Every 30 min: Fetch jobs → Filter → Generate → Approve → Submit to Upwork
```

No dashboard. No manual approval. Just let it run.

---

## 3-Minute Setup

### 1. Install

```bash
cd /Users/growthgod/.openclaw/workspace/upwork_scripting_app
pip install -r requirements.txt
playwright install chromium
```

### 2. Configure

```bash
cp .env.example .env
# Edit .env and add:
# CLAUDE_API_KEY=sk-ant-xxxxx
# UPWORK_EMAIL=your@email.com
# UPWORK_PASSWORD=your_password
```

### 3. Run

```bash
python main.py
```

**Done.** System starts automatically.

---

## What Happens

### First Run (1 min)
- Fetches jobs from Upwork RSS
- Filters by budget + keywords
- Generates proposals with Claude
- Auto-approves high-confidence ones (score ≥7)
- Submits to Upwork via Playwright

### Every 30 Minutes
- Repeats the cycle
- Logs everything to console

### Example Output

```
[autonomous_scheduler] 🚀 AUTONOMOUS UPWORK CYCLE STARTED
[feed_monitor] 📡 Fetching from 5 Upwork RSS feeds...
[job_filter] ✅ Passed filter (score 8): Build Python API
[proposal_generator] ✅ Generated proposal: "I've built Flask APIs..."
[auto_approver] ✅ Auto-approved (score 8)
[playwright_submitter] 📤 Submitting to Upwork...
[playwright_submitter] ✅ Proposal submitted successfully

📊 CYCLE SUMMARY
  Jobs fetched: 12
  Jobs filtered: 8 passed, 4 rejected
  Proposals generated: 8
  Proposals auto-approved: 6
  Proposals submitted: 6
```

---

## Check Status Anytime

```bash
# In another terminal:
curl http://localhost:8000/api/autonomous/status
```

Response:
```json
{
  "status": "running",
  "stats": {
    "total_jobs": 42,
    "proposals_sent": 8,
    "scheduler_running": true
  }
}
```

---

## Adjust Thresholds (Optional)

Edit `.env` to change when proposals auto-approve:

```env
AUTO_APPROVE_SCORE=7          # Min filter score (0-10)
AUTO_APPROVE_BUDGET_MIN=250   # Don't approve jobs under $250
AUTO_APPROVE_MAX_PER_DAY=15   # Max submissions per day
```

Higher score = higher quality, fewer submissions.  
Lower score = more submissions, maybe lower quality.

---

## Stop the System

```bash
# Press Ctrl+C in the terminal running `python main.py`
```

The scheduler stops cleanly. No cleanup needed.

---

## Expected Results

After 1 week:
- ~140 proposals sent (20/day × 7 days)
- ~10-15 client responses (10% response rate)
- ~3-5 interviews
- ~1-2 contracts landed

After 1 month:
- 4-8 projects (~$400 avg each)
- **~$1,600-3,200 revenue**
- **ROI on API costs: 400x**

---

## Troubleshooting

### "ModuleNotFoundError"

```bash
pip install -r requirements.txt
```

### "Playwright: element not found"

Upwork changed their HTML. Update the selectors in `modules/playwright_submitter.py`.

### "Upwork login failed"

- Check email/password in `.env`
- Verify 2FA is disabled (or handle via prompt)

### "No proposals being submitted"

```bash
curl http://localhost:8000/api/autonomous/status
```

Check the `proposals_in_review` count. If it's 0, filters are too strict.

---

## Next: Customize Filters

Open `config.py` and adjust:

**Budget thresholds:**
```python
BUDGET_FILTERS = {
    "fixed_min": 200,      # Raise from 150
    "hourly_min": 35,      # Raise from 25
}
```

**Keywords to target:**
```python
KEYWORD_WHITELIST = [
    "automation",          # Keep
    "python",              # Keep
    "discord bot",         # Add
    "telegram bot",        # Add
]
```

**Keywords to avoid:**
```python
KEYWORD_BLACKLIST = [
    "wordpress theme",     # Keep
    "niche site builder",  # Add
]
```

---

## Full Documentation

See `README_AUTONOMOUS.md` for:
- Complete architecture
- All API endpoints
- Advanced configuration
- Cost breakdown
- Feedback loop (Phase 2)

---

## You're Live 🚀

The system is now running autonomously. Come back in an hour to see proposals being submitted.

---

**Built by Sp3ct3R. Set it and forget it.**
