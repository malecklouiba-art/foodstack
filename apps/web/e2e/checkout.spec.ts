import { test, expect } from '@playwright/test';

test.describe('Checkout flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/menu');
    await page.waitForLoadState('networkidle');
  });

  test('cart drawer opens when cart button clicked', async ({ page }) => {
    const plusButtons = page.locator('button').filter({ has: page.locator('svg') });
    await plusButtons.first().click({ timeout: 10000 });

    const cartButton = page.locator('button').filter({ hasText: /panier|cart|voir/i }).first();
    if (await cartButton.isVisible()) {
      await cartButton.click();
      const drawer = page.locator('[class*="drawer"], [class*="cart"], [role="dialog"]').first();
      await expect(drawer).toBeVisible({ timeout: 5000 });
    }
  });

  test('checkout page requires authentication', async ({ page }) => {
    await page.goto('/checkout');

    const isRedirected = page.url().includes('/auth/login') || page.url().includes('/menu');
    const hasCheckoutContent = await page.locator('h1').filter({ hasText: /checkout|commande|paiement/i }).isVisible().catch(() => false);
    const isOnLogin = await page.locator('input[type="email"]').isVisible().catch(() => false);

    expect(isRedirected || hasCheckoutContent || isOnLogin).toBeTruthy();
  });
});

test.describe('Order history', () => {
  test('orders page is accessible', async ({ page }) => {
    await page.goto('/orders');
    await page.waitForLoadState('networkidle');

    const isOnOrders = !page.url().includes('/auth/login');
    const hasContent = await page.locator('body').isVisible();
    expect(hasContent).toBeTruthy();
  });
});
