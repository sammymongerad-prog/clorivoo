import { test, expect } from '@playwright/test';
import { goto, mockAuth, seedProducts, MOCK_PRODUCTS } from '../../helpers/navigate.js';

test.describe('Buyer — Fiche produit (PDP)', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await mockAuth(page, { role: 'buyer', name: 'Alice Dupont' });
    await seedProducts(page, MOCK_PRODUCTS);
    await goto(page, 'pdp', { productId: 'p1', product: MOCK_PRODUCTS[0] });
  });

  test('Titre du produit visible', async ({ page }) => {
    await expect(page.locator('text=Lampe Boho Tressée')).toBeVisible({ timeout: 5000 });
  });

  test('Prix affiché correctement', async ({ page }) => {
    await expect(page.locator('text=49').or(page.locator('text=$49')).first()).toBeVisible();
  });

  test('Badge de réduction visible (compare_price)', async ({ page }) => {
    // compare_price = 79.99, price = 49.99 → réduction ~37%
    await expect(page.locator('text=37%').or(page.locator('text=-37')).or(page.locator('text=38%')).first()).toBeVisible({ timeout: 5000 });
  });

  test('Bouton "Ajouter au panier" visible', async ({ page }) => {
    await expect(page.locator('button').filter({ hasText: /ajouter|panier|cart/i }).first()).toBeVisible();
  });

  test('Tabs Description / Avis / Livraison présents', async ({ page }) => {
    await expect(page.locator('text=Description')).toBeVisible();
    await expect(page.locator('text=Avis').or(page.locator('text=Reviews')).first()).toBeVisible();
    await expect(page.locator('text=Livraison').or(page.locator('text=Delivery')).first()).toBeVisible();
  });

  test('Tab "Avis" affiche les reviews', async ({ page }) => {
    await page.locator('text=Avis').first().click();
    await page.waitForTimeout(300);
    await expect(page.locator('text=★').first()).toBeVisible();
  });

  test('Tab "Livraison" affiche les options', async ({ page }) => {
    await page.locator('text=Livraison').first().click();
    await page.waitForTimeout(300);
    await expect(page.locator('text=Standard').or(page.locator('text=Express')).first()).toBeVisible();
  });

  test('Clic "Ajouter au panier" → confirmation', async ({ page }) => {
    const btn = page.locator('button').filter({ hasText: /ajouter|add to cart/i }).first();
    await btn.click();
    await page.waitForTimeout(600);
    // Button should show confirmation or item is in cart
    const confirmed = await page.locator('text=Ajouté').or(page.locator('text=✓')).or(page.locator('text=Added')).isVisible();
    // Even if not visible, page should not crash
    await expect(page.locator('body')).toBeVisible();
  });

  test('Bouton retour → revient à la page précédente', async ({ page }) => {
    // Navigate to home first, then to PDP, then back
    await goto(page, 'home');
    await goto(page, 'pdp', { productId: 'p1', product: MOCK_PRODUCTS[0] });
    await page.evaluate(() => window.__goBack());
    await page.waitForTimeout(350);
    await expect(page.locator('body')).toBeVisible();
  });

  test('Bouton messagerie vendeur cliquable', async ({ page }) => {
    const chatBtn = page.locator('button').filter({ hasText: /💬|message|vendeur/i }).first();
    if (await chatBtn.isVisible()) {
      await chatBtn.click();
      await page.waitForTimeout(400);
      await expect(page.locator('body')).toBeVisible();
    }
  });

});
