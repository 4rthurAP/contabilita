import { test, expect } from '@playwright/test';

test.describe('Authentication Pages', () => {
  test('login page renders correctly', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('#email')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.getByRole('button', { name: /Entrar/i })).toBeVisible();
  });

  test('login page has link to register', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('link', { name: /Criar conta/i })).toBeVisible({ timeout: 10000 });
  });

  test('register page renders correctly', async ({ page }) => {
    await page.goto('/register');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('#name')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#cpf')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.getByRole('button', { name: /Criar conta/i })).toBeVisible();
  });

  test('register page has link to login', async ({ page }) => {
    await page.goto('/register');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('link', { name: /Entrar/i })).toBeVisible({ timeout: 10000 });
  });

  test('unauthenticated access to /app redirects to login', async ({ page }) => {
    // Ensure no tokens
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    });

    await page.goto('/app');
    await page.waitForLoadState('networkidle');
    // ProtectedRoute checks localStorage — no token → redirect to /login
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });

  test('login form validates on empty submit', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    const submitBtn = page.getByRole('button', { name: /Entrar/i });
    await expect(submitBtn).toBeVisible({ timeout: 10000 });
    await submitBtn.click();

    // Zod validation keeps us on the login page
    await expect(page).toHaveURL(/\/login/);
  });
});
