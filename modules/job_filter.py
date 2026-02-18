"""Job Filter Engine - Scores and filters jobs based on criteria."""

import logging
import re
from db.database import exec_query
import config

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def extract_budget_amount(budget_str):
    """Extract numeric budget from string like '$150-300', '$50/hr', etc."""
    if not budget_str:
        return None
    
    # Extract first number found
    match = re.search(r'\d+', budget_str.replace(',', ''))
    if match:
        return int(match.group())
    return None

def is_budget_acceptable(budget_str):
    """Check if budget meets minimum thresholds."""
    if not budget_str:
        return config.BUDGET_FILTERS['allow_no_budget']
    
    amount = extract_budget_amount(budget_str)
    if not amount:
        return config.BUDGET_FILTERS['allow_no_budget']
    
    # Determine if fixed or hourly (simple heuristic)
    if '/hr' in budget_str.lower():
        return amount >= config.BUDGET_FILTERS['hourly_min']
    else:
        return amount >= config.BUDGET_FILTERS['fixed_min']

def check_blacklist(title, description):
    """Return True if job matches any blacklist keyword."""
    full_text = (title + " " + description).lower()
    
    for keyword in config.KEYWORD_BLACKLIST:
        if keyword.lower() in full_text:
            return True
    return False

def score_whitelist(title, description):
    """Score job based on whitelist keyword hits."""
    full_text = (title + " " + description).lower()
    score = 0
    
    for keyword in config.KEYWORD_WHITELIST:
        if keyword.lower() in full_text:
            score += 1
    
    return score

def filter_job(job_id):
    """Filter a single job and update its status and score."""
    # Get job from DB
    result = exec_query(
        "SELECT id, title, description, budget FROM jobs WHERE id = ?",
        (job_id,),
        fetch=True
    )
    
    if not result:
        logger.warning(f"Job {job_id} not found")
        return False
    
    job = result[0]
    
    # Check blacklist
    if check_blacklist(job['title'], job['description'] or ''):
        exec_query(
            "UPDATE jobs SET status = 'filtered_out', filter_reason = 'blacklist_match' WHERE id = ?",
            (job_id,)
        )
        logger.info(f"❌ Filtered out (blacklist): {job['title'][:50]}")
        return False
    
    # Check budget
    if not is_budget_acceptable(job['budget']):
        exec_query(
            "UPDATE jobs SET status = 'filtered_out', filter_reason = 'low_budget' WHERE id = ?",
            (job_id,)
        )
        logger.info(f"❌ Filtered out (budget): {job['title'][:50]}")
        return False
    
    # Score whitelist
    score = score_whitelist(job['title'], job['description'] or '')
    
    if score >= config.FILTER_WHITELIST_MIN_SCORE:
        exec_query(
            "UPDATE jobs SET status = 'pending_proposal', filter_score = ? WHERE id = ?",
            (score, job_id)
        )
        logger.info(f"✅ Passed filter (score {score}): {job['title'][:50]}")
        return True
    else:
        exec_query(
            "UPDATE jobs SET status = 'filtered_out', filter_reason = 'low_score', filter_score = ? WHERE id = ?",
            (score, job_id)
        )
        logger.info(f"❌ Filtered out (score {score}): {job['title'][:50]}")
        return False

def filter_all_new_jobs():
    """Filter all jobs with status='new'."""
    logger.info("🔍 Starting job filter...")
    
    # Get all new jobs
    new_jobs = exec_query(
        "SELECT id FROM jobs WHERE status = 'new' ORDER BY posted_at DESC",
        fetch=True
    )
    
    passed = 0
    filtered = 0
    
    for job in new_jobs:
        if filter_job(job['id']):
            passed += 1
        else:
            filtered += 1
    
    logger.info(f"📊 Filter complete: {passed} passed, {filtered} filtered out")
    return passed, filtered

if __name__ == "__main__":
    filter_all_new_jobs()
