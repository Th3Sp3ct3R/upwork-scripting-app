# Scraper Validation & Load Testing Guide

## Overview

This document explains how to validate the 50-scraper pool and test action rate limits before running full-scale growth operations.

---

## Part 1: Validation Testing (Verify Scraper Works)

### Quick Test (2 minutes)

```bash
cd /Users/growthgod/.openclaw/workspace/instagrowth-saas/backend
npm run dev  # Start backend on :3003

# In another terminal
./TEST_SCRAPER.sh
```

### What Gets Tested

| Test | Validates | Expected Result |
|------|-----------|-----------------|
| **Scraper Pool Load** | All 50 accounts initialized | ✅ 50/50 loaded with valid tokens |
| **Profile Scraping** | WebScraper.ts can fetch profiles | ✅ @instagram profile returns 300M+ followers |
| **Followers Discovery** | Can scrape follower lists | ✅ Returns 50+ follower objects with username/pk |
| **Hashtag Mining** | Can discover posts by hashtag | ✅ Returns 25+ posts with author/engagement |
| **Search** | Can search for accounts | ✅ Returns 20 account results |
| **Health Check** | Scraper sessions are healthy | ✅ Test scraper responds (not blocked) |

### Expected Output

```
✅ GET /api/scrapers/status — 50 scrapers loaded
✅ POST /api/scrapers/profile — @instagram returned (followers: 333M+)
✅ POST /api/scrapers/followers — 50 followers scraped
✅ POST /api/scrapers/hashtag — 25 posts found in #growth
✅ POST /api/scrapers/search — 20 results for "marketing"
✅ POST /api/scrapers/test — Scraper health OK

✨ ALL TESTS PASSED — Ready for load testing
```

---

## Part 2: Load Testing (Find Rate Limits)

### Discovery Configuration for Testing

Modify `LeadFinder` config to generate **1000+ targets** instead of 50:

```typescript
const loadTestConfig = {
  hashtags: [
    'growth', 'marketing', 'startup', 'entrepreneurship',
    'socialmedia', 'digitalmarketing', 'influencer', 'contentcreator',
    'business', 'bootstrap', 'onlinemarketing', 'growthhacking',
    'scaling', 'saas', 'webdesign', 'branding'
  ],
  postLimit: 200,       // 200 posts per hashtag
  maxPages: 5,          // Multi-page scraping
  minFollowers: 100,    // Filter out spam
  maxFollowers: 500000, // Cap at reasonable size
  targetCount: 1000     // Aim for 1000 unique targets
};

// Create discovery job
await discoveryJobsService.createDiscoveryJob(
  accountId,
  'hashtag_mining',
  loadTestConfig,
  24  // Daily refresh
);
```

### Execution Test Plan

**Phase 1: Baseline** (Days 1-3)
```
Execute: 50 follows/day
Monitor: Any blocks? Cooldowns? Errors?
Expected: 100% success rate
```

**Phase 2: Ramp Up** (Days 4-6)
```
Execute: 100 follows/day
Monitor: Error rate? 401s? Rate limit headers?
Expected: 95%+ success rate
```

**Phase 3: Push Limit** (Days 7-10)
```
Execute: 200 follows/day
Monitor: When does action_required trigger?
Expected: Find the ceiling (probably 200-400 actions/day)
```

**Phase 4: Mixed Actions** (Days 11-14)
```
Execute: 80 follows + 80 likes + 40 comments/day
Monitor: Which action type gets blocked first?
Expected: Follow has lowest limit, comments have highest
```

### Metrics to Track

Create a test dashboard tracking:

```sql
-- Action metrics per day
SELECT 
  DATE(attempted_at) as day,
  action_type,
  COUNT(*) as total_actions,
  SUM(CASE WHEN success THEN 1 ELSE 0 END) as succeeded,
  SUM(CASE WHEN success THEN 1 ELSE 0 END)::FLOAT / COUNT(*) as success_rate,
  AVG(CASE WHEN http_status = 429 THEN 1 ELSE 0 END) as rate_limit_pct,
  AVG(CASE WHEN http_status = 401 THEN 1 ELSE 0 END) as auth_fail_pct
FROM reaction_activity_log
WHERE account_id = $1
GROUP BY DATE(attempted_at), action_type
ORDER BY day DESC;
```

### Success Criteria

✅ **You've found the limit when:**
- 1-2 action_required errors per 200 actions
- Consistent 90%+ success rate at that volume
- No cascading failures (blocks stay localized)

❌ **You've hit too hard when:**
- >5% rate limit errors
- Repeated 401s (session blocked)
- Blocks lasting >2 hours

---

## Part 3: Data Collection for Affinity Engine

### While Testing, Collect:

**1. Response Data**
```typescript
// Store every action attempt
{
  target_username: 'growth_hacker_123',
  target_quality_score: 0.75,  // From master profiles cache
  target_niche: 'marketing',
  action_type: 'follow',
  action_duration_ms: 2500,
  http_status: 200,
  error: null,
  followed_back?: true,  // Check 5 days later
  interacted?: true      // Check if they liked/commented
}
```

**2. Conversion Tracking** (5-day window)
After following 100 accounts, check back:
```sql
SELECT 
  COUNT(*) as targets,
  SUM(CASE WHEN followed_back THEN 1 ELSE 0 END) as followbacks,
  SUM(CASE WHEN interacted THEN 1 ELSE 0 END) as interactions,
  COUNT(*) FILTER (WHERE converted)::FLOAT / COUNT(*) as conversion_rate
FROM reaction_tracking
WHERE action_type = 'follow' AND action_date > NOW() - INTERVAL '5 days';
```

**3. Cluster Performance**
```sql
-- Which affinity clusters convert best?
SELECT 
  cluster_label,
  COUNT(*) as targets,
  COUNT(*) FILTER (WHERE converted)::FLOAT / COUNT(*) as conversion_rate
FROM reaction_tracking
JOIN profiles_master ON reaction_tracking.target_pk = profiles_master.pk
JOIN affinity_clusters ON profiles_master.cluster_id = affinity_clusters.id
GROUP BY cluster_label
ORDER BY conversion_rate DESC;
```

---

## Part 4: Expected Results & Interpretation

### Scenario 1: Healthy Response

```
Phase 1 (50/day):   100% success    ✅ All actions processed
Phase 2 (100/day):  98% success     ✅ 1-2 blocks, expected
Phase 3 (200/day):  88% success     ⚠️  Approaching limit
Phase 4 (300/day):  65% success     🛑 Too hard, back off to 200/day
```

**Conclusion:** Safe operating range = 150-200 actions/day

### Scenario 2: Early Blocks

```
Phase 1 (50/day):   92% success     ⚠️  Some blocks at low volume
Phase 2 (100/day):  40% success     🛑 Highly restricted
Phase 3+ (skip):    BLOCKED

Possible causes:
- Old scraper accounts (IP reputation low)
- Scraper cookies expired
- Account flagged for automation
- Network rate limiting (proxy issue)
```

**Action:** Refresh scraper cookies, rotate IPs, reduce action speed

### Scenario 3: Conversion Peaks

```
Following "Micro Influencers + High Engagers" cluster:
- Conversion rate: 28%
- Followback rate: 32%

Following "Nano Accounts + Mass Followers" cluster:
- Conversion rate: 3%
- Followback rate: 1%
```

**Insight:** Micro tier converts 10x better. Adjust affinity weights to prioritize.

---

## Part 5: Instrumentation Code

Add to `ReactionExecutorService.ts`:

```typescript
interface ActionMetrics {
  target_username: string;
  action_type: 'follow' | 'like' | 'comment';
  attempted_at: Date;
  success: boolean;
  http_status?: number;
  error_code?: string;
  duration_ms: number;
  target_quality_score?: number;
  target_cluster?: string;
  account_id: string;
}

async function logActionMetrics(metrics: ActionMetrics) {
  await db.query(
    `INSERT INTO reaction_activity_log 
     (account_id, action_type, target_username, success, http_status, 
      error_code, duration_ms, target_quality_score, target_cluster, attempted_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [
      metrics.account_id,
      metrics.action_type,
      metrics.target_username,
      metrics.success,
      metrics.http_status,
      metrics.error_code,
      metrics.duration_ms,
      metrics.target_quality_score,
      metrics.target_cluster,
      metrics.attempted_at
    ]
  );
}

// Call in every action execution
await logActionMetrics({
  target_username: target.username,
  action_type: 'follow',
  attempted_at: new Date(),
  success: response.ok,
  http_status: response.status,
  duration_ms: Date.now() - startTime,
  target_quality_score: target.audience_quality_score,
  target_cluster: target.cluster_label,
  account_id: accountId
});
```

---

## Timeline

| Phase | Duration | Focus | Output |
|-------|----------|-------|--------|
| **Setup** | 1 hour | Validation tests, 1000 targets discovered | ✅ All systems go |
| **Phase 1** | 3 days | Baseline (50/day), monitor for blocks | Safe range identified |
| **Phase 2** | 3 days | Ramp up (100/day), measure success rate | Error patterns emerge |
| **Phase 3** | 4 days | Push limit (200-300/day), find ceiling | Rate limit threshold found |
| **Analysis** | 2 days | Review conversion by cluster, optimize FQS | Best-performing segments identified |
| **Deployment** | 1 day | Deploy optimized config, monitor | Live growth operation starts |

**Total: 2 weeks to production-ready load testing**

---

## Checklist

- [ ] Run `./TEST_SCRAPER.sh` — all 7 tests pass
- [ ] Discover 1000+ targets (use hashtag config above)
- [ ] Execute Phase 1 (50/day for 3 days)
- [ ] Execute Phase 2 (100/day for 3 days)
- [ ] Execute Phase 3 (200-300/day for 4 days)
- [ ] Analyze conversion data by cluster
- [ ] Identify rate limit ceiling
- [ ] Update FQS weights based on cluster performance
- [ ] Deploy to production with optimized config
- [ ] Monitor first 7 days at optimized rate

---

**Ready to test?** Start with: `./TEST_SCRAPER.sh` 🚀
