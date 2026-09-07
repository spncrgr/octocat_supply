import { expect, test } from '@playwright/test';

test.describe('Purchase order management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/purchase-orders');
    await expect(page.locator('h1:has-text("Purchase Orders")')).toBeVisible();
  });

  test('creates a draft purchase order with line items', async ({ page }) => {
    await page.locator('input[type="number"]').first().fill('1');
    await page.locator('input[type="number"]').nth(1).fill('1');
    await page.locator('input[type="text"]').fill('buyer-demo');
    await page.locator('input[aria-label="Line item 1 product id"]').fill('1');
    await page.locator('input[aria-label="Line item 1 quantity"]').fill('2');
    await page.locator('input[aria-label="Line item 1 expected price"]').fill('500');

    await page.getByRole('button', { name: 'Create Draft' }).click();

    await expect(page.locator('text=PO #')).toBeVisible();
    await expect(page.locator('text=Draft')).toBeVisible();
  });

  test('submits a draft to notify the supplier', async ({ page }) => {
    await page.locator('input[aria-label="Line item 1 product id"]').fill('1');
    await page.locator('input[aria-label="Line item 1 quantity"]').fill('2');
    await page.locator('input[aria-label="Line item 1 expected price"]').fill('500');
    await page.getByRole('button', { name: 'Create Draft' }).click();

    await page.getByRole('button', { name: 'Submit Purchase Order' }).click();

    await expect(page.locator('text=Submitted')).toBeVisible();
    await expect(page.locator('text=Latest Notification')).toBeVisible();
  });

  test('approves a high-value purchase order before fulfillment', async ({ page }) => {
    await page.locator('input[aria-label="Line item 1 product id"]').fill('1');
    await page.locator('input[aria-label="Line item 1 quantity"]').fill('21');
    await page.locator('input[aria-label="Line item 1 expected price"]').fill('500');
    await page.getByRole('button', { name: 'Create Draft' }).click();
    await page.getByRole('button', { name: 'Submit Purchase Order' }).click();

    await page.locator('input[placeholder="Approver user ID"]').fill('manager-1');
    await page.getByRole('button', { name: 'Approve' }).click();

    await expect(page.locator('text=Approved')).toBeVisible();
    await expect(page.locator('text=Approval complete')).toBeVisible();
  });

  test('fulfills an approved order', async ({ page }) => {
    await page.locator('input[aria-label="Line item 1 product id"]').fill('1');
    await page.locator('input[aria-label="Line item 1 quantity"]').fill('21');
    await page.locator('input[aria-label="Line item 1 expected price"]').fill('500');
    await page.getByRole('button', { name: 'Create Draft' }).click();
    await page.getByRole('button', { name: 'Submit Purchase Order' }).click();

    await page.locator('input[placeholder="Approver user ID"]').fill('manager-1');
    await page.getByRole('button', { name: 'Approve' }).click();
    await page.getByRole('button', { name: 'Mark Fulfilled' }).click();

    await expect(page.locator('text=Fulfilled')).toBeVisible();
  });
});
