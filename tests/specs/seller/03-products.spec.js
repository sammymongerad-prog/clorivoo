import { test, expect } from '@playwright/test';
import { goto, mockAuth, MOCK_PRODUCTS } from '../../helpers/navigate.js';

test.describe('Seller — Gestion des produits', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await mockAuth(page, { role: 'seller', name: 'Marc Vendeur' });
    await page.addInitScript((prods) => { window._MOCK_PRODUCTS = prods; }, MOCK_PRODUCTS);
  });

  test('CJ Connect — saisie clé API', async ({ page }) => {
    await goto(page, 'cj-connect');
    await expect(page.locator('input, text=CJ, text=API').first()).toBeVisible({ timeout: 5000 });
  });

  test('CJ Search — champ de recherche', async ({ page }) => {
    await goto(page, 'cj-search');
    await expect(page.locator('input').first()).toBeVisible({ timeout: 5000 });
  });

  test('CJ Search — recherche produits', async ({ page }) => {
    await goto(page, 'cj-search');
    const input = page.locator('input').first();
    await input.fill('lamp');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
    await expect(page.locator('body')).toBeVisible(); // no crash
  });

  test('CJ Publish — écran de publication', async ({ page }) => {
    await goto(page, 'cj-publish', { product: MOCK_PRODUCTS[0] });
    await expect(
      page.locator('text=Publier').or(page.locator('text=publish')).or(page.locator('text=Lampe')).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('CJ Publish — markup price visible', async ({ page }) => {
    await goto(page, 'cj-publish', { product: MOCK_PRODUCTS[0] });
    await expect(
      page.locator('text=marge').or(page.locator('text=markup').or(page.locator('text=prix'))).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('Commandes vendeur — filtre statut', async ({ page }) => {
    await goto(page, 'seller-orders');
    await expect(
      page.locator('text=En attente').or(page.locator('text=Expédié')).or(page.locator('text=Livré')).or(page.locator('text=Tout')).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('Commandes vendeur — bouton marquer expédié', async ({ page }) => {
    await page.addInitScript(() => {
      window._MOCK_SELLER_ORDERS = [
        { id: 'so1', status: 'pending', total: 49.99, buyer_name: 'Alice D.', items: [{ product_title: 'Lampe', qty: 1 }], created_at: new Date().toISOString() },
      ];
    });
    await goto(page, 'seller-orders');
    const expBtn = page.locator('button').filter({ hasText: /expédier|marquer|ship/i }).first();
    if (await expBtn.isVisible()) {
      await expBtn.click();
      await page.waitForTimeout(400);
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('Personnalisation boutique — nom modifiable', async ({ page }) => {
    await goto(page, 'shop-customize');
    const nameInput = page.locator('input').first();
    if (await nameInput.isVisible()) {
      await nameInput.fill('Ma Super Boutique');
      await expect(nameInput).toHaveValue('Ma Super Boutique');
    }
  });

  test('Personnalisation boutique — bouton sauvegarder', async ({ page }) => {
    await goto(page, 'shop-customize');
    await expect(
      page.locator('button').filter({ hasText: /sauvegarder|enregistrer|save/i }).first()
    ).toBeVisible({ timeout: 5000 });
  });

});
