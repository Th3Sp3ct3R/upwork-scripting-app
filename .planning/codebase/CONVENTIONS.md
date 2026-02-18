# Coding Conventions

**Analysis Date:** 2026-02-18

## Naming Patterns

**Files:**
- Snake case for Python modules: `job_filter.py`, `proposal_generator.py`, `feed_monitor.py`
- Lowercase with underscores: `test_system.py`, `database.py`
- Descriptive names matching their primary responsibility

**Functions:**
- Snake case throughout: `extract_budget_amount()`, `is_budget_acceptable()`, `check_blacklist()`
- Verb-prefixed for actions: `filter_job()`, `monitor_feeds()`, `generate_proposal()`, `export_approved_proposals()`
- Getter functions use explicit prefixes: `count_sent_today()`, `job_exists()`, `get_db()`, `exec_query()`
- Single word verbs for main entry functions: `init_db()`, `startup()`

**Variables:**
- Snake case consistently: `job_id`, `proposal_text`, `feed_url`, `filter_score`, `new_jobs`
- Descriptive names preferred: `pending_proposals` not `pp`, `filter_reason` not `reason`
- Boolean/flag variables explicit: `allow_no_budget`, `all_passed`
- Collection names plural: `new_jobs`, `proposals`, `filtered_out`

**Types/Classes:**
- Only procedural modules and functions, no class definitions in current codebase
- Constants in UPPER_SNAKE_CASE: `FILTER_WHITELIST_MIN_SCORE`, `PROPOSAL_MAX_CHARS`, `API_HOST`
- Global config constants uppercase: `CLAUDE_MODEL`, `FEED_POLL_INTERVAL`

## Code Style

**Formatting:**
- No automated formatter configured (no Black, Ruff, or Prettier)
- Consistent 4-space indentation observed across all files
- Line length not strictly limited but kept reasonable (under 100 characters in most cases)
- One blank line between function definitions in modules
- Two blank lines before main module sections (API Routes, etc.)

**Linting:**
- No linting tool configured (no Pylint, Flake8, or ESLint)
- Code style is manually maintained

**PEP 8 Compliance:**
- Generally follows PEP 8 conventions
- Docstrings present on functions and modules
- Imports organized at top of file

## Import Organization

**Order:**
1. Standard library imports: `logging`, `os`, `sys`, `sqlite3`, `json`, `re`, `pathlib`
2. Third-party library imports: `feedparser`, `anthropic`, `fastapi`, `dotenv`, `requests`
3. Local application imports: `from db.database import`, `from modules.`, `import config`

**Examples from codebase:**

```python
# From main.py
import logging
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from db.database import init_db, exec_query
from modules.feed_monitor import monitor_feeds
from modules.job_filter import filter_all_new_jobs
from modules.proposal_generator import generate_all_pending
from modules.sender import export_approved_proposals, mark_proposal_sent
import config
```

**Path Aliases:**
- Relative imports used: `from db.database import`, `from modules.job_filter import`
- Config imported as module: `import config` then accessed as `config.CLAUDE_API_KEY`

## Error Handling

**Patterns:**
- Try-except blocks around uncertain operations (API calls, file I/O, parsing)
- Specific exception types caught when possible: `except json.JSONDecodeError`, `except ImportError`
- Generic `except Exception` used for broad error capture with logging
- Errors logged with context before returning False/None

```python
# From proposal_generator.py
try:
    logger.info(f"🤖 Generating proposal for: {job['title'][:50]}...")
    response = client.messages.create(...)
    proposal_json = response.content[0].text
    proposal_data = json.loads(proposal_json)
    # ... insertion logic
    return True
except json.JSONDecodeError as e:
    logger.error(f"Failed to parse Claude response as JSON: {e}")
    return False
except Exception as e:
    logger.error(f"Error generating proposal: {e}")
    return False
```

**Silent failures common:**
- Functions return `False` or `None` on error rather than raising
- Logging provides visibility instead of exceptions propagating
- HTTP endpoints wrap with `HTTPException` for API responses

```python
# From main.py
@app.post("/api/run-cycle")
def run_cycle():
    try:
        # ... logic
        return {"status": "success", ...}
    except Exception as e:
        logger.error(f"Cycle failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
```

## Logging

**Framework:** Python `logging` module

**Configuration:**
- Basic config in each module: `logging.basicConfig(level=logging.INFO)`
- Logger created per module: `logger = logging.getLogger(__name__)`
- Centralized in main.py startup via logging.basicConfig

**Patterns:**

Informational progress with emoji indicators:
```python
logger.info("✅ Database initialized")
logger.info(f"🔍 Starting job filter...")
logger.info(f"✨ Feed monitor cycle complete")
logger.info(f"❌ Filtered out (blacklist): {job['title'][:50]}")
logger.warning(f"⚠️  Daily proposal limit ({limit}) reached")
logger.error(f"Error generating proposal: {e}")
```

- Informational operations prefixed with emoji for visual scanning
- Error messages include context and variable values
- Warnings for near-limit conditions
- All major operations logged at INFO level

## Comments

**When to Comment:**
- Docstrings present on all functions with purpose and no parameter docs
- Inline comments minimal - code is self-documenting through function names
- Section headers used in main.py with `# ============` dividers
- Comment blocks explain "why" not "what" when used

```python
# From main.py
# ============================================================================
# API Routes
# ============================================================================

@app.get("/api/jobs")
def get_jobs(status: str = None, limit: int = 50):
    """Get all jobs, optionally filtered by status."""
```

**JSDoc/TSDoc:**
- Not applicable (Python project)
- Docstrings are single-line descriptive strings on functions

## Function Design

**Size:**
- Functions are concise, 10-50 lines typically
- Long functions exist for orchestration: `export_approved_proposals()` (66 lines), `generate_all_pending()` (23 lines)

**Parameters:**
- Minimal parameters, most functions take 0-2 required params
- Optional parameters have defaults: `status: str = None`, `limit: int = 50`
- Configuration accessed via global `import config` rather than parameters

**Return Values:**
- Consistent boolean returns for success/failure: `True` or `False`
- Count returns for batch operations: `return passed, filtered`
- Dictionary returns for API endpoints: `{"status": "success", "exported": count}`
- None returns on errors (implicit)

```python
# Boolean return pattern
def filter_job(job_id):
    if check_blacklist(...):
        return False
    if not is_budget_acceptable(...):
        return False
    # ... logic
    return True

# Multi-value return pattern
def filter_all_new_jobs():
    passed = 0
    filtered = 0
    for job in new_jobs:
        if filter_job(job['id']):
            passed += 1
        else:
            filtered += 1
    return passed, filtered
```

## Module Design

**Exports:**
- Each module exposes one primary orchestration function: `monitor_feeds()`, `filter_all_new_jobs()`, `generate_all_pending()`, `export_approved_proposals()`
- Helper functions (starting with underscore is not used) private by convention through naming clarity
- All functions exposed - no explicit private functions

**Barrel Files:**
- Not used - imports are explicit from specific modules
- `__init__.py` files are minimal/empty docstrings only

**Module Responsibilities:**
- `config.py`: Configuration constants and defaults (no logic)
- `main.py`: FastAPI application, routing, HTTP endpoints
- `db/database.py`: Database initialization and query execution
- `modules/feed_monitor.py`: RSS feed parsing and job ingestion
- `modules/job_filter.py`: Job filtering and scoring logic
- `modules/proposal_generator.py`: Claude API integration for proposal generation
- `modules/sender.py`: Exporting proposals to files
- `test_system.py`: System integration tests

---

*Convention analysis: 2026-02-18*
