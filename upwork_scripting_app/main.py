"""FastAPI Backend for Fully Autonomous Upwork System."""

import logging
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from db.database import init_db, exec_query
from modules.autonomous_scheduler import (
    start_scheduler, stop_scheduler, run_cycle_once, get_autonomous_stats
)
import config

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Autonomous Upwork System")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database on startup
@app.on_event("startup")
async def startup():
    try:
        init_db()
        logger.info("✅ Database initialized")
        
        # Start the autonomous scheduler
        start_scheduler(interval_minutes=30)
        logger.info("🤖 Autonomous scheduler started")
    except Exception as e:
        logger.warning(f"Database already initialized: {e}")

@app.on_event("shutdown")
async def shutdown():
    stop_scheduler()
    logger.info("⏹️  Autonomous scheduler stopped")

# ============================================================================
# Autonomous Operations
# ============================================================================

@app.get("/api/autonomous/status")
def get_status():
    """Get status of autonomous operations."""
    stats = get_autonomous_stats()
    return {
        "status": "running",
        "stats": stats,
        "description": "Fully autonomous: fetch → filter → generate → approve → submit"
    }

@app.post("/api/autonomous/run-cycle")
def trigger_cycle():
    """Manually trigger one autonomous cycle."""
    try:
        run_cycle_once()
        return {"status": "cycle_complete"}
    except Exception as e:
        logger.error(f"Cycle failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/autonomous/configure")
def configure_upwork(email: str = None, password: str = None):
    """Configure Upwork credentials for auto-submission."""
    import os
    
    if email:
        os.environ["UPWORK_EMAIL"] = email
    if password:
        os.environ["UPWORK_PASSWORD"] = password
    
    return {
        "status": "configured",
        "email_set": bool(email or os.getenv("UPWORK_EMAIL")),
        "password_set": bool(password or os.getenv("UPWORK_PASSWORD")),
        "note": "Auto-submission will be enabled on next cycle"
    }

# ============================================================================
# Manual Controls (Optional - for user intervention)
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

@app.get("/api/queue")
def get_proposal_queue(limit: int = 50):
    """Get pending proposals (review queue - optional manual override)."""
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

@app.post("/api/proposal/{proposal_id}/approve")
def approve_proposal(proposal_id: int):
    """Manual approval override (usually auto-approved)."""
    exec_query(
        "UPDATE proposals SET status = 'approved', approved_at = ? WHERE id = ?",
        (datetime.now(), proposal_id)
    )
    logger.info(f"✅ Manually approved proposal {proposal_id}")
    return {"status": "approved"}

@app.get("/api/stats")
def get_stats():
    """Get system statistics."""
    today = datetime.now().strftime("%Y-%m-%d")
    
    jobs_today = exec_query(
        "SELECT COUNT(*) as count FROM jobs WHERE date(fetched_at) = ?",
        (today,),
        fetch=True
    )[0]['count']
    
    proposals_today = exec_query(
        "SELECT COUNT(*) as count FROM proposals WHERE date(generated_at) = ?",
        (today,),
        fetch=True
    )[0]['count']
    
    proposals_sent = exec_query(
        "SELECT COUNT(*) as count FROM proposals WHERE status = 'sent'",
        fetch=True
    )[0]['count']
    
    proposals_approved = exec_query(
        "SELECT COUNT(*) as count FROM proposals WHERE status = 'approved'",
        fetch=True
    )[0]['count']
    
    return {
        "jobs_fetched_today": jobs_today,
        "proposals_generated_today": proposals_today,
        "proposals_approved": proposals_approved,
        "proposals_sent_all_time": proposals_sent,
        "autonomous_mode": True
    }

@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "ok", "mode": "autonomous"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=config.API_HOST, port=config.API_PORT)
