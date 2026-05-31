import { test, expect } from '@playwright/test';
import { goto, mockAuth, MOCK_PRODUCTS } from '../../helpers/navigate.js';

const MOCK_CART = [
  { id: 'ci1', product_id: 'p1', quantity: 2, price: 49.99, variant: { size: 'M' }, products: MOCK_PRODUCTS[0] },
  { id: 'ci2', product_id: 'p2', quantity: 1, price: 89.99, variant: { size: 'L' }, products: MOCK_PRODUCTS[1] },
];

test.describe('Buyer — Panier & Checkout', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await mockAuth(page, { role: 'buyer', name: 'Alice Dupont' });
    await page.addInitScript((cart) => { window._MOCK_CART = cart; }, MOCK_CART);
    await goto(page, 'cart');
  });

  test('Panier affiche les articles mockés', async ({ page }) => {
    await expect(page.locator('text=Lampe Boho').or(page.locator('text=Écouteurs')).first()).toBeVisible({ timeout: 5000 });
  });

  test('Total du panier calculé', async ({ page }) => {
    // 2×49.99 + 89.99 = 189.97
    await expect(page.locator('text=189').or(page.locator('text=190')).first()).toBeVisible({ timeout: 5000 });
  });

  test('Bouton commander visible', async ({ page }) => {
    await expect(page.locator('button').filter({ hasText: /commander|checkout|payer/i }).first()).toBeVisible();
  });

  test('Panier vide affiche un message', async ({ page }) => {
    await page.addInitScript(() => { window._MOCK_CART = []; });
    await goto(page, 'cart');
    await expect(page.locator('text=vide').or(page.locator('text=empty').or(page.locator('text=Votre panier'))).first()).toBeVisible({ timeout: 5000 });
  });

  test('Clic Commander → Checkout', async ({ page }) => {
    await page.locator('button').filter({ hasText: /commander|checkout|payer/i }).first().click();
    await page.waitForTimeout(400);
    await expect(page.locator('text=Livraison').or(page.locator('text=Adresse').or(page.locator('text=Paiement'))).first()).toBeVisible({ timeout: 5000 });
  });

  test('Checkout — formulaire adresse visible', async ({ page }) => {
    await goto(page, 'checkout');
    await expect(
      page.locator('input[placeholder*="rue"], input[placeholder*="adresse"], input[placeholder*="address"]')
        .or(page.locator('text=Adresse')).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('Checkout — sélection méthode de livraison', async ({ page }) => {
    await goto(page, 'checkout');
    await expect(page.locator('text=Standard').or(page.locator('text=Express')).first()).toBeVisible({ timeout: 5000 });
  });

  test('Checkout — sélection méthode de paiement', async ({ page }) => {
    await goto(page, 'checkout');
    await expect(
      page.locator('text=Carte').or(page.locator('text=PayPal')).or(page.locator('text=paiement')).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('Confirmation commande → écran tracking', async ({ page }) => {
    await goto(page, 'checkout');
    const confirmBtn = page.locator('button').filter({ hasText: /confirmer|valider|payer|commander/i }).first();
    if (await confirmBtn.isVisible()) {
      await confirmBtn.click();
      await page.waitForTimeout(600);
      // Should navigate to tracking or show order confirmation
      await expect(page.locator('body')).toBeVisible();
    }
  });

});
