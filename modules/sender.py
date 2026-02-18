"""Sender Module - Exports approved proposals for manual submission."""

import logging
import os
from pathlib import Path
from datetime import datetime
from db.database import exec_query

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

EXPORTS_DIR = Path(__file__).parent.parent / "exports"

def create_export_dir():
    """Create exports directory if it doesn't exist."""
    today = datetime.now().strftime("%Y-%m-%d")
    export_path = EXPORTS_DIR / today
    export_path.mkdir(parents=True, exist_ok=True)
    return export_path

def slugify(text):
    """Convert text to filename-safe slug."""
    return text.lower().replace(" ", "-")[:50]

def export_approved_proposals():
    """Export all approved proposals to formatted text files."""
    logger.info("📤 Exporting approved proposals...")
    
    # Get all approved proposals with job details
    proposals = exec_query(
        """SELECT p.id, p.proposal_text, j.title, j.url, j.budget, j.description
           FROM proposals p
           JOIN jobs j ON p.job_id = j.id
           WHERE p.status = 'approved' AND p.sent_at IS NULL
           ORDER BY p.approved_at DESC""",
        fetch=True
    )
    
    if not proposals:
        logger.info("✅ No new approved proposals to export")
        return 0
    
    export_dir = create_export_dir()
    exported = 0
    
    for proposal in proposals:
        # Create filename
        job_slug = slugify(proposal['title'])
        filename = f"{proposal['id']:04d}_{job_slug}.txt"
        filepath = export_dir / filename
        
        # Format content
        content = f"""UPWORK PROPOSAL EXPORT
{'='*60}

JOB TITLE: {proposal['title']}
JOB URL: {proposal['url']}
BUDGET: {proposal['budget']}

{'='*60}
PROPOSAL TEXT:
{'='*60}

{proposal['proposal_text']}

{'='*60}
INSTRUCTIONS:
1. Copy the proposal text above
2. Go to the job URL
3. Paste into Upwork's proposal form
4. Review and submit

JOB DESCRIPTION (for reference):
{proposal['description']}
"""
        
        # Write file
        with open(filepath, 'w') as f:
            f.write(content)
        
        # Mark as sent
        exec_query(
            "UPDATE proposals SET status = 'sent', sent_at = ? WHERE id = ?",
            (datetime.now(), proposal['id'])
        )
        
        logger.info(f"📝 Exported: {filename}")
        exported += 1
    
    logger.info(f"✅ Exported {exported} proposals to {export_dir}")
    return exported

def mark_proposal_sent(proposal_id):
    """Mark a specific proposal as manually sent."""
    exec_query(
        "UPDATE proposals SET status = 'sent', sent_at = ? WHERE id = ?",
        (datetime.now(), proposal_id)
    )
    logger.info(f"✅ Marked proposal {proposal_id} as sent")

if __name__ == "__main__":
    export_approved_proposals()
