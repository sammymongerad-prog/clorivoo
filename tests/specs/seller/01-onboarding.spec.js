import { test, expect } from '@playwright/test';
import { goto, mockAuth } from '../../helpers/navigate.js';

test.describe('Seller — Onboarding & KYC', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await mockAuth(page, { role: 'seller', name: 'Marc Vendeur', email: 'marc@boutique.io' });
  });

  test('Écran Devenir Vendeur — pitch affiché', async ({ page }) => {
    await goto(page, 'become-seller');
    await expect(
      page.locator('text=vendeur').or(page.locator('text=boutique')).or(page.locator('text=Commencer')).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('Become Seller — bouton CTA visible', async ({ page }) => {
    await goto(page, 'become-seller');
    await expect(
      page.locator('button').filter({ hasText: /commencer|ouvrir|créer|start/i }).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('KYC — étape pièce d\'identité', async ({ page }) => {
    await goto(page, 'kyc-doc');
    await expect(
      page.locator('text=identité').or(page.locator('text=document')).or(page.locator('text=pièce')).or(page.locator('text=KYC')).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('KYC — bouton upload visible', async ({ page }) => {
    await goto(page, 'kyc-doc');
    await expect(
      page.locator('button').filter({ hasText: /photo|upload|prendre|choisir|importer/i }).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('KYC — étape selfie', async ({ page }) => {
    await goto(page, 'kyc-selfie');
    await expect(
      page.locator('text=selfie').or(page.locator('text=photo')).or(page.locator('text=visage')).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('KYC Success — confirmation d\'envoi', async ({ page }) => {
    await goto(page, 'kyc-success');
    await expect(
      page.locator('text=envoyé').or(page.locator('text=reçu').or(page.locator('text=✅').or(page.locator('text=succès')))).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('KYC Success — bouton continuer', async ({ page }) => {
    await goto(page, 'kyc-success');
    await expect(
      page.locator('button').filter({ hasText: /continuer|accueil|home|dashboard/i }).first()
    ).toBeVisible({ timeout: 5000 });
  });

});
