# CODING PIPELINE — Sp3ct3R + Sh3dw Task Queue

**Status:** Active  
**Last Updated:** March 3, 2026  
**Format:** Markdown checklist (agents pick up tasks, update status)

---

## 🔴 CRITICAL (Do First)

- [ ] **Restart Dcash Arbitrage Bot**
  - Status: DOWN since Feb 22 (9 days)
  - Action: Restart process, verify Jupiter API + Helius RPC
  - Owner: —
  - Est: 30 min
  - Path: `/Users/growthgod/dcash-arbitrage-bot/`

- [ ] **Test Python FastAPI Service (port 8000)**
  - Status: Untested in production
  - Action: Health check, run 100 test actions, measure ban rates
  - Owner: —
  - Est: 2 hours
  - Path: `/Users/growthgod/instagram-python/server.py`

---

## 🟡 HIGH (This Week)

- [ ] **MCP Phase 2: Test instagrowth-mcp**
  - Status: Scaffolding complete, need testing
  - Action: npm install, test tools via inspector, measure perf
  - Owner: —
  - Est: 4 hours
  - Path: `/Users/growthgod/.openclaw/workspace/instagrowth-mcp/`

- [ ] **Investigate Fleet Sync Issue**
  - Status: 6 unprocessed posts (39 scheduled vs 33 executed)
  - Action: Debug lock timeout race condition
  - Owner: —
  - Est: 3 hours
  - Path: `/Users/growthgod/.openclaw/workspace/instagrowth-saas/backend/src/routes/orchestration.ts`

- [ ] **Deploy SCRAPERS_JSON to Railway**
  - Status: Env var missing, backend 502 Bad Gateway
  - Action: Set env var on Railway backend service
  - Owner: —
  - Est: 15 min
  - Path: Railway dashboard

---

## 🟢 MEDIUM (Next 2 Weeks)

- [ ] **MCP Phase 3: Wire Agents to MCP**
  - Status: MCP built, agents need config
  - Action: Update Sp3ct3R + Sh3dw workspace MCPClient config
  - Owner: —
  - Est: 4 hours
  - Path: Workspace configs

- [ ] **Evaluate Instagram x-meta-zca Detection**
  - Status: New header flags device authenticity
  - Action: Review VANTA fleet risk, consider Nimble alternative
  - Owner: —
  - Est: 6 hours
  - Path: `/Users/growthgod/VantaLABs_gg/Main/`

- [ ] **Clean PC for Qwen 23k Context**
  - Status: Need ~12GB free for Qwen
  - Action: Remove docker images, old node_modules, logs
  - Owner: —
  - Est: 1-2 hours
  - Path: `~/` (various)

---

## 🔵 LOW (Next Month)

- [ ] **MCP Phase 4: Production Deployment**
  - Status: Not started
  - Action: Deploy instagrowth-mcp to Railway
  - Owner: —
  - Est: 2 weeks
  - Path: Railway + instagrowth-mcp/

- [ ] **Enable Telegram Link Parsing for Watchlist**
  - Status: WhatsApp working, Telegram not yet
  - Action: Add Telegram listener, auto-categorize links
  - Owner: —
  - Est: 4 hours
  - Path: `/Users/growthgod/.openclaw/workspace/watchlist-dashboard.js`

- [ ] **Licensing Setup (MCP Access Tokens)**
  - Status: Not started
  - Action: Generate API tokens, rate limiting, usage tracking
  - Owner: —
  - Est: 3 weeks
  - Path: instagrowth-mcp/

---

## 📊 COMPLETED ✅

- [x] **MCP Phase 1: Scaffolding** (Mar 3)
  - Created instagrowth-mcp/ repo
  - 5 tools with Zod schemas
  - PythonBridge HTTP client
  - Docker setup
  - Full documentation

- [x] **Add LM Studio + Qwen Config** (Mar 3)
  - Updated ~/.openclaw/openclaw.json
  - Updated ~/.claude/settings.json
  - Added CLAUDE.md documentation
  - Added Anthropic Haiku fallback

- [x] **Create Watchlist System** (Mar 2)
  - watchlist.json initialized
  - 7 categories ready
  - Dashboard at port 4001
  - Added Prompt Engineering Guide

---

## 📋 HOW AGENTS PICK UP TASKS

1. **Sp3ct3R or Sh3dw:**
   ```bash
   # Read this file
   cat /Users/growthgod/.openclaw/workspace/CODING_PIPELINE.md
   
   # Pick a task from 🔴 or 🟡
   # Update status to own it (change - [ ] to - [WIP])
   # Add owner: "Sp3ct3R" or "Sh3dw"
   ```

2. **Execute task** (use appropriate tools)

3. **Update status** when done:
   ```bash
   # Change [WIP] → [x] (completed)
   # Move to COMPLETED section
   # Add date + notes
   ```

4. **Commit changes:**
   ```bash
   git add CODING_PIPELINE.md
   git commit -m "task: [Sp3ct3R] Restart Dcash bot + verify health"
   ```

---

## 🎯 PRIORITY GUIDE

**🔴 Critical:** Service down, blocking other work, data at risk  
**🟡 High:** Important this week, affects main systems  
**🟢 Medium:** Next 2 weeks, optimization/enhancement  
**🔵 Low:** Next month, nice-to-have, new features  

---

## 🛠️ TOOLS AVAILABLE

- **Sp3ct3R:** Full OpenClaw + exec + git
- **Sh3dw:** Full OpenClaw + visual/design focus
- **Both:** Can call each other via subagents if needed

---

## 📝 NOTES

- Tasks estimated in hours (rough guides only)
- Blockers = can't proceed without external action
- Owner field = who's working on it (blank = unassigned)
- Use git commits to track progress

---

**Last Assigned:** Mar 3, 2026 01:30 PST  
**Next Review:** Daily (check critical section)
