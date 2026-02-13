import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should sign up a new user', async ({ page }) => {
    await page.goto('/signup');

    // Fill in signup form
    await page.fill('input[placeholder="John Doe"]', 'Test User');
    await page.fill('input[placeholder="you@example.com"]', `test-${Date.now()}@example.com`);
    await page.fill('input[placeholder="••••••••"]', 'TestPassword123');
    await page.fill('input:nth-of-type(4)', 'TestPassword123'); // Confirm password

    // Submit form
    await page.click('button:has-text("Sign up")');

    // Should redirect to onboarding
    await expect(page).toHaveURL(/\/onboard/);
    await expect(page.locator('h2')).toContainText("Let's start with your profile");
  });

  test('should sign in an existing user', async ({ page }) => {
    await page.goto('/signin');

    // Fill in signin form
    await page.fill('input[placeholder="you@example.com"]', 'test@example.com');
    await page.fill('input[placeholder="••••••••"]', 'TestPassword123');

    // Submit form
    await page.click('button:has-text("Sign in")');

    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('should show error on invalid credentials', async ({ page }) => {
    await page.goto('/signin');

    // Fill in signin form with wrong password
    await page.fill('input[placeholder="you@example.com"]', 'test@example.com');
    await page.fill('input[placeholder="••••••••"]', 'WrongPassword');

    // Submit form
    await page.click('button:has-text("Sign in")');

    // Should show error message
    const errorMessage = page.locator('text=/Invalid credentials|failed/i');
    await expect(errorMessage).toBeVisible();
  });
});
