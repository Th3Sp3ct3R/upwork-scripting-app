# Local Setup Instructions

## Prerequisites
- Python 3.9+ installed
- pip (comes with Python)
- Claude API key from https://console.anthropic.com/

---

## Step 1: Navigate to Project

```bash
cd /Users/growthgod/.openclaw/workspace/upwork_scripting_app
```

---

## Step 2: Install Dependencies

```bash
pip install -r requirements.txt
```

You should see:
```
Successfully installed feedparser anthropic fastapi uvicorn python-dotenv apscheduler requests
```

---

## Step 3: Create .env File

```bash
cp .env.example .env
```

Then edit `.env` and add your Claude API key:

```bash
# Open in your editor
nano .env
```

Change this line:
```env
CLAUDE_API_KEY=sk-ant-...
```

To your actual key (get one free at https://console.anthropic.com/):
```env
CLAUDE_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxx
```

Save and exit (Ctrl+X, then Y, then Enter in nano).

---

## Step 4: Initialize Database

```bash
python -c "from db.database import init_db; init_db()"
```

You should see:
```
✅ Database initialized at /Users/growthgod/.openclaw/workspace/upwork_scripting_app/upwork.db
```

---

## Step 5: Run System Test (Optional but Recommended)

```bash
python test_system.py
```

You should see all tests pass (green ✅):
```
🧪 UPWORK AUTO-APPLY SYSTEM TEST
============================================================

🔍 Testing imports...
  ✅ feedparser
  ✅ anthropic
  ✅ fastapi
  ✅ dotenv

🔍 Testing environment...
  ✅ CLAUDE_API_KEY configured

🔍 Testing database...
  ✅ Database initialized
  ✅ Table 'jobs' exists
  ✅ Table 'proposals' exists
  ✅ Table 'feed_log' exists

🔍 Testing API startup...
  ✅ FastAPI app loaded
  ✅ Health endpoint works

🔍 Testing Claude API...
  ✅ Claude API connection works

📊 TEST SUMMARY
============================================================
Imports               ✅ PASS
Environment           ✅ PASS
Database              ✅ PASS
API                   ✅ PASS
Claude API            ✅ PASS
============================================================

✨ All tests passed! Ready to run.
```

If any tests fail, fix the issue before continuing.

---

## Step 6: Start the Backend

Open a **new terminal window** and run:

```bash
cd /Users/growthgod/.openclaw/workspace/upwork_scripting_app
python main.py
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete
```

Leave this terminal open. The backend is now running.

---

## Step 7: Open the Dashboard

In a **different terminal window** (don't close the backend one), run:

```bash
open http://localhost:8000/dashboard/index.html
```

Or manually open your browser and navigate to:
```
http://localhost:8000/dashboard/index.html
```

You should see:
- **Header**: "🚀 Upwork Auto-Apply"
- **Stats boxes**: Jobs Today, Proposals Today, Pending Review, Sent All Time, Filtered Out
- **Queue section**: "No pending proposals" (because we haven't run a cycle yet)
- **"Run Cycle" button** in top right

---

## Step 8: Run Your First Cycle

In the dashboard:
1. Click the **"Run Cycle"** button (top right)
2. Wait 10-30 seconds while the system:
   - Polls 5 Upwork RSS feeds
   - Filters jobs by budget + keywords
   - Generates proposals with Claude

You should see the button show "Running..." then return to normal.

Check the results:
- **Stats** should update (Jobs Today, Proposals Today)
- **Queue** should show pending proposals (if any jobs matched)

---

## Step 9: Review Your First Proposals

If proposals were generated:
1. Go to **Queue** tab
2. Read the proposal Claude wrote
3. Click **✅ Approve** or **❌ Reject**
4. Repeat for each proposal

Once approved, click **Export** to generate copy-paste ready files.

---

## Troubleshooting

### "ModuleNotFoundError: No module named 'anthropic'"
```bash
pip install -r requirements.txt
```

### "CLAUDE_API_KEY not set"
1. Check `.env` exists in the project folder
2. Check it has `CLAUDE_API_KEY=sk-ant-xxx`
3. Verify no typos in the key

### "Database locked" error
Only one backend can run at a time. Check:
```bash
ps aux | grep main.py
```

If another instance is running, kill it:
```bash
pkill -f "python main.py"
```

### Backend won't start (port 8000 already in use)
```bash
# Find what's using port 8000
lsof -i :8000

# Kill the process (replace XXXX with PID)
kill -9 XXXX
```

### Dashboard shows "No pending proposals"
This is normal on first run. Try:
1. Click "Run Cycle" button
2. Wait for cycle to complete
3. Refresh the page (Cmd+R)

If still empty, check backend logs for errors.

### Claude proposals are low quality
Edit the system prompt in `config.py` to match your background better:
```python
SYSTEM_PROMPT = """You are writing Upwork proposals for a skilled developer named [YOUR NAME]...
```

---

## File Locations

- **Backend logs**: Console output (where you ran `python main.py`)
- **Database**: `/Users/growthgod/.openclaw/workspace/upwork_scripting_app/upwork.db`
- **Exported proposals**: `/Users/growthgod/.openclaw/workspace/upwork_scripting_app/exports/YYYY-MM-DD/`
- **Configuration**: `/Users/growthgod/.openclaw/workspace/upwork_scripting_app/config.py`
- **Environment secrets**: `/Users/growthgod/.openclaw/workspace/upwork_scripting_app/.env` (never commit this)

---

## Stop the Backend

To stop the backend, go back to the terminal where you ran `python main.py` and press:
```
Ctrl+C
```

---

## Keep It Running (Optional)

If you want the system to run in the background:

```bash
# In a new terminal:
cd /Users/growthgod/.openclaw/workspace/upwork_scripting_app
nohup python main.py > backend.log 2>&1 &
```

Then check status:
```bash
# View logs
tail -f backend.log

# Kill the process later
pkill -f "python main.py"
```

---

## Next Steps

1. ✅ Backend running locally
2. ✅ Dashboard accessible
3. ✅ First cycle completed
4. Customize filters in `config.py` (budget, keywords)
5. Customize Claude prompt for your background
6. Run daily and review proposals
7. Export and submit to Upwork

---

## Questions?

Check:
- `README.md` — Full documentation
- `QUICKSTART.md` — 5-minute overview
- `SYSTEM_OVERVIEW.md` — Architecture details
