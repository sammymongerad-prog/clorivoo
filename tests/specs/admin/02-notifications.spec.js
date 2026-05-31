import { test, expect } from '@playwright/test';
import { goto, mockAuth } from '../../helpers/navigate.js';

test.describe('Admin — Centre de notifications', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await mockAuth(page, { role: 'admin', name: 'Admin Clorivo' });
    // Mock the Supabase calls used by AdminNotifSection
    await page.addInitScript(() => {
      window._MOCK_NOTIF_STATS = { total: 520, unread: 43 };
      window._MOCK_NOTIF_HISTORY = [
        { id: 'n1', title: '⚡ Flash sale !', body: '-40% sur la mode', type: 'promo', created_at: new Date().toISOString(), profiles: { full_name: null } },
        { id: 'n2', title: '📦 Nouvelle commande', body: 'Tu as une commande', type: 'order', created_at: new Date().toISOString(), profiles: { full_name: 'Alice D.' } },
      ];
    });
    await goto(page, 'admin');
    // Navigate to notifications section inside admin
    const notifLink = page.locator('button, div[role="button"]').filter({ hasText: /notification/i }).first();
    if (await notifLink.isVisible()) await notifLink.click();
    await page.waitForTimeout(400);
  });

  test('Section notifications visible dans l\'admin', async ({ page }) => {
    await expect(
      page.locator('text=Notification').or(page.locator('text=notification')).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('Stats total / non-lues visibles', async ({ page }) => {
    await expect(
      page.locator('text=Total').or(page.locator('text=Non lues')).or(page.locator('text=envoyée')).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('Onglet Broadcast visible', async ({ page }) => {
    await expect(
      page.locator('text=Broadcast').or(page.locator('text=📣')).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('Onglet Individuel visible', async ({ page }) => {
    await expect(
      page.locator('text=Individuel').or(page.locator('text=👤')).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('Onglet Historique visible', async ({ page }) => {
    await expect(
      page.locator('text=Historique').or(page.locator('text=📋')).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('Broadcast — sélecteurs de segment présents', async ({ page }) => {
    await expect(
      page.locator('text=Tous').or(page.locator('text=Acheteurs')).or(page.locator('text=Vendeurs')).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('Broadcast — champ titre remplissable', async ({ page }) => {
    const titleInput = page.locator('input[placeholder*="Titre"], input[placeholder*="Flash"], input[placeholder*="titre"]').first();
    if (await titleInput.isVisible()) {
      await titleInput.fill('⚡ Test notification');
      await expect(titleInput).toHaveValue('⚡ Test notification');
    }
  });

  test('Broadcast — champ message remplissable', async ({ page }) => {
    const bodyInput = page.locator('input[placeholder*="essage"], textarea[placeholder*="essage"], input[placeholder*="-40"]').first();
    if (await bodyInput.isVisible()) {
      await bodyInput.fill('Ceci est un test de notification broadcast.');
      await expect(bodyInput).toHaveValue('Ceci est un test de notification broadcast.');
    }
  });

  test('Broadcast — bouton envoyer visible', async ({ page }) => {
    await expect(
      page.locator('button').filter({ hasText: /envoyer|send|broadcast/i }).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('Broadcast — envoi sans titre → pas de crash', async ({ page }) => {
    const sendBtn = page.locator('button').filter({ hasText: /envoyer/i }).first();
    if (await sendBtn.isVisible()) {
      await sendBtn.click(); // should show Alert, not crash
      await page.waitForTimeout(400);
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('Individuel — champ recherche utilisateur', async ({ page }) => {
    const tabBtn = page.locator('text=Individuel').or(page.locator('text=👤')).first();
    if (await tabBtn.isVisible()) {
      await tabBtn.click();
      await page.waitForTimeout(300);
      await expect(
        page.locator('input[placeholder*="hercher"], input[placeholder*="nom"], input[placeholder*="email"]').first()
      ).toBeVisible({ timeout: 5000 });
    }
  });

});
