import feedparser
import logging
from datetime import datetime
from db.database import exec_query
import config

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def fetch_feed(feed_url):
    try:
        feed = feedparser.parse(feed_url)
        return feed
    except Exception as e:
        logger.error(f"Error fetching feed {feed_url}: {e}")
        return None

def extract_job_from_entry(entry):
    try:
        job_id = entry.get('id', '').split('/')[-1]
        return {
            'id': job_id,
            'title': entry.get('title', ''),
            'description': entry.get('summary', '')[:500],
            'budget': entry.get('budget', None),
            'category': entry.get('category', 'General'),
            'url': entry.get('link', ''),
            'posted_at': datetime(*entry.published_parsed[:6]) if hasattr(entry, 'published_parsed') else datetime.now(),
        }
    except Exception as e:
        logger.error(f"Error extracting job: {e}")
        return None

def job_exists(job_id):
    result = exec_query("SELECT id FROM jobs WHERE id = ?", (job_id,), fetch=True)
    return len(result) > 0

def insert_job(job_data):
    exec_query(
        "INSERT INTO jobs (id, title, description, budget, category, url, posted_at, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'new')",
        (job_data['id'], job_data['title'], job_data['description'], job_data['budget'], job_data['category'], job_data['url'], job_data['posted_at'])
    )

def monitor_feeds():
    logger.info("🔄 Starting feed monitor cycle...")
    total_new = 0
    for feed_url in config.UPWORK_FEEDS:
        logger.info(f"📡 Fetching: {feed_url[:50]}...")
        feed = fetch_feed(feed_url)
        if not feed:
            continue
        
        new_jobs = 0
        for entry in feed.entries:
            job_data = extract_job_from_entry(entry)
            if not job_data:
                continue
            if not job_exists(job_data['id']):
                insert_job(job_data)
                new_jobs += 1
        
        total_new += new_jobs
        logger.info(f"✅ Found {new_jobs} new jobs")
    
    logger.info(f"📊 Total new jobs: {total_new}")
    return total_new
