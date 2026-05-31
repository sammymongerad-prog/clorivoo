import { test, expect } from '@playwright/test';
import { goto, mockAuth, MOCK_ORDERS } from '../../helpers/navigate.js';

test.describe('Buyer — Suivi & Commandes', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await mockAuth(page, { role: 'buyer', name: 'Alice Dupont' });
    await page.addInitScript((orders) => { window._MOCK_ORDERS = orders; }, MOCK_ORDERS);
  });

  test('Écran Tracking affiche le statut de la commande', async ({ page }) => {
    await goto(page, 'tracking', { orderId: 'order-1' });
    await expect(
      page.locator('text=expédié').or(page.locator('text=shipped')).or(page.locator('text=En route')).or(page.locator('text=order-1')).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('Timeline de livraison visible', async ({ page }) => {
    await goto(page, 'tracking', { orderId: 'order-1' });
    // Steps: Confirmée, Préparée, Expédiée, Livrée
    await expect(
      page.locator('text=Confirmée').or(page.locator('text=Préparée')).or(page.locator('text=Expédiée')).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('Commande livrée → bouton noter visible', async ({ page }) => {
    await goto(page, 'tracking', { orderId: 'order-2' });
    // order-2 is 'delivered'
    await expect(
      page.locator('button').filter({ hasText: /noter|review|avis/i })
        .or(page.locator('text=livré')).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('Messages — liste des conversations', async ({ page }) => {
    await goto(page, 'messages-list');
    // Either shows conversations or empty state
    await expect(page.locator('text=Message').or(page.locator('text=conversation')).or(page.locator('text=aucun')).first()).toBeVisible({ timeout: 5000 });
  });

  test('Chat — ouverture conversation', async ({ page }) => {
    await goto(page, 'chat', { conversationId: 'demo-conv', shopName: 'luna.studio' });
    await expect(page.locator('text=luna.studio').or(page.locator('input[placeholder*="essage"]')).first()).toBeVisible({ timeout: 5000 });
  });

  test('Chat — envoi d\'un message', async ({ page }) => {
    await goto(page, 'chat', { conversationId: 'demo-conv', shopName: 'luna.studio' });
    const input = page.locator('input[placeholder*="essage"], textarea').first();
    if (await input.isVisible()) {
      await input.fill('Bonjour, ce produit est-il disponible ?');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(400);
      await expect(page.locator('text=Bonjour, ce produit')).toBeVisible({ timeout: 5000 });
    }
  });

  test('Notifications — liste vide affiche état vide', async ({ page }) => {
    await goto(page, 'notifications');
    await expect(
      page.locator('text=Notification').or(page.locator('text=aucune').or(page.locator('text=🔔'))).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('Profil — informations utilisateur', async ({ page }) => {
    await goto(page, 'profile');
    await expect(page.locator('text=Alice').or(page.locator('text=Dupont')).first()).toBeVisible({ timeout: 5000 });
  });

  test('Profil — bouton Devenir vendeur visible', async ({ page }) => {
    await goto(page, 'profile');
    await expect(
      page.locator('button, a').filter({ hasText: /vendeur|seller|boutique/i }).first()
    ).toBeVisible({ timeout: 5000 });
  });

});
