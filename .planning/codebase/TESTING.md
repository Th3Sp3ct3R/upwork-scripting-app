# Testing Patterns

**Analysis Date:** 2026-02-18

## Test Framework

**Runner:**
- FastAPI's built-in `TestClient` from `fastapi.testclient`
- No separate test runner configured (pytest, unittest not found)
- Manual integration testing via `test_system.py`

**Assertion Library:**
- Python's standard equality checks: `if response.status_code == 200`, `if table in tables`
- No third-party assertion library

**Run Commands:**
```bash
python test_system.py            # Run system integration tests
python main.py                   # Start backend API (can then test endpoints)
```

## Test File Organization

**Location:**
- Single test file at root: `/Users/growthgod/upwork_scripting_app/test_system.py`
- Not co-located with source modules
- Separate from FastAPI application code

**Naming:**
- Test file: `test_system.py` (follows Python `test_` convention)
- Test functions: `test_imports()`, `test_env()`, `test_database()`, `test_api()`, `test_claude()`
- Each test function is a logical component test

**Structure:**
```
/Users/growthgod/upwork_scripting_app/
├── test_system.py          # Integration test suite
├── main.py                 # FastAPI application (can be tested via TestClient)
└── modules/                # No unit tests for individual modules
```

## Test Structure

**Suite Organization:**

```python
def main():
    """Run all tests."""
    print("=" * 60)
    print("🧪 UPWORK AUTO-APPLY SYSTEM TEST")
    print("=" * 60)

    results = []

    results.append(("Imports", test_imports()))
    results.append(("Environment", test_env()))
    results.append(("Database", test_database()))
    results.append(("API", test_api()))
    results.append(("Claude API", test_claude()))

    # ... summary output
    return 0 if all_passed else 1

if __name__ == "__main__":
    sys.exit(main())
```

**Patterns:**

- **Setup pattern:** Explicit setup within each test function (e.g., `load_dotenv()`, `init_db()`)
- **Cleanup pattern:** File/database cleanup done within tests (e.g., `db_path.unlink()` to clear old DB)
- **Assertion pattern:** Direct equality checks without framework helpers

```python
# Setup pattern - from test_database()
db_path = Path("upwork.db")
if db_path.exists():
    db_path.unlink()  # Clean before test

try:
    from db.database import init_db
    init_db()
    print("  ✅ Database initialized")
except Exception as e:
    print(f"  ❌ Database init failed: {e}")
    return False

# Assertion pattern
if response.status_code == 200:
    print("  ✅ Health endpoint works")
else:
    print(f"  ❌ Health endpoint returned {response.status_code}")
    return False
```

## Mocking

**Framework:**
- No mocking framework configured (unittest.mock not found in imports)

**Patterns:**
- No mocking observed in current tests
- Real integrations tested: real database, real API calls

```python
# From test_api() - uses real FastAPI app
from fastapi.testclient import TestClient
client = TestClient(app)
response = client.get("/health")  # Real endpoint test
```

**What to Mock:**
- External API calls (Claude API, Upwork feeds) could be mocked but aren't currently
- Database could be replaced with in-memory SQLite for testing but isn't

**What NOT to Mock:**
- Database operations - real database is tested
- FastAPI endpoints - real app is tested with TestClient
- Startup sequence - full init_db() is called to ensure schema works

## Fixtures and Factories

**Test Data:**
- No fixtures or factories currently used
- Tests use real data: real database, real API credentials

Example of data setup:
```python
# From test_database()
try:
    conn = sqlite3.connect("upwork.db")
    cursor = conn.cursor()

    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = [row[0] for row in cursor.fetchall()]

    required = ["jobs", "proposals", "feed_log"]
```

**Location:**
- Not applicable - no fixtures or factories in use

## Coverage

**Requirements:** None enforced

**View Coverage:**
- No coverage reporting tool configured
- Manual coverage by running `test_system.py` and visually inspecting output

## Test Types

**System/Integration Tests:**
- **Scope:** End-to-end component integration
- **Approach:** Each test validates a major system component works
  - `test_imports()`: All dependencies importable
  - `test_env()`: Environment variables configured
  - `test_database()`: Database can initialize with correct schema
  - `test_api()`: FastAPI app loads and health endpoint responds
  - `test_claude()`: Claude API connection works with real credentials

```python
def test_imports():
    """Test that all dependencies can be imported."""
    print("🔍 Testing imports...")

    try:
        import feedparser
        print("  ✅ feedparser")
    except ImportError as e:
        print(f"  ❌ feedparser: {e}")
        return False

    # ... check each dependency
    return True
```

**Unit Tests:**
- Not present
- No tests for individual module functions (filter_job, generate_proposal, etc.)

**E2E Tests:**
- Not automated
- Manual testing via dashboard UI documented in test output:
```python
print("1. python main.py          # Start the backend")
print("2. open http://localhost:8000/dashboard/index.html")
print("3. Click 'Run Cycle' to fetch and generate proposals")
```

## Common Patterns

**Async Testing:**
- Not used - no async test patterns
- FastAPI async functions tested via synchronous TestClient

**Error Testing:**
```python
# From test_env()
api_key = os.getenv("CLAUDE_API_KEY")
if not api_key:
    print("  ❌ CLAUDE_API_KEY not set in .env")
    return False

if api_key.startswith("sk-ant-"):
    print(f"  ✅ CLAUDE_API_KEY configured")
else:
    print(f"  ⚠️  CLAUDE_API_KEY may be invalid (should start with 'sk-ant-')")
```

**Exit Codes:**
```python
if all_passed:
    print("\n✨ All tests passed! Ready to run.")
    return 0
else:
    print("\n❌ Some tests failed. Check errors above.")
    return 1

if __name__ == "__main__":
    sys.exit(main())
```

## Testing Best Practices Observed

**Strengths:**
- Clear test naming and organization by component
- Human-readable output with emoji indicators for status
- Early exit on component failure (dependencies checked first)
- Real integrations tested (no mocking hides issues)
- Environment validation before core tests

**Current Gaps:**
- No unit tests for individual module functions
- No automated E2E tests of full workflow
- No fixture-based test data generation
- No parameterized tests for different configurations
- No performance/load testing

## Module Testing Strategy

**`db/database.py` testing:**
- Tested via `test_database()` - verifies schema, tables, connection
- Direct SQLite checks validate structure
- No isolated unit tests for `exec_query()` function

**`modules/feed_monitor.py` testing:**
- Not tested in test_system.py
- Manual testing via `python main.py` → "Run Cycle" → fetch phase
- No unit tests for individual functions like `extract_job_from_entry()`

**`modules/job_filter.py` testing:**
- Not tested in test_system.py
- Manual testing via "Run Cycle" → filter phase
- No unit tests for `is_budget_acceptable()`, `check_blacklist()`, etc.

**`modules/proposal_generator.py` testing:**
- Tested via `test_claude()` for API connectivity
- Manual testing via "Run Cycle" → generate phase
- Requires active CLAUDE_API_KEY to test

**`main.py` (API endpoints) testing:**
- Tested via `test_api()` - validates FastAPI loads and health check works
- Only `/health` endpoint explicitly tested
- Other endpoints (`/api/jobs`, `/api/queue`, etc.) not tested

---

*Testing analysis: 2026-02-18*
