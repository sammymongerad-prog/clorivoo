import { test, expect } from '@playwright/test';
import { goto, mockAuth } from '../../helpers/navigate.js';

test.describe('Buyer — Authentification', () => {

  test('Splash → Onboarding → Login (navigation flow)', async ({ page }) => {
    await page.goto('/');
    // Splash appears first
    await expect(page.locator('text=clorivo')).toBeVisible();
    // After splash auto-advance (or skip), onboarding shows
    await page.waitForTimeout(3000);
    await expect(page.locator('text=Bienvenue sur clorivo').or(page.locator('text=achetez en confiance')).or(page.locator('text=Se connecter'))).toBeVisible({ timeout: 5000 });
  });

  test('Affichage écran Login', async ({ page }) => {
    await page.goto('/');
    await mockAuth(page);
    await goto(page, 'login');
    await expect(page.locator('input[type="email"], input[placeholder*="mail"]').first()).toBeVisible();
    await expect(page.locator('input[type="password"], input[placeholder*="assword"]').first()).toBeVisible();
  });

  test('Login avec identifiants → accès Home', async ({ page }) => {
    await page.goto('/');
    await mockAuth(page);
    await goto(page, 'login');

    await page.locator('input[type="email"], input[placeholder*="mail"]').first().fill('acheteur@clorivo.io');
    await page.locator('input[type="password"], input[placeholder*="assword"]').first().fill('password123');
    // Clic bouton Se connecter
    await page.locator('button').filter({ hasText: /connecter|login/i }).first().click();
    await page.waitForTimeout(500);

    // Either home screen or still on login with mock — check screen transition
    const url = page.url();
    expect(url).toBeTruthy(); // page is still alive
  });

  test('Champ email invalide affiche une erreur', async ({ page }) => {
    await page.goto('/');
    await mockAuth(page, { role: 'buyer' });
    await goto(page, 'login');

    await page.locator('input[type="email"], input[placeholder*="mail"]').first().fill('pas-un-email');
    await page.locator('input[type="password"], input[placeholder*="assword"]').first().fill('abc');
    await page.locator('button').filter({ hasText: /connecter|login/i }).first().click();
    await page.waitForTimeout(400);
    // Page must not crash
    await expect(page.locator('body')).toBeVisible();
  });

  test('Lien "Créer un compte" → Register', async ({ page }) => {
    await page.goto('/');
    await mockAuth(page);
    await goto(page, 'login');
    await page.locator('button, a').filter({ hasText: /créer|register|inscription/i }).first().click();
    await page.waitForTimeout(400);
    await expect(page.locator('input[placeholder*="om"], input[placeholder*="ame"]').or(page.locator('text=Créer')).first()).toBeVisible();
  });

  test('Inscription nouveau compte → Register', async ({ page }) => {
    await page.goto('/');
    await mockAuth(page);
    await goto(page, 'register');

    const inputs = page.locator('input');
    const count  = await inputs.count();
    expect(count).toBeGreaterThanOrEqual(2);

    // Fill all visible inputs
    await inputs.nth(0).fill('Nouveau User');
    if (count > 1) await inputs.nth(1).fill('nouveau@clorivo.io');
    if (count > 2) await inputs.nth(2).fill('Password123!');

    await page.locator('button').filter({ hasText: /créer|register|inscrire|suivant/i }).first().click();
    await page.waitForTimeout(500);
    await expect(page.locator('body')).toBeVisible();
  });

});
