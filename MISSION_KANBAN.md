# MISSION KANBAN DASHBOARD

**Live URL:** http://localhost:4002  
**Port:** 4002  
**Server:** `/Users/growthgod/VantaLABs_gg/Main/mission-kanban-dashboard.js`

---

## What Is It?

A real-time Kanban board that tracks all coding tasks from `CODING_PIPELINE.md` and displays them in a visual workflow:

```
📋 Backlog → 🔄 In Progress → ✅ Testing → 🎉 Complete
```

**Auto-refreshes every 10 seconds** without manual intervention.

---

## How It Works

1. **Reads CODING_PIPELINE.md** automatically
2. **Parses task priorities:**
   - 🔴 CRITICAL (highest)
   - 🟡 HIGH
   - 🟢 MEDIUM
   - 🔵 LOW
   - ✅ COMPLETED

3. **Groups by status:**
   - `[ ]` = Backlog (not started)
   - `[WIP]` = In Progress (agent working)
   - (Testing column ready for future use)
   - `[x]` = Complete

4. **Shows metadata per task:**
   - Owner (agent name)
   - Estimated time
   - Current status
   - Priority color-coded border

---

## Updating the Dashboard

**No API calls needed.** Just edit `CODING_PIPELINE.md`:

### Mark a task as claimed:
```markdown
- [ ] **Task Name**          # Backlog (not started)
- [WIP] **Task Name**        # In Progress (agent working)
- [x] **Task Name**          # Complete
```

### Dashboard updates automatically on next refresh (10 sec).

---

## Dashboard Columns

### 📋 Backlog
Tasks that haven't been started yet. Click to see details:
- Task name
- Owner (should be "—")
- Estimated time
- Priority badge

### 🔄 In Progress
Actively being worked on by agents. Shows:
- Task name
- Owner (Sp3ct3R, Sh3dw, etc.)
- Time estimate (elapsed vs remaining)
- Status: `in-progress` (orange)

### ✅ Testing
Tasks in validation phase (future use).

### 🎉 Complete
All finished tasks. Shows:
- Task name
- Owner (who completed it)
- Status: `complete` (green)
- Moved here when marked `[x]` in pipeline

---

## Using with Agents

**For Sp3ct3R or Sh3dw:**

1. **Pick a task:**
   ```bash
   cat /Users/growthgod/.openclaw/workspace/CODING_PIPELINE.md
   # Find 🔴 CRITICAL task
   ```

2. **Claim it:**
   ```bash
   # Edit CODING_PIPELINE.md, change:
   # [ ] Task → [WIP] Task (add Owner: Sp3ct3R)
   ```

3. **Dashboard shows it immediately** (next 10s refresh)

4. **Complete it:**
   ```bash
   # Change [WIP] Task → [x] Task
   # Move to COMPLETED section
   ```

5. **Dashboard updates** (task moves to "Complete" column)

---

## API Endpoints

### GET /
Returns HTML dashboard (auto-refreshes every 10s)

### GET /api/tasks
Returns JSON of all parsed tasks:
```json
{
  "tasks": [
    {
      "id": 0,
      "title": "Restart Dcash Arbitrage Bot",
      "status": "backlog",
      "priority": "critical",
      "owner": "—",
      "estimate": "30 min"
    }
  ]
}
```

---

## Running Standalone

If the server stops:

```bash
cd /Users/growthgod/VantaLABs_gg/Main
node mission-kanban-dashboard.js

# Or in background:
node mission-kanban-dashboard.js > /tmp/mission-kanban.log 2>&1 &
```

---

## Key Features

- ✅ **Zero database** — reads markdown file directly
- ✅ **Auto-refresh** — every 10 seconds, no manual refresh needed
- ✅ **Real-time** — updates instantly when pipeline changes
- ✅ **Agent-friendly** — simple task ownership model
- ✅ **Priority visualization** — color-coded borders
- ✅ **Stat counter** — see overall progress at a glance
- ✅ **Dark mode** — easy on the eyes

---

## Example Task Flow

**Initial state (in CODING_PIPELINE.md):**
```markdown
- [ ] **Restart Dcash Arbitrage Bot**
  - Owner: —
  - Est: 30 min
```
**Kanban shows:** Task in "Backlog" column

---

**Agent picks it up:**
```markdown
- [WIP] **Restart Dcash Arbitrage Bot**
  - Owner: Sp3ct3R
  - Est: 30 min
```
**Kanban shows:** Task moves to "In Progress" column, labeled with agent name

---

**Agent completes it:**
```markdown
- [x] **Restart Dcash Arbitrage Bot** ✅ (Mar 3, 01:45)
  - Owner: Sp3ct3R
  - Time: 45 min
  - Notes: Jupiter API timeout issue fixed, bot now trading
```
**Then move to COMPLETED section**

**Kanban shows:** Task in "Complete" column, status badge is green

---

## Stats Display

Shows real-time counts:
- **Backlog:** # of unstarted tasks
- **In Progress:** # actively being worked
- **Testing:** # in validation
- **Complete:** # finished

Updates on every refresh.

---

## Troubleshooting

### Dashboard shows old tasks
```bash
# Check CODING_PIPELINE.md is being read
curl http://localhost:4002/api/tasks | jq '.tasks | length'
```

### Markdown parsing issues
Make sure task format is:
```markdown
- [x] **Task Title**
  - Owner: Name
  - Est: Time
```

### Server stopped
```bash
# Restart
ps aux | grep mission-kanban
kill <PID>
# Then restart
cd /Users/growthgod/VantaLABs_gg/Main && node mission-kanban-dashboard.js &
```

---

## Architecture

```
Browser (http://localhost:4002)
  ↓
Node.js HTTP Server (mission-kanban-dashboard.js)
  ↓
File Reader (fs.readFileSync)
  ↓
CODING_PIPELINE.md
  ↓
Parse → Group by Status → Render HTML → Auto-refresh (10s)
```

No database, no persistence layer. **Pure file-based.**

---

**Last Updated:** March 3, 2026  
**Status:** ✅ Live and working
