"""Configuration for Upwork Auto-Apply System."""

import os
from dotenv import load_dotenv

load_dotenv()

# Claude API
CLAUDE_API_KEY = os.getenv("CLAUDE_API_KEY")
CLAUDE_MODEL = "claude-3-5-sonnet-20241022"

# Feed Monitor
FEED_POLL_INTERVAL = 30  # minutes
UPWORK_FEEDS = [
    "https://www.upwork.com/ab/feed/jobs/rss?q=landing+page&sort=recency",
    "https://www.upwork.com/ab/feed/jobs/rss?q=python+automation&sort=recency",
    "https://www.upwork.com/ab/feed/jobs/rss?q=web+scraping&sort=recency",
    "https://www.upwork.com/ab/feed/jobs/rss?q=zapier+automation&sort=recency",
    "https://www.upwork.com/ab/feed/jobs/rss?q=api+integration&sort=recency",
]

# Job Filtering
BUDGET_FILTERS = {
    "fixed_min": 150,  # Minimum fixed price
    "hourly_min": 25,  # Minimum hourly rate
    "allow_no_budget": False,
}

KEYWORD_BLACKLIST = [
    "wordpress theme",
    "logo design",
    "data entry",
    "full-time",
    "urgent $",
]

KEYWORD_WHITELIST = [
    "automation",
    "python",
    "script",
    "api",
    "integrate",
    "landing page",
    "webflow",
    "react",
    "next.js",
    "scraping",
    "pipeline",
    "workflow",
    "zapier",
    "make.com",
]

FILTER_WHITELIST_MIN_SCORE = 2  # Minimum score to proceed to proposal generation

# Proposal Generator
PROPOSAL_MAX_CHARS = 1000
PROPOSAL_TONE = "professional but personable"  # Style for Claude to use

# API Server
API_HOST = "0.0.0.0"
API_PORT = 8000
