"""Auto-Submit Module — submits approved proposals to Upwork via Chrome CDP.

Connects to the user's real Chrome browser through Playwright CDP,
navigates to each job URL, fills the proposal form, and submits.

Prerequisites:
  Chrome must be running with --remote-debugging-port=9222
"""

import logging
import os
import random
import re
import time
from datetime import datetime
from pathlib import Path

import config
from db.database import exec_query

logger = logging.getLogger(__name__)

CDP_URL = os.getenv("CHROME_CDP_URL", "http://localhost:9222")
SCREENSHOTS_DIR = Path(__file__).parent.parent / "screenshots"

# ---------------------------------------------------------------------------
# Selectors — multiple fallbacks for Upwork's proposal form
# ---------------------------------------------------------------------------

APPLY_BUTTON_SELECTORS = [
    'button[data-test="apply-button"]',
    'a[href*="proposals/job"]',
    'button:has-text("Apply Now")',
    'button:has-text("Submit a Proposal")',
    'a:has-text("Apply Now")',
    'a:has-text("Submit a Proposal")',
    '[aria-label="Apply Now"]',
    '[aria-label="Submit a Proposal"]',
]

COVER_LETTER_SELECTORS = [
    'textarea[data-test="cover-letter"]',
    'textarea.cover-letter',
    'textarea[name="coverLetter"]',
    'textarea[placeholder*="cover letter" i]',
    'textarea[placeholder*="proposal" i]',
    'textarea[aria-label*="cover letter" i]',
    'textarea[aria-label*="proposal" i]',
    '#cover-letter',
    '.up-textarea >> textarea',
]

BID_INPUT_SELECTORS = [
    'input[data-test="bid-input"]',
    'input[name="amount"]',
    'input[data-test="charge-amount"]',
    'input[aria-label*="bid" i]',
    'input[aria-label*="amount" i]',
    'input[aria-label*="rate" i]',
    'input[placeholder*="amount" i]',
    'input[placeholder*="bid" i]',
]

SUBMIT_BUTTON_SELECTORS = [
    'button[data-test="submit-proposal"]',
    'button[type="submit"]:has-text("Submit")',
    'button:has-text("Submit Proposal")',
    'button:has-text("Send Proposal")',
    'button[type="submit"]',
    '[aria-label="Submit Proposal"]',
    '[aria-label="Send Proposal"]',
]

CLOUDFLARE_INDICATORS = ["just a moment", "verify you are human", "checking your browser"]


# ---------------------------------------------------------------------------
# Helper: find first matching selector
# ---------------------------------------------------------------------------

def _find_element(page, selectors: list[str], description: str, timeout: int = 10000):
    """Try each selector in order, return the first visible element found.

    Returns the element handle or None if nothing matched.
    """
    for selector in selectors:
        try:
            element = page.wait_for_selector(selector, timeout=timeout, state="visible")
            if element:
                logger.debug(f"Found {description} with selector: {selector}")
                return element
        except Exception:
            continue

    logger.warning(f"Could not find {description} with any selector")
    return None


def _wait_for_cloudflare(page, timeout_ms: int = 60000):
    """Detect and wait through a Cloudflare challenge if present."""
    try:
        title = (page.title() or "").lower()
        body_text = page.text_content("body") or ""
        combined = title + " " + body_text[:500].lower()

        if any(indicator in combined for indicator in CLOUDFLARE_INDICATORS):
            logger.warning("Cloudflare challenge detected — waiting up to 60s...")
            page.wait_for_function(
                """() => {
                    const t = document.title.toLowerCase();
                    return !t.includes('moment') && !t.includes('verify');
                }""",
                timeout=timeout_ms,
            )
            # Extra settle time after challenge clears
            page.wait_for_load_state("networkidle", timeout=15000)
            logger.info("Cloudflare challenge resolved")
            return True
    except Exception as e:
        logger.warning(f"Cloudflare wait issue: {e}")
    return False


def _parse_bid_from_budget(budget_str: str) -> float | None:
    """Extract a numeric bid from a budget string like '$250' or '$25-$50/hr'.

    For fixed-price budgets, returns the amount.
    For hourly, returns None (let Upwork use its default or the profile rate).
    """
    if not budget_str:
        return None

    budget_str = budget_str.strip()

    # Fixed price: "$250", "$1,500"
    fixed_match = re.match(r"^\$[\s]*([\d,]+(?:\.\d+)?)$", budget_str)
    if fixed_match:
        return float(fixed_match.group(1).replace(",", ""))

    # Hourly: "$25-$50/hr" — skip, profile rate is used
    if "/hr" in budget_str.lower():
        return None

    # Fallback: try to extract any number
    numbers = re.findall(r"[\d,]+(?:\.\d+)?", budget_str)
    if numbers:
        return float(numbers[0].replace(",", ""))

    return None


def _take_screenshot(page, proposal_id: int, stage: str = "pre-submit") -> str | None:
    """Save a screenshot for audit trail. Returns the file path or None."""
    if not config.AUTO_SUBMIT_SCREENSHOTS:
        return None

    try:
        SCREENSHOTS_DIR.mkdir(parents=True, exist_ok=True)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"proposal_{proposal_id}_{stage}_{timestamp}.png"
        filepath = SCREENSHOTS_DIR / filename
        page.screenshot(path=str(filepath), full_page=False)
        logger.info(f"Screenshot saved: {filepath}")
        return str(filepath)
    except Exception as e:
        logger.warning(f"Screenshot failed: {e}")
        return None


# ---------------------------------------------------------------------------
# DB queries
# ---------------------------------------------------------------------------

def _get_approved_proposals() -> list[dict]:
    """Fetch all approved proposals that haven't been sent yet."""
    return exec_query(
        """SELECT p.id, p.job_id, p.proposal_text, p.status,
                  j.title, j.url, j.budget, j.description
           FROM proposals p
           JOIN jobs j ON p.job_id = j.id
           WHERE p.status = 'approved' AND p.sent_at IS NULL
           ORDER BY p.approved_at ASC""",
        fetch=True,
    )


def _get_proposal_by_id(proposal_id: int) -> dict | None:
    """Fetch a single proposal by its ID."""
    rows = exec_query(
        """SELECT p.id, p.job_id, p.proposal_text, p.status,
                  j.title, j.url, j.budget, j.description
           FROM proposals p
           JOIN jobs j ON p.job_id = j.id
           WHERE p.id = %s""",
        (proposal_id,),
        fetch=True,
    )
    return rows[0] if rows else None


def _mark_sent(proposal_id: int):
    """Mark proposal as sent with current timestamp."""
    exec_query(
        "UPDATE proposals SET status = 'sent', sent_at = %s WHERE id = %s",
        (datetime.now(), proposal_id),
    )


def _mark_failed(proposal_id: int, reason: str):
    """Mark proposal as failed with a note."""
    exec_query(
        "UPDATE proposals SET status = 'send_failed', notes = %s WHERE id = %s",
        (reason[:500], proposal_id),
    )


# ---------------------------------------------------------------------------
# Browser connection
# ---------------------------------------------------------------------------

class UpworkSubmitter:
    """Manages browser connection for submitting proposals."""

    def __init__(self):
        self.browser = None
        self.context = None
        self.page = None
        self.playwright = None

    def connect(self):
        """Connect to Chrome via CDP."""
        from playwright.sync_api import sync_playwright

        self.playwright = sync_playwright().start()

        try:
            self.browser = self.playwright.chromium.connect_over_cdp(CDP_URL)
            contexts = self.browser.contexts
            if contexts:
                self.context = contexts[0]
                self.page = self.context.new_page()
            else:
                self.context = self.browser.new_context()
                self.page = self.context.new_page()
            logger.info(f"Connected to Chrome via CDP at {CDP_URL}")
        except Exception as e:
            self.stop()
            raise ConnectionError(
                f"Cannot connect to Chrome CDP at {CDP_URL}. "
                f"Start Chrome with: /Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome "
                f"--remote-debugging-port=9222  -- Error: {e}"
            ) from e

    def stop(self):
        """Clean up browser resources."""
        try:
            if self.page:
                self.page.close()
        except Exception:
            pass
        try:
            if self.playwright:
                self.playwright.stop()
        except Exception:
            pass
        self.page = None
        self.context = None
        self.browser = None
        self.playwright = None
        logger.info("Submitter browser connection closed")

    # -------------------------------------------------------------------
    # Core submission logic
    # -------------------------------------------------------------------

    def submit_proposal(self, proposal: dict) -> bool:
        """Submit a single proposal through the browser.

        Args:
            proposal: dict with keys id, job_id, proposal_text, url, budget, title

        Returns:
            True if submitted successfully, False otherwise.
        """
        proposal_id = proposal["id"]
        job_url = proposal["url"]
        job_title = proposal.get("title", "Unknown")

        logger.info(f"[Proposal {proposal_id}] Submitting for: {job_title[:60]}")

        try:
            # 1. Navigate to the job page
            logger.info(f"[Proposal {proposal_id}] Navigating to {job_url}")
            self.page.goto(job_url, wait_until="domcontentloaded", timeout=config.SCRAPE_TIMEOUT)

            # 2. Handle Cloudflare if it appears
            _wait_for_cloudflare(self.page)

            # 3. Wait for page to settle
            self.page.wait_for_load_state("networkidle", timeout=15000)

            # 4. Click the "Apply Now" / "Submit a Proposal" button
            apply_btn = _find_element(
                self.page, APPLY_BUTTON_SELECTORS, "Apply button", timeout=10000
            )
            if not apply_btn:
                reason = "Apply button not found — job may be closed or already applied"
                logger.warning(f"[Proposal {proposal_id}] {reason}")
                _mark_failed(proposal_id, reason)
                _take_screenshot(self.page, proposal_id, "no-apply-button")
                return False

            apply_btn.click()
            logger.info(f"[Proposal {proposal_id}] Clicked Apply button")

            # 5. Wait for the proposal form to load
            self.page.wait_for_load_state("domcontentloaded", timeout=config.SCRAPE_TIMEOUT)
            _wait_for_cloudflare(self.page)
            # Give the SPA time to render the form
            self.page.wait_for_timeout(3000)

            # 6. Fill in the cover letter
            cover_letter_el = _find_element(
                self.page, COVER_LETTER_SELECTORS, "cover letter textarea", timeout=15000
            )
            if not cover_letter_el:
                reason = "Cover letter textarea not found — unexpected form layout"
                logger.warning(f"[Proposal {proposal_id}] {reason}")
                _mark_failed(proposal_id, reason)
                _take_screenshot(self.page, proposal_id, "no-cover-letter")
                return False

            # Clear existing content and type the proposal
            cover_letter_el.click()
            cover_letter_el.fill("")
            cover_letter_el.type(proposal["proposal_text"], delay=5)
            logger.info(f"[Proposal {proposal_id}] Filled cover letter ({len(proposal['proposal_text'])} chars)")

            # 7. Set the bid amount (fixed-price jobs)
            bid_amount = _parse_bid_from_budget(proposal.get("budget", ""))
            if bid_amount is None:
                bid_amount = config.AUTO_SUBMIT_DEFAULT_BID

            bid_input = _find_element(
                self.page, BID_INPUT_SELECTORS, "bid input", timeout=5000
            )
            if bid_input:
                bid_input.click()
                bid_input.fill("")
                bid_input.type(str(int(bid_amount)), delay=20)
                logger.info(f"[Proposal {proposal_id}] Set bid amount: ${int(bid_amount)}")
            else:
                logger.info(
                    f"[Proposal {proposal_id}] No bid input found — "
                    "may be hourly or bid is pre-filled"
                )

            # 8. Take pre-submit screenshot for audit
            _take_screenshot(self.page, proposal_id, "pre-submit")

            # 9. Scroll to bottom to make submit button visible
            self.page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            self.page.wait_for_timeout(1000)

            # 10. Click Submit
            submit_btn = _find_element(
                self.page, SUBMIT_BUTTON_SELECTORS, "Submit button", timeout=10000
            )
            if not submit_btn:
                reason = "Submit button not found — form may require additional fields"
                logger.warning(f"[Proposal {proposal_id}] {reason}")
                _mark_failed(proposal_id, reason)
                _take_screenshot(self.page, proposal_id, "no-submit-button")
                return False

            submit_btn.click()
            logger.info(f"[Proposal {proposal_id}] Clicked Submit")

            # 11. Wait for confirmation / navigation after submit
            try:
                self.page.wait_for_load_state("networkidle", timeout=15000)
            except Exception:
                pass  # Sometimes Upwork doesn't fully settle, that's OK

            # Brief pause for the page to process
            self.page.wait_for_timeout(2000)

            # 12. Take post-submit screenshot
            _take_screenshot(self.page, proposal_id, "post-submit")

            # 13. Check for success indicators
            success = self._check_submission_success()
            if success:
                _mark_sent(proposal_id)
                logger.info(f"[Proposal {proposal_id}] Successfully submitted")
                return True
            else:
                # Even without a clear success signal, the click went through.
                # Mark as sent but log the ambiguity.
                _mark_sent(proposal_id)
                logger.warning(
                    f"[Proposal {proposal_id}] Submit clicked but could not confirm "
                    "success — marked as sent. Check screenshot."
                )
                return True

        except Exception as e:
            reason = f"Unexpected error: {str(e)[:400]}"
            logger.error(f"[Proposal {proposal_id}] {reason}")
            _mark_failed(proposal_id, reason)
            _take_screenshot(self.page, proposal_id, "error")
            return False

    def _check_submission_success(self) -> bool:
        """Check whether the proposal was submitted successfully.

        Looks for common success indicators on the page.
        """
        try:
            page_text = (self.page.text_content("body") or "").lower()
            url = self.page.url.lower()

            success_phrases = [
                "proposal submitted",
                "proposal was submitted",
                "successfully submitted",
                "thank you for submitting",
                "your proposal",
            ]

            # Check URL for success indicators
            if "proposals" in url and "submit" not in url:
                return True

            # Check page content
            for phrase in success_phrases:
                if phrase in page_text:
                    return True

        except Exception:
            pass

        return False


# ---------------------------------------------------------------------------
# Public entry points
# ---------------------------------------------------------------------------

def submit_approved_proposals() -> int:
    """Submit all approved proposals that haven't been sent yet.

    Returns:
        Number of proposals successfully submitted.
    """
    proposals = _get_approved_proposals()

    if not proposals:
        logger.info("No approved proposals to submit")
        return 0

    logger.info(f"Found {len(proposals)} approved proposal(s) to submit")

    submitter = UpworkSubmitter()
    submitted_count = 0

    try:
        submitter.connect()
    except ConnectionError as e:
        logger.error(str(e))
        return 0

    try:
        for i, proposal in enumerate(proposals):
            success = submitter.submit_proposal(proposal)
            if success:
                submitted_count += 1

            # Random delay between submissions (skip after last one)
            if i < len(proposals) - 1:
                delay = random.uniform(*config.AUTO_SUBMIT_DELAY)
                logger.info(f"Waiting {delay:.1f}s before next submission...")
                time.sleep(delay)

    except Exception as e:
        logger.error(f"Submission loop error: {e}")
    finally:
        submitter.stop()

    logger.info(
        f"Submission complete: {submitted_count}/{len(proposals)} submitted successfully"
    )
    return submitted_count


def submit_single_proposal(proposal_id: int) -> bool:
    """Submit a single proposal by its ID.

    Args:
        proposal_id: The proposal ID to submit.

    Returns:
        True if submitted successfully, False otherwise.
    """
    proposal = _get_proposal_by_id(proposal_id)

    if not proposal:
        logger.error(f"Proposal {proposal_id} not found")
        return False

    if proposal["status"] != "approved":
        logger.error(
            f"Proposal {proposal_id} has status '{proposal['status']}' — must be 'approved'"
        )
        return False

    submitter = UpworkSubmitter()

    try:
        submitter.connect()
    except ConnectionError as e:
        logger.error(str(e))
        return False

    try:
        return submitter.submit_proposal(proposal)
    except Exception as e:
        logger.error(f"Failed to submit proposal {proposal_id}: {e}")
        return False
    finally:
        submitter.stop()


# ---------------------------------------------------------------------------
# CLI entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(name)s %(levelname)s %(message)s",
    )
    count = submit_approved_proposals()
    print(f"Submitted {count} proposal(s)")
