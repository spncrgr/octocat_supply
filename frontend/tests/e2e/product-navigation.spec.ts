import { test, expect } from '@playwright/test';

function extractCurrencyValue(value: string): number {
  const normalized = value.replace(/,/g, '');
  const match = normalized.match(/\$([0-9]+(?:\.[0-9]{1,2})?)/);
  if (!match) {
    throw new Error(`Unable to extract currency value from "${value}"`);
  }

  return Number.parseFloat(match[1]);
}

/**
 * Product catalog discovery E2E tests
 * Implements: frontend/tests/features/product-navigation.feature
 *
 * Covers:
 * - Navigation from home page to product catalog
 * - Product search with valid matches
 * - Product search with no matches (empty state)
 */

test.describe('Product catalog discovery', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate away from about:blank so localStorage context is available
    await page.goto('/');
  });

  test('Navigate from the home page to the product catalog', async ({ page }) => {
    // Given I am on the home page
    await page.goto('/');
    await expect(page.locator('h1:has-text("Smart Cat Tech")')).toBeVisible();

    // When I select the Products navigation link
    await page.click('nav a:has-text("Products")');

    // Then I land on the product catalog page
    await expect(page).toHaveURL(/\/products/);

    // And I see the catalog header "Products"
    await expect(page.locator('h1:has-text("Products")')).toBeVisible();
  });

  test('Search for a product by name', async ({ page }) => {
    // Given I am viewing the product catalog
    await page.goto('/products');
    await expect(page.locator('h1:has-text("Products")')).toBeVisible();

    // And the catalog includes "SmartFeeder One"
    // Wait for product grid to load
    const productGrid = page.locator('div[class*="grid"]').filter({ hasText: 'SmartFeeder One' });
    await expect(productGrid).toBeVisible();

    // When I search for "SmartFeeder"
    const searchInput = page.locator('input[aria-label="Search products"]');
    await searchInput.fill('SmartFeeder');

    // Then the results list shows "SmartFeeder One"
    const productCard = page.locator('h3:has-text("SmartFeeder One")');
    await expect(productCard).toBeVisible();

    // And the product description is visible in the results
    const description = page.locator('text=/AI-powered feeder.*nap cycles/i').first();
    await expect(description).toBeVisible();
  });

  test('Search for a product with no matches', async ({ page }) => {
    // Given I am viewing the product catalog
    await page.goto('/products');
    await expect(page.locator('h1:has-text("Products")')).toBeVisible();

    // Wait for initial products to load
    await expect(page.locator('div[class*="grid"]').first()).toBeVisible();

    // When I search for "Space Tuna"
    const searchInput = page.locator('input[aria-label="Search products"]');
    await searchInput.fill('Space Tuna');

    // Then I see the empty state message "No products found"
    const emptyState = page.locator('[role="status"]');
    await expect(emptyState).toContainText('No products found');

    // And I am prompted to adjust the search filters
    await expect(emptyState).toContainText(/clearing.*changing.*search filters/i);
  });

  test('Add and remove products in the cart', async ({ page }) => {
    // Given I am viewing the product catalog
    await page.goto('/products');
    await expect(page.locator('h1:has-text("Products")')).toBeVisible();

    // When I increase the quantity of a product and add it to the cart
    const increaseQuantityButton = page.locator('[id^="increase-qty-"]').first();
    await increaseQuantityButton.click();
    await increaseQuantityButton.click();
    const addToCartButton = page.locator('[id^="add-to-cart-"]').first();
    await addToCartButton.click();

    // Then the cart badge updates with the selected quantity
    const cartIconLink = page.locator('a[aria-label^="Open cart with"]');
    await expect(cartIconLink).toHaveAttribute('aria-label', /Open cart with 2 items/);

    // When I open the cart page
    await cartIconLink.click();
    await expect(page).toHaveURL(/\/cart/);
    await expect(page.locator('h2:has-text("Order Summary")')).toBeVisible();

    // And shipping and total follow the cart pricing rule
    const subtotalValueText = await page
      .locator('div.flex.justify-between.text-lg')
      .filter({ hasText: 'Subtotal' })
      .first()
      .locator('span')
      .last()
      .innerText();
    const shippingValueText = await page
      .locator('div.flex.justify-between.text-lg')
      .filter({ hasText: 'Shipping' })
      .first()
      .locator('span')
      .last()
      .innerText();
    const grandTotalValueText = await page
      .locator('div.flex.justify-between.text-2xl')
      .filter({ hasText: 'Grand Total' })
      .first()
      .locator('span')
      .last()
      .innerText();

    const subtotal = extractCurrencyValue(subtotalValueText);
    const shipping = extractCurrencyValue(shippingValueText);
    const grandTotal = extractCurrencyValue(grandTotalValueText);
    const expectedShipping = subtotal === 0 ? 0 : subtotal > 100 ? 0 : 25;
    const expectedGrandTotal = subtotal + expectedShipping;

    expect(shipping).toBeCloseTo(expectedShipping, 2);
    expect(grandTotal).toBeCloseTo(expectedGrandTotal, 2);

    // And I remove the item from the cart
    await page.locator('button[aria-label^="Remove "]').first().click();

    // Then I see the empty cart state
    await expect(page.locator('h1:has-text("Your Cart")')).toBeVisible();
    await expect(page.locator('text=Your cart is currently empty.')).toBeVisible();
    await expect(cartIconLink).toHaveAttribute('aria-label', /Open cart with 0 items/);
  });
});
