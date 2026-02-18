"""FastAPI Backend for Upwork Auto-Apply System."""

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

# Initialize database on startup
@app.on_event("startup")
async def startup():
    try:
        init_db()
        logger.info("✅ Database initialized")
    except Exception as e:
        logger.warning(f"Database already initialized: {e}")

# ============================================================================
# API Routes
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
    logger.info(f"✅ Approved proposal {proposal_id}")
    return {"status": "approved"}

@app.post("/api/proposal/{proposal_id}/reject")
def reject_proposal(proposal_id: int):
    """Mark a proposal as rejected."""
    exec_query(
        "UPDATE proposals SET status = 'rejected' WHERE id = ?",
        (proposal_id,)
    )
    logger.info(f"❌ Rejected proposal {proposal_id}")
    return {"status": "rejected"}

@app.put("/api/proposal/{proposal_id}")
def update_proposal(proposal_id: int, proposal_text: str):
    """Update proposal text (edit before approving)."""
    exec_query(
        "UPDATE proposals SET proposal_text = ? WHERE id = ?",
        (proposal_text, proposal_id)
    )
    logger.info(f"✏️  Updated proposal {proposal_id}")
    return {"status": "updated"}

@app.get("/api/stats")
def get_stats():
    """Get dashboard statistics."""
    today = datetime.now().strftime("%Y-%m-%d")
    
    # Jobs fetched today
    jobs_today = exec_query(
        "SELECT COUNT(*) as count FROM jobs WHERE date(fetched_at) = ?",
        (today,),
        fetch=True
    )[0]['count']
    
    # Proposals generated today
    proposals_today = exec_query(
        "SELECT COUNT(*) as count FROM proposals WHERE date(generated_at) = ?",
        (today,),
        fetch=True
    )[0]['count']
    
    # Proposals sent (all time)
    proposals_sent = exec_query(
        "SELECT COUNT(*) as count FROM proposals WHERE status = 'sent'",
        fetch=True
    )[0]['count']
    
    # Jobs filtered out
    filtered_out = exec_query(
        "SELECT COUNT(*) as count FROM jobs WHERE status = 'filtered_out'",
        fetch=True
    )[0]['count']
    
    # Pending proposals
    pending = exec_query(
        "SELECT COUNT(*) as count FROM proposals WHERE status = 'pending'",
        fetch=True
    )[0]['count']
    
    return {
        "jobs_fetched_today": jobs_today,
        "proposals_generated_today": proposals_today,
        "proposals_sent_all_time": proposals_sent,
        "jobs_filtered_out": filtered_out,
        "proposals_pending_review": pending,
    }

@app.post("/api/run-cycle")
def run_cycle():
    """Manually trigger a full fetch + filter + generate cycle."""
    logger.info("🚀 Starting manual cycle...")
    
    try:
        # Fetch
        monitor_feeds()
        
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

@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=config.API_HOST, port=config.API_PORT)
