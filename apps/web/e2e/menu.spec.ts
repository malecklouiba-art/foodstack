import { test, expect } from '@playwright/test';

test.describe('Menu page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/menu');
  });

  test('menu page loads and shows items', async ({ page }) => {
    await expect(page.getByRole('heading').first()).toBeVisible();

    const menuItems = page.locator('[class*="card"], [class*="item"]').first();
    await expect(menuItems).toBeVisible({ timeout: 10000 });
  });

  test('add to cart button works', async ({ page }) => {
    const addButton = page.locator('button').filter({ has: page.locator('svg') }).first();
    await expect(addButton).toBeVisible({ timeout: 10000 });

    await addButton.click();

    const cartIndicator = page.locator('[class*="cart"], [class*="badge"]').filter({
      hasText: /[1-9]/,
    });
    await expect(cartIndicator).toBeVisible({ timeout: 5000 });
  });

  test('cart count increments on add', async ({ page }) => {
    const plusButtons = page.locator('button').filter({ has: page.locator('svg') });
    const firstBtn = plusButtons.first();
    await expect(firstBtn).toBeVisible({ timeout: 10000 });

    await firstBtn.click();
    await firstBtn.click();

    const badge = page.locator('[class*="badge"], [class*="count"]').filter({ hasText: /[2-9]/ });
    await expect(badge).toBeVisible({ timeout: 5000 });
  });
});
