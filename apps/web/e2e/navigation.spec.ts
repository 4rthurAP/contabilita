import { test, expect } from '@playwright/test';

test.describe('Navigation & Routing', () => {
  test('root URL serves landing page, not dashboard', async ({ page }) => {
    await page.goto('/');

    // Landing page markers
    await expect(page.getByText('Comecar gratuitamente').first()).toBeVisible({ timeout: 10000 });

    // Should NOT have dashboard sidebar
    const sidebar = page.locator('aside');
    await expect(sidebar).toBeHidden();
  });

  test('all public routes are accessible without auth', async ({ page }) => {
    // Landing
    await page.goto('/');
    await expect(page).toHaveURL('/');

    // Login
    await page.goto('/login');
    await expect(page).toHaveURL('/login');

    // Register
    await page.goto('/register');
    await expect(page).toHaveURL('/register');
  });

  test('landing page navbar links have correct href anchors', async ({ page }) => {
    await page.goto('/');

    const resourcesLink = page.locator('a[href="#features"]');
    await expect(resourcesLink).toBeAttached();

    const statsLink = page.locator('a[href="#stats"]');
    await expect(statsLink).toBeAttached();

    const modulesLink = page.locator('a[href="#modules"]');
    await expect(modulesLink).toBeAttached();

    const pricingLink = page.locator('a[href="#pricing"]');
    await expect(pricingLink).toBeAttached();
  });

  test('landing page has no horizontal overflow', async ({ page }) => {
    await page.goto('/');

    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);

    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1); // 1px tolerance
  });

  test('mobile landing page has no horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');

    // Wait for content to render
    await page.waitForTimeout(1000);

    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);

    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1);
  });
});

test.describe('Visual & Animation Checks', () => {
  test('landing page dark theme background is applied', async ({ page }) => {
    await page.goto('/');

    const bgColor = await page.evaluate(() => {
      const el = document.querySelector('div.min-h-screen');
      return el ? getComputedStyle(el).backgroundColor : null;
    });

    // Should be dark (#09090b or similar)
    expect(bgColor).toBeTruthy();
    // rgb(9, 9, 11) = #09090b
    expect(bgColor).toMatch(/rgb\(9,\s*9,\s*11\)/);
  });

  test('gradient text animation renders', async ({ page }) => {
    await page.goto('/');

    // GradientText uses bg-clip-text + text-transparent
    const gradientElements = page.locator('.bg-clip-text');
    const count = await gradientElements.count();
    expect(count).toBeGreaterThan(0);
  });

  test('noise overlay is present', async ({ page }) => {
    await page.goto('/');

    const noiseOverlay = page.locator('.pointer-events-none.fixed.inset-0');
    await expect(noiseOverlay.first()).toBeAttached();
  });
});
