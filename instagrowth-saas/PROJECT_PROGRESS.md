# InstagrowthMCP — Project Progress Log

**Project Root:** `/Users/growthgod/.openclaw/workspace/instagrowth-saas/`  
**Archive:** `/instagrowth333/` (legacy, see below)  
**Status:** Phase 2 (Android API architecture decision + MCP scaffold)  
**Last Updated:** March 3, 2026

---

## Executive Summary

InstagrowthMCP is a full-stack Instagram growth automation SaaS built on:
- **Frontend:** Next.js 15 + React 18 (Vercel, https://frontend-orpin-seven-32.vercel.app)
- **Backend:** Node.js/Express + TypeScript (Railway, https://instagrowth-saas-production.up.railway.app)
- **Database:** PostgreSQL (9 tables, fully indexed)
- **Python Layer:** FastAPI wrapper around instagrapi (port 8000)
- **Affinity Engine:** 8-layer clustering + optimization

**Latest Decision:** Build separate MCP server (instagrowth-mcp) for Instagram operations instead of rebuilding backend.

---

## Archive Context

**Previous location:** `/instagrowth333/`
- Legacy codebase
- Proof of concept work
- Some code patterns + learnings migrated to current repo

**Current location:** `/Users/growthgod/.openclaw/workspace/instagrowth-saas/`
- Production-ready codebase
- Live deployments (Vercel + Railway)
- Full TypeScript, 0 errors
- Git history maintained

---

## Phase 1: Discovery & Build (Feb-Mar 2026)

### What Was Built

**Backend (TypeScript/Express):**
- ✅ 13 compiled services
- ✅ 70+ API endpoints
- ✅ 8-layer affinity engine
- ✅ Master profiles cache (100k+)
- ✅ Fleet orchestration system
- ✅ Attribution tracking
- ✅ 9 database migrations

**Frontend (React/Next.js):**
- ✅ Dashboard (dark enterprise UI)
- ✅ Accounts page (2FA flow)
- ✅ Onboarding flow (email → handle → vibe → plan → password)
- ✅ Affinity explorer (graphs, clusters, correlations)
- ✅ Billing integration (Stripe)

**Database (PostgreSQL):**
```
├── users
├── accounts (Instagram credentials)
├── agent_duties (approval-based automation)
├── profile_analysis (Claude vibe analysis)
├── device_sessions (fleet status)
├── scheduled_posts
├── images/captions
├── discovery_jobs
├── device_locks (orchestration)
└── profiles_master (100k+ cached)
```

**Services Built:**
1. ProfileMasterCacheService — 100k profiles, <100ms query
2. FollowerAffinityService — 6-phase clustering
3. OnboardingService — Email → approval → execution
4. ReactionExecutorService — Like/comment/follow with delays
5. AttributionService — Intent logging + conversion matching
6. DiscoveryService — 4 job types + audience mining
7. DiscoveryExecutor — Async target discovery
8. FleetOrchestrationService — Device locks + parallel execution
9. EnrichedFollowerProfileService — Deep data enrichment
10. FQSOptimizer — Gradient descent auto-tuning
11. BaselineGraphService — Day 1 clustering
12. EnhancedDiscoveryService — Personalized targeting
13. DashboardService — Real-time metrics

### Key Decisions Made

1. **Approval Gate Before Credentials**
   - Plan review required before password entry
   - Prevents credential theft + ensures consent
   - Intent logging happens pre-credentials

2. **Master Profiles Cache Architecture**
   - Central profiles_master table
   - Every username = 1 row (never duplicated)
   - 30+ compound indexes
   - Auto-update scrape_count + last_scraped_at

3. **50-Scraper Pool Load-Balanced**
   - Round-robin distribution
   - 5 req/min per account
   - 250 req/min peak
   - 360k profiles/day capacity

4. **Fleet Orchestration: Sequential Per Device**
   - Parallel device acquisition (non-blocking locks)
   - Sequential post execution per device
   - 30-minute lock timeout auto-cleanup
   - Verified: 26 posts/min (21 devices, 31 accounts)

5. **Reactions Only (Phase 1)**
   - No direct posting from SaaS
   - Like, comment, follow, story_view only
   - Posting via Fleet + Android devices

6. **Conservative Learning**
   - FQS optimizer: min 5 data points before weight adjustment
   - learning_rate = 0.15 × confidence
   - Prevents wild swings

---

## Phase 2: Android API Decision (Mar 3, 2026)

### Problem Statement
- Competitor released web app using Instagram Android API
- Question: Rebuild with Android API or test existing approach?

### Architecture Options Evaluated

**Option A: Test Existing Python Service First** ✅ CHOSEN
- Python FastAPI (port 8000) wraps instagrapi
- Untested in production — need validation
- If it works: optimize, don't rebuild
- If it fails: then pivot to Android API

**Option B: Build Android API v2 (Conditional)**
- Only if Option A fails
- Use mcp-use framework (user's own MCP SDK)
- Separate repo (instagrowth-mcp/)
- Port 5555, TypeScript, type-safe

### Key Insight
Competitor likely uses instagrapi or PHP Instagram wrapper (not a moat). **Real differentiator is affinity engine**, not the underlying API.

### Decision
**Do NOT rebuild yet.** Test Python service first.

---

## Phase 2 Builds: Scaffolding & Infrastructure

### 1. instagrowth-mcp (Standby)
**Location:** `/Users/growthgod/.openclaw/workspace/instagrowth-mcp/`  
**Status:** Phase 1 complete (scaffolding)

```
MCP Server (port 5555, if needed)
├── 5 tools: execute_reaction, check_status, scrape, manage_session, health
├── PythonBridge HTTP client (wraps port 8000)
├── Zod schemas (type-safe validation)
├── Docker setup (ready to deploy)
└── Complete documentation
```

**When to activate:** After Python service is validated working.

### 2. Mission Kanban Dashboard
**Location:** `/Users/growthgod/VantaLABs_gg/Main/mission-kanban-dashboard.js`  
**Status:** Live on port 4002

```
Kanban board (Backlog → In Progress → Testing → Complete)
├── Reads CODING_PIPELINE.md (auto-parse)
├── Shows task ownership + estimates
├── Priority color-coded (🔴🟡🟢🔵✅)
├── Real-time stats
├── Auto-refresh every 10 seconds
└── Zero database (file-based)
```

### 3. Dashboard HUB (Central Command)
**Location:** `/Users/growthgod/VantaLABs_gg/Main/dashboard-hub.js`  
**Status:** Live on port 4000

```
Central command center
├── Quick links to all dashboards
├── Real-time service health checks
├── Grid view of active systems
└── One-click access to any dashboard
```

### 4. Supporting Infrastructure
- **Coding Pipeline:** CODING_PIPELINE.md (task queue)
- **Task Workflow:** TASK_WORKFLOW.md (how agents execute)
- **Watchlist System:** 138 organized links across 13 categories
- **Models Runway:** 30 models, 10 active, 99 pending posts
- **Upwork Auto-Apply:** Job feed polling, proposal generation

---

## Current System Architecture

```
Agents (Sp3ct3R, Sh3dw)
  ↓
↓ Primary: LM Studio (qwen/qwen3.5-9b, 23k context)
↓ Fallback: Anthropic Haiku (if LM Studio offline)
  ↓
Mission Control Dashboards (port 4000 HUB)
  ├── 🎯 Mission Kanban (4002) — Task tracking
  ├── 📊 Models Runway (3333) — Content inventory
  ├── 📚 Watchlist (4001) — Links to read
  └── 💼 Upwork Auto-Apply (9000) — Job feed
  ↓
Backend API (3005, Railway prod)
  ├── User auth + onboarding
  ├── Account management
  ├── Affinity engine
  ├── Fleet orchestration
  └── Attribution tracking
  ↓
Python FastAPI Service (8000)
  └── instagrapi wrapper
      ↓
      Instagram Private API
```

---

## Testing Status

### Python Service (port 8000)
- ❓ **Status:** Untested in production
- **Action:** Validate with 100 test actions, measure ban rates
- **Owner:** (pending assignment)
- **Est:** 2 hours

### Fleet Orchestration
- ✅ **Status:** Verified (26 posts/min, 21 devices)
- **Issue:** 6 unprocessed posts (39 vs 33 executed) — under investigation

### MCP Scaffold
- ✅ **Status:** Phase 1 complete
- **Action:** Phase 2 testing (depends on Python service validation)
- **Owner:** (pending assignment)

---

## Critical Blockers

1. **Dcash Bot DOWN** (9 days)
   - Last trades: Feb 20
   - Wallet: 0.424 SOL
   - Action: Restart + verify

2. **Instagram x-meta-zca Detection**
   - New auth header flags device authenticity
   - Impact: GeeLark phone farms easily detected
   - Action: Evaluate Nimble alternative vs VANTA strategy

3. **Railway Deployment**
   - Backend 502 Bad Gateway
   - Cause: SCRAPERS_JSON env var missing
   - Action: Deploy env var to Railway

4. **Fleet Sync Discrepancy**
   - 6 unprocessed posts
   - Possible: Lock timeout race condition
   - Action: Debug + fix

---

## File Structure

```
/Users/growthgod/.openclaw/workspace/instagrowth-saas/
├── frontend/                      (Next.js, Vercel)
│   └── src/pages/, components/
├── backend/                       (Express, Railway)
│   ├── src/
│   │   ├── routes/               (70+ endpoints)
│   │   ├── services/             (13 services)
│   │   ├── db/                   (migrations, schema)
│   │   └── middleware/
│   ├── dist/                     (compiled)
│   ├── tsconfig.json
│   └── package.json
├── CLAUDE.md                      (LM Studio config)
├── CODING_PIPELINE.md             (task queue)
├── TASK_WORKFLOW.md               (agent workflow)
├── MISSION_KANBAN.md              (dashboard docs)
├── PROJECT_STATUS.md              (current status)
└── PROJECT_PROGRESS.md            (this file)

/Users/growthgod/.openclaw/workspace/instagrowth-mcp/
├── src/
│   ├── index.ts                  (MCP server, 5 tools)
│   ├── services/PythonBridge.ts  (HTTP client)
│   └── tools/index.ts            (Zod schemas)
├── package.json
├── Dockerfile
├── docker-compose.yml
├── README.md
└── PROJECT_STATUS.md

/Users/growthgod/VantaLABs_gg/Main/
├── mission-kanban-dashboard.js   (port 4002)
├── dashboard-hub.js              (port 4000)
├── watchlist-dashboard.js        (port 4001)
├── models-runway.js              (port 3333)
└── (other device/orchestration scripts)
```

---

## Deployment Status

### Frontend (Vercel)
- ✅ Live at https://frontend-orpin-seven-32.vercel.app
- ✅ Auto-deploy on git push
- ✅ Dark enterprise UI complete

### Backend (Railway)
- ✅ Live at https://instagrowth-saas-production.up.railway.app
- ✅ Auto-deploy + auto-migrate on git push
- ✅ 0 TypeScript errors
- ⚠️ 502 Bad Gateway (needs SCRAPERS_JSON env var)

### Database (Railway PostgreSQL)
- ✅ 9 migrations ready
- ✅ All tables indexed
- ✅ Auto-run migrations on deploy

---

## Next Steps (Priority Order)

### 🔴 CRITICAL
1. **Restart Dcash Bot** — Dead 9 days, 0.424 SOL wallet
2. **Test Python Service** — 100 actions, measure ban rates
3. **Deploy SCRAPERS_JSON** — Unblocks Railway backend

### 🟡 HIGH
1. **MCP Phase 2 Testing** — Test tools via inspector
2. **Fleet Sync Debug** — 6 unprocessed posts
3. **Instagram x-meta-zca Eval** — Risk assessment vs VANTA

### 🟢 MEDIUM
1. **MCP Phase 3 Integration** — Wire agents to MCP
2. **PC Cleanup** — Free 10-15GB for Qwen 23k
3. **Production Deploy** — MCP to Railway

### 🔵 LOW
1. **Telegram Integration** — Auto-parse watchlist links
2. **Licensing Setup** — MCP access tokens
3. **Feature Development** — New agent capabilities

---

## Key Metrics

### Performance
- Profile lookup: <10ms
- Complex query: 50-200ms
- API response: <500ms
- Fleet throughput: 26 posts/min (21 devices)

### Capacity
- Scraper pool: 50 accounts, 250 req/min peak
- Master cache: 100k+ profiles
- Affinity clustering: <5s (1k profiles)

### Conversion (Expected)
- Day 1: 50% (default weights)
- Day 7: 62% (learning)
- Day 30: 85%+ (trained)

---

## Team & Ownership

| Role | Agent | Model | Status |
|------|-------|-------|--------|
| Ops | Sp3ct3R | qwen3.5-9b | Active |
| Visual | Sh3dw | qwen3.5-9b | Standby |
| Code | Claude Code | Fallback to Haiku | Available |

**Sp3ct3R** handles critical ops. **Sh3dw** handles design/visual. Both can spawn subagents for parallel work.

---

## Documentation Map

- **CLAUDE.md** — Model routing + LM Studio config
- **CODING_PIPELINE.md** — Task queue (agents read this)
- **TASK_WORKFLOW.md** — How agents execute tasks
- **MISSION_KANBAN.md** — Dashboard system + updates
- **PROJECT_STATUS.md** — Current project state
- **PROJECT_PROGRESS.md** — This file (history + decisions)
- **MEMORY.md** — Long-term memory + credentials
- **TOOLS.md** — Local dev setup

---

## Git History

```
Latest commits:
├── Add Mission Kanban Dashboard (port 4002)
├── Add Dashboard HUB (port 4000)
├── Add coding task pipeline + workflow
├── Update LM Studio + Qwen config
├── Create CLAUDE.md (model routing)
├── Add MCP scaffolding (Phase 1)
├── Add watchlist.json (138 links)
└── Earlier: Full backend + frontend build
```

All pushed to main branch. No feature branches for core systems.

---

## Success Criteria (Next 4 Weeks)

- [ ] Python service validated (100+ actions, ban rate tested)
- [ ] MCP Phase 2 complete (tools tested via inspector)
- [ ] Fleet sync issue resolved (6 posts accounted for)
- [ ] Dcash bot restarted + verified
- [ ] Railway backend: SCRAPERS_JSON deployed, 502 resolved
- [ ] Instagram x-meta-zca risk assessed
- [ ] MCP Phase 3: Agents wired (Sp3ct3R + Sh3dw)
- [ ] Kanban dashboard actively tracking agent work

---

**Created:** Mar 3, 2026  
**By:** Sp3ct3R (AI fleet commander)  
**Context:** Move from `/instagrowth333` to production `/instagrowth-saas`, establish new scaffolding for MCP layer
