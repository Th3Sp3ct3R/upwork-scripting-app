# TASK WORKFLOW — For Sp3ct3R & Sh3dw

Quick guide for picking up and completing coding tasks.

---

## Step 1: Find a Task

Open CODING_PIPELINE.md:
```bash
cat CODING_PIPELINE.md
```

Pick from **🔴 CRITICAL** (highest priority) or **🟡 HIGH**.

---

## Step 2: Claim the Task

Edit CODING_PIPELINE.md, find the task:

**Before:**
```markdown
- [ ] **Restart Dcash Arbitrage Bot**
  - Owner: —
```

**After:**
```markdown
- [WIP] **Restart Dcash Arbitrage Bot**
  - Owner: Sp3ct3R
```

---

## Step 3: Execute

Use tools as needed:
```bash
# Example: Check if bot is running
ps aux | grep dcash
# Restart it
cd /Users/growthgod/dcash-arbitrage-bot && npm start
# Verify
curl http://localhost:5000/health
```

Document what you find. Update memory:
```bash
echo "## Task: Restart Dcash Bot" >> /Users/growthgod/.openclaw/workspace/memory/$(date +%Y-%m-%d).md
echo "Status: ..." >> ...
```

---

## Step 4: Mark Complete

Edit CODING_PIPELINE.md:

**Before:**
```markdown
- [WIP] **Restart Dcash Arbitrage Bot**
  - Owner: Sp3ct3R
  - Est: 30 min
```

**After:**
```markdown
- [x] **Restart Dcash Arbitrage Bot** ✅ (Mar 3, 01:45)
  - Owner: Sp3ct3R
  - Time: 45 min (longer than estimated)
  - Notes: Jupiter API timeout issue fixed, bot now trading
```

Move to COMPLETED section.

---

## Step 5: Commit

```bash
cd /Users/growthgod/.openclaw/workspace
git add CODING_PIPELINE.md
git commit -m "task: [Sp3ct3R] Restart Dcash bot, verify health check passing"
```

---

## Example: Full Task Execution

**Task:** Test Python FastAPI Service

```bash
# 1. Check what needs testing
cat /Users/growthgod/instagram-python/server.py | head -50

# 2. Start service
cd /Users/growthgod/instagram-python
python server.py
# Should listen on port 8000

# 3. Test health
curl http://localhost:8000/health
# Should return JSON

# 4. Test real action
curl -X POST http://localhost:8000/api/action \
  -H "Content-Type: application/json" \
  -d '{
    "action": "like",
    "account_id": "test_account",
    "target_username": "target"
  }'

# 5. Document findings
echo "Python service health: OK
Response time: 150ms
Errors: None
Ban rate baseline: TBD (need 100+ actions)
" > /tmp/test_results.txt

# 6. Update memory
cat >> /Users/growthgod/.openclaw/workspace/memory/$(date +%Y-%m-%d).md << 'EOF'
## Task: Test Python FastAPI Service
- Status: COMPLETE
- Time: 1.5 hours
- Results: Service running, health check passing
- Next: Run 100 test actions to measure ban rate
EOF

# 7. Mark done in pipeline + commit
# Edit CODING_PIPELINE.md
# git add CODING_PIPELINE.md memory/...
# git commit -m "task: [Sp3ct3R] Test Python service - health check passing"
```

---

## Tips

- **If stuck:** Check git logs, MEMORY.md, or recent commits for context
- **Ask for help:** Can call each other via subagents
- **Estimate time:** Usually 1.5-2x what's listed (be generous)
- **Document everything:** Future-you will thank you
- **Commit often:** Small commits are easier to debug

---

## Current Agents

- **Sp3ct3R:** Main agent, operations focus
- **Sh3dw:** Visual/design focus, can help with UX/frontend tasks

---

**Last Updated:** March 3, 2026  
**Format:** Reference guide for agents
