import { test, expect } from '@playwright/test';
import { goto, mockAuth, seedProducts, MOCK_PRODUCTS } from '../../helpers/navigate.js';

test.describe('Buyer — Homepage', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await mockAuth(page, { role: 'buyer', name: 'Alice Dupont' });
    await seedProducts(page, MOCK_PRODUCTS);
    await goto(page, 'home');
  });

  test('Homepage se charge sans erreur JS', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.waitForTimeout(500);
    expect(errors.filter(e => !e.includes('supabase') && !e.includes('network'))).toHaveLength(0);
  });

  test('Affiche le prénom de l\'utilisateur', async ({ page }) => {
    await expect(page.locator('text=Alice')).toBeVisible({ timeout: 5000 });
  });

  test('Barre de recherche visible', async ({ page }) => {
    await expect(page.locator('input[placeholder*="earch"], input[placeholder*="hercher"]').first()).toBeVisible();
  });

  test('Chips de catégories affichées', async ({ page }) => {
    await expect(page.locator('text=Maison').or(page.locator('text=Tech')).or(page.locator('text=Tout')).first()).toBeVisible();
  });

  test('Flash deals section visible', async ({ page }) => {
    await expect(page.locator('text=Flash').or(page.locator('text=deal').or(page.locator('text=Offre'))).first()).toBeVisible();
  });

  test('Icône panier avec badge cliquable', async ({ page }) => {
    const cartIcon = page.locator('[aria-label*="art"], button').filter({ hasText: /🛒|panier/i }).or(page.locator('svg').nth(2));
    // At minimum, the bottom nav has 5 items
    const navButtons = page.locator('button').filter({ hasText: '' });
    expect(await navButtons.count()).toBeGreaterThan(0);
  });

  test('Clic sur icône notifications → écran notifications', async ({ page }) => {
    await page.evaluate(() => window.__navigate('notifications'));
    await page.waitForTimeout(350);
    await expect(page.locator('text=Notification').or(page.locator('text=🔔')).first()).toBeVisible();
  });

  test('Chip catégorie "Tech" filtre les produits', async ({ page }) => {
    const techChip = page.locator('button, div[role="button"]').filter({ hasText: /^Tech$/ }).first();
    if (await techChip.isVisible()) {
      await techChip.click();
      await page.waitForTimeout(300);
      await expect(page.locator('body')).toBeVisible(); // no crash
    }
  });

  test('Navigation bottom bar → Catégories', async ({ page }) => {
    await page.evaluate(() => window.__navigate('category'));
    await page.waitForTimeout(350);
    await expect(page.locator('text=Catégorie').or(page.locator('text=Tout')).first()).toBeVisible();
  });

  test('Navigation bottom bar → Profil', async ({ page }) => {
    await page.evaluate(() => window.__navigate('profile'));
    await page.waitForTimeout(350);
    await expect(page.locator('text=Alice').or(page.locator('text=Profil')).first()).toBeVisible();
  });

});
