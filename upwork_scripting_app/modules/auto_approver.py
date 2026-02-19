"""Auto-Approval Engine - Approves high-confidence proposals without human review."""

import logging
from db.database import exec_query
import config

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Thresholds for auto-approval (configurable)
AUTO_APPROVE_SCORE = 7  # Min filter score to auto-approve (0-10)
AUTO_APPROVE_BUDGET_MIN = 250  # Don't auto-approve tiny jobs
AUTO_APPROVE_MAX_PER_DAY = 15  # Safety limit (leave some for manual review)

def extract_budget_amount(budget_str):
    """Extract numeric budget for filtering."""
    import re
    if not budget_str:
        return 0
    match = re.search(r'\d+', budget_str.replace(',', ''))
    return int(match.group()) if match else 0

def should_auto_approve(proposal_id):
    """Determine if a proposal should be auto-approved."""
    
    # Get proposal + job details
    result = exec_query(
        """SELECT p.id, p.job_id, p.status, j.budget, j.filter_score
           FROM proposals p
           JOIN jobs j ON p.job_id = j.id
           WHERE p.id = ?""",
        (proposal_id,),
        fetch=True
    )
    
    if not result:
        return False
    
    proposal = result[0]
    
    # Skip if already approved/rejected/sent
    if proposal['status'] != 'pending':
        return False
    
    # Check score threshold
    score = proposal['filter_score'] or 0
    if score < AUTO_APPROVE_SCORE:
        logger.info(f"Proposal {proposal_id}: score {score} < threshold {AUTO_APPROVE_SCORE}")
        return False
    
    # Check budget threshold
    budget_amount = extract_budget_amount(proposal['budget'] or '')
    if budget_amount < AUTO_APPROVE_BUDGET_MIN:
        logger.info(f"Proposal {proposal_id}: budget ${budget_amount} < min ${AUTO_APPROVE_BUDGET_MIN}")
        return False
    
    return True

def auto_approve_pending():
    """Auto-approve all pending proposals that meet criteria."""
    
    logger.info("🤖 Starting auto-approval cycle...")
    
    # Get all pending proposals
    pending = exec_query(
        """SELECT p.id, j.title, j.filter_score, j.budget
           FROM proposals p
           JOIN jobs j ON p.job_id = j.id
           WHERE p.status = 'pending'
           ORDER BY j.filter_score DESC
           LIMIT ?""",
        (AUTO_APPROVE_MAX_PER_DAY,),
        fetch=True
    )
    
    if not pending:
        logger.info("✅ No pending proposals to review")
        return 0
    
    approved = 0
    
    for proposal in pending:
        if should_auto_approve(proposal['id']):
            # Approve it
            from datetime import datetime
            exec_query(
                "UPDATE proposals SET status = 'approved', approved_at = ? WHERE id = ?",
                (datetime.now(), proposal['id'])
            )
            approved += 1
            logger.info(f"✅ Auto-approved (score {proposal['filter_score']}): {proposal['title'][:50]}")
        else:
            logger.info(f"⏳ Held for review (score {proposal['filter_score']}): {proposal['title'][:50]}")
    
    logger.info(f"📊 Auto-approval complete: {approved}/{len(pending)} approved")
    return approved

if __name__ == "__main__":
    auto_approve_pending()
