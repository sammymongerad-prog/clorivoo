import { supabase } from './supabase';

// In-memory cache
let _cache = {};
let _cacheTime = 0;
const TTL = 60000; // 1 minute

export async function getAppConfig(forceRefresh = false) {
  if (!forceRefresh && Date.now() - _cacheTime < TTL && Object.keys(_cache).length > 0) {
    return _cache;
  }
  try {
    const { data } = await supabase.from('app_config').select('key, value');
    if (data) {
      _cache = {};
      data.forEach(row => { _cache[row.key] = row.value; });
      _cacheTime = Date.now();
    }
  } catch (e) { console.warn('CMS config error:', e); }
  return _cache;
}

export function getCached(key, fallback = null) {
  if (key in _cache) return _cache[key];
  return fallback;
}

export async function setAppConfig(key, value) {
  const { error } = await supabase.from('app_config')
    .upsert({ key, value: JSON.parse(JSON.stringify(value)), updated_at: new Date().toISOString() });
  if (!error) { _cache[key] = value; }
  return { error };
}

export async function getHomepageSections() {
  const { data } = await supabase.from('homepage_sections').select('*').order('sort_order');
  return data ?? [];
}

export async function updateHomepageSection(id, updates) {
  return supabase.from('homepage_sections').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id);
}

export async function getOnboardingSlides() {
  const { data } = await supabase.from('onboarding_slides').select('*').eq('active', true).order('sort_order');
  return data ?? [];
}

export async function upsertOnboardingSlide(slide) {
  if (slide.id) {
    return supabase.from('onboarding_slides').update({ ...slide, updated_at: new Date().toISOString() }).eq('id', slide.id);
  }
  return supabase.from('onboarding_slides').insert(slide);
}

export async function deleteOnboardingSlide(id) {
  return supabase.from('onboarding_slides').delete().eq('id', id);
}

export async function getShippingMethods() {
  const { data } = await supabase.from('shipping_methods').select('*').eq('active', true).order('sort_order');
  return data ?? [];
}

export async function getAllShippingMethods() {
  const { data } = await supabase.from('shipping_methods').select('*').order('sort_order');
  return data ?? [];
}

export async function upsertShippingMethod(method) {
  if (method.id) {
    return supabase.from('shipping_methods').update({ ...method, updated_at: new Date().toISOString() }).eq('id', method.id);
  }
  return supabase.from('shipping_methods').insert(method);
}

export async function deleteShippingMethod(id) {
  return supabase.from('shipping_methods').delete().eq('id', id);
}

export async function getPaymentMethods() {
  const { data } = await supabase.from('payment_methods').select('*').eq('active', true).order('sort_order');
  return data ?? [];
}

export async function getAllPaymentMethods() {
  const { data } = await supabase.from('payment_methods').select('*').order('sort_order');
  return data ?? [];
}

export async function upsertPaymentMethod(method) {
  if (method.id) {
    return supabase.from('payment_methods').update({ ...method, updated_at: new Date().toISOString() }).eq('id', method.id);
  }
  return supabase.from('payment_methods').insert(method);
}

export async function deletePaymentMethod(id) {
  return supabase.from('payment_methods').delete().eq('id', id);
}

export async function getNotificationTemplates() {
  const { data } = await supabase.from('notification_templates').select('*').order('key');
  return data ?? [];
}

export async function upsertNotificationTemplate(tpl) {
  if (tpl.id) {
    return supabase.from('notification_templates').update({ ...tpl, updated_at: new Date().toISOString() }).eq('id', tpl.id);
  }
  return supabase.from('notification_templates').insert(tpl);
}
