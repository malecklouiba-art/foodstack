import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('login page renders correctly', async ({ page }) => {
    await page.goto('/auth/login');

    await expect(page.getByText('Connexion')).toBeVisible();
    await expect(page.getByPlaceholder('vous@exemple.fr')).toBeVisible();
    await expect(page.getByPlaceholder('••••••••')).toBeVisible();
    await expect(page.getByRole('button', { name: /se connecter/i })).toBeVisible();
  });

  test('register page renders correctly', async ({ page }) => {
    await page.goto('/auth/register');

    await expect(page.getByRole('button', { name: /créer un compte/i })).toBeVisible();
  });

  test('login link from register page navigates to login', async ({ page }) => {
    await page.goto('/auth/register');

    const loginLink = page.getByRole('link', { name: /connexion/i }).first();
    await loginLink.click();

    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('register link from login page navigates to register', async ({ page }) => {
    await page.goto('/auth/login');

    const registerLink = page.getByRole('link', { name: /inscription|créer/i }).first();
    await registerLink.click();

    await expect(page).toHaveURL(/\/auth\/register/);
  });

  test('login form shows error on invalid credentials', async ({ page }) => {
    await page.goto('/auth/login');

    await page.getByPlaceholder('vous@exemple.fr').fill('invalid@test.com');
    await page.getByPlaceholder('••••••••').fill('wrongpassword');
    await page.getByRole('button', { name: /se connecter/i }).click();

    await expect(
      page.getByText(/identifiants|incorrect|invalide|erreur/i),
    ).toBeVisible({ timeout: 10000 });
  });

  test('redirects unauthenticated users from protected pages', async ({ page }) => {
    await page.goto('/dashboard');

    await expect(page).toHaveURL(/\/auth\/login|\/\?/);
  });
});
