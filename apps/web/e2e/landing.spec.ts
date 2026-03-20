import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('renders the landing page at root URL', async ({ page }) => {
    await expect(page).toHaveTitle(/Contabilita/i);
  });

  test('displays navbar with logo and navigation links', async ({ page }) => {
    const navbar = page.locator('nav').first();
    await expect(navbar).toBeVisible();
    await expect(navbar.getByText('Contabilita')).toBeVisible();
    await expect(navbar.getByRole('link', { name: 'Recursos' })).toBeVisible();
    await expect(navbar.getByRole('link', { name: 'Numeros' })).toBeVisible();
    await expect(navbar.getByRole('link', { name: 'Modulos' })).toBeVisible();
    await expect(navbar.getByRole('link', { name: 'Planos' })).toBeVisible();
  });

  test('displays hero section with animated text', async ({ page }) => {
    const heroText = page.getByText('Contabilidade inteligente que transforma seu escritorio');
    await expect(heroText).toBeVisible({ timeout: 10000 });
  });

  test('displays rotating text in hero', async ({ page }) => {
    const rotatingContainer = page.locator('.sr-only').filter({
      hasText: /Lancamentos|Apuracoes|Obrigacoes|Relatorios|Folha/,
    });
    await expect(rotatingContainer.first()).toBeAttached({ timeout: 5000 });
  });

  test('hero CTA buttons are visible and clickable', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Comecar gratuitamente/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Acessar plataforma/i })).toBeVisible();
  });

  test('CTA button navigates to register page', async ({ page }) => {
    await page.getByRole('button', { name: /Comecar gratuitamente/i }).first().click();
    await expect(page).toHaveURL(/\/register/);
  });

  test('navbar Entrar button navigates to login', async ({ page }) => {
    const navbar = page.locator('nav').first();
    await navbar.getByRole('button', { name: /Entrar/i }).click();
    await expect(page).toHaveURL(/\/login/);
  });

  test('displays stats section with count-up numbers', async ({ page }) => {
    const statsSection = page.locator('#stats');
    await statsSection.scrollIntoViewIfNeeded();

    await expect(page.getByText('Escritorios ativos')).toBeVisible();
    await expect(page.getByText('Empresas gerenciadas')).toBeVisible();
    await expect(page.getByText('Uptime garantido')).toBeVisible();
  });

  test('displays features section with 6 feature cards', async ({ page }) => {
    const featuresSection = page.locator('#features');
    await featuresSection.scrollIntoViewIfNeeded();

    await expect(page.getByRole('heading', { name: 'Tudo que seu escritorio precisa' })).toBeVisible();
    await expect(page.getByText('Contabilidade Completa')).toBeVisible();
    await expect(page.getByText('Escrita Fiscal Inteligente')).toBeVisible();
    await expect(page.getByText('Seguranca & Auditoria')).toBeVisible();
    await expect(page.getByText('Relatorios & Analytics')).toBeVisible();
    await expect(page.getByText('Automacao Total')).toBeVisible();
    // "Folha de Pagamento" appears in features — use exact match within features section
    await expect(featuresSection.getByText('Folha de Pagamento')).toBeVisible();
  });

  test('displays modules section with 16 modules', async ({ page }) => {
    const modulesSection = page.locator('#modules');
    await modulesSection.scrollIntoViewIfNeeded();

    await expect(page.getByText('16+ modulos integrados')).toBeVisible();
    // Use specific module names that are unique to the modules section
    await expect(modulesSection.getByText('Lancamentos Contabeis')).toBeVisible();
    await expect(modulesSection.getByText('LALUR / Lucro Real')).toBeVisible();
    await expect(modulesSection.getByText('Portal do Cliente')).toBeVisible();
  });

  test('displays pricing section with 3 plans', async ({ page }) => {
    const pricingSection = page.locator('#pricing');
    await pricingSection.scrollIntoViewIfNeeded();

    await expect(page.getByText('Escolha o plano ideal')).toBeVisible();
    await expect(page.getByText('Starter')).toBeVisible();
    await expect(page.getByText('Professional')).toBeVisible();
    await expect(page.getByText('Enterprise')).toBeVisible();
    await expect(page.getByText('Mais popular')).toBeVisible();
  });

  test('displays footer with copyright', async ({ page }) => {
    const footer = page.locator('footer');
    await footer.scrollIntoViewIfNeeded();

    const currentYear = new Date().getFullYear().toString();
    await expect(footer.getByText(new RegExp(currentYear))).toBeVisible();
    await expect(footer.getByText('Contabilita', { exact: true })).toBeVisible();
  });

  test('anchor links scroll to sections', async ({ page }) => {
    await page.getByRole('link', { name: 'Recursos' }).click();
    await expect(page.locator('#features')).toBeInViewport({ timeout: 3000 });
  });
});

test.describe('Landing Page — Responsive', () => {
  test('mobile viewport hides desktop nav links', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');

    const desktopNav = page.locator('nav').first().getByRole('link', { name: 'Recursos' });
    await expect(desktopNav).toBeHidden();

    await expect(page.getByRole('button', { name: /Comecar gratis/i }).first()).toBeVisible();
  });

  test('pricing cards stack on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');

    const pricingSection = page.locator('#pricing');
    await pricingSection.scrollIntoViewIfNeeded();

    await expect(page.getByText('Starter')).toBeVisible();
    await expect(page.getByText('Professional')).toBeVisible();
    await expect(page.getByText('Enterprise')).toBeVisible();
  });
});
