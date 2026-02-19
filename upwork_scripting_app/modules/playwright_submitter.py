"""Playwright Automation - Submits approved proposals directly to Upwork."""

import logging
import asyncio
from datetime import datetime
from db.database import exec_query

try:
    from playwright.async_api import async_playwright, Page
except ImportError:
    print("⚠️  Playwright not installed. Install with: pip install playwright")
    print("Then run: playwright install")
    async_playwright = None

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration
UPWORK_LOGIN_EMAIL = None  # Set via env or config
UPWORK_LOGIN_PASSWORD = None
HEADLESS = True  # Set to False to see the browser
TIMEOUT = 30000  # 30 seconds

class UpworkSubmitter:
    def __init__(self, email: str, password: str, headless: bool = True):
        self.email = email
        self.password = password
        self.headless = headless
        self.page: Page = None
        self.browser = None
        self.context = None
    
    async def login(self):
        """Login to Upwork."""
        logger.info("🔐 Logging into Upwork...")
        
        # Navigate to login
        await self.page.goto("https://www.upwork.com/ab/account-security/login", timeout=TIMEOUT)
        
        # Enter email
        await self.page.fill('input[type="email"]', self.email, timeout=TIMEOUT)
        await self.page.click('button[type="submit"]')
        
        # Wait for password field
        await self.page.wait_for_selector('input[type="password"]', timeout=TIMEOUT)
        
        # Enter password
        await self.page.fill('input[type="password"]', self.password, timeout=TIMEOUT)
        await self.page.click('button[type="submit"]')
        
        # Wait for dashboard to load
        await self.page.wait_for_url("https://www.upwork.com/**", timeout=TIMEOUT)
        logger.info("✅ Logged in successfully")
    
    async def submit_proposal(self, job_url: str, proposal_text: str) -> bool:
        """Submit a proposal to a job."""
        try:
            logger.info(f"📤 Submitting proposal to: {job_url}")
            
            # Navigate to job
            await self.page.goto(job_url, timeout=TIMEOUT)
            
            # Wait for proposal button
            await self.page.wait_for_selector('button:has-text("Send a proposal")', timeout=TIMEOUT)
            await self.page.click('button:has-text("Send a proposal")')
            
            # Wait for modal/form
            await self.page.wait_for_selector('textarea[placeholder*="proposal"]', timeout=TIMEOUT)
            
            # Clear any existing text and type proposal
            textarea = await self.page.query_selector('textarea[placeholder*="proposal"]')
            await textarea.fill(proposal_text)
            
            # Submit
            submit_btn = await self.page.query_selector('button:has-text("Send Proposal")')
            if submit_btn:
                await submit_btn.click()
                
                # Wait for success confirmation
                await self.page.wait_for_selector('text="Your proposal has been sent"', timeout=TIMEOUT)
                logger.info("✅ Proposal submitted successfully")
                return True
            else:
                logger.warning("⚠️  Could not find submit button")
                return False
            
        except Exception as e:
            logger.error(f"❌ Submission failed: {e}")
            return False
    
    async def submit_all_approved(self, limit: int = 5):
        """Submit all approved proposals."""
        
        # Get approved proposals
        approved = exec_query(
            """SELECT p.id, p.proposal_text, j.url, j.title
               FROM proposals p
               JOIN jobs j ON p.job_id = j.id
               WHERE p.status = 'approved' AND p.sent_at IS NULL
               LIMIT ?""",
            (limit,),
            fetch=True
        )
        
        submitted = 0
        
        for proposal in approved:
            success = await self.submit_proposal(proposal['url'], proposal['proposal_text'])
            
            if success:
                # Mark as sent
                exec_query(
                    "UPDATE proposals SET status = 'sent', sent_at = ? WHERE id = ?",
                    (datetime.now(), proposal['id'])
                )
                submitted += 1
                logger.info(f"✅ Marked proposal {proposal['id']} as sent")
            
            # Rate limit: 1 proposal per 5 seconds (Upwork rate limiting)
            await asyncio.sleep(5)
        
        logger.info(f"📊 Submission cycle complete: {submitted}/{len(approved)} submitted")
        return submitted
    
    async def start(self):
        """Start browser session."""
        if not async_playwright:
            raise RuntimeError("Playwright not installed")
        
        self.playwright = await async_playwright().start()
        self.browser = await self.playwright.chromium.launch(headless=self.headless)
        self.context = await self.browser.new_context()
        self.page = await self.context.new_page()
        
        await self.login()
    
    async def close(self):
        """Close browser session."""
        if self.context:
            await self.context.close()
        if self.browser:
            await self.browser.close()
        if self.playwright:
            await self.playwright.stop()

async def submit_approved_proposals(email: str, password: str, limit: int = 5, headless: bool = True):
    """Submit approved proposals to Upwork."""
    
    submitter = UpworkSubmitter(email, password, headless=headless)
    
    try:
        await submitter.start()
        submitted = await submitter.submit_all_approved(limit=limit)
        return submitted
    finally:
        await submitter.close()

if __name__ == "__main__":
    import os
    
    email = os.getenv("UPWORK_EMAIL")
    password = os.getenv("UPWORK_PASSWORD")
    
    if not email or not password:
        print("❌ Set UPWORK_EMAIL and UPWORK_PASSWORD env vars")
        exit(1)
    
    submitted = asyncio.run(submit_approved_proposals(email, password, limit=5, headless=False))
    print(f"✅ Submitted {submitted} proposals")
