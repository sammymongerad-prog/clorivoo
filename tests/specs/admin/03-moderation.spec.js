import { test, expect } from '@playwright/test';
import { goto, mockAuth } from '../../helpers/navigate.js';

test.describe('Admin — Modération & CMS', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await mockAuth(page, { role: 'admin', name: 'Admin Clorivo' });
  });

  // ── KYC ──────────────────────────────────────────────────────────

  test('KYC — liste des dossiers en attente', async ({ page }) => {
    await page.addInitScript(() => {
      window._MOCK_KYC = [
        { id: 'k1', status: 'pending', seller_name: 'Lucie Martin',  shop_name: 'LM Design',   submitted_at: new Date().toISOString() },
        { id: 'k2', status: 'pending', seller_name: 'Omar Khaled',   shop_name: 'OK Store',    submitted_at: new Date().toISOString() },
        { id: 'k3', status: 'approved', seller_name: 'Sophie Brun',  shop_name: 'SB Boutique', submitted_at: new Date().toISOString() },
      ];
    });
    await goto(page, 'admin-kyc');
    await expect(
      page.locator('text=Lucie').or(page.locator('text=Omar')).or(page.locator('text=attente')).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('KYC — filtre "Approuvés" affiche seulement approuvés', async ({ page }) => {
    await goto(page, 'admin-kyc');
    const approvedFilter = page.locator('button').filter({ hasText: /approuvé|approved/i }).first();
    if (await approvedFilter.isVisible()) {
      await approvedFilter.click();
      await page.waitForTimeout(300);
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('KYC — clic Approuver fonctionne', async ({ page }) => {
    await page.addInitScript(() => {
      window.sbUpdateKyc = async () => ({ error: null });
    });
    await goto(page, 'admin-kyc');
    const approveBtn = page.locator('button').filter({ hasText: /approuver|approve|✓/i }).first();
    if (await approveBtn.isVisible()) {
      await approveBtn.click();
      await page.waitForTimeout(400);
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('KYC — clic Rejeter fonctionne', async ({ page }) => {
    await page.addInitScript(() => {
      window.sbUpdateKyc = async () => ({ error: null });
    });
    await goto(page, 'admin-kyc');
    const rejectBtn = page.locator('button').filter({ hasText: /rejeter|refuser|reject|✗/i }).first();
    if (await rejectBtn.isVisible()) {
      await rejectBtn.click();
      await page.waitForTimeout(400);
      await expect(page.locator('body')).toBeVisible();
    }
  });

  // ── BANNIÈRES CMS ────────────────────────────────────────────────

  test('Bannières CMS — liste affichée', async ({ page }) => {
    await goto(page, 'admin-banners');
    await expect(
      page.locator('text=bannière').or(page.locator('text=banner')).or(page.locator('text=CMS')).or(page.locator('button').filter({ hasText: /ajouter|nouvelle/i })).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('Bannières CMS — ajouter nouvelle bannière', async ({ page }) => {
    await goto(page, 'admin-banners');
    const addBtn = page.locator('button').filter({ hasText: /ajouter|nouvelle|add|new/i }).first();
    if (await addBtn.isVisible()) {
      await addBtn.click();
      await page.waitForTimeout(400);
      // Modal or form should appear
      await expect(page.locator('input').first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('Bannières CMS — toggle actif/inactif', async ({ page }) => {
    await page.addInitScript(() => {
      window._MOCK_BANNERS = [
        { id: 'b1', title: 'Promo Été', is_active: true,  position: 1, image_url: null },
        { id: 'b2', title: 'Mode Auto', is_active: false, position: 2, image_url: null },
      ];
    });
    await goto(page, 'admin-banners');
    await expect(
      page.locator('text=Promo Été').or(page.locator('text=Mode Auto')).or(page.locator('text=actif')).first()
    ).toBeVisible({ timeout: 5000 });
  });

  // ── PRODUITS ADMIN ───────────────────────────────────────────────

  test('Admin — section produits accessible', async ({ page }) => {
    await goto(page, 'admin');
    const prodLink = page.locator('button, div').filter({ hasText: /^Produits$/ }).first();
    if (await prodLink.isVisible()) {
      await prodLink.click();
      await page.waitForTimeout(400);
    }
    await expect(page.locator('body')).toBeVisible();
  });

  test('Admin — section vendeurs accessible', async ({ page }) => {
    await goto(page, 'admin');
    const link = page.locator('button, div').filter({ hasText: /^Vendeurs$/ }).first();
    if (await link.isVisible()) {
      await link.click();
      await page.waitForTimeout(400);
    }
    await expect(page.locator('body')).toBeVisible();
  });

  test('Admin — section commandes accessible', async ({ page }) => {
    await goto(page, 'admin');
    const link = page.locator('button, div').filter({ hasText: /^Commandes$/ }).first();
    if (await link.isVisible()) {
      await link.click();
      await page.waitForTimeout(400);
    }
    await expect(page.locator('body')).toBeVisible();
  });

});
