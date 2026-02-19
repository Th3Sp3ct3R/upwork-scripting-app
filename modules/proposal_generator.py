"""Proposal Generator - Uses AI API to generate custom proposals."""

import logging
import json
import re
from openai import OpenAI
from db.database import exec_query
import config
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

client = OpenAI(
    api_key=config.AI_API_KEY,
    base_url=config.AI_BASE_URL,
)

SYSTEM_PROMPT = """You are writing Upwork proposals for a skilled developer named Alex Chen. Their background:
- Built and operate a large-scale Instagram automation platform managing 200+ accounts
- Expert in Python, Node.js, React, PostgreSQL, Redis, REST APIs
- Specializes in: automation systems, web scraping, data pipelines, landing pages, API integrations
- Fast executor — delivers in days not weeks

Proposal rules:
1. FIRST LINE must reference something specific from their job post
2. NO generic openers like "I am interested in your project"
3. Keep it under 200 words — clients don't read long proposals
4. Show ONE relevant past experience (use the automation platform context)
5. End with a specific question about their project
6. Tone: confident, direct, no fluff

Output format (valid JSON only):
{
    "proposal": "full proposal text here",
    "opening_hook": "the first line you used",
    "relevant_experience": "what experience you highlighted"
}"""

def count_sent_today():
    """Count proposals sent today."""
    result = exec_query(
        "SELECT COUNT(*) as count FROM proposals WHERE sent_at >= date('now')",
        fetch=True
    )
    return result[0]['count'] if result else 0

def generate_proposal(job_id):
    """Generate a proposal for a specific job using Claude."""
    
    # Check daily limit
    if count_sent_today() >= config.LIMITS['max_proposals_per_day']:
        logger.warning(f"⚠️  Daily proposal limit ({config.LIMITS['max_proposals_per_day']}) reached")
        return False
    
    # Get job details
    result = exec_query(
        "SELECT id, title, description, budget FROM jobs WHERE id = ?",
        (job_id,),
        fetch=True
    )
    
    if not result:
        logger.error(f"Job {job_id} not found")
        return False
    
    job = result[0]
    
    # Check if proposal already exists
    existing = exec_query(
        "SELECT id FROM proposals WHERE job_id = ?",
        (job_id,),
        fetch=True
    )
    
    if existing:
        logger.warning(f"Proposal already exists for job {job_id}")
        return False
    
    # Build prompt
    job_context = f"""
Job Title: {job['title']}
Budget: {job['budget']}
Description: {job['description']}
"""
    
    try:
        logger.info(f"🤖 Generating proposal for: {job['title'][:50]}...")
        
        response = client.chat.completions.create(
            model=config.AI_MODEL,
            max_tokens=1024,
            messages=[
                {
                    "role": "system",
                    "content": SYSTEM_PROMPT
                },
                {
                    "role": "user",
                    "content": f"Generate a proposal for this Upwork job:\n{job_context}"
                }
            ]
        )

        # Parse response — handle None, markdown fences, or plain text
        raw = response.choices[0].message.content or ""
        raw = raw.strip()

        # Strip markdown code fences if present
        if raw.startswith("```"):
            raw = re.sub(r"^```(?:json)?\s*", "", raw)
            raw = re.sub(r"\s*```$", "", raw)
            raw = raw.strip()

        # Try JSON parse
        try:
            proposal_data = json.loads(raw)
            proposal_text = proposal_data.get("proposal", raw)
        except (json.JSONDecodeError, TypeError):
            # Not valid JSON — use raw text as the proposal
            proposal_text = raw

        if not proposal_text:
            logger.error("AI returned empty proposal")
            return False

        # Store in database
        exec_query(
            """INSERT INTO proposals (job_id, proposal_text, status, generated_at)
               VALUES (?, ?, 'pending', ?)""",
            (job_id, proposal_text, datetime.now())
        )

        # Update job status
        exec_query(
            "UPDATE jobs SET status = 'proposal_ready' WHERE id = ?",
            (job_id,)
        )

        logger.info(f"✅ Proposal generated: {proposal_text[:60]}...")
        return True

    except Exception as e:
        logger.error(f"Error generating proposal: {e}")
        return False

def generate_all_pending():
    """Generate proposals for all jobs with status='pending_proposal'."""
    logger.info("📝 Starting proposal generation...")
    
    # Get all pending proposal jobs, ordered by filter score (highest first)
    pending_jobs = exec_query(
        "SELECT id FROM jobs WHERE status = 'pending_proposal' ORDER BY filter_score DESC",
        fetch=True
    )
    
    generated = 0
    
    for job in pending_jobs:
        if generate_proposal(job['id']):
            generated += 1
        
        # Stop if daily limit reached
        if count_sent_today() >= config.LIMITS['max_proposals_per_day']:
            logger.info(f"Daily limit reached after {generated} proposals")
            break
    
    logger.info(f"📊 Generation complete: {generated} proposals created")
    return generated

if __name__ == "__main__":
    generate_all_pending()
