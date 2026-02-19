# Codebase Concerns

**Analysis Date:** 2026-02-18

## Critical Issues

**Missing config.LIMITS dictionary:**
- Issue: Code references `config.LIMITS['max_proposals_per_day']` but dictionary is not defined in `config.py`
- Files: `modules/proposal_generator.py` (lines 48, 142)
- Impact: Daily proposal limit enforcement fails at runtime with KeyError. System will crash when generating proposals
- Fix approach: Add `LIMITS = {"max_proposals_per_day": 15}` to `config.py`. Set conservative default (15-20 per day) to avoid hitting Anthropic rate limits

**Missing scheduler implementation:**
- Issue: APScheduler is listed in `requirements.txt` but never initialized or used in `main.py`
- Files: `requirements.txt` (apscheduler==3.10.4), `main.py` (no scheduler code)
- Impact: No background job processing. System only works when manually triggered via `/api/run-cycle`. Upwork feed monitoring never runs automatically
- Fix approach: Add APScheduler initialization in `main.py` startup event. Schedule `monitor_feeds()` → `filter_all_new_jobs()` → `generate_all_pending()` cycle every 30 minutes (per `config.FEED_POLL_INTERVAL`)

**Dashboard API mismatch:**
- Issue: Dashboard HTML fetches `/api/proposals?status=pending` but API endpoint is `/api/queue` (line 74 in main.py)
- Files: `dashboard/index.html` (line 312), `main.py` (line 73)
- Impact: Dashboard fails silently. Proposal cards never load. Frontend shows empty state
- Fix approach: Either rename `/api/queue` to `/api/proposals?status=pending` OR update dashboard to fetch `/api/queue`

**Missing request body validation:**
- Issue: PUT endpoint `update_proposal(proposal_id: int, proposal_text: str)` has no Pydantic model or body parameter definition
- Files: `main.py` (lines 127-135)
- Impact: FastAPI will treat `proposal_text` as query parameter, not request body. Frontend cannot send proposal updates. Endpoint broken
- Fix approach: Create Pydantic BaseModel for request: `class UpdateProposalRequest(BaseModel): proposal_text: str`. Use in endpoint signature

## Security Concerns

**CORS allows localhost hardcoded:**
- Issue: CORS configured for `http://localhost:3000` and `http://localhost:3001` - not environment-based
- Files: `main.py` (lines 20-26)
- Risk: Production deployment will fail if frontend runs on different port. Secrets/tokens in response vulnerable to XSS
- Recommendations:
  - Move CORS origins to environment variables
  - Use environment-specific configs (dev: localhost:3000, prod: api.example.com)
  - Enable CORS_ALLOW_CREDENTIALS only in development

**Potential XSS in dashboard:**
- Issue: Dashboard directly inserts user data into HTML without escaping: `${p.title}`, `${p.proposal_text}` (lines 329-330)
- Files: `dashboard/index.html` (lines 329-330)
- Risk: Malicious job titles or proposal text containing HTML/JS will execute in browser
- Recommendations:
  - Use `textContent` instead of innerHTML for user data
  - Or sanitize with DOMPurify before rendering
  - Example: `<div class="proposal-text">${p.proposal_text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>`

**API key exposed in version control risk:**
- Issue: `.env.example` present but `.env` itself could be committed if gitignore fails
- Files: `.env.example` shows template, `.gitignore` should protect `.env`
- Risk: CLAUDE_API_KEY leaked if developer accidentally commits `.env`
- Recommendations:
  - Add aggressive `.gitignore` patterns: `.env`, `.env.*`, `!.env.example`
  - Use `git-secrets` to scan for api key patterns before commit
  - Test with: `grep -r "sk-ant-" .` to verify no keys in repo

## Data Integrity Issues

**No error recovery for failed proposals:**
- Issue: If Claude API call fails or returns invalid JSON, proposal is not retried. Just logged as error
- Files: `modules/proposal_generator.py` (lines 118-123)
- Impact: Job filters to `pending_proposal` but never generates proposal. No way to retry without manual DB edit
- Fix approach:
  - Add `retry_count` column to proposals table
  - Implement exponential backoff retry logic
  - Mark as `failed` after 3 retries, not silently dropped

**Database connections not properly closed on exception:**
- Issue: `exec_query()` uses try/finally but only closes on exception, not all paths
- Files: `db/database.py` (lines 26-45)
- Impact: If cursor.execute() raises, connection still closes (good). But if fetchall() raises, result undefined
- Fix approach: Restructure to ensure connection.close() called in all paths:
  ```python
  try:
      result = cursor.fetchall() if fetch else cursor.rowcount
  finally:
      conn.close()
  ```

**No unique constraint on job_id in feed fetching:**
- Issue: `job_exists()` checks if job in DB but races with concurrent API requests possible. No unique index prevents duplicates
- Files: `modules/feed_monitor.py` (lines 41-48), `db/schema.sql` (line 4)
- Impact: Concurrent `/api/run-cycle` calls could insert same job twice
- Fix approach: Add `UNIQUE(id)` constraint on jobs table (already PRIMARY KEY, so safe)

## Performance Bottlenecks

**Feed fetching blocks request:**
- Issue: `/api/run-cycle` endpoint (line 182 in main.py) calls `monitor_feeds()` synchronously. Takes 5-30 seconds depending on feed response times
- Files: `main.py` (lines 187-204)
- Impact: Dashboard/client request hangs for up to 30 seconds. No timeout protection
- Fix approach:
  - Make `run_cycle()` async and use background task queue
  - Return 202 Accepted immediately with job ID
  - Client polls `/api/cycle/{job_id}/status` for progress
  - Or use APScheduler with event system instead of on-demand endpoint

**No pagination on job/proposal queries:**
- Issue: `get_jobs()` and `get_queue()` fetch all with only LIMIT applied
- Files: `main.py` (lines 42-54, 73-88)
- Impact: With 10,000+ jobs in DB, queries return entire result set. Memory spike. Slow serialization to JSON
- Fix approach:
  - Add OFFSET parameter: `def get_jobs(status: str = None, limit: int = 50, offset: int = 0)`
  - Use cursor.fetchall() with LIMIT/OFFSET in SQL
  - Return metadata: `{"total": count, "page": offset, "limit": limit, "data": [...]}`

**Claude API calls not rate-limited:**
- Issue: If 100 jobs filter to `pending_proposal`, system calls Claude API 100 times immediately (lines 125-147 in proposal_generator.py)
- Files: `modules/proposal_generator.py`, `config.py`
- Impact: Could hit Anthropic rate limits (429 error). All 100 requests fail. No backoff
- Fix approach:
  - Add rate limiter: 1 request per 2 seconds (30 per minute max)
  - Implement exponential backoff on 429 responses
  - Add circuit breaker: stop proposals if Claude API returns error

**SQLite locking on concurrent writes:**
- Issue: Each `exec_query()` opens new connection. Multiple simultaneous API requests = concurrent DB writers
- Files: `db/database.py` (lines 20-24, 28)
- Impact: SQLite has table-level locking. Heavy concurrent load causes "database is locked" errors
- Fix approach:
  - Keep persistent connection pool (use sqlite3 with check_same_thread=False in production)
  - Or switch to PostgreSQL at scale
  - Add timeout: `conn.execute("PRAGMA busy_timeout = 5000")` (5 second wait before failing)

## Fragile Areas

**Job budget extraction heuristic is fragile:**
- Issue: `extract_budget_amount()` assumes first number is budget amount. Doesn't handle ranges, currency symbols, or text patterns
- Files: `modules/job_filter.py` (lines 11-20)
- Why fragile: Job description "Automate 3 data imports. Budget: $500" extracts "3" not "500". Filter by budget fails
- Safe modification: Use regex to find pattern like `\$[\d,]+` or `\d+\s*-\s*\d+` before general `\d+`
- Test coverage: Zero. Need tests for cases: "$150", "$150-300", "50/hr", "£500", "Budget 100K", "no budget"

**Proposal generation system prompt hardcoded with personal name:**
- Issue: SYSTEM_PROMPT in proposal_generator.py (lines 15-34) hardcoded with "Alex Chen" name
- Files: `modules/proposal_generator.py` (line 15)
- Why fragile: If deploying for different user, all proposals signed with wrong name. Not parameterized
- Safe modification: Move SYSTEM_PROMPT template to config.py with placeholder `{user_name}`. Format at runtime
- Test coverage: No tests for system prompt variations

**Feed monitor assumes specific RSS structure:**
- Issue: `extract_job_from_entry()` accesses fields like `entry.published_parsed`, `entry.summary` with no validation
- Files: `modules/feed_monitor.py` (lines 23-39)
- Why fragile: If Upwork changes RSS schema or entry is malformed, `.get('summary', '')` silently returns empty string. No warning
- Safe modification: Add try/except around field extraction. Log warnings for missing fields
- Example: If title is missing, skip entry entirely (don't insert with empty title)

**Job filter score relies on substring matching:**
- Issue: `score_whitelist()` checks `if keyword.lower() in full_text`. "test" matches "testing", "latest", "temptest"
- Files: `modules/job_filter.py` (lines 46-55)
- Why fragile: False positives. Job about "test automation" shouldn't match "latest Python"
- Safe modification: Use word boundary regex: `re.search(r'\b' + keyword.lower() + r'\b', full_text)`

**No timeout on feed fetching:**
- Issue: `feedparser.parse(feed_url)` can hang indefinitely if Upwork server doesn't respond
- Files: `modules/feed_monitor.py` (lines 12-21)
- Why fragile: `/api/run-cycle` hangs forever if feed endpoint is down
- Safe modification: Use `requests.get()` with timeout instead of feedparser
  ```python
  response = requests.get(feed_url, timeout=10)
  feed = feedparser.parse(response.content)
  ```

## Test Coverage Gaps

**No unit tests:**
- Files: Only `test_system.py` exists, which is integration test script only
- What's not tested:
  - `extract_budget_amount()` with edge cases (currency symbols, ranges, no number)
  - `check_blacklist()` with phrase matching
  - `score_whitelist()` with word boundaries
  - `generate_proposal()` JSON parsing errors
  - `approve_proposal()` non-existent proposal ID (404 handling)
  - `update_proposal()` with oversized text (DB constraints)
- Risk: Bug in filter or generation logic silently breaks proposal quality
- Priority: High - Add pytest with fixtures for jobs/proposals

**No API integration tests:**
- Files: No tests for endpoint behavior, request validation, error responses
- What's not tested:
  - POST with missing parameters
  - GET with invalid ID returns 404
  - Concurrent requests race conditions
  - Proposal updates with XSS payloads
- Risk: Security vulnerability in endpoint could go to production
- Priority: High - Add FastAPI TestClient tests for all endpoints

**No error scenario testing:**
- What's not tested:
  - Claude API rate limit (429) handling
  - Database lock timeout
  - Malformed RSS feed (bozo=True)
  - Missing job description (NULL in DB)
- Risk: System crashes in production under load or with bad data
- Priority: Medium - Add error injection tests

## Known Limitations

**No scheduler in production:**
- Status: APScheduler installed but not used. System requires manual `/api/run-cycle` calls
- Workaround: Use external cron job: `curl -X POST http://localhost:8000/api/run-cycle` every 30 minutes
- Timeline: Implement in next phase

**No direct Upwork submission:**
- Status: Proposals generated and exported to files only. Manual copy/paste required
- Workaround: Use `export_approved_proposals()` to get .txt files. Copy proposals manually to Upwork
- Timeline: Phase 2 requires Upwork OAuth integration

**SQLite doesn't scale:**
- Status: Works for <10K jobs. Slows significantly beyond that
- Workaround: None without rewrite. Recommend PostgreSQL for production
- Limits: ~100K jobs before query times exceed 1 second

**No proposal editing history:**
- Status: Once approved, proposals can't be rolled back if sent incorrectly
- Impact: If user approves wrong proposal, it's marked sent but not submitted to Upwork
- Workaround: Mark as `rejected` and regenerate
- Timeline: Add version history table in Phase 2

## Configuration Risks

**Filters too loose by default:**
- Status: `FILTER_WHITELIST_MIN_SCORE = 2` means any job with 2 keyword matches qualifies
- Risk: Very low quality proposals generated for weakly-matching jobs
- Recommendation: Increase to 3 or 4 for more selective filtering
- Test: Monitor first 24 hours and adjust based on proposal quality

**Budget filters don't account for currency:**
- Status: Budget extraction assumes USD. "£200" extracts as "200" and fails hourly check
- Risk: Good jobs filtered out if posted in non-USD currency
- Recommendation: Add regex to detect currency symbol and convert rate
- Timeline: Low priority for USD-only market

**Hardcoded system prompt ties to one person:**
- Status: "Alex Chen" in proposal template (line 15 of proposal_generator.py)
- Risk: System can't be reused for different freelancers without code change
- Recommendation: Move to config.py as template
- Timeline: Before multi-user support

## Scaling Considerations

**Feed URLs hardcoded:**
- Status: 5 feeds in config, but no way to add more without code change
- Scaling path: Move to database table `feed_subscriptions` with enable/disable toggle

**Single account only:**
- Status: System assumes one Upwork profile
- Scaling path: Add `account_id` column to proposals/jobs. Create API endpoints for account management

**No proposal tagging/categorization:**
- Status: Can't group proposals by job category or client
- Scaling path: Add `tags` JSON column to proposals table for filtering dashboard

---

*Concerns audit: 2026-02-18*
