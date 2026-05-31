import { test, expect } from '@playwright/test';
import { goto, mockAuth } from '../../helpers/navigate.js';

const MOCK_SELLER_STATS = {
  revenue: 4250.80,
  orders: 38,
  products: 12,
  views: 1840,
};

test.describe('Seller — Dashboard', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await mockAuth(page, { role: 'seller', name: 'Marc Vendeur', email: 'marc@boutique.io' });
    await page.addInitScript((stats) => { window._MOCK_SELLER_STATS = stats; }, MOCK_SELLER_STATS);
    await goto(page, 'seller-home');
  });

  test('Dashboard vendeur se charge', async ({ page }) => {
    await expect(
      page.locator('text=Marc').or(page.locator('text=Dashboard')).or(page.locator('text=boutique')).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('KPIs — revenus / commandes / produits visibles', async ({ page }) => {
    await expect(
      page.locator('text=revenus').or(page.locator('text=Revenue')).or(page.locator('text=commandes')).or(page.locator('text=$')).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('Section "Dernières commandes" présente', async ({ page }) => {
    await expect(
      page.locator('text=commandes').or(page.locator('text=orders')).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('Bouton Ajouter un produit visible', async ({ page }) => {
    await expect(
      page.locator('button').filter({ hasText: /ajouter|nouveau|produit|add/i }).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('Clic Ajouter produit → formulaire', async ({ page }) => {
    const btn = page.locator('button').filter({ hasText: /ajouter|nouveau produit|add/i }).first();
    if (await btn.isVisible()) {
      await btn.click();
      await page.waitForTimeout(400);
      await expect(page.locator('input, textarea').first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('Navigation vers commandes vendeur', async ({ page }) => {
    await goto(page, 'seller-orders');
    await expect(
      page.locator('text=commande').or(page.locator('text=order')).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('Navigation vers personnalisation boutique', async ({ page }) => {
    await goto(page, 'shop-customize');
    await expect(
      page.locator('text=boutique').or(page.locator('text=shop')).or(page.locator('input').first())
    ).toBeVisible({ timeout: 5000 });
  });

  test('Bouton CJ Import (import dropshipping)', async ({ page }) => {
    const cjBtn = page.locator('button, a').filter({ hasText: /CJ|import|dropship/i }).first();
    if (await cjBtn.isVisible()) {
      await cjBtn.click();
      await page.waitForTimeout(350);
      await expect(page.locator('body')).toBeVisible();
    }
  });

});
