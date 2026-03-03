"""RSS Feed Monitor - Polls Upwork feeds for new jobs."""

import feedparser
import logging
from datetime import datetime
from db.database import exec_query, get_db
import config

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def fetch_feed(feed_url):
    """Fetch and parse RSS feed."""
    try:
        feed = feedparser.parse(feed_url)
        if feed.bozo:
            logger.warning(f"Feed parsing error: {feed.bozo_exception}")
        return feed
    except Exception as e:
        logger.error(f"Error fetching feed {feed_url}: {e}")
        return None

def extract_job_from_entry(entry):
    """Extract job data from RSS entry."""
    try:
        job_id = entry.get('id', '').split('/')[-1]  # Extract ID from URL
        
        return {
            'id': job_id,
            'title': entry.get('title', ''),
            'description': entry.get('summary', '')[:500],  # Truncate description
            'budget': entry.get('budget', None),
            'category': entry.get('category', 'General'),
            'url': entry.get('link', ''),
            'posted_at': datetime(*entry.published_parsed[:6]) if hasattr(entry, 'published_parsed') else datetime.now(),
        }
    except Exception as e:
        logger.error(f"Error extracting job from entry: {e}")
        return None

def job_exists(job_id):
    """Check if job already in database."""
    result = exec_query(
        "SELECT id FROM jobs WHERE id = ?",
        (job_id,),
        fetch=True
    )
    return len(result) > 0

def insert_job(job_data):
    """Insert new job into database."""
    exec_query(
        """INSERT INTO jobs (id, title, description, budget, category, url, posted_at, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'new')""",
        (job_data['id'], job_data['title'], job_data['description'],
         job_data['budget'], job_data['category'], job_data['url'], job_data['posted_at'])
    )

def log_feed_fetch(feed_url, new_jobs, duplicates, errors=None):
    """Log feed fetch cycle."""
    exec_query(
        "INSERT INTO feed_log (feed_url, new_jobs, duplicates, errors) VALUES (?, ?, ?, ?)",
        (feed_url, new_jobs, duplicates, errors)
    )

def monitor_feeds():
    """Poll all configured Upwork feeds for new jobs."""
    logger.info("🔄 Starting feed monitor cycle...")
    
    for feed_url in config.UPWORK_FEEDS:
        logger.info(f"📡 Fetching: {feed_url}")
        feed = fetch_feed(feed_url)
        
        if not feed:
            log_feed_fetch(feed_url, 0, 0, "Failed to fetch feed")
            continue
        
        new_jobs = 0
        duplicates = 0
        
        for entry in feed.entries:
            job_data = extract_job_from_entry(entry)
            if not job_data:
                continue
            
            if job_exists(job_data['id']):
                duplicates += 1
            else:
                insert_job(job_data)
                new_jobs += 1
                logger.info(f"✅ New job: {job_data['title'][:50]}...")
        
        log_feed_fetch(feed_url, new_jobs, duplicates)
        logger.info(f"📊 Feed summary: {new_jobs} new, {duplicates} duplicates")
    
    logger.info("✨ Feed monitor cycle complete")
    return True

if __name__ == "__main__":
    monitor_feeds()
