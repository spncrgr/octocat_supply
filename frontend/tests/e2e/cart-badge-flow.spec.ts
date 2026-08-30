import { test, expect } from '@playwright/test';

test.describe('Cart badge and subtotal flow', () => {
  test('adds two products, validates subtotal, then removes one item', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.goto('/products');

    await expect(page.locator('h1:has-text("Products")')).toBeVisible();

    // Add SmartFeeder One with quantity 1
    await page.locator('#increase-qty-1').click();
    await page.locator('#add-to-cart-1').click();

    // Add Smart Fountain Flow+ with quantity 1
    await page.locator('#increase-qty-7').click();
    await page.locator('#add-to-cart-7').click();

    const cartBadge = page.locator('a[aria-label^="Open cart with"] span').first();
    await expect(cartBadge).toHaveText('2');

    // Open the cart page and confirm the subtotal is correct.
    await page.locator('a[aria-label^="Open cart with"]').first().click();
    await expect(page).toHaveURL(/\/cart/);
    await expect(page.locator('h1:has-text("Your Cart")')).toBeVisible();

    const subtotalRow = page.locator('div').filter({ hasText: 'Subtotal' }).filter({ hasText: '$149.99' }).first();
    await expect(subtotalRow).toContainText('$149.99');

    await page.locator('button[aria-label^="Remove "]').first().click();

    const badgeAfterRemoval = page.locator('a[aria-label^="Open cart with"] span').first();
    await expect(badgeAfterRemoval).toHaveText('1');
  });
});
