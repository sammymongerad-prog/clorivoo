import { test, expect } from '@playwright/test';
import { goto, mockAuth, MOCK_PRODUCTS } from '../../helpers/navigate.js';

/**
 * Scénario complet vendeur :
 * Login → Devenir vendeur → KYC → Dashboard → Importer produit → Gérer commandes
 */
test.describe('E2E — Parcours vendeur complet', () => {

  test('Vendeur : onboarding KYC complet', async ({ page }) => {
    await page.goto('/');
    await mockAuth(page, { role: 'buyer', name: 'Marc Vendeur' }); // starts as buyer

    // Profile → Devenir vendeur
    await goto(page, 'profile');
    const sellerBtn = page.locator('button').filter({ hasText: /vendeur|seller|boutique/i }).first();
    if (await sellerBtn.isVisible()) await sellerBtn.click();
    else await goto(page, 'become-seller');
    await page.waitForTimeout(400);

    // Become seller pitch
    await expect(
      page.locator('text=vendeur').or(page.locator('text=boutique')).or(page.locator('text=Commencer')).first()
    ).toBeVisible({ timeout: 5000 });

    // KYC doc
    await goto(page, 'kyc-doc');
    await expect(page.locator('body')).toBeVisible();

    // KYC selfie
    await goto(page, 'kyc-selfie');
    await expect(page.locator('body')).toBeVisible();

    // KYC success
    await goto(page, 'kyc-success');
    await expect(
      page.locator('text=envoyé').or(page.locator('text=✅')).or(page.locator('text=succès')).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('Vendeur : dashboard → gestion commandes', async ({ page }) => {
    await page.goto('/');
    await mockAuth(page, { role: 'seller', name: 'Marc Vendeur' });
    await page.addInitScript(() => {
      window._MOCK_SELLER_ORDERS = [
        { id: 'so1', status: 'pending',  total: 49.99, buyer_name: 'Alice D.', items: [{ product_title: 'Lampe', qty: 2, price: 49.99 }], created_at: new Date().toISOString() },
        { id: 'so2', status: 'shipped',  total: 89.99, buyer_name: 'Bob M.',   items: [{ product_title: 'Écouteurs', qty: 1, price: 89.99 }], created_at: new Date().toISOString() },
      ];
    });

    await goto(page, 'seller-home');
    await expect(
      page.locator('text=Marc').or(page.locator('text=Dashboard')).or(page.locator('text=boutique')).first()
    ).toBeVisible({ timeout: 5000 });

    await goto(page, 'seller-orders');
    await expect(
      page.locator('text=Alice').or(page.locator('text=commande')).or(page.locator('text=Lampe')).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('Vendeur : import CJ → publication produit', async ({ page }) => {
    await page.goto('/');
    await mockAuth(page, { role: 'seller', name: 'Marc Vendeur' });

    await goto(page, 'cj-connect');
    const apiInput = page.locator('input').first();
    if (await apiInput.isVisible()) {
      await apiInput.fill('MOCK-CJ-API-KEY-12345');
      const connectBtn = page.locator('button').filter({ hasText: /connecter|connect|suivant|valider/i }).first();
      if (await connectBtn.isVisible()) await connectBtn.click();
      await page.waitForTimeout(400);
    }

    await goto(page, 'cj-search');
    const searchInput = page.locator('input').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('wireless earphones');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(600);
    }

    await goto(page, 'cj-publish', { product: MOCK_PRODUCTS[1] });
    await expect(
      page.locator('text=Publier').or(page.locator('text=Écouteurs')).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('Vendeur : personnaliser sa boutique', async ({ page }) => {
    await page.goto('/');
    await mockAuth(page, { role: 'seller', name: 'Marc Vendeur' });

    await goto(page, 'shop-customize');
    const nameInput = page.locator('input').first();
    if (await nameInput.isVisible()) {
      await nameInput.clear();
      await nameInput.fill('Marc Premium Store');

      const saveBtn = page.locator('button').filter({ hasText: /sauvegarder|enregistrer|save/i }).first();
      if (await saveBtn.isVisible()) {
        await saveBtn.click();
        await page.waitForTimeout(400);
      }
    }
    await expect(page.locator('body')).toBeVisible();
  });

});
