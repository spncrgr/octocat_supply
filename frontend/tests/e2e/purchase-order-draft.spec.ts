import { expect, test } from '@playwright/test';

test.describe('Purchase order draft flow', () => {
  test('opens purchase order page and shows draft form', async ({ page }) => {
    await page.goto('/purchase-orders');

    await expect(page.locator('h1:has-text("Purchase Orders")')).toBeVisible();
    await expect(page.locator('h2:has-text("Create Draft Purchase Order")')).toBeVisible();
    await expect(page.locator('button:has-text("Create Draft")')).toBeVisible();
  });
});
