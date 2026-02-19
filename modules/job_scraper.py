"""Upwork job scraper — extracts jobs from __NUXT__ SSR state.

Two modes:
1. CDP (default): Connects to your real Chrome — no Cloudflare issues
   Start Chrome: /Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome --remote-debugging-port=9222
2. HTTP (experimental): Direct requests with curl_cffi — needs valid cf_clearance
"""

import json
import logging
import os
import re
import random
import time
from datetime import datetime
from pathlib import Path
from urllib.parse import quote_plus, urlencode

import config
from db.database import exec_query

logger = logging.getLogger(__name__)

STATE_DIR = Path(__file__).parent.parent / ".browser_state"
CDP_URL = os.getenv("CHROME_CDP_URL", "http://localhost:9222")


def _build_search_url(keyword: str, page: int = 1) -> str:
    """Build Upwork search URL with keyword, page, and configured filters."""
    params = {"q": keyword, "page": str(page)}
    for key, val in config.SEARCH_FILTERS.items():
        if val is not None:
            params[key] = val
    return "https://www.upwork.com/nx/search/jobs/?" + urlencode(params)


def _extract_nuxt_jobs(page, feed_mode=False) -> list[dict]:
    """Extract job data from __NUXT__ state via JS evaluation.

    feed_mode: try multiple NUXT state paths (findWork, bestMatches, etc.)
    """
    raw = page.evaluate("""
        ((feedMode) => {
            let jobs = [];
            if (feedMode) {
                // Try multiple paths for feed pages (/nx/find-work/*)
                const paths = [
                    window.__NUXT__?.state?.findWork?.results,
                    window.__NUXT__?.state?.findWork?.jobs,
                    window.__NUXT__?.state?.bestMatches?.results,
                    window.__NUXT__?.state?.bestMatches?.jobs,
                    window.__NUXT__?.state?.mostRecentJobs?.results,
                    window.__NUXT__?.state?.mostRecentJobs?.jobs,
                    window.__NUXT__?.state?.jobsSearch?.jobs,
                ];
                for (const p of paths) {
                    if (p && p.length > 0) { jobs = p; break; }
                }
                // Last resort: walk the state tree looking for an array of objects with 'title'
                if (jobs.length === 0) {
                    const state = window.__NUXT__?.state || {};
                    for (const key of Object.keys(state)) {
                        const val = state[key];
                        if (val && typeof val === 'object') {
                            for (const subkey of Object.keys(val)) {
                                const arr = val[subkey];
                                if (Array.isArray(arr) && arr.length > 0 && arr[0]?.title) {
                                    jobs = arr;
                                    break;
                                }
                            }
                        }
                        if (jobs.length > 0) break;
                    }
                }
            } else {
                jobs = window.__NUXT__?.state?.jobsSearch?.jobs || [];
            }
            return jobs.map(j => ({
                id: j.ciphertext?.replace('~0', '') || j.uid || '',
                title: j.title || '',
                ciphertext: j.ciphertext || '',
                description: (j.description || '').slice(0, 2000),
                budget_amount: j.amount?.amount || 0,
                hourly_min: j.hourlyBudget?.min || 0,
                hourly_max: j.hourlyBudget?.max || 0,
                published_on: j.publishedOn || '',
                client_country: j.client?.location?.country || '',
                client_spent: j.client?.totalSpent || '0',
                client_verified: j.client?.isPaymentVerified || false,
                proposals_tier: j.proposalsTier || '',
                tier_text: j.tierText || '',
                type: j.type || 0,
            }));
        })(%s)
    """ % ("true" if feed_mode else "false"))
    if not raw:
        return []

    jobs = []
    for j in raw:
        if not j.get("id") or not j.get("title"):
            continue

        # Format budget string
        if j["budget_amount"] > 0:
            budget = f"${j['budget_amount']}"
        elif j["hourly_max"] > 0:
            budget = f"${j['hourly_min']}-${j['hourly_max']}/hr"
        else:
            budget = ""

        jobs.append({
            "id": j["id"],
            "title": j["title"],
            "url": f"https://www.upwork.com/jobs/{j['ciphertext']}",
            "description": j["description"],
            "budget": budget,
            "posted_at": j["published_on"],
            "client_country": j.get("client_country", ""),
            "client_spent": j.get("client_spent", "0"),
            "client_verified": j.get("client_verified", False),
            "proposals_tier": j.get("proposals_tier", ""),
            "experience_level": j.get("tier_text", ""),
            "job_type": "hourly" if j.get("type") == 1 else "fixed",
        })
    return jobs


def _extract_nuxt_paging(page) -> dict:
    """Get paging info from __NUXT__ state."""
    return page.evaluate("""
        (() => {
            const p = window.__NUXT__?.state?.jobsSearch?.paging;
            return p ? { total: p.total, offset: p.offset, count: p.count } : null;
        })()
    """) or {}


class UpworkScraper:
    """Manages browser connection for Upwork scraping."""

    def __init__(self):
        self.browser = None
        self.context = None
        self.page = None
        self.playwright = None
        self._using_cdp = False

    def start_browser(self):
        """Connect to Chrome via CDP, or launch standalone as fallback."""
        from playwright.sync_api import sync_playwright

        self.playwright = sync_playwright().start()

        # Try CDP first
        try:
            self.browser = self.playwright.chromium.connect_over_cdp(CDP_URL)
            self._using_cdp = True
            contexts = self.browser.contexts
            if contexts:
                self.context = contexts[0]
                self.page = self.context.new_page()
            else:
                self.context = self.browser.new_context()
                self.page = self.context.new_page()
            logger.info(f"Connected to Chrome via CDP at {CDP_URL}")
            return
        except Exception as e:
            logger.warning(f"CDP failed ({e}), launching standalone Chromium")

        # Fallback: standalone
        self._using_cdp = False
        self.browser = self.playwright.chromium.launch(
            headless=config.SCRAPE_HEADLESS,
            args=["--disable-blink-features=AutomationControlled", "--no-sandbox"],
        )
        state_file = STATE_DIR / "state.json"
        storage_state = str(state_file) if state_file.exists() else None
        if storage_state:
            logger.info("Loading saved browser state")

        self.context = self.browser.new_context(
            storage_state=storage_state,
            user_agent=(
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/131.0.0.0 Safari/537.36"
            ),
            viewport={"width": 1920, "height": 1080},
        )
        self.context.add_init_script(
            "Object.defineProperty(navigator, 'webdriver', {get: () => undefined})"
        )
        self.page = self.context.new_page()
        logger.info("Standalone Chromium started")

    def scrape_search_page(self, keyword: str, page_num: int = 1) -> list[dict]:
        """Navigate to search URL and extract jobs from __NUXT__ state."""
        url = _build_search_url(keyword, page_num)
        logger.info(f"Scraping: {keyword} (page {page_num})")

        self.page.goto(url, wait_until="domcontentloaded", timeout=config.SCRAPE_TIMEOUT)

        # Wait for NUXT state to hydrate
        try:
            self.page.wait_for_function(
                "() => window.__NUXT__?.state?.jobsSearch?.jobs?.length > 0",
                timeout=15000,
            )
        except Exception:
            # Check for Cloudflare
            title = self.page.title()
            if "moment" in title.lower() or "verify" in title.lower():
                logger.warning("Cloudflare challenge — waiting up to 60s...")
                try:
                    self.page.wait_for_function(
                        "() => window.__NUXT__?.state?.jobsSearch?.jobs?.length > 0",
                        timeout=60000,
                    )
                except Exception:
                    debug_path = STATE_DIR / "debug_cloudflare.png"
                    STATE_DIR.mkdir(parents=True, exist_ok=True)
                    self.page.screenshot(path=str(debug_path))
                    logger.error(f"Cloudflare not resolved — screenshot: {debug_path}")
                    return []
            else:
                logger.warning(f"No jobs found on page (title: {title})")
                return []

        return _extract_nuxt_jobs(self.page)

    def scrape_keyword(self, keyword: str) -> list[dict]:
        """Scrape up to SCRAPE_MAX_PAGES pages for a keyword."""
        all_jobs = []
        for page_num in range(1, config.SCRAPE_MAX_PAGES + 1):
            jobs = self.scrape_search_page(keyword, page_num)

            if not jobs:
                logger.info(f"No jobs on page {page_num} for '{keyword}', stopping")
                break

            all_jobs.extend(jobs)
            logger.info(f"Found {len(jobs)} jobs on page {page_num}")

            if page_num < config.SCRAPE_MAX_PAGES:
                delay = random.uniform(*config.SCRAPE_PAGE_DELAY)
                time.sleep(delay)

        return all_jobs

    def scrape_feed_page(self, url: str) -> list[dict]:
        """Navigate to an Upwork feed URL (best-matches, most-recent) and extract jobs."""
        logger.info(f"Scraping feed: {url}")

        self.page.goto(url, wait_until="domcontentloaded", timeout=config.SCRAPE_TIMEOUT)

        # Wait for any NUXT state with job data to hydrate
        try:
            self.page.wait_for_function(
                """() => {
                    const s = window.__NUXT__?.state || {};
                    for (const k of Object.keys(s)) {
                        const v = s[k];
                        if (v && typeof v === 'object') {
                            for (const sk of Object.keys(v)) {
                                const arr = v[sk];
                                if (Array.isArray(arr) && arr.length > 0 && arr[0]?.title) return true;
                            }
                        }
                    }
                    return false;
                }""",
                timeout=15000,
            )
        except Exception:
            title = self.page.title()
            if "moment" in title.lower() or "verify" in title.lower():
                logger.warning("Cloudflare challenge on feed page — waiting 60s...")
                try:
                    self.page.wait_for_function(
                        "() => document.querySelectorAll('[data-test=\"JobTile\"], [data-test=\"job-tile-list\"] > *').length > 0",
                        timeout=60000,
                    )
                except Exception:
                    logger.error("Cloudflare not resolved on feed page")
                    return []
            else:
                logger.warning(f"No jobs found on feed page (title: {title})")
                return []

        return _extract_nuxt_jobs(self.page, feed_mode=True)

    def stop(self):
        """Clean up browser resources."""
        try:
            if self.page and self._using_cdp:
                self.page.close()
            elif self.context and not self._using_cdp:
                self.context.close()
            if self.browser and not self._using_cdp:
                self.browser.close()
            if self.playwright:
                self.playwright.stop()
        except Exception as e:
            logger.warning(f"Error stopping browser: {e}")
        logger.info("Browser stopped")


# ── DB helpers ────────────────────────────────────────────────────────────

def _job_exists(job_id: str) -> bool:
    result = exec_query("SELECT 1 FROM jobs WHERE id = %s", (job_id,), fetch=True)
    return len(result) > 0


def _insert_job(job: dict, feed_source: str = ""):
    exec_query(
        """INSERT INTO jobs (id, title, url, description, budget, posted_at, status, fetched_at,
                             client_country, client_spent, client_verified, proposals_tier,
                             experience_level, job_type, feed_source)
           VALUES (%s, %s, %s, %s, %s, %s, 'new', %s, %s, %s, %s, %s, %s, %s, %s)""",
        (
            job["id"],
            job["title"],
            job["url"],
            job["description"][:2000],
            job["budget"],
            job["posted_at"] or datetime.now().isoformat(),
            datetime.now().isoformat(),
            job.get("client_country", ""),
            job.get("client_spent", "0"),
            job.get("client_verified", False),
            job.get("proposals_tier", ""),
            job.get("experience_level", ""),
            job.get("job_type", ""),
            feed_source,
        ),
    )


def _log_feed_run(keyword: str, jobs_found: int, new_jobs: int):
    duplicates = jobs_found - new_jobs
    exec_query(
        """INSERT INTO feed_log (feed_url, new_jobs, duplicates, fetched_at)
           VALUES (%s, %s, %s, %s)""",
        (f"search:{keyword}", new_jobs, duplicates, datetime.now().isoformat()),
    )


# ── Main entry point ─────────────────────────────────────────────────────

def scrape_jobs():
    """Main entry point — drop-in replacement for monitor_feeds().

    Scrapes Upwork search results for configured keywords,
    deduplicates against the DB, and inserts new jobs.
    """
    scraper = UpworkScraper()
    total_found = 0
    total_new = 0

    try:
        scraper.start_browser()

        for i, keyword in enumerate(config.SEARCH_KEYWORDS):
            jobs = scraper.scrape_keyword(keyword)
            new_count = 0

            for job in jobs:
                if not _job_exists(job["id"]):
                    try:
                        _insert_job(job, feed_source=f"search:{keyword}")
                        new_count += 1
                    except Exception as e:
                        logger.error(f"Failed to insert job {job['id']}: {e}")

            total_found += len(jobs)
            total_new += new_count
            _log_feed_run(keyword, len(jobs), new_count)
            logger.info(f"[{keyword}] {len(jobs)} found, {new_count} new")

            if i < len(config.SEARCH_KEYWORDS) - 1:
                delay = random.uniform(*config.SCRAPE_KEYWORD_DELAY)
                time.sleep(delay)

    except Exception as e:
        logger.error(f"Scraper error: {e}")
        raise
    finally:
        scraper.stop()

    logger.info(f"Scrape complete: {total_found} found, {total_new} new")
    return total_new


FEED_URLS = {
    "best-matches": "https://www.upwork.com/nx/find-work/best-matches",
    "most-recent": "https://www.upwork.com/nx/find-work/most-recent",
    "saved-jobs": "https://www.upwork.com/nx/find-work/saved-jobs",
}


def scrape_feed(source: str) -> int:
    """Scrape jobs from an Upwork feed page (best-matches or most-recent).

    Returns count of new jobs inserted.
    """
    url = FEED_URLS.get(source)
    if not url:
        raise ValueError(f"Unknown feed source: {source}. Use: {list(FEED_URLS.keys())}")

    scraper = UpworkScraper()
    total_found = 0
    new_count = 0

    try:
        scraper.start_browser()
        jobs = scraper.scrape_feed_page(url)
        total_found = len(jobs)

        for job in jobs:
            if not _job_exists(job["id"]):
                try:
                    _insert_job(job, feed_source=source)
                    new_count += 1
                except Exception as e:
                    logger.error(f"Failed to insert job {job['id']}: {e}")

        _log_feed_run(f"feed:{source}", total_found, new_count)
        logger.info(f"[feed:{source}] {total_found} found, {new_count} new")

    except Exception as e:
        logger.error(f"Feed scraper error: {e}")
        raise
    finally:
        scraper.stop()

    return new_count
