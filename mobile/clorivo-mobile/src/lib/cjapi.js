import { Platform } from 'react-native';

const CJ_BASE = 'https://developers.cjdropshipping.com/api2.0/v1';

// In-memory token cache (works on web + mobile)
let _memToken = null;
let _memRefresh = null;
let _memExpiry = 0;

function isOk(code) {
  return code === 200 || code === '200';
}

async function getStoredToken() {
  // Memory first (works everywhere)
  if (_memToken && Date.now() < _memExpiry - 60000) return { accessToken: _memToken, refreshToken: _memRefresh };
  if (_memRefresh) return { accessToken: null, refreshToken: _memRefresh };

  // Persistent storage (mobile only)
  if (Platform.OS !== 'web') {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const raw = await AsyncStorage.getItem('cj_token');
      if (!raw) return null;
      const { accessToken, refreshToken, expiresAt } = JSON.parse(raw);
      _memToken = accessToken;
      _memRefresh = refreshToken;
      _memExpiry = expiresAt;
      if (Date.now() < expiresAt - 60000) return { accessToken, refreshToken };
      return { accessToken: null, refreshToken };
    } catch { return null; }
  }
  return null;
}

async function storeToken(accessToken, refreshToken) {
  const expiresAt = Date.now() + 14 * 24 * 60 * 60 * 1000;
  _memToken = accessToken;
  _memRefresh = refreshToken;
  _memExpiry = expiresAt;
  if (Platform.OS !== 'web') {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.setItem('cj_token', JSON.stringify({ accessToken, refreshToken, expiresAt }));
    } catch {}
  }
}

export async function getCJToken(apiKey) {
  const stored = await getStoredToken();
  if (stored?.accessToken) return stored.accessToken;

  if (stored?.refreshToken) {
    try {
      const res = await fetch(`${CJ_BASE}/authentication/refreshAccessToken`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: stored.refreshToken }),
      });
      const json = await res.json();
      if (isOk(json.code) && json.data?.accessToken) {
        await storeToken(json.data.accessToken, stored.refreshToken);
        return json.data.accessToken;
      }
    } catch {}
  }

  if (!apiKey) throw new Error('Clé API CJ manquante');
  const res = await fetch(`${CJ_BASE}/authentication/getAccessToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey }),
  });
  const json = await res.json();
  if (!isOk(json.code) || !json.data?.accessToken) {
    throw new Error(json.message || `Auth CJ échouée (code: ${json.code})`);
  }
  await storeToken(json.data.accessToken, json.data.refreshToken);
  return json.data.accessToken;
}

async function cjFetch(path, apiKey) {
  const token = await getCJToken(apiKey);
  const url = `${CJ_BASE}${path}`;
  let res;
  try {
    res = await fetch(url, { headers: { 'CJ-Access-Token': token } });
  } catch (networkErr) {
    throw new Error(`Réseau/CORS bloqué: ${networkErr.message}. Essayez sur mobile.`);
  }
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { throw new Error(`Réponse invalide: ${text.slice(0, 200)}`); }
  console.log('[CJ]', path, '→ code:', json.code, 'data keys:', Object.keys(json.data || {}).join(','));
  if (!isOk(json.code)) {
    throw new Error(json.message || `CJ code ${json.code} — ${path}`);
  }
  // Log first item keys for product lists to help debug field names
  const firstItem = json.data?.content?.[0] ?? json.data?.list?.[0];
  if (firstItem) console.log('[CJ] first item keys:', Object.keys(firstItem).join(','));
  return json.data;
}

export async function getCJCategories(apiKey) {
  const data = await cjFetch('/product/getCategory', apiKey);
  // data can be array directly or { categoryList: [...] }
  if (Array.isArray(data)) return data;
  if (data?.categoryList) return data.categoryList;
  if (data?.list) return data.list;
  return [];
}

export async function searchCJProducts(apiKey, { categoryId, keyWord, page = 1, pageSize = 50 } = {}) {
  const params = new URLSearchParams({ pageNum: String(page), pageSize: String(pageSize) });
  if (categoryId) params.set('categoryId', categoryId);
  if (keyWord) params.set('keyWord', keyWord);

  // Try listV2 first, fall back to list
  try {
    const data = await cjFetch(`/product/listV2?${params}`, apiKey);
    return normalizeProductList(data);
  } catch {
    const data = await cjFetch(`/product/list?${params}`, apiKey);
    return normalizeProductList(data);
  }
}

function normalizeProductList(data) {
  if (!data) return { list: [], total: 0 };
  // Handle both { list, total } and { list, totalCount } and direct arrays
  if (Array.isArray(data)) return { list: data, total: data.length };
  const list = data.list ?? data.content ?? data.productList ?? data.records ?? [];
  const total = data.total ?? data.totalRecords ?? data.totalCount ?? data.totalRecord ?? list.length;
  return { list, total };
}

export async function getCJProduct(apiKey, pid) {
  return cjFetch(`/product/query?pid=${encodeURIComponent(pid)}`, apiKey);
}

export async function clearCJToken() {
  _memToken = null;
  _memRefresh = null;
  _memExpiry = 0;
  if (Platform.OS !== 'web') {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.removeItem('cj_token');
    } catch {}
  }
}
