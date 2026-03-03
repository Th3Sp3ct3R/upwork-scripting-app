"""Configuration for Upwork Auto-Apply System."""

import os
from dotenv import load_dotenv

load_dotenv()

# AI API (NVIDIA / Kimi)
AI_API_KEY = os.getenv("NVIDIA_API_KEY")
AI_BASE_URL = "https://integrate.api.nvidia.com/v1"
AI_MODEL = "moonshotai/kimi-k2.5"

# Rate Limits
LIMITS = {
    "max_proposals_per_day": 15,
}

# Scraper
FEED_POLL_INTERVAL = 30  # minutes
SEARCH_KEYWORDS = [
    "landing page",
    "python automation",
    "web scraping",
    "zapier automation",
    "api integration",
]

SCRAPE_MAX_PAGES = 3
SCRAPE_PAGE_DELAY = (2, 5)      # seconds between pages
SCRAPE_KEYWORD_DELAY = (5, 10)  # seconds between keywords
SCRAPE_HEADLESS = True
SCRAPE_TIMEOUT = 30000          # ms

# Search filters (URL params for Upwork search)
# All are optional — omit or set to None to skip
SEARCH_FILTERS = {
    "sort": "recency",
    # "contractor_tier": "2,3",     # 1=Entry, 2=Intermediate, 3=Expert
    # "t": "0",                     # 0=Fixed, 1=Hourly
    # "amount": "100-500",          # Fixed price range
    # "hourly_rate": "25-100",      # Hourly rate range
    # "payment_verified": "1",      # Verified payment method
    # "client_hires": "1-",         # Clients with 1+ hires
    # "proposals": "0-4",           # Less than 5 proposals
    # "duration_v3": "weeks",       # weeks, months, semester, ongoing
    # "workload": "as_needed",      # as_needed, part_time, full_time
    # "location": "Americas",       # Client region
    # "contract_to_hire": "1",      # Contract-to-hire jobs
}

# Job Filtering
BUDGET_FILTERS = {
    "fixed_min": 150,  # Minimum fixed price
    "hourly_min": 25,  # Minimum hourly rate
    "allow_no_budget": True,
}

# Client / Job Filters (applied locally after scraping)
CLIENT_FILTERS = {
    "min_client_spent": 0,          # Minimum $ client has spent on Upwork (0 = any)
    "require_payment_verified": False,  # Only verified payment methods
    "allowed_countries": [],         # Empty = all countries. e.g. ["United States", "United Kingdom"]
    "blocked_countries": [],         # e.g. ["India", "Pakistan"] — skip these
    "max_proposals_tier": "",        # e.g. "lessThan5", "5to10", "10to15", "15to20", "20to50"
    "allowed_job_types": [],         # ["fixed", "hourly"] — empty = both
    "allowed_experience": [],        # ["Entry", "Intermediate", "Expert"] — empty = all
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

# Auto-Submit
AUTO_SUBMIT_DELAY = (10, 30)  # seconds between submissions
AUTO_SUBMIT_DEFAULT_BID = 250  # default fixed price bid if none specified
AUTO_SUBMIT_SCREENSHOTS = True  # save screenshots before submitting
