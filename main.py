"""FastAPI Backend for Upwork Auto-Apply System."""

import json
import logging
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from datetime import datetime
from db.database import init_db, exec_query
from modules.job_scraper import scrape_jobs, scrape_feed
from modules.job_filter import filter_all_new_jobs, filter_job
from modules.proposal_generator import generate_all_pending
from modules.sender import export_approved_proposals, mark_proposal_sent
import config

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Upwork Auto-Apply System")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# Pydantic Models
# ============================================================================

class ConfigUpdate(BaseModel):
    search_keywords: Optional[List[str]] = None
    search_filters: Optional[Dict[str, Any]] = None
    budget_filters: Optional[Dict[str, Any]] = None
    client_filters: Optional[Dict[str, Any]] = None
    keyword_blacklist: Optional[List[str]] = None
    keyword_whitelist: Optional[List[str]] = None
    whitelist_min_score: Optional[int] = None

class SavedSearchCreate(BaseModel):
    name: str
    search_keywords: Optional[List[str]] = None
    search_filters: Optional[Dict[str, Any]] = None
    budget_filters: Optional[Dict[str, Any]] = None
    client_filters: Optional[Dict[str, Any]] = None
    keyword_blacklist: Optional[List[str]] = None
    keyword_whitelist: Optional[List[str]] = None
    whitelist_min_score: Optional[int] = None

class SavedSearchUpdate(BaseModel):
    name: Optional[str] = None
    search_keywords: Optional[List[str]] = None
    search_filters: Optional[Dict[str, Any]] = None
    budget_filters: Optional[Dict[str, Any]] = None
    client_filters: Optional[Dict[str, Any]] = None
    keyword_blacklist: Optional[List[str]] = None
    keyword_whitelist: Optional[List[str]] = None
    whitelist_min_score: Optional[int] = None


# ============================================================================
# Helpers
# ============================================================================

def _get_runtime_config():
    """Snapshot current runtime config as a dict."""
    return {
        "search_keywords": list(config.SEARCH_KEYWORDS),
        "search_filters": dict(config.SEARCH_FILTERS),
        "budget_filters": dict(config.BUDGET_FILTERS),
        "client_filters": dict(config.CLIENT_FILTERS),
        "keyword_blacklist": list(config.KEYWORD_BLACKLIST),
        "keyword_whitelist": list(config.KEYWORD_WHITELIST),
        "whitelist_min_score": config.FILTER_WHITELIST_MIN_SCORE,
    }

def _apply_config(data: dict):
    """Apply a config dict to runtime config module variables."""
    if "search_keywords" in data and data["search_keywords"] is not None:
        config.SEARCH_KEYWORDS = data["search_keywords"]
    if "search_filters" in data and data["search_filters"] is not None:
        config.SEARCH_FILTERS = data["search_filters"]
    if "budget_filters" in data and data["budget_filters"] is not None:
        config.BUDGET_FILTERS = data["budget_filters"]
    if "client_filters" in data and data["client_filters"] is not None:
        config.CLIENT_FILTERS = data["client_filters"]
    if "keyword_blacklist" in data and data["keyword_blacklist"] is not None:
        config.KEYWORD_BLACKLIST = data["keyword_blacklist"]
    if "keyword_whitelist" in data and data["keyword_whitelist"] is not None:
        config.KEYWORD_WHITELIST = data["keyword_whitelist"]
    if "whitelist_min_score" in data and data["whitelist_min_score"] is not None:
        config.FILTER_WHITELIST_MIN_SCORE = data["whitelist_min_score"]

def _load_active_search():
    """Load the active saved search into runtime config on startup."""
    try:
        result = exec_query(
            "SELECT * FROM saved_searches WHERE is_active = TRUE LIMIT 1",
            fetch=True
        )
        if result:
            row = dict(result[0])
            _apply_config({
                "search_keywords": json.loads(row["search_keywords"]),
                "search_filters": json.loads(row["search_filters"]),
                "budget_filters": json.loads(row["budget_filters"]),
                "client_filters": json.loads(row["client_filters"]),
                "keyword_blacklist": json.loads(row["keyword_blacklist"]),
                "keyword_whitelist": json.loads(row["keyword_whitelist"]),
                "whitelist_min_score": row["whitelist_min_score"],
            })
            logger.info(f"Loaded active saved search: {row['name']}")
    except Exception as e:
        logger.warning(f"Could not load active search: {e}")


# Initialize database on startup
@app.on_event("startup")
async def startup():
    try:
        init_db()
        logger.info("Database initialized")
    except Exception as e:
        logger.warning(f"Database init warning: {e}")
    _load_active_search()

# ============================================================================
# Config Endpoints
# ============================================================================

@app.get("/api/config")
def get_config():
    """Return current runtime config."""
    return _get_runtime_config()

@app.put("/api/config")
def update_config(update: ConfigUpdate):
    """Update runtime config in memory."""
    _apply_config(update.model_dump(exclude_none=True))
    logger.info("Runtime config updated")
    return _get_runtime_config()

# ============================================================================
# Saved Searches CRUD
# ============================================================================

@app.get("/api/searches")
def list_searches():
    """List all saved searches."""
    result = exec_query(
        "SELECT * FROM saved_searches ORDER BY updated_at DESC",
        fetch=True
    )
    return {"searches": [dict(row) for row in result]}

@app.post("/api/searches")
def create_search(body: SavedSearchCreate):
    """Create a new saved search. Snapshots current config for omitted fields."""
    current = _get_runtime_config()
    data = body.model_dump()
    for key in ["search_keywords", "search_filters", "budget_filters",
                "client_filters", "keyword_blacklist", "keyword_whitelist"]:
        if data[key] is None:
            data[key] = current[key]
    if data["whitelist_min_score"] is None:
        data["whitelist_min_score"] = current["whitelist_min_score"]

    exec_query(
        """INSERT INTO saved_searches
           (name, search_keywords, search_filters, budget_filters,
            client_filters, keyword_blacklist, keyword_whitelist, whitelist_min_score)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
        (
            data["name"],
            json.dumps(data["search_keywords"]),
            json.dumps(data["search_filters"]),
            json.dumps(data["budget_filters"]),
            json.dumps(data["client_filters"]),
            json.dumps(data["keyword_blacklist"]),
            json.dumps(data["keyword_whitelist"]),
            data["whitelist_min_score"],
        )
    )
    logger.info(f"Created saved search: {data['name']}")
    return {"status": "created", "name": data["name"]}

@app.put("/api/searches/{search_id}")
def update_search(search_id: int, body: SavedSearchUpdate):
    """Update a saved search."""
    existing = exec_query(
        "SELECT * FROM saved_searches WHERE id = ?", (search_id,), fetch=True
    )
    if not existing:
        raise HTTPException(status_code=404, detail="Search not found")

    row = dict(existing[0])
    data = body.model_dump(exclude_none=True)

    if "name" in data:
        row["name"] = data["name"]
    for key in ["search_keywords", "search_filters", "budget_filters",
                "client_filters", "keyword_blacklist", "keyword_whitelist"]:
        if key in data:
            row[key] = json.dumps(data[key])
    if "whitelist_min_score" in data:
        row["whitelist_min_score"] = data["whitelist_min_score"]

    exec_query(
        """UPDATE saved_searches SET name = ?, search_keywords = ?, search_filters = ?,
           budget_filters = ?, client_filters = ?, keyword_blacklist = ?,
           keyword_whitelist = ?, whitelist_min_score = ?, updated_at = ?
           WHERE id = ?""",
        (
            row["name"], row["search_keywords"], row["search_filters"],
            row["budget_filters"], row["client_filters"], row["keyword_blacklist"],
            row["keyword_whitelist"], row["whitelist_min_score"],
            datetime.now(), search_id
        )
    )
    return {"status": "updated"}

@app.delete("/api/searches/{search_id}")
def delete_search(search_id: int):
    """Delete a saved search."""
    exec_query("DELETE FROM saved_searches WHERE id = ?", (search_id,))
    return {"status": "deleted"}

@app.post("/api/searches/{search_id}/activate")
def activate_search(search_id: int):
    """Load a saved search into runtime config and mark it active."""
    result = exec_query(
        "SELECT * FROM saved_searches WHERE id = ?", (search_id,), fetch=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="Search not found")

    # Deactivate all, then activate this one
    exec_query("UPDATE saved_searches SET is_active = FALSE")
    exec_query("UPDATE saved_searches SET is_active = TRUE WHERE id = ?", (search_id,))

    row = dict(result[0])
    _apply_config({
        "search_keywords": json.loads(row["search_keywords"]),
        "search_filters": json.loads(row["search_filters"]),
        "budget_filters": json.loads(row["budget_filters"]),
        "client_filters": json.loads(row["client_filters"]),
        "keyword_blacklist": json.loads(row["keyword_blacklist"]),
        "keyword_whitelist": json.loads(row["keyword_whitelist"]),
        "whitelist_min_score": row["whitelist_min_score"],
    })
    logger.info(f"Activated saved search: {row['name']}")
    return {"status": "activated", "name": row["name"]}

# ============================================================================
# Filter Transparency Endpoints
# ============================================================================

@app.get("/api/jobs/filtered")
def get_filtered_jobs(reason: str = None, limit: int = 50, offset: int = 0):
    """Get filtered-out jobs with reasons and reason count breakdown."""
    # Reason breakdown
    reason_counts = exec_query(
        """SELECT filter_reason, COUNT(*) as count FROM jobs
           WHERE status = 'filtered_out' AND filter_reason IS NOT NULL
           GROUP BY filter_reason ORDER BY count DESC""",
        fetch=True
    )

    # Filtered jobs
    if reason:
        jobs = exec_query(
            """SELECT * FROM jobs WHERE status = 'filtered_out' AND filter_reason = ?
               ORDER BY fetched_at DESC LIMIT ? OFFSET ?""",
            (reason, limit, offset),
            fetch=True
        )
    else:
        jobs = exec_query(
            """SELECT * FROM jobs WHERE status = 'filtered_out'
               ORDER BY fetched_at DESC LIMIT ? OFFSET ?""",
            (limit, offset),
            fetch=True
        )

    return {
        "jobs": [dict(row) for row in jobs],
        "reason_counts": {row["filter_reason"]: row["count"] for row in reason_counts},
        "total": sum(row["count"] for row in reason_counts),
    }

@app.post("/api/jobs/{job_id}/refilter")
def refilter_job(job_id: str):
    """Re-evaluate a single job against current filters."""
    # Reset to 'new' so filter_job can re-evaluate
    exec_query(
        "UPDATE jobs SET status = 'new', filter_reason = NULL, filter_score = 0 WHERE id = ?",
        (job_id,)
    )
    passed = filter_job(job_id)
    # Get updated job
    result = exec_query("SELECT * FROM jobs WHERE id = ?", (job_id,), fetch=True)
    return {"passed": passed, "job": dict(result[0]) if result else None}

@app.post("/api/jobs/refilter-all")
def refilter_all_jobs():
    """Re-evaluate all filtered-out jobs against current filters."""
    # Reset all filtered jobs to 'new'
    exec_query(
        "UPDATE jobs SET status = 'new', filter_reason = NULL, filter_score = 0 WHERE status = 'filtered_out'"
    )
    passed, filtered = filter_all_new_jobs()
    return {"passed": passed, "filtered": filtered}

# ============================================================================
# Saved Jobs
# ============================================================================

@app.get("/api/jobs/saved")
def get_saved_jobs(limit: int = 50):
    """Get all saved/bookmarked jobs."""
    result = exec_query(
        """SELECT j.*, p.id as proposal_id, p.status as proposal_status
           FROM jobs j
           LEFT JOIN proposals p ON j.id = p.job_id
           WHERE j.is_saved = TRUE
           ORDER BY j.fetched_at DESC LIMIT ?""",
        (limit,),
        fetch=True
    )
    return {"jobs": [dict(row) for row in result]}

@app.post("/api/jobs/{job_id}/save")
def save_job(job_id: str):
    """Save/bookmark a job."""
    exec_query("UPDATE jobs SET is_saved = TRUE WHERE id = ?", (job_id,))
    return {"status": "saved"}

@app.post("/api/jobs/{job_id}/unsave")
def unsave_job(job_id: str):
    """Remove a job from saved."""
    exec_query("UPDATE jobs SET is_saved = FALSE WHERE id = ?", (job_id,))
    return {"status": "unsaved"}

# ============================================================================
# Feed (combined Best Matches + Most Recent + Saved Jobs)
# ============================================================================

@app.get("/api/jobs/feed")
def get_feed_jobs(source: str = None, limit: int = 100):
    """Get jobs from feed sources (best-matches, most-recent, saved-jobs) for browsing."""
    feed_sources = ("best-matches", "most-recent", "saved-jobs")
    if source and source in feed_sources:
        jobs = exec_query(
            """SELECT j.*, p.id as proposal_id, p.status as proposal_status
               FROM jobs j
               LEFT JOIN proposals p ON j.id = p.job_id
               WHERE j.feed_source = ?
               ORDER BY j.fetched_at DESC LIMIT ?""",
            (source, limit),
            fetch=True
        )
    else:
        placeholders = ",".join(["?"] * len(feed_sources))
        jobs = exec_query(
            f"""SELECT j.*, p.id as proposal_id, p.status as proposal_status
                FROM jobs j
                LEFT JOIN proposals p ON j.id = p.job_id
                WHERE j.feed_source IN ({placeholders})
                ORDER BY j.fetched_at DESC LIMIT ?""",
            (*feed_sources, limit),
            fetch=True
        )

    # Source counts for filter pills
    counts = exec_query(
        f"""SELECT feed_source, COUNT(*) as count FROM jobs
            WHERE feed_source IN ({",".join(["?"] * len(feed_sources))})
            GROUP BY feed_source""",
        feed_sources,
        fetch=True
    )

    return {
        "jobs": [dict(row) for row in jobs],
        "source_counts": {row["feed_source"]: row["count"] for row in counts},
        "total": sum(row["count"] for row in counts),
    }

# ============================================================================
# Existing API Routes
# ============================================================================

@app.get("/api/jobs")
def get_jobs(status: str = None, limit: int = 50):
    """Get all jobs, optionally filtered by status."""
    if status:
        result = exec_query(
            "SELECT * FROM jobs WHERE status = ? ORDER BY posted_at DESC LIMIT ?",
            (status, limit),
            fetch=True
        )
    else:
        result = exec_query(
            "SELECT * FROM jobs ORDER BY posted_at DESC LIMIT ?",
            (limit,),
            fetch=True
        )

    return [dict(row) for row in result]

@app.get("/api/jobs/{job_id}")
def get_job(job_id: str):
    """Get a single job by ID."""
    result = exec_query(
        "SELECT * FROM jobs WHERE id = ?",
        (job_id,),
        fetch=True
    )

    if not result:
        raise HTTPException(status_code=404, detail="Job not found")

    return dict(result[0])

@app.get("/api/queue")
def get_proposal_queue(limit: int = 50):
    """Get all pending proposals (review queue)."""
    result = exec_query(
        """SELECT p.id, p.job_id, p.proposal_text, p.status, p.generated_at,
                  j.title, j.budget, j.url
           FROM proposals p
           JOIN jobs j ON p.job_id = j.id
           WHERE p.status = 'pending'
           ORDER BY p.generated_at DESC
           LIMIT ?""",
        (limit,),
        fetch=True
    )

    return [dict(row) for row in result]

@app.get("/api/proposal/{proposal_id}")
def get_proposal(proposal_id: int):
    """Get a single proposal detail."""
    result = exec_query(
        """SELECT p.*, j.title, j.url, j.description, j.budget
           FROM proposals p
           JOIN jobs j ON p.job_id = j.id
           WHERE p.id = ?""",
        (proposal_id,),
        fetch=True
    )

    if not result:
        raise HTTPException(status_code=404, detail="Proposal not found")

    return dict(result[0])

@app.post("/api/proposal/{proposal_id}/approve")
def approve_proposal(proposal_id: int):
    """Mark a proposal as approved."""
    exec_query(
        "UPDATE proposals SET status = 'approved', approved_at = ? WHERE id = ?",
        (datetime.now(), proposal_id)
    )
    logger.info(f"Approved proposal {proposal_id}")
    return {"status": "approved"}

@app.post("/api/proposal/{proposal_id}/reject")
def reject_proposal(proposal_id: int):
    """Mark a proposal as rejected."""
    exec_query(
        "UPDATE proposals SET status = 'rejected' WHERE id = ?",
        (proposal_id,)
    )
    logger.info(f"Rejected proposal {proposal_id}")
    return {"status": "rejected"}

@app.put("/api/proposal/{proposal_id}")
def update_proposal(proposal_id: int, proposal_text: str):
    """Update proposal text (edit before approving)."""
    exec_query(
        "UPDATE proposals SET proposal_text = ? WHERE id = ?",
        (proposal_text, proposal_id)
    )
    logger.info(f"Updated proposal {proposal_id}")
    return {"status": "updated"}

@app.get("/api/stats")
def get_stats():
    """Get dashboard statistics."""
    def _count(query, params=None):
        r = exec_query(query, params, fetch=True)
        return r[0]['count'] if r else 0

    today = datetime.now().strftime("%Y-%m-%d")
    return {
        "new_jobs": _count("SELECT COUNT(*) as count FROM jobs WHERE status = 'new'"),
        "filtered_out": _count("SELECT COUNT(*) as count FROM jobs WHERE status = 'filtered_out'"),
        "pending_proposal": _count("SELECT COUNT(*) as count FROM jobs WHERE status = 'pending_proposal'"),
        "proposal_ready": _count("SELECT COUNT(*) as count FROM jobs WHERE status = 'proposal_ready'"),
        "proposals_pending": _count("SELECT COUNT(*) as count FROM proposals WHERE status = 'pending'"),
        "proposals_approved": _count("SELECT COUNT(*) as count FROM proposals WHERE status = 'approved'"),
        "proposals_sent": _count("SELECT COUNT(*) as count FROM proposals WHERE status = 'sent'"),
        "jobs_fetched_today": _count("SELECT COUNT(*) as count FROM jobs WHERE date(fetched_at) = ?", (today,)),
        "proposals_generated_today": _count("SELECT COUNT(*) as count FROM proposals WHERE date(generated_at) = ?", (today,)),
    }

@app.get("/api/proposals")
def get_proposals(status: str = "pending", limit: int = 50):
    """Get proposals filtered by status."""
    result = exec_query(
        """SELECT p.id, p.job_id, p.proposal_text, p.status, p.generated_at,
                  j.title, j.budget, j.url, j.description, j.client_country, j.client_spent
           FROM proposals p
           JOIN jobs j ON p.job_id = j.id
           WHERE p.status = ?
           ORDER BY p.generated_at DESC
           LIMIT ?""",
        (status, limit),
        fetch=True,
    )
    return {"proposals": [dict(row) for row in result]}

@app.post("/api/scrape-feed/{source}")
def scrape_feed_endpoint(source: str):
    """Scrape jobs from an Upwork feed page and run them through filters.

    source: 'best-matches' or 'most-recent'
    """
    if source not in ("best-matches", "most-recent", "saved-jobs"):
        raise HTTPException(status_code=400, detail="source must be 'best-matches', 'most-recent', or 'saved-jobs'")

    logger.info(f"Scraping feed: {source}")
    try:
        new_jobs = scrape_feed(source)
        passed, filtered = filter_all_new_jobs()
        generated = generate_all_pending()
        return {
            "status": "success",
            "source": source,
            "new_jobs": new_jobs,
            "jobs_filtered": {"passed": passed, "filtered": filtered},
            "proposals_generated": generated,
        }
    except Exception as e:
        logger.error(f"Feed scrape failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/run-cycle")
def run_cycle():
    """Manually trigger a full fetch + filter + generate cycle."""
    logger.info("Starting manual cycle...")

    try:
        # Fetch
        scrape_jobs()

        # Filter
        passed, filtered = filter_all_new_jobs()

        # Generate
        generated = generate_all_pending()

        return {
            "status": "success",
            "jobs_filtered": {"passed": passed, "filtered": filtered},
            "proposals_generated": generated,
        }
    except Exception as e:
        logger.error(f"Cycle failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/export-approved")
def export_approved():
    """Export all approved proposals."""
    try:
        count = export_approved_proposals()
        return {"status": "success", "exported": count}
    except Exception as e:
        logger.error(f"Export failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/submit-approved")
def submit_approved():
    """Auto-submit all approved proposals via browser."""
    from modules.auto_submit import submit_approved_proposals
    try:
        count = submit_approved_proposals()
        return {"status": "success", "submitted": count}
    except Exception as e:
        logger.error(f"Submit failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/submit/{proposal_id}")
def submit_single(proposal_id: int):
    """Auto-submit a single approved proposal via browser."""
    from modules.auto_submit import submit_single_proposal
    try:
        success = submit_single_proposal(proposal_id)
        return {"status": "submitted" if success else "failed"}
    except Exception as e:
        logger.error(f"Submit failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "ok"}

# Serve dashboard static files (must be after API routes)
app.mount("/dashboard", StaticFiles(directory="dashboard", html=True), name="dashboard")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=config.API_HOST, port=config.API_PORT)
