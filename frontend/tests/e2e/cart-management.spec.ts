import { expect, test } from '@playwright/test';

/**
 * Cart workflow E2E tests
 * Implements: frontend/tests/features/cart-management.feature
 *
 * Covers:
 * - Empty cart state
 * - Adding a product to the cart from the product catalog
 * - Updating quantity inside the cart
 * - Removing items and returning to the empty state
 */

test.describe('Cart page management', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/');
  });

  test('View the empty cart state', async ({ page }) => {
    // Given I am on the cart page with no items
    await page.goto('/cart');

    // Then I see the heading "Your Cart"
    await expect(page.locator('h1:has-text("Your Cart")')).toBeVisible();

    // And I see the message "Your cart is currently empty."
    await expect(page.locator('text=Your cart is currently empty.')).toBeVisible();

    // And I can browse products from the empty cart state
    await page.locator('a:has-text("Browse Products")').click();
    await expect(page).toHaveURL(/\/products/);
  });

  test('Add a product and review the order summary', async ({ page }) => {
    // Given I am viewing the product catalog
    await page.goto('/products');
    await expect(page.locator('h1:has-text("Products")')).toBeVisible();

    // When I add "SmartFeeder One" to the cart with a quantity of 2
    const productCard = page
      .locator('h3:has-text("SmartFeeder One")')
      .locator('xpath=ancestor::div[contains(@class, "rounded-lg")][1]');
    const increaseQuantityButton = productCard.locator('[id^="increase-qty-"]');
    const quantityBadge = productCard.locator('[id^="qty-"]');
    const addToCartButton = productCard.locator('[id^="add-to-cart-"]');

    await increaseQuantityButton.click();
    await increaseQuantityButton.click();
    await expect(quantityBadge).toHaveText('2');
    await expect(addToCartButton).toHaveAttribute('aria-label', /Add 2 .* to cart/);
    await addToCartButton.click();

    // Then the cart badge shows "Open cart with 2 items"
    const cartIconLink = page.locator('a[aria-label^="Open cart with"]');
    await expect(cartIconLink).toHaveAttribute('aria-label', /Open cart with 2 items/);

    // And I land on the cart page
    await cartIconLink.click();
    await expect(page).toHaveURL(/\/cart/);

    // And I see the product in the cart table
    await expect(page.locator('td').filter({ hasText: 'SmartFeeder One' }).first()).toBeVisible();

    // And I see the order summary panel
    await expect(page.locator('h2:has-text("Order Summary")')).toBeVisible();
  });

  test('Update product quantity inside the cart', async ({ page }) => {
    // Given I have "SmartFeeder One" in my cart
    await page.goto('/products');
    await page.locator('[id^="increase-qty-"]').first().click();
    await page.locator('[id^="add-to-cart-"]').first().click();

    const cartIconLink = page.locator('a[aria-label^="Open cart with"]');
    await cartIconLink.click();
    await expect(page).toHaveURL(/\/cart/);

    // When I change the quantity to 3
    const quantityInput = page.locator('input[aria-label^="Quantity for "]').first();
    await quantityInput.fill('3');
    await quantityInput.blur();

    // Then the quantity input shows 3
    await expect(quantityInput).toHaveValue('3');

    // And the cart badge shows "Open cart with 3 items"
    await expect(cartIconLink).toHaveAttribute('aria-label', /Open cart with 3 items/);
  });

  test('Remove a product and return to the empty cart state', async ({ page }) => {
    // Given I have a product in my cart
    await page.goto('/products');
    await page.locator('[id^="increase-qty-"]').first().click();
    await page.locator('[id^="add-to-cart-"]').first().click();

    // When I remove the product from the cart
    await page.locator('a[aria-label^="Open cart with"]').click();
    await page.locator('button[aria-label^="Remove "]').first().click();

    // Then the product is no longer listed
    await expect(page.locator('td').filter({ hasText: 'SmartFeeder One' })).toHaveCount(0);

    // And I see the message "Your cart is currently empty."
    await expect(page.locator('text=Your cart is currently empty.')).toBeVisible();
    await expect(page.locator('a[aria-label^="Open cart with"]').first()).toHaveAttribute('aria-label', /Open cart with 0 items/);
  });
});
