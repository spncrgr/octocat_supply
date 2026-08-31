import { expect, test } from '@playwright/test';

test.describe('Purchase order submit and notification panel', () => {
  test('shows submission and notification sections', async ({ page }) => {
    await page.goto('/purchase-orders');

    await expect(page.locator('h1:has-text("Purchase Orders")')).toBeVisible();
    await expect(page.locator('text=Submission & Notification')).toBeVisible();
  });
});
