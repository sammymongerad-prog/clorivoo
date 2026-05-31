import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  testDir: './specs',
  fullyParallel: false,   // tests share a browser context per role, run sequentially per file
  retries: 1,
  timeout: 30_000,
  expect: { timeout: 8_000 },

  reporter: [
    ['html', { outputFolder: 'report', open: 'never' }],
    ['list'],
  ],

  use: {
    // Point to the HTML prototype served locally
    baseURL: process.env.BASE_URL ?? `file://${path.resolve(__dirname, '../Clorivo.html')}`,
    headless: true,
    viewport: { width: 390, height: 844 },   // iPhone 14 Pro
    deviceScaleFactor: 2,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },

  projects: [
    { name: 'buyer',  testMatch: '**/buyer/**' },
    { name: 'seller', testMatch: '**/seller/**' },
    { name: 'admin',  testMatch: '**/admin/**' },
    { name: 'e2e',    testMatch: '**/e2e/**' },
  ],
});
