/**
 * Helpers to drive the Clorivo SPA (JSX/HTML prototype).
 * All navigation goes through window.__navigate / window.__goBack exposed by app.jsx.
 */

/** Navigate to a named screen programmatically (bypasses splash/onboarding) */
export async function goto(page, screen, params = {}) {
  await page.evaluate(
    ([s, p]) => window.__navigate(s, p),
    [screen, params],
  );
  await page.waitForTimeout(350); // animation
}

/** Tap the back button or call goBack() */
export async function goBack(page) {
  await page.evaluate(() => window.__goBack());
  await page.waitForTimeout(300);
}

/** Mock Supabase auth so tests don't need a real backend */
export async function mockAuth(page, { role = 'buyer', name = 'Test User', email = 'test@clorivo.io' } = {}) {
  await page.addInitScript(({ role, name, email }) => {
    // Stub window._supabase + sbGetUser used throughout the screens
    window._MOCK_USER = { id: `mock-${role}-id`, role, user_metadata: { full_name: name }, email };
    window._supabase = true;

    // Override the helper functions loaded from supabase-client.jsx
    window.sbGetUser       = async () => window._MOCK_USER;
    window.sbGetProducts   = async () => ({ data: window._MOCK_PRODUCTS ?? [] });
    window.sbGetShops      = async () => ({ data: window._MOCK_SHOPS ?? [] });
    window.sbGetBanners    = async () => ({ data: [] });
    window.sbGetCart       = async () => ({ data: window._MOCK_CART ?? [] });
    window.sbUpsertCartItem = async () => ({ error: null });
    window.sbCreateOrder   = async () => ({ data: { id: 'mock-order-1', status: 'pending' }, error: null });
    window.sbGetOrders     = async () => ({ data: window._MOCK_ORDERS ?? [] });
    window.sbGetConversations = async () => ({ data: [] });
    window.sbGetMessages   = async () => ({ data: [] });
    window.sbSendMessage   = async () => ({ error: null });
    window.sbSubscribeToMessages = () => () => {};
    window.sbGetNotifications    = async () => ({ data: [] });
    window.sbMarkNotificationRead = async () => ({});
    window.sbSignIn        = async () => ({ data: { user: window._MOCK_USER }, error: null });
    window.sbSignUp        = async () => ({ data: { user: window._MOCK_USER }, error: null });
    window.sbSignOut       = async () => ({});
  }, { role, name, email });
}

/** Seed mock products into the window so screens can render them */
export async function seedProducts(page, products) {
  await page.evaluate((prods) => { window._MOCK_PRODUCTS = prods; }, products);
}

export const MOCK_PRODUCTS = [
  { id: 'p1', title: 'Lampe Boho Tressée', price: 49.99, compare_price: 79.99, images: [], category: 'Maison', status: 'active', shops: { name: 'luna.studio', is_verified: true } },
  { id: 'p2', title: 'Écouteurs Pro Max', price: 89.99, compare_price: 129.99, images: [], category: 'Tech',   status: 'active', shops: { name: 'TechZone',    is_verified: true } },
  { id: 'p3', title: 'Robe Lin Été',       price: 34.99, compare_price: null,   images: [], category: 'Mode',   status: 'active', shops: { name: 'Fashion House', is_verified: false } },
];

export const MOCK_ORDERS = [
  { id: 'order-1', status: 'shipped',   total: 49.99, created_at: new Date().toISOString(), items: [{ product_title: 'Lampe Boho Tressée', qty: 1, price: 49.99 }] },
  { id: 'order-2', status: 'delivered', total: 89.99, created_at: new Date().toISOString(), items: [{ product_title: 'Écouteurs Pro Max',  qty: 1, price: 89.99 }] },
];
