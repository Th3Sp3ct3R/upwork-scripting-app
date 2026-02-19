"""Autonomous Scheduler - Full end-to-end automation without human intervention."""

import logging
import asyncio
import os
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from modules.feed_monitor import monitor_feeds
from modules.job_filter import filter_all_new_jobs
from modules.proposal_generator import generate_all_pending
from modules.auto_approver import auto_approve_pending
from modules.playwright_submitter import submit_approved_proposals
from db.database import exec_query

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

scheduler = BackgroundScheduler()

# ============================================================================
# Autonomous Cycle
# ============================================================================

async def run_full_cycle():
    """Run the complete autonomous cycle: fetch → filter → generate → approve → submit."""
    
    logger.info("=" * 60)
    logger.info("🚀 AUTONOMOUS UPWORK CYCLE STARTED")
    logger.info("=" * 60)
    
    try:
        # Step 1: Fetch new jobs from RSS
        logger.info("\n📡 STEP 1: Fetching jobs from Upwork RSS feeds...")
        monitor_feeds()
        
        # Step 2: Filter jobs by budget + keywords
        logger.info("\n🔍 STEP 2: Filtering jobs...")
        passed, filtered = filter_all_new_jobs()
        
        # Step 3: Generate proposals with Claude
        logger.info("\n🤖 STEP 3: Generating proposals...")
        generated = generate_all_pending()
        
        # Step 4: Auto-approve high-confidence proposals
        logger.info("\n✅ STEP 4: Auto-approving proposals...")
        approved = auto_approve_pending()
        
        # Step 5: Submit approved proposals to Upwork (optional - requires credentials)
        logger.info("\n📤 STEP 5: Submitting to Upwork...")
        submitted = await submit_approved_if_configured()
        
        # Log summary
        logger.info("\n" + "=" * 60)
        logger.info("📊 CYCLE SUMMARY")
        logger.info("=" * 60)
        logger.info(f"  Jobs fetched: 📡")
        logger.info(f"  Jobs filtered: {passed} passed, {filtered} rejected")
        logger.info(f"  Proposals generated: {generated}")
        logger.info(f"  Proposals auto-approved: {approved}")
        logger.info(f"  Proposals submitted: {submitted}")
        logger.info("=" * 60 + "\n")
        
    except Exception as e:
        logger.error(f"❌ Cycle failed: {e}", exc_info=True)

async def submit_approved_if_configured():
    """Submit proposals only if Upwork credentials are configured."""
    
    email = os.getenv("UPWORK_EMAIL")
    password = os.getenv("UPWORK_PASSWORD")
    
    if not email or not password:
        logger.info("⏭️  Skipping submission (UPWORK_EMAIL/PASSWORD not set)")
        return 0
    
    try:
        submitted = await submit_approved_proposals(email, password, limit=5, headless=True)
        return submitted
    except Exception as e:
        logger.warning(f"⚠️  Submission skipped: {e}")
        return 0

def start_scheduler(interval_minutes: int = 30):
    """Start the autonomous scheduler."""
    
    if scheduler.running:
        logger.warning("⚠️  Scheduler already running")
        return
    
    logger.info(f"🔄 Starting autonomous scheduler (every {interval_minutes} minutes)")
    
    # Schedule the full cycle
    trigger = IntervalTrigger(minutes=interval_minutes)
    scheduler.add_job(
        lambda: asyncio.run(run_full_cycle()),
        trigger=trigger,
        id='autonomous_cycle',
        name='Autonomous Upwork Cycle'
    )
    
    scheduler.start()
    logger.info("✅ Scheduler started")

def stop_scheduler():
    """Stop the autonomous scheduler."""
    
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("⏹️  Scheduler stopped")

def run_cycle_once():
    """Run the cycle once (useful for testing/manual triggers)."""
    
    logger.info("🎯 Running single cycle...")
    asyncio.run(run_full_cycle())

# ============================================================================
# Stats & Monitoring
# ============================================================================

def get_autonomous_stats():
    """Get stats about the autonomous operation."""
    
    total_jobs = exec_query("SELECT COUNT(*) as count FROM jobs", fetch=True)[0]['count']
    total_proposals = exec_query("SELECT COUNT(*) as count FROM proposals", fetch=True)[0]['count']
    sent_proposals = exec_query("SELECT COUNT(*) as count FROM proposals WHERE status = 'sent'", fetch=True)[0]['count']
    pending_proposals = exec_query("SELECT COUNT(*) as count FROM proposals WHERE status = 'pending'", fetch=True)[0]['count']
    approved_proposals = exec_query("SELECT COUNT(*) as count FROM proposals WHERE status = 'approved'", fetch=True)[0]['count']
    
    return {
        "total_jobs": total_jobs,
        "total_proposals": total_proposals,
        "proposals_sent": sent_proposals,
        "proposals_approved_pending_submission": approved_proposals,
        "proposals_in_review": pending_proposals,
        "scheduler_running": scheduler.running
    }

if __name__ == "__main__":
    # Test: run one cycle
    print("🚀 Testing autonomous cycle...")
    asyncio.run(run_full_cycle())
