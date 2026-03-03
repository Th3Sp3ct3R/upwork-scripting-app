# CODING PIPELINE — Sp3ct3R + Sh3dw Task Queue

**Status:** Active  
**Last Updated:** March 3, 2026  
**Format:** Markdown checklist (agents pick up tasks, update status)

---

## 🔴 CRITICAL (Do First)

- [ ] **Restart Dcash Arbitrage Bot** 🔵 BACKLOG
  - Status: Moved to backlog. Not needed for MVP launch.
  - Owner: —
  - Est: TBD
  - Path: Unknown location (need to relocate bot)

- [x] **Test Python FastAPI Service (port 8000)** ✅ (Mar 3, 13:39 PST)
  - Owner: PYTHON_SERVICE_TEST agent
  - Time: 2m33s
  - Result: Service RUNS, health check PASSES (24ms), auth WORKS. Bug found: _create_session() outside try/except in _execute_action() line 273 → raw 500 on bad device profile. 5-min fix. Otherwise production-ready.
  - Action: Fix error handling in server.py line 273, then test with real logged-in account
  - Verdict: 🟡 NEEDS ONE FIX (5 min), then production-ready

---

## 🎨 DESIGN FLEET (Sh3dw Conductor - Mar 3)

**Status:** Spawning 10 specialized design agents in parallel

- [WIP] **UI_ONBOARDING_DESIGNER**
  - Status: MVP onboarding flow UI (handle → vibe → plan → password)
  - Owner: Sh3dw conductor (child agent)
  - Est: 30 min
  - Path: `/Users/growthgod/.openclaw/workspace/instagrowth-saas/designs/onboarding-flow.html`
  - Started: Mar 3, 13:42 PST

- [WIP] **VISUAL_KANBAN_POLISH**
  - Status: Improve Kanban dashboard (colors, animations, status badges)
  - Owner: Sh3dw conductor (child agent)
  - Est: 45 min
  - Path: `/Users/growthgod/VantaLABs_gg/Main/mission-kanban-dashboard.js`
  - Started: Mar 3, 13:42 PST

- [WIP] **VISUAL_FLEET_STATUS**
  - Status: Device health heatmap + throughput visualization
  - Owner: Sh3dw conductor (child agent)
  - Est: 40 min
  - Path: `/Users/growthgod/VantaLABs_gg/Main/fleet-status-visual.html`
  - Started: Mar 3, 13:42 PST

- [WIP] **DESIGN_AFFINITY_CHARTS**
  - Status: Confidence gauges, trend sparklines, cluster maps
  - Owner: Sh3dw conductor (child agent)
  - Est: 45 min
  - Path: `/Users/growthgod/.openclaw/workspace/instagrowth-saas/designs/affinity-charts.html`
  - Started: Mar 3, 13:42 PST

- [WIP] **VISUAL_CONTENT_QA**
  - Status: Frame quality indicator, color histogram, blur detection UI
  - Owner: Sh3dw conductor (child agent)
  - Est: 35 min
  - Path: `/Users/growthgod/.openclaw/workspace/designs/content-qa.html`
  - Started: Mar 3, 13:42 PST

- [WIP] **DESIGN_PROFILE_AUDIT**
  - Status: Bio diff viewer, follower timeline, engagement heatmap
  - Owner: Sh3dw conductor (child agent)
  - Est: 40 min
  - Path: `/Users/growthgod/VantaLABs_gg/Main/profile-audit-visual.html`
  - Started: Mar 3, 13:42 PST

- [WIP] **UI_MARKETING_LANDING**
  - Status: SaaS landing page (hero + 3 features + pricing + CTA)
  - Owner: Sh3dw conductor (child agent)
  - Est: 50 min
  - Path: `/Users/growthgod/.openclaw/workspace/instagrowth-saas/landing.html`
  - Started: Mar 3, 13:42 PST

- [WIP] **VISUAL_AGENT_HUB**
  - Status: Unified Agent Operations Center (all agents' status + metrics)
  - Owner: Sh3dw conductor (child agent)
  - Est: 40 min
  - Path: `/Users/growthgod/VantaLABs_gg/Main/agent-operations-center.html`
  - Started: Mar 3, 13:42 PST

- [WIP] **VISUAL_VIDEO_ANALYZER**
  - Status: Video QA tool (frame quality, text readability, aspect ratio)
  - Owner: Sh3dw conductor (child agent)
  - Est: 35 min
  - Path: `/Users/growthgod/.openclaw/workspace/designs/video-analyzer.html`
  - Started: Mar 3, 13:42 PST

- [WIP] **DESIGN_DARK_THEME**
  - Status: Tailwind dark mode system + component library
  - Owner: Sh3dw conductor (child agent)
  - Est: 45 min
  - Path: `/Users/growthgod/.openclaw/workspace/instagrowth-saas/designs/dark-theme.html`
  - Started: Mar 3, 13:42 PST

---

## 🟡 HIGH (This Week)

- [ ] **MCP Phase 2: Test instagrowth-mcp**
  - Status: Scaffolding complete, need testing
  - Action: npm install, test tools via inspector, measure perf
  - Owner: —
  - Est: 4 hours
  - Path: `/Users/growthgod/.openclaw/workspace/instagrowth-mcp/`

- [x] **Investigate Fleet Sync Issue** ✅ (Mar 3, 13:39 PST)
  - Owner: FLEET_SYNC_DEBUG agent
  - Time: 2m3s
  - Result: ROOT CAUSE FOUND — TOCTOU race condition in tryAcquireLock(). Lock stolen between SELECT and INSERT. Secondary: non-logged_in accounts silently skipped.
  - Fix: Atomic INSERT...ON CONFLICT WHERE release_at <= NOW() RETURNING (single statement, no gap). Patch 2 files.
  - Priority: 🔴 Critical — causes data loss (posts not executing)

- [x] **Deploy SCRAPERS_JSON to Railway** ✅ (Mar 3, 13:40 PST)
  - Owner: RAILWAY_DEPLOY_ENV agent
  - Time: 3m15s
  - Result: 502 resolved itself (transient). Backend is LIVE, health check 200 OK. SCRAPERS_JSON not blocking startup. Found: DB migration issue (instagram_username column missing), placeholder API keys need replacing.
  - Action: Fix DB migration, replace placeholder keys, deploy SCRAPERS_JSON when account data ready

---

## 🟢 MEDIUM (Next 2 Weeks)

- [ ] **MCP Phase 3: Wire Agents to MCP**
  - Status: MCP built, agents need config
  - Action: Update Sp3ct3R + Sh3dw workspace MCPClient config
  - Owner: —
  - Est: 4 hours
  - Path: Workspace configs

- [x] **Evaluate Instagram x-meta-zca Detection** ✅ (Mar 3, 13:38 PST)
  - Owner: INSTAGRAM_DETECTION_EVAL agent
  - Time: 1m10s
  - Result: MEDIUM risk, unverified threat. No ban waves detected. Fleet issues are operational (broken vision API), NOT detection. Monitor 2-4 weeks before pivot.
  - Action: Fix vision pipeline first, test post batch from GeeLark, get Nimble URL

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
