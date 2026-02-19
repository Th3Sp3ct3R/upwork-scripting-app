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
    "fixed_min": int(os.getenv("BUDGET_FIXED_MIN", 150)),
    "hourly_min": int(os.getenv("BUDGET_HOURLY_MIN", 25)),
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

FILTER_WHITELIST_MIN_SCORE = 2

# Auto-Approval Thresholds
AUTO_APPROVE_SCORE = int(os.getenv("AUTO_APPROVE_SCORE", 7))  # Min filter score (0-10)
AUTO_APPROVE_BUDGET_MIN = int(os.getenv("AUTO_APPROVE_BUDGET_MIN", 250))  # Don't auto-approve tiny jobs
AUTO_APPROVE_MAX_PER_DAY = int(os.getenv("AUTO_APPROVE_MAX_PER_DAY", 15))  # Safety limit

# Upwork Submission
UPWORK_EMAIL = os.getenv("UPWORK_EMAIL")
UPWORK_PASSWORD = os.getenv("UPWORK_PASSWORD")
UPWORK_HEADLESS = os.getenv("UPWORK_HEADLESS", "true").lower() == "true"  # Hide browser window
UPWORK_SUBMIT_ENABLED = bool(UPWORK_EMAIL and UPWORK_PASSWORD)

# Proposal Generator
PROPOSAL_MAX_CHARS = 1000
PROPOSAL_TONE = "professional but personable"

# Limits
LIMITS = {
    "max_proposals_per_day": int(os.getenv("MAX_PROPOSALS_PER_DAY", 20)),
    "poll_interval_minutes": FEED_POLL_INTERVAL,
}

# API Server
API_HOST = os.getenv("API_HOST", "0.0.0.0")
API_PORT = int(os.getenv("API_PORT", 8000))

# Scheduler
SCHEDULER_INTERVAL_MINUTES = int(os.getenv("SCHEDULER_INTERVAL_MINUTES", 30))
