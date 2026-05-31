import AsyncStorage from '@react-native-async-storage/async-storage';

const CJ_BASE = 'https://developers.cjdropshipping.com/api2.0/v1';

async function getStoredToken() {
  try {
    const raw = await AsyncStorage.getItem('cj_token');
    if (!raw) return null;
    const { accessToken, refreshToken, expiresAt } = JSON.parse(raw);
    if (Date.now() < expiresAt - 60000) return { accessToken, refreshToken };
    return { accessToken: null, refreshToken };
  } catch { return null; }
}

async function storeToken(accessToken, refreshToken) {
  const expiresAt = Date.now() + 14 * 24 * 60 * 60 * 1000; // 14 days
  await AsyncStorage.setItem('cj_token', JSON.stringify({ accessToken, refreshToken, expiresAt }));
}

export async function getCJToken(apiKey) {
  // Try stored first
  const stored = await getStoredToken();
  if (stored?.accessToken) return stored.accessToken;

  // Try refresh
  if (stored?.refreshToken) {
    try {
      const res = await fetch(`${CJ_BASE}/authentication/refreshAccessToken`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: stored.refreshToken }),
      });
      const json = await res.json();
      if (json.code === 200 && json.data?.accessToken) {
        await storeToken(json.data.accessToken, stored.refreshToken);
        return json.data.accessToken;
      }
    } catch {}
  }

  // Get new token
  if (!apiKey) throw new Error('Clé API CJ manquante');
  const res = await fetch(`${CJ_BASE}/authentication/getAccessToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey }),
  });
  const json = await res.json();
  if (json.code !== 200 || !json.data?.accessToken) {
    throw new Error(json.message || 'Authentification CJ échouée');
  }
  await storeToken(json.data.accessToken, json.data.refreshToken);
  return json.data.accessToken;
}

async function cjFetch(path, apiKey) {
  const token = await getCJToken(apiKey);
  const res = await fetch(`${CJ_BASE}${path}`, {
    headers: { 'CJ-Access-Token': token },
  });
  const json = await res.json();
  if (json.code !== 200) throw new Error(json.message || `CJ API error: ${path}`);
  return json.data;
}

export async function getCJCategories(apiKey) {
  return cjFetch('/product/getCategory', apiKey);
}

export async function searchCJProducts(apiKey, { categoryId, keyWord, page = 1, pageSize = 50 } = {}) {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (categoryId) params.set('categoryId', categoryId);
  if (keyWord) params.set('keyWord', keyWord);
  return cjFetch(`/product/listV2?${params}`, apiKey);
}

export async function getCJProduct(apiKey, pid) {
  return cjFetch(`/product/query?pid=${pid}`, apiKey);
}

export async function clearCJToken() {
  await AsyncStorage.removeItem('cj_token');
}
