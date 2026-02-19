"""Proposal Generator - Uses Claude API to generate custom proposals."""

import logging
import json
from datetime import datetime
from anthropic import Anthropic
from db.database import exec_query
import config

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

client = Anthropic()

SYSTEM_PROMPT = """You are writing Upwork proposals for a skilled developer. Their background:
- Built and operate large-scale automation platforms
- Expert in Python, Node.js, React, PostgreSQL, REST APIs
- Specializes in: automation systems, web scraping, data pipelines, landing pages, API integrations
- Fast executor — delivers in days not weeks

Proposal rules:
1. FIRST LINE must reference something specific from their job post
2. NO generic openers
3. Keep it under 200 words
4. Show ONE relevant past experience
5. End with a specific question about their project
6. Tone: confident, direct, no fluff

Output format (valid JSON only):
{
    "proposal": "full proposal text here",
    "opening_hook": "the first line you used",
    "relevant_experience": "what experience you highlighted"
}
"""

def count_sent_today():
    from datetime import datetime
    today = datetime.now().strftime("%Y-%m-%d")
    result = exec_query("SELECT COUNT(*) as count FROM proposals WHERE date(sent_at) = ?", (today,), fetch=True)
    return result[0]['count'] if result else 0

def generate_proposal(job_id):
    """Generate a proposal for a specific job using Claude."""
    
    if count_sent_today() >= config.LIMITS['max_proposals_per_day']:
        logger.warning(f"Daily limit reached")
        return False
    
    result = exec_query("SELECT id, title, description, budget FROM jobs WHERE id = ?", (job_id,), fetch=True)
    if not result:
        logger.error(f"Job {job_id} not found")
        return False
    
    job = result[0]
    
    existing = exec_query("SELECT id FROM proposals WHERE job_id = ?", (job_id,), fetch=True)
    if existing:
        logger.warning(f"Proposal already exists for job {job_id}")
        return False
    
    job_context = f"""
Job Title: {job['title']}
Budget: {job['budget']}
Description: {job['description']}
"""
    
    try:
        logger.info(f"🤖 Generating proposal for: {job['title'][:50]}...")
        
        response = client.messages.create(
            model=config.CLAUDE_MODEL,
            max_tokens=1024,
            system=SYSTEM_PROMPT,
            messages=[
                {
                    "role": "user",
                    "content": f"Generate a proposal for this Upwork job:\n{job_context}"
                }
            ]
        )
        
        proposal_json = response.content[0].text
        proposal_data = json.loads(proposal_json)
        
        exec_query(
            "INSERT INTO proposals (job_id, proposal_text, status, generated_at) VALUES (?, ?, 'pending', ?)",
            (job_id, proposal_data['proposal'], datetime.now())
        )
        
        exec_query("UPDATE jobs SET status = 'proposal_ready' WHERE id = ?", (job_id,))
        
        logger.info(f"✅ Proposal generated: {proposal_data['opening_hook'][:50]}...")
        return True
        
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse Claude response as JSON: {e}")
        return False
    except Exception as e:
        logger.error(f"Error generating proposal: {e}")
        return False

def generate_all_pending():
    """Generate proposals for all pending jobs."""
    logger.info("📝 Starting proposal generation...")
    
    pending_jobs = exec_query(
        "SELECT id FROM jobs WHERE status = 'pending_proposal' ORDER BY filter_score DESC",
        fetch=True
    )
    
    generated = 0
    
    for job in pending_jobs:
        if generate_proposal(job['id']):
            generated += 1
        
        if count_sent_today() >= config.LIMITS['max_proposals_per_day']:
            logger.info(f"Daily limit reached after {generated} proposals")
            break
    
    logger.info(f"📊 Generation complete: {generated} proposals created")
    return generated
