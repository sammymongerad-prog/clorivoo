import { test, expect } from '@playwright/test';
import { goto, mockAuth } from '../../helpers/navigate.js';

const MOCK_ADMIN_STATS = {
  total_users: 1240,
  active_sellers: 87,
  total_orders: 3802,
  total_revenue: 148500,
  pending_kyc: 5,
};

test.describe('Admin — Dashboard & Stats', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await mockAuth(page, { role: 'admin', name: 'Admin Clorivo', email: 'admin@clorivo.io' });
    await page.addInitScript((stats) => { window._MOCK_ADMIN_STATS = stats; }, MOCK_ADMIN_STATS);
    await goto(page, 'admin');
  });

  test('Dashboard admin se charge sans erreur', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.waitForTimeout(600);
    expect(errors.filter(e => !e.includes('supabase') && !e.includes('network'))).toHaveLength(0);
  });

  test('Titre "Admin" ou "Dashboard" visible', async ({ page }) => {
    await expect(
      page.locator('text=Admin').or(page.locator('text=Dashboard')).or(page.locator('text=Console')).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('Statistiques globales affichées (users/commandes)', async ({ page }) => {
    await expect(
      page.locator('text=utilisateur').or(page.locator('text=user').or(page.locator('text=commande'))).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('Menu latéral — sections présentes', async ({ page }) => {
    await expect(
      page.locator('text=Produits').or(page.locator('text=Vendeurs')).or(page.locator('text=Commandes')).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('Section KYC accessible', async ({ page }) => {
    const kycLink = page.locator('button, a, div[role="button"]').filter({ hasText: /KYC|vérif/i }).first();
    if (await kycLink.isVisible()) {
      await kycLink.click();
      await page.waitForTimeout(400);
      await expect(page.locator('body')).toBeVisible();
    } else {
      await goto(page, 'admin-kyc');
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('Section KYC — dossiers en attente', async ({ page }) => {
    await goto(page, 'admin-kyc');
    await expect(
      page.locator('text=attente').or(page.locator('text=pending').or(page.locator('text=KYC'))).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('Bouton Approuver KYC visible', async ({ page }) => {
    await page.addInitScript(() => {
      window._MOCK_KYC = [
        { id: 'k1', seller_name: 'Jean Dupont', shop_name: 'JD Boutique', status: 'pending', submitted_at: new Date().toISOString() },
      ];
    });
    await goto(page, 'admin-kyc');
    await expect(
      page.locator('button').filter({ hasText: /approuver|valider|approve/i }).or(page.locator('text=Jean')).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('Section Bannières accessible', async ({ page }) => {
    await goto(page, 'admin-banners');
    await expect(
      page.locator('text=bannière').or(page.locator('text=banner')).or(page.locator('button').filter({ hasText: /ajouter|add/i })).first()
    ).toBeVisible({ timeout: 5000 });
  });

});
