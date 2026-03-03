# Agent Handoff Summary — March 3, 2026

**Handoff From:** Sp3ct3R (Main Agent)  
**To:** [Next Agent]  
**Context:** Strategic decision on Instagram Android API architecture for instagrowth-saas

---

## Context: The Situation

### Catalyst
- Competitor launched web app using Instagram Android API
- User wants to evaluate if we should rebuild instagrowth-saas with Android API approach
- Question: Should we use existing Python service, or build new TypeScript MCP?

### Current Stack (instagrowth-saas)
```
Frontend: Next.js 15 + React 18 (Vercel)
  ↓
Backend: Node.js/Express + TypeScript (Railway, port 3005)
  ├── 13 compiled services
  ├── 70+ API endpoints
  └── 8-layer affinity engine (master profiles cache, clustering, attribution)
  ↓
Python FastAPI Service (port 8000)
  └── instagram-private-api (instagrapi) wrapper
      └── Handles login, sessions, reactions (like/comment/follow)

Database: PostgreSQL (9 tables, fully indexed)
Repository: /Users/growthgod/.openclaw/workspace/instagrowth-saas/
Git: main branch (clean), feature/mvp-plan-approval merged, several stale branches
```

---

## Exploration Done

### 1. Architecture Options Evaluated

**Option 1: Use Existing Library (Fastest)**
- `instagram-private-api` (Node.js/TypeScript) — most popular, fits stack
- `instagrapi` (Python) — very actively maintained, already in use
- `Instagram4j` (Java/Android) — not evaluated

**Option 2: Intercept Traffic (Most Control)**
- MITM proxy (mitmproxy/Charles)
- GeeLark device + Frida/objection for SSL pinning bypass
- Captures fresh endpoints on every Instagram update
- Timeline: 3-4 weeks, high maintenance burden

**Option 3: Reverse Engineer APK (Most Authentic)**
- decompile with jadx/apktool
- Extract endpoint + signature logic
- Most fragile (breaks every IG update)
- Timeline: 4-6 weeks

**Recommendation at time:** Hybrid approach
- Week 1-2: Use instagram-private-api as v1 (quick to market)
- Week 3-4: Run Option 2 (MITM capture) in parallel
- Gradually migrate to owned endpoints by month 2

### 2. MCP Architecture (Path B)

User suggested: Build separate MCP repo for Instagram execution
- Rationale: Expose as licensed service without revealing proprietary code
- Agents (Sp3ct3R, Sh3dw, etc.) call via MCP, not direct code access
- Keeps affinity engine + optimization hidden in main repo

**Found:** User already owns https://github.com/Th3Sp3ct3R/mcp-use
- Full MCP framework (TypeScript + Python SDKs)
- Built-in inspector, CLI, deployment tools
- Could wrap Instagram API as MCP tools

### 3. Current Repo State

**Location:** `/Users/growthgod/.openclaw/workspace/instagrowth-saas/`

**Branches:**
- `main` (current, up-to-date, clean)
- `claude/kind-darwin` (Claude flow worktree, stale)
- `feature/live-data-wiring` (local + remote, not merged, status unknown)
- `feature/live-data-phases-d-g` (local only, status unknown)
- `fix-agent-blockers` (local + remote, not merged, status unknown)
- `feature/mvp-plan-approval` (merged into main ✅)

**Git status (main):**
```
Modified: backend/src/index.ts, backend/src/routes/scraper.ts, backend/src/services/InstagramScraperAPI.ts
Deleted: .claude-flow/daemon.pid files
```

**Dependencies:**
- Backend: `npm run dev` = PORT=3005
- Frontend: `npm dev` = port 3000 (Next.js default)
- Python: port 8000 (FastAPI)

### 4. Python FastAPI Service Deep Dive

**Location:** `/Users/growthgod/instagram-python/server.py`

**Architecture:**
- FastAPI server (port 8000)
- Wraps instagram-private-api (instagrapi) 
- AccountSession model (stateless from server perspective)
- Handles: login, 2FA, session restore, actions (like/comment/follow)
- Called by Node.js backend via HTTP

**What's exposed:**
- `POST /api/login` — authenticate account
- `POST /api/action` — execute reaction (like/comment/follow/post)
- `POST /api/session-restore` — restore from cookies
- `GET /health` — service status

**Status:** Not recently tested / validated

---

## Critical Realization (Key Insight)

**We haven't actually tested the existing Python service.**

Before building Android API v2:
- No validation of Python service reliability
- No ban rate comparison (Python vs GeeLark vs Scraper)
- No session stability measurement
- No rate limit testing
- No actual production usage data

---

## Recommended Path Forward

### BEFORE building Android API MCP (DO THIS FIRST)

**Week 1: Audit Existing Python Service**
```
1. Check server.py logs — any errors?
2. Test manually:
   - curl POST /api/login with test account
   - curl POST /api/action (like a few targets)
   - curl GET /health
3. Measure:
   - Response time per action
   - Session persistence
   - Error rates
4. Check ReactionExecutor.ts — is it actually wired to port 8000?
```

**Week 2: Live Test**
```
1. Run 100 actions (likes/comments) on test Instagram accounts
2. Measure ban rate
3. Compare:
   - Python service (instagrapi)
   - Current scraper approach
   - GeeLark approach
4. Log session stability
5. Test multi-account concurrent actions
```

**Week 3: Decision**
```
IF Python service works:
  └── Optimize it, don't rebuild
      - Fix any bugs
      - Optimize performance
      - Maybe wrap as MCP later (low priority)

IF Python service is broken/slow:
  └── Then build Android API v2
      - Option A: Extend existing Python service
      - Option B: New TypeScript MCP (using mcp-use framework)
```

---

## Decision Point (WHAT TO DO NOW)

**Do NOT build Android API yet.**

Instead, answer these 3 questions first:

1. **Is Python service actually running/working?**
   ```bash
   ps aux | grep server.py
   curl http://localhost:8000/health
   ```

2. **Is ReactionExecutor wired to use it?**
   ```bash
   grep -r "localhost:8000" /Users/growthgod/.openclaw/workspace/instagrowth-saas/backend/src/
   ```

3. **What's the actual problem we're trying to solve?**
   - Ban rates too high?
   - Performance too slow?
   - Session instability?
   - Instagram detection?
   - Competitor feature parity?

---

## Higher Priority Blockers (Before Android API)

From memory (Feb 28 - Mar 2):

1. **Dcash Arbitrage Bot** — NOT RUNNING since Feb 22
   - Wallet: 0.424 SOL
   - Should execute 12 trades/hour during peak (09:00-15:00 UTC)
   - Action: Restart daemon or fix

2. **Instagram x-meta-zca Detection**
   - New auth header detects device authenticity
   - GeeLark phone farms now easily detected
   - Impact: Current VANTA fleet strategy may be obsolete
   - Action: Review and evaluate Nimble alternative

3. **Fleet Sync Issue**
   - 6 unprocessed posts (39 scheduled vs 33 executed)
   - Under investigation
   - Action: Debug lock timeout race condition

4. **Railway Deployment**
   - Backend live but needs SCRAPERS_JSON env var
   - Awaiting deployment

---

## If Android API IS Needed (Contingency)

**Architecture Decision: Use mcp-use framework**

```typescript
// instagrowth-mcp/ (new repo)
import { MCPServer } from "mcp-use/server";
import { z } from "zod";

// Tools exposed to agents:
server.tool({
  name: "execute_reaction",
  schema: z.object({ action, account_id, target_username }),
  handler: async ({ action, account_id, target_username }) => {
    // instagram-private-api call here (hidden implementation)
    return { success: true };
  }
});

// Agents call via MCP, not direct code
await server.listen(5555);
```

**Why mcp-use:**
- Built-in tool definitions + validation
- Auto-inspector for debugging
- Works with Claude + custom agents
- Can hide Instagram API implementation
- Better than building custom MCP from scratch

**Timing:** 2-3 weeks if needed

---

## Files to Review (Next Agent)

1. **Python Service:** `/Users/growthgod/instagram-python/server.py`
   - Check if running, test endpoints

2. **Reaction Executor:** `backend/src/services/ReactionExecutorService.ts`
   - Confirm it calls port 8000

3. **Backend Entry:** `backend/src/index.ts`
   - Current route registration

4. **Stale Branches:** Check what's in feature/live-data-wiring, fix-agent-blockers
   - May have relevant context

5. **Competitor Analysis:**
   - If they're using instagrapi/PHP, not a moat
   - Your affinity engine is the real differentiator

---

## Summary for Next Agent

**Status:** Ready to test, not ready to rebuild

**Current:** Python FastAPI service exists but untested in production

**Next:** Validate existing service before committing to Android API rebuild

**Decision:** Build Android API MCP *only if* current approach fails testing

**Timeline:** 
- Week 1: Test Python service
- Week 2-3: Live testing + comparison
- Week 4+: Build Android API if needed

**Tools Available:** mcp-use framework ready to use if MCP needed

---

**Questions Next Agent Should Ask:**
1. Is Python service running right now?
2. Has it ever been tested in production?
3. What specific problem are we trying to solve? (ban rate? speed? features?)
4. Do we know why the competitor's approach is better, or just assuming?
5. Should we focus on other blockers first (Dcash bot, x-meta-zca, fleet sync)?
