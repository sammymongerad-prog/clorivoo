import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Switch,
  TextInput, ActivityIndicator, Modal, Image, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SHADOW } from '../../lib/tokens';
import { Avatar } from '../../components/UI';
import Icon from '../../components/Icon';
import { supabase, uploadImage } from '../../lib/supabase';
import { useSession } from '../../hooks/useSession';
import {
  getAppConfig, setAppConfig,
  getHomepageSections, updateHomepageSection,
  getOnboardingSlides, upsertOnboardingSlide, deleteOnboardingSlide,
  getAllShippingMethods, upsertShippingMethod, deleteShippingMethod,
  getAllPaymentMethods, upsertPaymentMethod, deletePaymentMethod,
  getNotificationTemplates, upsertNotificationTemplate,
} from '../../lib/cms';

/* ─── Theme ─────────────────────────────────────────────────────────────── */
const DARK = {
  bg: '#0A0812',
  card: '#1A1630',
  border: 'rgba(255,255,255,0.06)',
  text: '#EDE9F7',
  mute: 'rgba(255,255,255,0.4)',
  sidebar: '#0F0C1E',
};

const BANNER_COLORS = ['#6C4DFF', '#C97B5A', '#3B82F6', '#10B981', '#EF4444', '#8B5CF6'];

const EMPTY_BANNER_FORM = {
  title: '',
  subtitle: '',
  cta: '',
  bg_color: '#6C4DFF',
  image_url: '',
  position: 0,
  is_active: true,
};

/* ─── Navigation ─────────────────────────────────────────────────────────── */
const NAV_ITEMS = [
  { key: 'dashboard',     icon: 'home',        label: 'Dashboard' },
  { key: 'users',         icon: 'user',         label: 'Utilisateurs' },
  { key: 'sellers',       icon: 'store',        label: 'Vendeurs' },
  { key: 'products',      icon: 'shoppingBag',  label: 'Produits' },
  { key: 'orders',        icon: 'package',      label: 'Commandes' },
  { key: 'categories',    icon: 'grid',         label: 'Catégories' },
  { key: 'coupons',       icon: 'tag',          label: 'Coupons' },
  { key: 'reviews',       icon: 'star',         label: 'Avis' },
  { key: 'withdrawals',   icon: 'creditCard',   label: 'Retraits' },
  { key: 'transactions',  icon: 'zap',          label: 'Transactions' },
  { key: 'reports',       icon: 'barChart',     label: 'Rapports' },
  { key: 'notifications', icon: 'bell',         label: 'Notifications' },
  { key: 'banners',       icon: 'camera',       label: 'Bannières' },
  { key: 'media',         icon: 'image',        label: 'Médias' },
  { key: 'settings',      icon: 'settings',     label: 'Paramètres' },
];

const MEDIA_SUB_TABS = [
  { key: 'banners',    label: 'Bannières' },
  { key: 'categories', label: 'Catégories' },
  { key: 'featured',   label: 'Vedette' },
];

const MAIN_CATEGORIES = [
  { slug: 'maison',  label: 'Maison' },
  { slug: 'mode',    label: 'Mode' },
  { slug: 'tech',    label: 'Tech' },
  { slug: 'beaute',  label: 'Beauté' },
];

const WEEK_BARS = [45, 62, 38, 78, 55, 90, 72];
const WEEK_DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MAX_BAR = Math.max(...WEEK_BARS);

const TOP_CATS = [
  { name: 'Électronique', pct: 35, color: '#6C4DFF' },
  { name: 'Mode',         pct: 25, color: '#3B82F6' },
  { name: 'Maison',       pct: 18, color: '#10B981' },
  { name: 'Beauté',       pct: 12, color: '#F59E0B' },
  { name: 'Sport',        pct: 6,  color: '#EF4444' },
];

const LOCATION_DATA = [
  { country: 'États-Unis', flag: '🇺🇸', amount: '$45,231', pct: '35%' },
  { country: 'Haïti',      flag: '🇭🇹', amount: '$22,410', pct: '17%' },
  { country: 'France',     flag: '🇫🇷', amount: '$18,245', pct: '14%' },
  { country: 'Canada',     flag: '🇨🇦', amount: '$15,320', pct: '12%' },
  { country: 'Autres',     flag: '🌍', amount: '$27,354', pct: '22%' },
];

const STATUS_COLORS = {
  confirmed: '#6C4DFF',
  shipped:   '#3B82F6',
  delivered: '#10B981',
  pending:   '#F59E0B',
  cancelled: '#EF4444',
};

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function DarkCard({ children, style }) {
  return (
    <View style={[{ backgroundColor: DARK.card, borderRadius: 12, overflow: 'hidden' }, style]}>
      {children}
    </View>
  );
}

function KpiCard({ label, value, delta, icon, color }) {
  return (
    <View style={{ flex: 1, backgroundColor: DARK.card, borderRadius: 12, padding: 12, minWidth: '45%' }}>
      <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: color + '22', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
        <Icon name={icon} size={18} color={color} />
      </View>
      <Text style={{ fontSize: 10, color: DARK.mute, marginBottom: 4 }}>{label}</Text>
      <Text style={{ fontFamily: 'monospace', fontSize: 18, fontWeight: '700', color: DARK.text }}>{value}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 3 }}>
        <Icon name="arrowLeft" size={10} color="#10B981" style={{ transform: [{ rotate: '45deg' }] }} />
        <Text style={{ fontSize: 11, color: '#10B981', fontWeight: '600' }}>{delta}</Text>
      </View>
    </View>
  );
}

function SectionHeader({ title, subtitle, action, onAction }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: '700', color: DARK.text }}>{title}</Text>
        {!!subtitle && <Text style={{ fontSize: 11, color: DARK.mute, marginTop: 2 }}>{subtitle}</Text>}
      </View>
      {!!action && (
        <TouchableOpacity onPress={onAction}>
          <Text style={{ fontSize: 12, color: COLORS.primary, fontWeight: '600' }}>{action}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function ComingSoon({ icon, label }) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 60, gap: 14 }}>
      <View style={{ width: 60, height: 60, borderRadius: 20, backgroundColor: 'rgba(108,77,255,0.15)', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={28} color={COLORS.primary} />
      </View>
      <Text style={{ fontSize: 16, fontWeight: '700', color: DARK.text }}>{label}</Text>
      <Text style={{ fontSize: 13, color: DARK.mute }}>Bientôt disponible</Text>
    </View>
  );
}

function StatusBadge({ status }) {
  const color = STATUS_COLORS[status] ?? '#888';
  return (
    <View style={{ borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: color + '22' }}>
      <Text style={{ fontSize: 10, fontWeight: '700', color }}>{status}</Text>
    </View>
  );
}

/* ─── CMS Settings Sub-tabs ─────────────────────────────────────────────── */
const SETTINGS_SUB_TABS = [
  { key: 'accueil',       label: 'Accueil' },
  { key: 'config',        label: 'Config' },
  { key: 'onboarding',    label: 'Onboarding' },
  { key: 'livraison',     label: 'Livraison' },
  { key: 'paiement',      label: 'Paiement' },
  { key: 'notifications', label: 'Notifs' },
];

function SubTabBar({ tabs, active, onSelect }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
      <View style={{ flexDirection: 'row', backgroundColor: DARK.card, borderRadius: 10, padding: 3, gap: 2 }}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => onSelect(tab.key)}
            style={{ paddingHorizontal: 12, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: active === tab.key ? COLORS.primary : 'transparent' }}
          >
            <Text style={{ fontSize: 11, fontWeight: '600', color: active === tab.key ? '#fff' : DARK.mute }}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

function DarkInput({ value, onChangeText, placeholder, multiline, keyboardType, style }) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={DARK.mute}
      multiline={multiline}
      keyboardType={keyboardType}
      style={[{ backgroundColor: DARK.bg, borderRadius: 8, borderWidth: 1, borderColor: DARK.border, color: DARK.text, paddingHorizontal: 12, paddingVertical: 9, fontSize: 13 }, style]}
    />
  );
}

/* Homepage sections sub-tab */
function HomepageSectionsTab() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getHomepageSections().then(data => { setSections(data); setLoading(false); });
  }, []);

  async function toggleVisible(sec) {
    const updated = { ...sec, visible: !sec.visible };
    setSections(prev => prev.map(s => s.id === sec.id ? updated : s));
    await updateHomepageSection(sec.id, { visible: !sec.visible });
  }

  async function updateOrder(sec, val) {
    const n = parseInt(val) || 0;
    setSections(prev => prev.map(s => s.id === sec.id ? { ...s, sort_order: n } : s));
    await updateHomepageSection(sec.id, { sort_order: n });
  }

  if (loading) return <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />;

  return (
    <>
      <Text style={{ fontSize: 12, color: DARK.mute, marginBottom: 12 }}>Activez/désactivez les sections de la page d'accueil et définissez leur ordre d'affichage.</Text>
      {sections.map((sec, i) => (
        <DarkCard key={sec.id} style={{ marginBottom: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, paddingVertical: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: DARK.text }}>{sec.label}</Text>
              <Text style={{ fontSize: 10, color: DARK.mute, marginTop: 2 }}>{sec.key}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginRight: 8 }}>
              <Text style={{ fontSize: 11, color: DARK.mute }}>Ordre</Text>
              <TextInput
                value={String(sec.sort_order)}
                onChangeText={v => setSections(prev => prev.map(s => s.id === sec.id ? { ...s, sort_order: parseInt(v) || 0 } : s))}
                onEndEditing={e => updateOrder(sec, e.nativeEvent.text)}
                keyboardType="numeric"
                style={{ width: 40, backgroundColor: DARK.bg, borderRadius: 6, borderWidth: 1, borderColor: DARK.border, color: DARK.text, textAlign: 'center', paddingVertical: 4, fontSize: 12 }}
              />
            </View>
            <Switch
              value={sec.visible}
              onValueChange={() => toggleVisible(sec)}
              trackColor={{ false: DARK.border, true: COLORS.primary }}
              thumbColor="#fff"
            />
          </View>
        </DarkCard>
      ))}
    </>
  );
}

/* Config sub-tab */
function ConfigTab() {
  const [config, setConfigData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);

  useEffect(() => {
    getAppConfig(true).then(data => { setConfigData(data); setLoading(false); });
  }, []);

  async function save(key, value) {
    setSaving(key);
    await setAppConfig(key, value);
    setSaving(null);
  }

  if (loading) return <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />;

  const appKeys = ['app.name', 'app.tagline'];
  const themeKeys = Object.keys(config).filter(k => k.startsWith('theme.'));
  const featureKeys = Object.keys(config).filter(k => k.startsWith('features.'));

  return (
    <>
      {/* App info */}
      <DarkCard style={{ marginBottom: 12 }}>
        <View style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: DARK.border }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: DARK.text }}>Informations app</Text>
        </View>
        {appKeys.map(key => (
          <View key={key} style={{ paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: DARK.border }}>
            <Text style={{ fontSize: 10, color: DARK.mute, marginBottom: 5 }}>{key}</Text>
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <TextInput
                value={typeof config[key] === 'string' ? config[key] : JSON.stringify(config[key])}
                onChangeText={v => setConfigData(prev => ({ ...prev, [key]: v }))}
                style={{ flex: 1, backgroundColor: DARK.bg, borderRadius: 8, borderWidth: 1, borderColor: DARK.border, color: DARK.text, paddingHorizontal: 10, paddingVertical: 7, fontSize: 13 }}
                placeholderTextColor={DARK.mute}
              />
              <TouchableOpacity
                onPress={() => save(key, config[key])}
                disabled={saving === key}
                style={{ width: 60, height: 36, borderRadius: 8, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' }}
              >
                {saving === key
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>Sauv.</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </DarkCard>

      {/* Theme colors */}
      <DarkCard style={{ marginBottom: 12 }}>
        <View style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: DARK.border }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: DARK.text }}>Couleurs du thème</Text>
        </View>
        {themeKeys.map(key => {
          const colorVal = typeof config[key] === 'string' ? config[key] : '#6C4DFF';
          return (
            <View key={key} style={{ paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: DARK.border }}>
              <Text style={{ fontSize: 10, color: DARK.mute, marginBottom: 5 }}>{key}</Text>
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: colorVal, borderWidth: 2, borderColor: DARK.border }} />
                <TextInput
                  value={colorVal}
                  onChangeText={v => setConfigData(prev => ({ ...prev, [key]: v }))}
                  style={{ flex: 1, backgroundColor: DARK.bg, borderRadius: 8, borderWidth: 1, borderColor: DARK.border, color: DARK.text, paddingHorizontal: 10, paddingVertical: 7, fontSize: 13 }}
                  placeholderTextColor={DARK.mute}
                  placeholder="#RRGGBB"
                />
                <TouchableOpacity
                  onPress={() => save(key, colorVal)}
                  disabled={saving === key}
                  style={{ width: 60, height: 36, borderRadius: 8, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' }}
                >
                  {saving === key
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>Sauv.</Text>
                  }
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </DarkCard>

      {/* Feature flags */}
      <DarkCard style={{ marginBottom: 12 }}>
        <View style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: DARK.border }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: DARK.text }}>Fonctionnalités</Text>
        </View>
        {featureKeys.map(key => (
          <View key={key} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: DARK.border }}>
            <Text style={{ flex: 1, fontSize: 13, color: DARK.text }}>{key.replace('features.', '')}</Text>
            <Switch
              value={config[key] === true || config[key] === 'true'}
              onValueChange={v => {
                setConfigData(prev => ({ ...prev, [key]: v }));
                save(key, v);
              }}
              trackColor={{ false: DARK.border, true: COLORS.primary }}
              thumbColor="#fff"
            />
          </View>
        ))}
      </DarkCard>
    </>
  );
}

/* Onboarding sub-tab */
function OnboardingTab() {
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editSlide, setEditSlide] = useState(null);
  const [form, setForm] = useState({ title: '', subtitle: '', emoji: '✨', bg_color: '#6C4DFF', label: '', sort_order: 0, active: true });
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const data = await getOnboardingSlides();
    setSlides(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openNew() {
    setEditSlide(null);
    setForm({ title: '', subtitle: '', emoji: '✨', bg_color: '#6C4DFF', label: '', sort_order: slides.length + 1, active: true });
    setModal(true);
  }

  function openEdit(slide) {
    setEditSlide(slide);
    setForm({ title: slide.title, subtitle: slide.subtitle ?? '', emoji: slide.emoji ?? '✨', bg_color: slide.bg_color ?? '#6C4DFF', label: slide.label ?? '', sort_order: slide.sort_order ?? 0, active: slide.active ?? true });
    setModal(true);
  }

  async function save() {
    setSaving(true);
    const payload = editSlide ? { ...form, id: editSlide.id } : form;
    await upsertOnboardingSlide(payload);
    setSaving(false);
    setModal(false);
    load();
  }

  async function del(id) {
    await deleteOnboardingSlide(id);
    load();
  }

  if (loading) return <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />;

  return (
    <>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Text style={{ fontSize: 12, color: DARK.mute }}>{slides.length} slide(s)</Text>
        <TouchableOpacity onPress={openNew} style={{ backgroundColor: COLORS.primary, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Icon name="plus" size={13} color="#fff" />
          <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>Nouveau slide</Text>
        </TouchableOpacity>
      </View>

      {slides.map(slide => (
        <DarkCard key={slide.id} style={{ marginBottom: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 }}>
            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: slide.bg_color ?? '#6C4DFF', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 18 }}>{slide.emoji}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: DARK.text }} numberOfLines={1}>{slide.title}</Text>
              <Text style={{ fontSize: 10, color: DARK.mute, marginTop: 2 }}>Ordre {slide.sort_order} · {slide.active ? 'Actif' : 'Inactif'}</Text>
            </View>
            <TouchableOpacity onPress={() => openEdit(slide)} style={{ width: 28, height: 28, borderRadius: 7, backgroundColor: 'rgba(108,77,255,0.18)', alignItems: 'center', justifyContent: 'center', marginRight: 6 }}>
              <Icon name="eye" size={14} color={COLORS.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => del(slide.id)} style={{ width: 28, height: 28, borderRadius: 7, backgroundColor: 'rgba(209,67,67,0.15)', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="trash2" size={14} color={COLORS.danger} />
            </TouchableOpacity>
          </View>
        </DarkCard>
      ))}

      <Modal visible={modal} transparent animationType="slide" onRequestClose={() => setModal(false)}>
        <TouchableOpacity activeOpacity={1} onPress={() => setModal(false)} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
          <TouchableOpacity activeOpacity={1} style={{ backgroundColor: DARK.card, borderTopLeftRadius: 18, borderTopRightRadius: 18, paddingHorizontal: 18, paddingTop: 16, paddingBottom: 32 }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: DARK.border, alignSelf: 'center', marginBottom: 16 }} />
            <Text style={{ fontSize: 16, fontWeight: '700', color: DARK.text, marginBottom: 14 }}>{editSlide ? 'Modifier le slide' : 'Nouveau slide'}</Text>

            <Text style={{ fontSize: 11, color: DARK.mute, marginBottom: 5 }}>Titre</Text>
            <DarkInput value={form.title} onChangeText={v => setForm(f => ({ ...f, title: v }))} placeholder="Titre" style={{ marginBottom: 10 }} />

            <Text style={{ fontSize: 11, color: DARK.mute, marginBottom: 5 }}>Sous-titre</Text>
            <DarkInput value={form.subtitle} onChangeText={v => setForm(f => ({ ...f, subtitle: v }))} placeholder="Sous-titre" multiline style={{ minHeight: 60, marginBottom: 10 }} />

            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, color: DARK.mute, marginBottom: 5 }}>Emoji</Text>
                <DarkInput value={form.emoji} onChangeText={v => setForm(f => ({ ...f, emoji: v }))} placeholder="✨" />
              </View>
              <View style={{ flex: 2 }}>
                <Text style={{ fontSize: 11, color: DARK.mute, marginBottom: 5 }}>Label</Text>
                <DarkInput value={form.label} onChangeText={v => setForm(f => ({ ...f, label: v }))} placeholder="lifestyle · shopping" />
              </View>
            </View>

            <Text style={{ fontSize: 11, color: DARK.mute, marginBottom: 8 }}>Couleur de fond</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
              {BANNER_COLORS.map(c => (
                <TouchableOpacity key={c} onPress={() => setForm(f => ({ ...f, bg_color: c }))}
                  style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: c, borderWidth: form.bg_color === c ? 2 : 0, borderColor: '#fff' }} />
              ))}
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, color: DARK.mute, marginBottom: 5 }}>Ordre</Text>
                <DarkInput value={String(form.sort_order)} onChangeText={v => setForm(f => ({ ...f, sort_order: parseInt(v) || 0 }))} keyboardType="numeric" placeholder="1" />
              </View>
              <View style={{ flex: 2, justifyContent: 'flex-end', paddingBottom: 2 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 13, color: DARK.text }}>Actif</Text>
                  <Switch value={form.active} onValueChange={v => setForm(f => ({ ...f, active: v }))} trackColor={{ false: DARK.border, true: COLORS.primary }} thumbColor="#fff" />
                </View>
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity onPress={() => setModal(false)} style={{ flex: 1, height: 44, borderRadius: 10, borderWidth: 1, borderColor: DARK.border, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: DARK.mute, fontWeight: '600', fontSize: 14 }}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={save} disabled={saving} style={{ flex: 2, height: 44, borderRadius: 10, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' }}>
                {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Enregistrer</Text>}
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

/* Shipping sub-tab */
function ShippingTab() {
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ key: '', name: '', description: '', price: '3.99', free_threshold: '', estimated_days: '', emoji: '🚚', active: true, sort_order: 0 });
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const data = await getAllShippingMethods();
    setMethods(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openNew() {
    setEditItem(null);
    setForm({ key: '', name: '', description: '', price: '3.99', free_threshold: '', estimated_days: '', emoji: '🚚', active: true, sort_order: methods.length + 1 });
    setModal(true);
  }

  function openEdit(m) {
    setEditItem(m);
    setForm({ key: m.key, name: m.name, description: m.description ?? '', price: String(m.price ?? '0'), free_threshold: m.free_threshold != null ? String(m.free_threshold) : '', estimated_days: m.estimated_days ?? '', emoji: m.emoji ?? '🚚', active: m.active ?? true, sort_order: m.sort_order ?? 0 });
    setModal(true);
  }

  async function save() {
    setSaving(true);
    const payload = {
      key: form.key,
      name: form.name,
      description: form.description,
      price: parseFloat(form.price) || 0,
      free_threshold: form.free_threshold ? parseFloat(form.free_threshold) : null,
      estimated_days: form.estimated_days,
      emoji: form.emoji,
      active: form.active,
      sort_order: form.sort_order,
    };
    if (editItem) payload.id = editItem.id;
    await upsertShippingMethod(payload);
    setSaving(false);
    setModal(false);
    load();
  }

  async function del(id) {
    await deleteShippingMethod(id);
    load();
  }

  if (loading) return <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />;

  return (
    <>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Text style={{ fontSize: 12, color: DARK.mute }}>{methods.length} méthode(s)</Text>
        <TouchableOpacity onPress={openNew} style={{ backgroundColor: COLORS.primary, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Icon name="plus" size={13} color="#fff" />
          <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>Nouveau</Text>
        </TouchableOpacity>
      </View>

      {methods.map(m => (
        <DarkCard key={m.id} style={{ marginBottom: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 }}>
            <Text style={{ fontSize: 22 }}>{m.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: DARK.text }}>{m.name}</Text>
              <Text style={{ fontSize: 11, color: DARK.mute, marginTop: 2 }}>${m.price} · {m.estimated_days} · {m.active ? 'Actif' : 'Inactif'}</Text>
            </View>
            <TouchableOpacity onPress={() => openEdit(m)} style={{ width: 28, height: 28, borderRadius: 7, backgroundColor: 'rgba(108,77,255,0.18)', alignItems: 'center', justifyContent: 'center', marginRight: 6 }}>
              <Icon name="eye" size={14} color={COLORS.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => del(m.id)} style={{ width: 28, height: 28, borderRadius: 7, backgroundColor: 'rgba(209,67,67,0.15)', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="trash2" size={14} color={COLORS.danger} />
            </TouchableOpacity>
          </View>
        </DarkCard>
      ))}

      <Modal visible={modal} transparent animationType="slide" onRequestClose={() => setModal(false)}>
        <TouchableOpacity activeOpacity={1} onPress={() => setModal(false)} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
          <TouchableOpacity activeOpacity={1} style={{ backgroundColor: DARK.card, borderTopLeftRadius: 18, borderTopRightRadius: 18, paddingHorizontal: 18, paddingTop: 16, paddingBottom: 32 }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: DARK.border, alignSelf: 'center', marginBottom: 16 }} />
            <Text style={{ fontSize: 16, fontWeight: '700', color: DARK.text, marginBottom: 14 }}>{editItem ? 'Modifier la livraison' : 'Nouvelle méthode'}</Text>

            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, color: DARK.mute, marginBottom: 5 }}>Clé</Text>
                <DarkInput value={form.key} onChangeText={v => setForm(f => ({ ...f, key: v }))} placeholder="standard" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, color: DARK.mute, marginBottom: 5 }}>Emoji</Text>
                <DarkInput value={form.emoji} onChangeText={v => setForm(f => ({ ...f, emoji: v }))} placeholder="🚚" />
              </View>
            </View>

            <Text style={{ fontSize: 11, color: DARK.mute, marginBottom: 5 }}>Nom</Text>
            <DarkInput value={form.name} onChangeText={v => setForm(f => ({ ...f, name: v }))} placeholder="Standard" style={{ marginBottom: 10 }} />

            <Text style={{ fontSize: 11, color: DARK.mute, marginBottom: 5 }}>Description</Text>
            <DarkInput value={form.description} onChangeText={v => setForm(f => ({ ...f, description: v }))} placeholder="Livraison en 5 à 8 jours" style={{ marginBottom: 10 }} />

            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, color: DARK.mute, marginBottom: 5 }}>Prix ($)</Text>
                <DarkInput value={form.price} onChangeText={v => setForm(f => ({ ...f, price: v }))} placeholder="3.99" keyboardType="decimal-pad" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, color: DARK.mute, marginBottom: 5 }}>Gratuit si + ($)</Text>
                <DarkInput value={form.free_threshold} onChangeText={v => setForm(f => ({ ...f, free_threshold: v }))} placeholder="30" keyboardType="decimal-pad" />
              </View>
            </View>

            <Text style={{ fontSize: 11, color: DARK.mute, marginBottom: 5 }}>Délai estimé</Text>
            <DarkInput value={form.estimated_days} onChangeText={v => setForm(f => ({ ...f, estimated_days: v }))} placeholder="5 à 8 jours" style={{ marginBottom: 12 }} />

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <Text style={{ fontSize: 13, color: DARK.text }}>Activer</Text>
              <Switch value={form.active} onValueChange={v => setForm(f => ({ ...f, active: v }))} trackColor={{ false: DARK.border, true: COLORS.primary }} thumbColor="#fff" />
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity onPress={() => setModal(false)} style={{ flex: 1, height: 44, borderRadius: 10, borderWidth: 1, borderColor: DARK.border, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: DARK.mute, fontWeight: '600', fontSize: 14 }}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={save} disabled={saving} style={{ flex: 2, height: 44, borderRadius: 10, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' }}>
                {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Enregistrer</Text>}
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

/* Payment sub-tab */
function PaymentTab() {
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ key: '', name: '', description: '', emoji: '💳', active: true, sort_order: 0 });
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const data = await getAllPaymentMethods();
    setMethods(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openNew() {
    setEditItem(null);
    setForm({ key: '', name: '', description: '', emoji: '💳', active: true, sort_order: methods.length + 1 });
    setModal(true);
  }

  function openEdit(m) {
    setEditItem(m);
    setForm({ key: m.key, name: m.name, description: m.description ?? '', emoji: m.emoji ?? '💳', active: m.active ?? true, sort_order: m.sort_order ?? 0 });
    setModal(true);
  }

  async function save() {
    setSaving(true);
    const payload = { key: form.key, name: form.name, description: form.description, emoji: form.emoji, active: form.active, sort_order: form.sort_order };
    if (editItem) payload.id = editItem.id;
    await upsertPaymentMethod(payload);
    setSaving(false);
    setModal(false);
    load();
  }

  async function del(id) {
    await deletePaymentMethod(id);
    load();
  }

  if (loading) return <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />;

  return (
    <>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Text style={{ fontSize: 12, color: DARK.mute }}>{methods.length} méthode(s)</Text>
        <TouchableOpacity onPress={openNew} style={{ backgroundColor: COLORS.primary, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Icon name="plus" size={13} color="#fff" />
          <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>Nouveau</Text>
        </TouchableOpacity>
      </View>

      {methods.map(m => (
        <DarkCard key={m.id} style={{ marginBottom: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 }}>
            <Text style={{ fontSize: 22 }}>{m.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: DARK.text }}>{m.name}</Text>
              <Text style={{ fontSize: 11, color: DARK.mute, marginTop: 2 }}>{m.description} · {m.active ? 'Actif' : 'Inactif'}</Text>
            </View>
            <TouchableOpacity onPress={() => openEdit(m)} style={{ width: 28, height: 28, borderRadius: 7, backgroundColor: 'rgba(108,77,255,0.18)', alignItems: 'center', justifyContent: 'center', marginRight: 6 }}>
              <Icon name="eye" size={14} color={COLORS.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => del(m.id)} style={{ width: 28, height: 28, borderRadius: 7, backgroundColor: 'rgba(209,67,67,0.15)', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="trash2" size={14} color={COLORS.danger} />
            </TouchableOpacity>
          </View>
        </DarkCard>
      ))}

      <Modal visible={modal} transparent animationType="slide" onRequestClose={() => setModal(false)}>
        <TouchableOpacity activeOpacity={1} onPress={() => setModal(false)} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
          <TouchableOpacity activeOpacity={1} style={{ backgroundColor: DARK.card, borderTopLeftRadius: 18, borderTopRightRadius: 18, paddingHorizontal: 18, paddingTop: 16, paddingBottom: 32 }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: DARK.border, alignSelf: 'center', marginBottom: 16 }} />
            <Text style={{ fontSize: 16, fontWeight: '700', color: DARK.text, marginBottom: 14 }}>{editItem ? 'Modifier' : 'Nouveau paiement'}</Text>

            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, color: DARK.mute, marginBottom: 5 }}>Clé</Text>
                <DarkInput value={form.key} onChangeText={v => setForm(f => ({ ...f, key: v }))} placeholder="card" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, color: DARK.mute, marginBottom: 5 }}>Emoji</Text>
                <DarkInput value={form.emoji} onChangeText={v => setForm(f => ({ ...f, emoji: v }))} placeholder="💳" />
              </View>
            </View>

            <Text style={{ fontSize: 11, color: DARK.mute, marginBottom: 5 }}>Nom</Text>
            <DarkInput value={form.name} onChangeText={v => setForm(f => ({ ...f, name: v }))} placeholder="Carte bancaire" style={{ marginBottom: 10 }} />

            <Text style={{ fontSize: 11, color: DARK.mute, marginBottom: 5 }}>Description</Text>
            <DarkInput value={form.description} onChangeText={v => setForm(f => ({ ...f, description: v }))} placeholder="Visa, Mastercard" style={{ marginBottom: 12 }} />

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <Text style={{ fontSize: 13, color: DARK.text }}>Activer</Text>
              <Switch value={form.active} onValueChange={v => setForm(f => ({ ...f, active: v }))} trackColor={{ false: DARK.border, true: COLORS.primary }} thumbColor="#fff" />
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity onPress={() => setModal(false)} style={{ flex: 1, height: 44, borderRadius: 10, borderWidth: 1, borderColor: DARK.border, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: DARK.mute, fontWeight: '600', fontSize: 14 }}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={save} disabled={saving} style={{ flex: 2, height: 44, borderRadius: 10, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' }}>
                {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Enregistrer</Text>}
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

/* Notifications sub-tab */
function NotificationsTab() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ key: '', title: '', body: '', active: true });
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const data = await getNotificationTemplates();
    setTemplates(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openEdit(tpl) {
    setEditItem(tpl);
    setForm({ key: tpl.key, title: tpl.title, body: tpl.body, active: tpl.active ?? true });
    setModal(true);
  }

  async function save() {
    setSaving(true);
    const payload = { ...form };
    if (editItem) payload.id = editItem.id;
    await upsertNotificationTemplate(payload);
    setSaving(false);
    setModal(false);
    load();
  }

  if (loading) return <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />;

  return (
    <>
      <Text style={{ fontSize: 12, color: DARK.mute, marginBottom: 12 }}>Modifiez les templates de notifications envoyées aux utilisateurs.</Text>

      {templates.map(tpl => (
        <DarkCard key={tpl.id} style={{ marginBottom: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: DARK.text }} numberOfLines={1}>{tpl.title}</Text>
              <Text style={{ fontSize: 10, color: DARK.mute, marginTop: 2 }}>{tpl.key} · {tpl.active ? 'Actif' : 'Inactif'}</Text>
            </View>
            <TouchableOpacity onPress={() => openEdit(tpl)} style={{ width: 28, height: 28, borderRadius: 7, backgroundColor: 'rgba(108,77,255,0.18)', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="eye" size={14} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        </DarkCard>
      ))}

      <Modal visible={modal} transparent animationType="slide" onRequestClose={() => setModal(false)}>
        <TouchableOpacity activeOpacity={1} onPress={() => setModal(false)} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
          <TouchableOpacity activeOpacity={1} style={{ backgroundColor: DARK.card, borderTopLeftRadius: 18, borderTopRightRadius: 18, paddingHorizontal: 18, paddingTop: 16, paddingBottom: 32 }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: DARK.border, alignSelf: 'center', marginBottom: 16 }} />
            <Text style={{ fontSize: 16, fontWeight: '700', color: DARK.text, marginBottom: 14 }}>Modifier le template</Text>

            <Text style={{ fontSize: 11, color: DARK.mute, marginBottom: 5 }}>Clé</Text>
            <DarkInput value={form.key} onChangeText={v => setForm(f => ({ ...f, key: v }))} placeholder="order_confirmed" style={{ marginBottom: 10 }} />

            <Text style={{ fontSize: 11, color: DARK.mute, marginBottom: 5 }}>Titre</Text>
            <DarkInput value={form.title} onChangeText={v => setForm(f => ({ ...f, title: v }))} placeholder="Titre de la notification" style={{ marginBottom: 10 }} />

            <Text style={{ fontSize: 11, color: DARK.mute, marginBottom: 5 }}>Corps</Text>
            <DarkInput value={form.body} onChangeText={v => setForm(f => ({ ...f, body: v }))} placeholder="Contenu de la notification. Utilisez {{variable}} pour les variables." multiline style={{ minHeight: 80, marginBottom: 12 }} />

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <Text style={{ fontSize: 13, color: DARK.text }}>Actif</Text>
              <Switch value={form.active} onValueChange={v => setForm(f => ({ ...f, active: v }))} trackColor={{ false: DARK.border, true: COLORS.primary }} thumbColor="#fff" />
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity onPress={() => setModal(false)} style={{ flex: 1, height: 44, borderRadius: 10, borderWidth: 1, borderColor: DARK.border, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: DARK.mute, fontWeight: '600', fontSize: 14 }}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={save} disabled={saving} style={{ flex: 2, height: 44, borderRadius: 10, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' }}>
                {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Enregistrer</Text>}
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

/* ─── Banner CMS components ──────────────────────────────────────────────── */
function BannerCard({ b, onEdit, onDelete, onToggle }) {
  return (
    <DarkCard style={{ marginBottom: 10 }}>
      {b.image_url ? (
        <Image source={{ uri: b.image_url }} style={{ width: '100%', height: 80 }} resizeMode="cover" />
      ) : (
        <View style={{ height: 80, backgroundColor: b.bg_color ?? COLORS.primary, paddingHorizontal: 12, paddingVertical: 10, justifyContent: 'center' }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#fff' }} numberOfLines={1}>{b.title}</Text>
          {!!b.subtitle && (
            <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 2 }} numberOfLines={1}>{b.subtitle}</Text>
          )}
        </View>
      )}
      <View style={{ paddingHorizontal: 10, paddingTop: 8, paddingBottom: 4 }}>
        <Text style={{ fontSize: 12, fontWeight: '600', color: DARK.text }} numberOfLines={1}>{b.title || '(sans titre)'}</Text>
        <Text style={{ fontSize: 10, color: DARK.mute, marginTop: 2 }}>Position {b.position ?? 0}</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingBottom: 10, paddingTop: 6, gap: 8 }}>
        <View style={{ backgroundColor: b.is_active ? 'rgba(31,138,91,0.2)' : 'rgba(255,255,255,0.08)', borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2 }}>
          <Text style={{ fontSize: 9, fontWeight: '700', color: b.is_active ? COLORS.success : DARK.mute }}>
            {b.is_active ? 'live' : 'inactif'}
          </Text>
        </View>
        <View style={{ flex: 1 }} />
        <TouchableOpacity onPress={() => onToggle(b)} style={{ marginRight: 6 }}>
          <Text style={{ fontSize: 10, color: COLORS.primary }}>{b.is_active ? 'Désactiver' : 'Activer'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onEdit(b)} style={{ width: 28, height: 28, borderRadius: 7, backgroundColor: 'rgba(108,77,255,0.18)', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="eye" size={14} color={COLORS.primary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onDelete(b.id)} style={{ width: 28, height: 28, borderRadius: 7, backgroundColor: 'rgba(209,67,67,0.15)', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="trash2" size={14} color={COLORS.danger} />
        </TouchableOpacity>
      </View>
    </DarkCard>
  );
}

function BannerImageUploadButton({ form, setForm }) {
  const [uploading, setUploading] = useState(false);
  async function pick() {
    setUploading(true);
    try {
      const ImagePicker = await import('expo-image-picker');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const path = `banners/${Date.now()}.jpg`;
        const url = await uploadImage(asset.uri, 'banners', path);
        if (url) setForm(f => ({ ...f, image_url: url }));
      }
    } catch (e) {
      console.warn('Banner image upload error', e);
    } finally {
      setUploading(false);
    }
  }
  return (
    <TouchableOpacity
      onPress={pick}
      disabled={uploading}
      style={{ height: 38, borderRadius: 8, borderWidth: 1, borderColor: COLORS.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}
    >
      {uploading
        ? <ActivityIndicator color={COLORS.primary} size="small" />
        : <>
            <Icon name="image" size={14} color={COLORS.primary} />
            <Text style={{ color: COLORS.primary, fontSize: 13, fontWeight: '600' }}>Choisir une image</Text>
          </>
      }
    </TouchableOpacity>
  );
}

function BannerModal({ visible, form, setForm, onSave, onCancel, saving }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={onCancel}
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}
      >
        <TouchableOpacity activeOpacity={1} style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: DARK.card, borderTopLeftRadius: 18, borderTopRightRadius: 18, paddingHorizontal: 18, paddingTop: 16, paddingBottom: 32 }}>
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: DARK.border, alignSelf: 'center', marginBottom: 16 }} />
          <Text style={{ fontSize: 16, fontWeight: '700', color: DARK.text, marginBottom: 14 }}>
            {form._isNew ? 'Nouvelle bannière' : 'Modifier la bannière'}
          </Text>
          <Text style={{ fontSize: 11, color: DARK.mute, marginBottom: 5 }}>Titre</Text>
          <TextInput
            value={form.title}
            onChangeText={v => setForm(f => ({ ...f, title: v }))}
            placeholder="Titre de la bannière"
            placeholderTextColor={DARK.mute}
            style={{ backgroundColor: DARK.bg, borderRadius: 8, borderWidth: 1, borderColor: DARK.border, color: DARK.text, paddingHorizontal: 12, paddingVertical: 9, fontSize: 13, marginBottom: 10 }}
          />
          <Text style={{ fontSize: 11, color: DARK.mute, marginBottom: 5 }}>Sous-titre</Text>
          <TextInput
            value={form.subtitle}
            onChangeText={v => setForm(f => ({ ...f, subtitle: v }))}
            placeholder="Sous-titre (optionnel)"
            placeholderTextColor={DARK.mute}
            style={{ backgroundColor: DARK.bg, borderRadius: 8, borderWidth: 1, borderColor: DARK.border, color: DARK.text, paddingHorizontal: 12, paddingVertical: 9, fontSize: 13, marginBottom: 10 }}
          />
          <Text style={{ fontSize: 11, color: DARK.mute, marginBottom: 5 }}>Texte du bouton CTA</Text>
          <TextInput
            value={form.cta}
            onChangeText={v => setForm(f => ({ ...f, cta: v }))}
            placeholder="Ex: Découvrir"
            placeholderTextColor={DARK.mute}
            style={{ backgroundColor: DARK.bg, borderRadius: 8, borderWidth: 1, borderColor: DARK.border, color: DARK.text, paddingHorizontal: 12, paddingVertical: 9, fontSize: 13, marginBottom: 10 }}
          />
          <Text style={{ fontSize: 11, color: DARK.mute, marginBottom: 8 }}>Couleur de fond</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
            {BANNER_COLORS.map(c => (
              <TouchableOpacity
                key={c}
                onPress={() => setForm(f => ({ ...f, bg_color: c }))}
                style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: c, borderWidth: form.bg_color === c ? 2 : 0, borderColor: '#fff' }}
              />
            ))}
          </View>
          <Text style={{ fontSize: 11, color: DARK.mute, marginBottom: 5 }}>Image</Text>
          {!!form.image_url && (
            <Image source={{ uri: form.image_url }} style={{ width: '100%', height: 80, borderRadius: 8, marginBottom: 8 }} resizeMode="cover" />
          )}
          <BannerImageUploadButton form={form} setForm={setForm} />
          <Text style={{ fontSize: 11, color: DARK.mute, marginBottom: 5, marginTop: 10 }}>Position</Text>
          <TextInput
            value={String(form.position)}
            onChangeText={v => setForm(f => ({ ...f, position: parseInt(v) || 0 }))}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={DARK.mute}
            style={{ backgroundColor: DARK.bg, borderRadius: 8, borderWidth: 1, borderColor: DARK.border, color: DARK.text, paddingHorizontal: 12, paddingVertical: 9, fontSize: 13, marginBottom: 12 }}
          />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <Text style={{ fontSize: 13, color: DARK.text }}>Activer la bannière</Text>
            <Switch
              value={form.is_active}
              onValueChange={v => setForm(f => ({ ...f, is_active: v }))}
              trackColor={{ false: DARK.border, true: COLORS.primary }}
              thumbColor="#fff"
            />
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity onPress={onCancel} style={{ flex: 1, height: 44, borderRadius: 10, borderWidth: 1, borderColor: DARK.border, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: DARK.mute, fontWeight: '600', fontSize: 14 }}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onSave}
              disabled={saving}
              style={{ flex: 2, height: 44, borderRadius: 10, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' }}
            >
              {saving
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Enregistrer</Text>
              }
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

function BannersCMS({ banners, setBanners, bannerModal, setBannerModal, editingBanner, setEditingBanner, bannerForm, setBannerForm, savingBanner, onOpenModal, onSaveBanner, onDeleteBanner, onToggleBanner }) {
  return (
    <>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Text style={{ fontSize: 12, color: DARK.mute }}>{banners.filter(b => b.is_active).length} active(s)</Text>
        <TouchableOpacity
          onPress={() => onOpenModal(null)}
          style={{ backgroundColor: COLORS.primary, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 6 }}
        >
          <Icon name="plus" size={13} color="#fff" />
          <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>Nouvelle bannière</Text>
        </TouchableOpacity>
      </View>
      {banners.length === 0 && (
        <View style={{ alignItems: 'center', paddingVertical: 30 }}>
          <Icon name="image" size={32} color={DARK.mute} />
          <Text style={{ color: DARK.mute, fontSize: 13, marginTop: 10 }}>Aucune bannière</Text>
        </View>
      )}
      {banners.map(b => (
        <BannerCard key={b.id} b={b} onEdit={onOpenModal} onDelete={onDeleteBanner} onToggle={onToggleBanner} />
      ))}
      <BannerModal
        visible={bannerModal}
        form={bannerForm}
        setForm={setBannerForm}
        onSave={onSaveBanner}
        onCancel={() => setBannerModal(false)}
        saving={savingBanner}
      />
    </>
  );
}

/* ─── Main Screen ────────────────────────────────────────────────────────── */
export default function AdminConsoleScreen({ navigation }) {
  const session = useSession();
  const [section, setSection]         = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  /* data */
  const [users,        setUsers]        = useState([]);
  const [sellers,      setSellers]      = useState([]);
  const [kycRequests,  setKycRequests]  = useState([]);
  const [kycLoading,   setKycLoading]   = useState(false);
  const [rejectModal,  setRejectModal]  = useState(false);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectNotes,  setRejectNotes]  = useState('');
  const [kycDetailModal, setKycDetailModal] = useState(false);
  const [kycDetailReq,   setKycDetailReq]   = useState(null);
  const [kycSignedUrls,  setKycSignedUrls]  = useState({});

  async function openKycDetail(req) {
    setKycDetailReq(req);
    setKycSignedUrls({});
    setKycDetailModal(true);
    const urls = {};
    for (const [key, url] of [['selfie', req.selfie_url], ['front', req.doc_front_url], ['back', req.doc_back_url]]) {
      if (!url) continue;
      try {
        const parts = url.split('/kyc-docs/');
        const path = parts[1];
        if (path) {
          const { data } = await supabase.storage.from('kyc-docs').createSignedUrl(path, 3600);
          urls[key] = data?.signedUrl ?? url;
        } else {
          urls[key] = url;
        }
      } catch { urls[key] = url; }
    }
    setKycSignedUrls(urls);
  }
  const [usersCount,   setUsersCount]   = useState(0);
  const [ordersCount,  setOrdersCount]  = useState(0);
  const [banners,      setBanners]      = useState([]);
  const [categories,   setCategories]   = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [products,     setProducts]     = useState([]);
  const [revenue,      setRevenue]      = useState(0);
  const [loading,      setLoading]      = useState(true);

  /* settings & media */
  const [settingsSubTab,  setSettingsSubTab]  = useState('accueil');
  const [settingsOpen,    setSettingsOpen]    = useState(null);
  const [mediaSubTab,     setMediaSubTab]     = useState('banners');
  const [uploadingCat,    setUploadingCat]    = useState(null);
  const [featuredIds,     setFeaturedIds]     = useState('');
  const [savingFeatured,  setSavingFeatured]  = useState(false);
  const [featuredProducts, setFeaturedProducts] = useState([]);

  /* banner CMS */
  const [bannerModal,   setBannerModal]   = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [bannerForm,    setBannerForm]    = useState({ ...EMPTY_BANNER_FORM });
  const [savingBanner,  setSavingBanner]  = useState(false);

  /* sidebar animation */
  const sidebarAnim = useRef(new Animated.Value(54)).current;
  useEffect(() => {
    Animated.timing(sidebarAnim, {
      toValue: sidebarOpen ? 180 : 54,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [sidebarOpen]);

  const initials = (session?.user?.user_metadata?.full_name ?? 'A')
    .split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  useEffect(() => { loadAll(); }, []);
  useEffect(() => { if (section === 'sellers') loadKycRequests(); }, [section]);

  async function loadAll() {
    setLoading(true);
    try {
      const [
        { count: uc },
        { count: oc },
        { data: recentUsers },
        { data: recentSellers },
        { data: bannersData },
        { data: catsData },
        { data: settingsData },
        { data: featProdsData },
        { data: ordersData },
        { data: recentOrdersData },
        { data: productsData },
        { data: revenueData },
      ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id,full_name,email,role,created_at').order('created_at', { ascending: false }).limit(10),
        supabase.from('shops').select('id,name,is_verified,is_active,seller_id').order('created_at', { ascending: false }).limit(10),
        supabase.from('banners').select('*').order('position'),
        supabase.from('categories').select('slug,name,image_url').in('slug', MAIN_CATEGORIES.map(c => c.slug)),
        supabase.from('platform_settings').select('key,value').eq('key', 'featured_products').limit(1),
        supabase.from('products').select('id,name').limit(50),
        supabase.from('orders').select('id,total_amount,status,created_at,buyer_id').order('created_at', { ascending: false }).limit(5),
        supabase.from('orders').select('id,total_amount,status,created_at,buyer_id').order('created_at', { ascending: false }).limit(5),
        supabase.from('products').select('id,title,price,status,images').limit(20),
        supabase.from('orders').select('total_amount'),
      ]);

      setUsersCount(uc ?? 0);
      setOrdersCount(oc ?? 0);
      setUsers(recentUsers ?? []);
      setSellers(recentSellers ?? []);
      setBanners(bannersData ?? []);
      setCategories(catsData ?? []);
      if (settingsData && settingsData.length > 0) setFeaturedIds(settingsData[0].value ?? '');
      setFeaturedProducts(featProdsData ?? []);
      setRecentOrders(recentOrdersData ?? []);
      setProducts(productsData ?? []);
      const totalRevenue = (revenueData ?? []).reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);
      setRevenue(totalRevenue);
    } catch (e) {
      console.warn('loadAll error', e);
    } finally {
      setLoading(false);
    }
  }

  /* KYC helpers */
  async function loadKycRequests() {
    setKycLoading(true);
    try {
      const { data } = await supabase
        .from('kyc_requests')
        .select('*')
        .eq('status', 'pending')
        .order('submitted_at', { ascending: false });
      setKycRequests(data ?? []);
    } catch (e) {
      console.warn('loadKycRequests error', e);
    } finally {
      setKycLoading(false);
    }
  }

  async function approveKyc(req) {
    try {
      await supabase.from('kyc_requests').update({ status: 'approved', reviewed_at: new Date().toISOString() }).eq('id', req.id);
      await supabase.from('profiles').update({ role: 'seller', kyc_status: 'approved' }).eq('id', req.seller_id);
      setKycRequests(prev => prev.filter(r => r.id !== req.id));
    } catch (e) {
      console.warn('approveKyc error', e);
    }
  }

  async function rejectKyc() {
    if (!rejectTarget) return;
    try {
      await supabase.from('kyc_requests').update({ status: 'rejected', admin_notes: rejectNotes, reviewed_at: new Date().toISOString() }).eq('id', rejectTarget.id);
      await supabase.from('profiles').update({ kyc_status: 'rejected' }).eq('id', rejectTarget.seller_id);
      setKycRequests(prev => prev.filter(r => r.id !== rejectTarget.id));
    } catch (e) {
      console.warn('rejectKyc error', e);
    } finally {
      setRejectModal(false);
      setRejectTarget(null);
      setRejectNotes('');
    }
  }

  /* banner helpers */
  async function toggleBanner(b) {
    await supabase.from('banners').update({ is_active: !b.is_active }).eq('id', b.id);
    setBanners(prev => prev.map(x => x.id === b.id ? { ...x, is_active: !x.is_active } : x));
  }

  function openBannerModal(banner) {
    if (banner) {
      setEditingBanner(banner);
      setBannerForm({ title: banner.title ?? '', subtitle: banner.subtitle ?? '', cta: banner.cta ?? '', bg_color: banner.bg_color ?? '#6C4DFF', image_url: banner.image_url ?? '', position: banner.position ?? 0, is_active: banner.is_active ?? true, _isNew: false });
    } else {
      setEditingBanner(null);
      setBannerForm({ ...EMPTY_BANNER_FORM, _isNew: true });
    }
    setBannerModal(true);
  }

  async function saveBanner() {
    setSavingBanner(true);
    const payload = { title: bannerForm.title, subtitle: bannerForm.subtitle, cta: bannerForm.cta, bg_color: bannerForm.bg_color, image_url: bannerForm.image_url || null, position: bannerForm.position, is_active: bannerForm.is_active };
    try {
      if (editingBanner) {
        await supabase.from('banners').update(payload).eq('id', editingBanner.id);
        setBanners(prev => prev.map(b => b.id === editingBanner.id ? { ...b, ...payload } : b));
      } else {
        const { data } = await supabase.from('banners').insert(payload).select().single();
        if (data) setBanners(prev => [...prev, data].sort((a, b) => (a.position ?? 0) - (b.position ?? 0)));
      }
    } catch (e) {
      console.warn('saveBanner error', e);
    } finally {
      setSavingBanner(false);
      setBannerModal(false);
    }
  }

  async function deleteBanner(id) {
    await supabase.from('banners').delete().eq('id', id);
    setBanners(prev => prev.filter(b => b.id !== id));
  }

  /* category image */
  async function uploadCategoryImage(slug) {
    setUploadingCat(slug);
    try {
      const ImagePicker = await import('expo-image-picker');
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const path = `categories/${slug}-${Date.now()}.jpg`;
        const url = await uploadImage(asset.uri, 'banners', path);
        if (url) {
          await supabase.from('categories').update({ image_url: url }).eq('slug', slug);
          setCategories(prev => prev.map(c => c.slug === slug ? { ...c, image_url: url } : c));
        }
      }
    } catch (e) {
      console.warn('uploadCategoryImage error', e);
    } finally {
      setUploadingCat(null);
    }
  }

  /* featured products */
  async function saveFeaturedProducts() {
    setSavingFeatured(true);
    try {
      await supabase.from('platform_settings').upsert({ key: 'featured_products', value: featuredIds });
    } catch (e) {
      console.warn('saveFeaturedProducts error', e);
    } finally {
      setSavingFeatured(false);
    }
  }

  /* toggle product active */
  async function toggleProduct(p) {
    const newStatus = p.status === 'active' ? 'inactive' : 'active';
    await supabase.from('products').update({ status: newStatus }).eq('id', p.id);
    setProducts(prev => prev.map(x => x.id === p.id ? { ...x, status: newStatus } : x));
  }

  const SETTINGS = [
    { key: 'commission', icon: 'creditCard', label: 'Commission plateforme', detail: '8.5%' },
    { key: 'shipping',   icon: 'truck',      label: 'Frais de livraison',    detail: 'Configurés' },
    { key: 'security',   icon: 'lock',       label: 'Sécurité & 2FA',        detail: 'Activé' },
    { key: 'notifs',     icon: 'bell',       label: 'Notifications système', detail: 'On' },
    { key: 'roles',      icon: 'user',       label: 'Rôles & permissions',   detail: '4 rôles' },
  ];

  /* ─ RENDER ─ */
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: DARK.bg }} edges={['top']}>
      {/* Header */}
      <View style={{ backgroundColor: DARK.sidebar, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: DARK.border }}>
        <TouchableOpacity onPress={() => setSidebarOpen(v => !v)} style={{ marginRight: 12 }}>
          <Icon name={sidebarOpen ? 'x' : 'home'} size={20} color={DARK.text} />
        </TouchableOpacity>
        <Text style={{ fontWeight: '800', fontSize: 16, color: '#fff', letterSpacing: 1 }}>CLORIVO</Text>
        <View style={{ flex: 1 }} />
        <TouchableOpacity style={{ marginRight: 14 }}>
          <Icon name="search" size={18} color={DARK.mute} />
        </TouchableOpacity>
        <TouchableOpacity style={{ marginRight: 14, position: 'relative' }}>
          <Icon name="bell" size={18} color={DARK.mute} />
          <View style={{ position: 'absolute', top: -4, right: -4, width: 14, height: 14, borderRadius: 7, backgroundColor: COLORS.danger, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 8, color: '#fff', fontWeight: '700' }}>3</Text>
          </View>
        </TouchableOpacity>
        <Avatar size={28} initials={initials} bg={COLORS.primary} />
      </View>

      <View style={{ flex: 1, flexDirection: 'row' }}>
        {/* Sidebar */}
        <Animated.View style={{ width: sidebarAnim, backgroundColor: DARK.sidebar, borderRightWidth: 1, borderRightColor: DARK.border, paddingTop: 10, overflow: 'hidden' }}>
          {NAV_ITEMS.map(item => {
            const isActive = section === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                onPress={() => setSection(item.key)}
                style={{ flexDirection: 'row', alignItems: 'center', height: 44, paddingHorizontal: 15, marginBottom: 2, borderRadius: 0, backgroundColor: isActive ? 'rgba(108,77,255,0.2)' : 'transparent', borderLeftWidth: isActive ? 3 : 0, borderLeftColor: COLORS.primary }}
              >
                <Icon name={item.icon} size={18} color={isActive ? COLORS.primary : DARK.mute} />
                {sidebarOpen && (
                  <Text style={{ marginLeft: 12, fontSize: 13, fontWeight: isActive ? '700' : '400', color: isActive ? DARK.text : DARK.mute }} numberOfLines={1}>
                    {item.label}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </Animated.View>

        {/* Main content */}
        <ScrollView
          style={{ flex: 1, backgroundColor: DARK.bg }}
          contentContainerStyle={{ padding: 14, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {loading && <ActivityIndicator color={COLORS.primary} style={{ marginTop: 60 }} />}

          {/* ── DASHBOARD ── */}
          {!loading && section === 'dashboard' && (
            <>
              {/* Welcome header */}
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 22, fontWeight: '800', color: DARK.text, letterSpacing: -0.5 }}>Dashboard</Text>
                <Text style={{ fontSize: 12, color: DARK.mute, marginTop: 4 }}>Bienvenue ! Voici ce qui se passe aujourd'hui.</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 6, alignSelf: 'flex-start', backgroundColor: DARK.card, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 }}>
                  <Icon name="eye" size={12} color={DARK.mute} />
                  <Text style={{ fontSize: 11, color: DARK.mute }}>30 derniers jours</Text>
                </View>
              </View>

              {/* KPI 2x2 grid */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
                <KpiCard label="Revenus totaux"  value={'$' + revenue.toFixed(0)} delta="+12.5%" icon="creditCard" color="#6C4DFF" />
                <KpiCard label="Commandes"       value={String(ordersCount)}       delta="+8.3%"  icon="package"    color="#10B981" />
                <KpiCard label="Utilisateurs"    value={String(usersCount)}        delta="+15.7%" icon="user"       color="#3B82F6" />
                <KpiCard label="Vendeurs actifs" value={String(sellers.length)}    delta="+9.2%"  icon="store"      color="#F59E0B" />
              </View>

              {/* Sales bar chart */}
              <DarkCard style={{ marginBottom: 16, padding: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: DARK.text }}>Aperçu des ventes</Text>
                  <View style={{ backgroundColor: 'rgba(108,77,255,0.15)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 }}>
                    <Text style={{ fontSize: 11, color: COLORS.primary }}>Cette semaine</Text>
                  </View>
                </View>
                {/* Y axis max label */}
                <Text style={{ fontSize: 9, color: DARK.mute, marginBottom: 4 }}>{MAX_BAR}</Text>
                {/* Bars */}
                <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 90 }}>
                  {WEEK_BARS.map((v, i) => (
                    <View key={i} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: 80 }}>
                      <View style={{ width: '100%', height: Math.round((v / MAX_BAR) * 80), backgroundColor: '#6C4DFF', borderRadius: 4 }} />
                    </View>
                  ))}
                </View>
                {/* Day labels */}
                <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
                  {WEEK_DAYS.map((d, i) => (
                    <Text key={i} style={{ flex: 1, textAlign: 'center', fontSize: 9, color: DARK.mute }}>{d}</Text>
                  ))}
                </View>
                {/* Legend */}
                <View style={{ flexDirection: 'row', gap: 16, marginTop: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: '#6C4DFF' }} />
                    <Text style={{ fontSize: 11, color: DARK.mute }}>Revenue</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)' }} />
                    <Text style={{ fontSize: 11, color: DARK.mute }}>Commandes</Text>
                  </View>
                </View>
              </DarkCard>

              {/* Top categories */}
              <DarkCard style={{ marginBottom: 16, padding: 14 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: DARK.text, marginBottom: 12 }}>Top Catégories</Text>
                {TOP_CATS.map((cat, i) => (
                  <View key={i} style={{ marginBottom: i < TOP_CATS.length - 1 ? 12 : 0 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5, gap: 8 }}>
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: cat.color }} />
                      <Text style={{ flex: 1, fontSize: 12, color: DARK.text }}>{cat.name}</Text>
                      <Text style={{ fontSize: 12, color: DARK.mute, fontWeight: '600' }}>{cat.pct}%</Text>
                    </View>
                    <View style={{ height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.08)', width: '100%' }}>
                      <View style={{ height: 4, borderRadius: 2, backgroundColor: cat.color, width: cat.pct + '%' }} />
                    </View>
                  </View>
                ))}
              </DarkCard>

              {/* Recent orders */}
              <DarkCard style={{ marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: DARK.border }}>
                  <Text style={{ flex: 1, fontSize: 14, fontWeight: '700', color: DARK.text }}>Commandes récentes</Text>
                  <TouchableOpacity onPress={() => setSection('orders')}>
                    <Text style={{ fontSize: 12, color: COLORS.primary, fontWeight: '600' }}>Voir tout</Text>
                  </TouchableOpacity>
                </View>
                {recentOrders.length === 0 && (
                  <Text style={{ fontSize: 13, color: DARK.mute, padding: 14 }}>Aucune commande</Text>
                )}
                {recentOrders.map((o, i) => (
                  <View key={o.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 12, borderTopWidth: i > 0 ? 1 : 0, borderTopColor: DARK.border }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 12, fontWeight: '600', color: DARK.text }}>{'#CLV' + o.id.slice(0, 6).toUpperCase()}</Text>
                      <Text style={{ fontSize: 10, color: DARK.mute, marginTop: 2 }}>{o.buyer_id ? o.buyer_id.slice(0, 12) + '…' : '—'}</Text>
                    </View>
                    <StatusBadge status={o.status ?? 'pending'} />
                    <Text style={{ fontSize: 12, color: DARK.text, fontWeight: '700', marginLeft: 6 }}>${parseFloat(o.total_amount ?? 0).toFixed(2)}</Text>
                  </View>
                ))}
              </DarkCard>

              {/* Sales by location */}
              <DarkCard style={{ marginBottom: 16 }}>
                <View style={{ padding: 14, borderBottomWidth: 1, borderBottomColor: DARK.border }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: DARK.text }}>Ventes par région</Text>
                </View>
                {LOCATION_DATA.map((loc, i) => (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 12, borderTopWidth: i > 0 ? 1 : 0, borderTopColor: DARK.border }}>
                    <Text style={{ fontSize: 18 }}>{loc.flag}</Text>
                    <Text style={{ flex: 1, fontSize: 12, color: DARK.text }}>{loc.country}</Text>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: DARK.text, marginRight: 8 }}>{loc.amount}</Text>
                    <View style={{ backgroundColor: 'rgba(108,77,255,0.15)', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 }}>
                      <Text style={{ fontSize: 11, color: COLORS.primary, fontWeight: '600' }}>{loc.pct}</Text>
                    </View>
                  </View>
                ))}
              </DarkCard>
            </>
          )}

          {/* ── USERS ── */}
          {!loading && section === 'users' && (
            <>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
                {[['Total', String(usersCount)], ['Vendeurs', String(sellers.length)], ['Admins', '1']].map(([k, v], i) => (
                  <View key={i} style={{ flex: 1, backgroundColor: DARK.card, borderRadius: 10, padding: 10 }}>
                    <Text style={{ fontSize: 10, color: DARK.mute }}>{k}</Text>
                    <Text style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: '700', color: DARK.text, marginTop: 2 }}>{v}</Text>
                  </View>
                ))}
              </View>
              <DarkCard>
                <View style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: DARK.border }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: DARK.text }}>Comptes récents</Text>
                </View>
                {users.map((u, i) => (
                  <View key={u.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderTopWidth: i > 0 ? 1 : 0, borderTopColor: DARK.border }}>
                    <Avatar size={32} initials={(u.full_name ?? u.email ?? '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 12, fontWeight: '600', color: DARK.text }}>{u.full_name ?? '—'}</Text>
                      <Text style={{ fontSize: 11, color: DARK.mute }} numberOfLines={1}>{u.email} · {u.role}</Text>
                    </View>
                    <View style={{ backgroundColor: 'rgba(31,138,91,0.2)', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 }}>
                      <Text style={{ fontSize: 9, fontWeight: '700', color: COLORS.success }}>actif</Text>
                    </View>
                  </View>
                ))}
              </DarkCard>
            </>
          )}

          {/* ── SELLERS / KYC ── */}
          {!loading && section === 'sellers' && (
            <>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
                {[['En attente', String(kycRequests.length)], ['Vendeurs', String(sellers.length)]].map(([k, v], i) => (
                  <View key={i} style={{ flex: 1, backgroundColor: DARK.card, borderRadius: 10, padding: 10 }}>
                    <Text style={{ fontSize: 10, color: DARK.mute }}>{k}</Text>
                    <Text style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: '700', color: DARK.text, marginTop: 2 }}>{v}</Text>
                  </View>
                ))}
                <TouchableOpacity
                  onPress={loadKycRequests}
                  style={{ backgroundColor: COLORS.primary, borderRadius: 10, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>Actualiser</Text>
                </TouchableOpacity>
              </View>

              <Text style={{ fontSize: 13, fontWeight: '700', color: DARK.text, marginBottom: 10 }}>Demandes KYC en attente</Text>

              {kycLoading && <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 20 }} />}

              {!kycLoading && kycRequests.length === 0 && (
                <DarkCard style={{ padding: 24, alignItems: 'center' }}>
                  <Text style={{ fontSize: 13, color: DARK.mute }}>Aucune demande KYC en attente</Text>
                </DarkCard>
              )}

              {kycRequests.map((req) => (
                <DarkCard key={req.id} style={{ marginBottom: 12 }}>
                  <View style={{ padding: 14 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      {req.selfie_url
                        ? <Image source={{ uri: req.selfie_url }} style={{ width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: DARK.border }} resizeMode="cover" />
                        : <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: DARK.bg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: DARK.border }}>
                            <Icon name="user" size={20} color={DARK.mute} />
                          </View>
                      }
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: '700', color: DARK.text }}>
                          {req.first_name ?? ''} {req.last_name ?? ''}
                        </Text>
                        <Text style={{ fontSize: 11, color: DARK.mute, marginTop: 2 }}>
                          🏪 {req.shop_name ?? '—'}
                        </Text>
                        <Text style={{ fontSize: 10, color: DARK.mute }}>
                          Soumis le {req.submitted_at ? new Date(req.submitted_at).toLocaleDateString('fr-FR') : '—'}
                        </Text>
                      </View>
                      <View style={{ backgroundColor: 'rgba(245,158,11,0.2)', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 }}>
                        <Text style={{ fontSize: 9, fontWeight: '700', color: '#F59E0B' }}>EN ATTENTE</Text>
                      </View>
                    </View>

                    {/* View full dossier button */}
                    <TouchableOpacity onPress={() => openKycDetail(req)}
                      style={{ borderWidth: 1, borderColor: DARK.border, borderRadius: 8, paddingVertical: 8, alignItems: 'center', marginBottom: 8, flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
                      <Icon name="eye" size={14} color={DARK.mute} />
                      <Text style={{ fontSize: 12, color: DARK.mute, fontWeight: '600' }}>Voir le dossier complet</Text>
                    </TouchableOpacity>

                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TouchableOpacity onPress={() => approveKyc(req)}
                        style={{ flex: 1, height: 38, borderRadius: 8, backgroundColor: 'rgba(16,185,129,0.15)', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 }}>
                        <Icon name="checkCircle" size={14} color="#10B981" />
                        <Text style={{ fontSize: 12, fontWeight: '700', color: '#10B981' }}>Approuver</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => { setRejectTarget(req); setRejectNotes(''); setRejectModal(true); }}
                        style={{ flex: 1, height: 38, borderRadius: 8, backgroundColor: 'rgba(239,68,68,0.15)', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 }}>
                        <Icon name="x" size={14} color="#EF4444" />
                        <Text style={{ fontSize: 12, fontWeight: '700', color: '#EF4444' }}>Rejeter</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </DarkCard>
              ))}

              {/* KYC Detail Modal */}
              <Modal visible={kycDetailModal} animationType="slide" transparent onRequestClose={() => setKycDetailModal(false)}>
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' }}>
                  <View style={{ backgroundColor: DARK.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '94%' }}>
                    {/* Modal header */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: DARK.border }}>
                      <Text style={{ flex: 1, fontSize: 16, fontWeight: '700', color: DARK.text }}>Dossier KYC</Text>
                      <TouchableOpacity onPress={() => setKycDetailModal(false)}>
                        <Icon name="x" size={20} color={DARK.mute} />
                      </TouchableOpacity>
                    </View>

                    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
                      {kycDetailReq && (() => {
                        const r = kycDetailReq;
                        const docLabels = { passport: 'Passeport', id_card: 'Carte nationale d\'identité', work_permit: 'Permis de travail', driver_license: 'Permis de conduire' };
                        return (
                          <>
                            {/* Selfie + name */}
                            <View style={{ alignItems: 'center', marginBottom: 20 }}>
                              {(kycSignedUrls.selfie || r.selfie_url)
                                ? <Image source={{ uri: kycSignedUrls.selfie || r.selfie_url }} style={{ width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: DARK.border }} resizeMode="cover" />
                                : <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: DARK.bg, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: DARK.border }}>
                                    <Icon name="user" size={40} color={DARK.mute} />
                                  </View>
                              }
                              <Text style={{ fontSize: 18, fontWeight: '800', color: DARK.text, marginTop: 10 }}>{r.first_name} {r.last_name}</Text>
                              <Text style={{ fontSize: 12, color: DARK.mute }}>{r.nationality} · {r.country}</Text>
                            </View>

                            {/* Personal info */}
                            <View style={{ backgroundColor: DARK.bg, borderRadius: 12, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: DARK.border }}>
                              <Text style={{ fontSize: 12, fontWeight: '700', color: DARK.mute, letterSpacing: 1, marginBottom: 10 }}>INFORMATIONS PERSONNELLES</Text>
                              {[
                                ['Date de naissance', r.birth_date],
                                ['Téléphone', r.phone],
                                ['Email', r.email],
                                ['Nationalité', r.nationality],
                                ['Pays de résidence', r.country],
                              ].map(([label, val]) => val ? (
                                <View key={label} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: DARK.border }}>
                                  <Text style={{ fontSize: 12, color: DARK.mute }}>{label}</Text>
                                  <Text style={{ fontSize: 12, color: DARK.text, fontWeight: '600', maxWidth: '55%', textAlign: 'right' }}>{val}</Text>
                                </View>
                              ) : null)}
                            </View>

                            {/* Shop info */}
                            <View style={{ backgroundColor: DARK.bg, borderRadius: 12, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: DARK.border }}>
                              <Text style={{ fontSize: 12, fontWeight: '700', color: DARK.mute, letterSpacing: 1, marginBottom: 10 }}>BOUTIQUE</Text>
                              {[
                                ['Nom', r.shop_name],
                                ['Catégorie', r.shop_category],
                                ['Description', r.shop_description],
                              ].map(([label, val]) => val ? (
                                <View key={label} style={{ paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: DARK.border }}>
                                  <Text style={{ fontSize: 11, color: DARK.mute }}>{label}</Text>
                                  <Text style={{ fontSize: 13, color: DARK.text, fontWeight: '600', marginTop: 2 }}>{val}</Text>
                                </View>
                              ) : null)}
                            </View>

                            {/* Document */}
                            <View style={{ backgroundColor: DARK.bg, borderRadius: 12, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: DARK.border }}>
                              <Text style={{ fontSize: 12, fontWeight: '700', color: DARK.mute, letterSpacing: 1, marginBottom: 10 }}>
                                DOCUMENT — {docLabels[r.doc_type] ?? r.doc_type ?? '—'}
                              </Text>
                              <View style={{ flexDirection: 'row', gap: 10 }}>
                                {(kycSignedUrls.front || r.doc_front_url)
                                  ? <View style={{ flex: 1 }}>
                                      <Text style={{ fontSize: 10, color: DARK.mute, marginBottom: 4 }}>RECTO</Text>
                                      <Image source={{ uri: kycSignedUrls.front || r.doc_front_url }} style={{ width: '100%', height: 110, borderRadius: 8 }} resizeMode="cover" />
                                    </View>
                                  : null
                                }
                                {(kycSignedUrls.back || r.doc_back_url)
                                  ? <View style={{ flex: 1 }}>
                                      <Text style={{ fontSize: 10, color: DARK.mute, marginBottom: 4 }}>VERSO</Text>
                                      <Image source={{ uri: kycSignedUrls.back || r.doc_back_url }} style={{ width: '100%', height: 110, borderRadius: 8 }} resizeMode="cover" />
                                    </View>
                                  : null
                                }
                              </View>
                            </View>

                            <Text style={{ fontSize: 10, color: DARK.mute, textAlign: 'center', marginBottom: 16 }}>
                              Soumis le {r.submitted_at ? new Date(r.submitted_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'}
                            </Text>

                            {/* Action buttons in modal */}
                            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 30 }}>
                              <TouchableOpacity onPress={() => { setKycDetailModal(false); setTimeout(() => approveKyc(r), 300); }}
                                style={{ flex: 1, height: 46, borderRadius: 10, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }}>
                                <Icon name="checkCircle" size={16} color="#fff" />
                                <Text style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>Approuver</Text>
                              </TouchableOpacity>
                              <TouchableOpacity onPress={() => { setKycDetailModal(false); setTimeout(() => { setRejectTarget(r); setRejectNotes(''); setRejectModal(true); }, 300); }}
                                style={{ flex: 1, height: 46, borderRadius: 10, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }}>
                                <Icon name="x" size={16} color="#fff" />
                                <Text style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>Rejeter</Text>
                              </TouchableOpacity>
                            </View>
                          </>
                        );
                      })()}
                    </ScrollView>
                  </View>
                </View>
              </Modal>

              {/* Reject modal */}
              <Modal visible={rejectModal} transparent animationType="slide" onRequestClose={() => setRejectModal(false)}>
                <TouchableOpacity activeOpacity={1} onPress={() => setRejectModal(false)} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
                  <TouchableOpacity activeOpacity={1} style={{ backgroundColor: DARK.card, borderTopLeftRadius: 18, borderTopRightRadius: 18, paddingHorizontal: 18, paddingTop: 16, paddingBottom: 32 }}>
                    <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: DARK.border, alignSelf: 'center', marginBottom: 16 }} />
                    <Text style={{ fontSize: 16, fontWeight: '700', color: DARK.text, marginBottom: 8 }}>Rejeter la demande</Text>
                    <Text style={{ fontSize: 12, color: DARK.mute, marginBottom: 14 }}>
                      {rejectTarget ? `${rejectTarget.first_name ?? ''} ${rejectTarget.last_name ?? ''} — ${rejectTarget.shop_name ?? ''}` : ''}
                    </Text>
                    <Text style={{ fontSize: 11, color: DARK.mute, marginBottom: 6 }}>Motif du rejet (optionnel)</Text>
                    <TextInput
                      value={rejectNotes}
                      onChangeText={setRejectNotes}
                      placeholder="Documents illisibles, informations incorrectes..."
                      placeholderTextColor={DARK.mute}
                      multiline
                      style={{ backgroundColor: DARK.bg, borderRadius: 8, borderWidth: 1, borderColor: DARK.border, color: DARK.text, paddingHorizontal: 12, paddingVertical: 9, fontSize: 13, minHeight: 70, marginBottom: 16 }}
                    />
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      <TouchableOpacity onPress={() => setRejectModal(false)} style={{ flex: 1, height: 44, borderRadius: 10, borderWidth: 1, borderColor: DARK.border, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ color: DARK.mute, fontWeight: '600', fontSize: 14 }}>Annuler</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={rejectKyc} style={{ flex: 2, height: 44, borderRadius: 10, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Confirmer le rejet</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                </TouchableOpacity>
              </Modal>
            </>
          )}

          {/* ── PRODUCTS ── */}
          {!loading && section === 'products' && (
            <>
              <SectionHeader title="Produits" subtitle={`${products.length} produits`} />
              <DarkCard>
                {products.length === 0 && (
                  <Text style={{ fontSize: 13, color: DARK.mute, padding: 16 }}>Aucun produit</Text>
                )}
                {products.map((p, i) => {
                  const thumb = Array.isArray(p.images) ? p.images[0] : null;
                  const isActive = p.status === 'active';
                  return (
                    <View key={p.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderTopWidth: i > 0 ? 1 : 0, borderTopColor: DARK.border }}>
                      {thumb ? (
                        <Image source={{ uri: thumb }} style={{ width: 40, height: 40, borderRadius: 8 }} resizeMode="cover" />
                      ) : (
                        <View style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: DARK.bg, alignItems: 'center', justifyContent: 'center' }}>
                          <Icon name="shoppingBag" size={16} color={DARK.mute} />
                        </View>
                      )}
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 12, fontWeight: '600', color: DARK.text }} numberOfLines={1}>{p.title ?? '—'}</Text>
                        <Text style={{ fontSize: 11, color: DARK.mute, marginTop: 2 }}>${parseFloat(p.price ?? 0).toFixed(2)}</Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => toggleProduct(p)}
                        style={{ borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: isActive ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.06)' }}
                      >
                        <Text style={{ fontSize: 11, fontWeight: '700', color: isActive ? '#10B981' : DARK.mute }}>
                          {isActive ? 'Actif' : 'Inactif'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </DarkCard>
            </>
          )}

          {/* ── ORDERS ── */}
          {!loading && section === 'orders' && (
            <>
              <SectionHeader title="Commandes" subtitle="Toutes les commandes" />
              <DarkCard>
                {recentOrders.length === 0 && (
                  <Text style={{ fontSize: 13, color: DARK.mute, padding: 16 }}>Aucune commande</Text>
                )}
                {recentOrders.map((o, i) => (
                  <View key={o.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderTopWidth: i > 0 ? 1 : 0, borderTopColor: DARK.border }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 12, fontWeight: '600', color: DARK.text }}>{'#CLV' + o.id.slice(0, 6).toUpperCase()}</Text>
                      <Text style={{ fontSize: 10, color: DARK.mute, marginTop: 2 }}>{o.created_at ? new Date(o.created_at).toLocaleDateString('fr-FR') : '—'}</Text>
                    </View>
                    <StatusBadge status={o.status ?? 'pending'} />
                    <Text style={{ fontSize: 12, color: DARK.text, fontWeight: '700', marginLeft: 6 }}>${parseFloat(o.total_amount ?? 0).toFixed(2)}</Text>
                  </View>
                ))}
              </DarkCard>
            </>
          )}

          {/* ── CATEGORIES ── */}
          {!loading && section === 'categories' && (
            <>
              <SectionHeader title="Catégories" subtitle="Images des catégories principales" />
              {MAIN_CATEGORIES.map(cat => {
                const catData = categories.find(c => c.slug === cat.slug);
                const isUploading = uploadingCat === cat.slug;
                return (
                  <DarkCard key={cat.slug} style={{ marginBottom: 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 }}>
                      {catData?.image_url ? (
                        <Image source={{ uri: catData.image_url }} style={{ width: 56, height: 56, borderRadius: 10 }} resizeMode="cover" />
                      ) : (
                        <View style={{ width: 56, height: 56, borderRadius: 10, backgroundColor: DARK.bg, alignItems: 'center', justifyContent: 'center' }}>
                          <Icon name="image" size={22} color={DARK.mute} />
                        </View>
                      )}
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: '700', color: DARK.text }}>{cat.label}</Text>
                        <Text style={{ fontSize: 10, color: DARK.mute, marginTop: 2 }}>/{cat.slug}</Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => uploadCategoryImage(cat.slug)}
                        disabled={isUploading}
                        style={{ height: 34, borderRadius: 8, borderWidth: 1, borderColor: COLORS.primary, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' }}
                      >
                        {isUploading
                          ? <ActivityIndicator color={COLORS.primary} size="small" />
                          : <Text style={{ color: COLORS.primary, fontSize: 12, fontWeight: '600' }}>{catData?.image_url ? 'Remplacer' : 'Ajouter'}</Text>
                        }
                      </TouchableOpacity>
                    </View>
                  </DarkCard>
                );
              })}
            </>
          )}

          {/* ── COUPONS ── */}
          {!loading && section === 'coupons' && <ComingSoon icon="tag" label="Coupons" />}

          {/* ── REVIEWS ── */}
          {!loading && section === 'reviews' && <ComingSoon icon="star" label="Avis clients" />}

          {/* ── WITHDRAWALS ── */}
          {!loading && section === 'withdrawals' && <ComingSoon icon="creditCard" label="Retraits" />}

          {/* ── TRANSACTIONS ── */}
          {!loading && section === 'transactions' && <ComingSoon icon="zap" label="Transactions" />}

          {/* ── NOTIFICATIONS ── */}
          {!loading && section === 'notifications' && <ComingSoon icon="bell" label="Notifications" />}

          {/* ── REPORTS ── */}
          {!loading && section === 'reports' && (
            <>
              <View style={{ backgroundColor: 'rgba(209,67,67,0.12)', borderWidth: 1, borderColor: 'rgba(209,67,67,0.3)', borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <Icon name="zap" size={18} color={COLORS.danger} />
                <Text style={{ fontSize: 13, color: DARK.text, fontWeight: '500', flex: 1 }}>Vérifiez les signalements en attente</Text>
              </View>
              <DarkCard>
                {[
                  { subject: 'Produit contrefait',  target: 'boutique #2841', time: 'il y a 2h', severity: 'urgent' },
                  { subject: 'Avis frauduleux',     target: '@fastdeals',     time: 'il y a 5h', severity: 'moyen' },
                  { subject: 'Contenu inapproprié', target: 'produit #9921',  time: 'il y a 1j', severity: 'moyen' },
                ].map((r, i) => (
                  <View key={i} style={{ padding: 12, borderTopWidth: i > 0 ? 1 : 0, borderTopColor: DARK.border }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: DARK.text }}>{r.subject}</Text>
                      <View style={{ backgroundColor: r.severity === 'urgent' ? COLORS.danger : 'rgba(198,138,0,0.25)', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 }}>
                        <Text style={{ fontSize: 9, fontWeight: '700', color: r.severity === 'urgent' ? '#fff' : '#F59E0B' }}>{r.severity}</Text>
                      </View>
                    </View>
                    <Text style={{ fontSize: 11, color: DARK.mute, marginBottom: 8 }}>Cible : {r.target} · {r.time}</Text>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TouchableOpacity style={{ flex: 1, height: 32, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ color: DARK.text, fontSize: 12, fontWeight: '600' }}>Examiner</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={{ flex: 1, height: 32, borderRadius: 8, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>Résoudre</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </DarkCard>
            </>
          )}

          {/* ── BANNERS ── */}
          {!loading && section === 'banners' && (
            <BannersCMS
              banners={banners}
              setBanners={setBanners}
              bannerModal={bannerModal}
              setBannerModal={setBannerModal}
              editingBanner={editingBanner}
              setEditingBanner={setEditingBanner}
              bannerForm={bannerForm}
              setBannerForm={setBannerForm}
              savingBanner={savingBanner}
              onOpenModal={openBannerModal}
              onSaveBanner={saveBanner}
              onDeleteBanner={deleteBanner}
              onToggleBanner={toggleBanner}
            />
          )}

          {/* ── MEDIA ── */}
          {!loading && section === 'media' && (
            <>
              <View style={{ flexDirection: 'row', backgroundColor: DARK.card, borderRadius: 10, padding: 3, marginBottom: 14 }}>
                {MEDIA_SUB_TABS.map(tab => (
                  <TouchableOpacity
                    key={tab.key}
                    onPress={() => setMediaSubTab(tab.key)}
                    style={{ flex: 1, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: mediaSubTab === tab.key ? COLORS.primary : 'transparent' }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: '600', color: mediaSubTab === tab.key ? '#fff' : DARK.mute }}>{tab.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {mediaSubTab === 'banners' && (
                <BannersCMS
                  banners={banners}
                  setBanners={setBanners}
                  bannerModal={bannerModal}
                  setBannerModal={setBannerModal}
                  editingBanner={editingBanner}
                  setEditingBanner={setEditingBanner}
                  bannerForm={bannerForm}
                  setBannerForm={setBannerForm}
                  savingBanner={savingBanner}
                  onOpenModal={openBannerModal}
                  onSaveBanner={saveBanner}
                  onDeleteBanner={deleteBanner}
                  onToggleBanner={toggleBanner}
                />
              )}

              {mediaSubTab === 'categories' && (
                <>
                  <Text style={{ fontSize: 12, color: DARK.mute, marginBottom: 10 }}>Gérez les images des catégories principales</Text>
                  {MAIN_CATEGORIES.map(cat => {
                    const catData = categories.find(c => c.slug === cat.slug);
                    const isUploading = uploadingCat === cat.slug;
                    return (
                      <DarkCard key={cat.slug} style={{ marginBottom: 10 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 }}>
                          {catData?.image_url ? (
                            <Image source={{ uri: catData.image_url }} style={{ width: 56, height: 56, borderRadius: 10 }} resizeMode="cover" />
                          ) : (
                            <View style={{ width: 56, height: 56, borderRadius: 10, backgroundColor: DARK.bg, alignItems: 'center', justifyContent: 'center' }}>
                              <Icon name="image" size={22} color={DARK.mute} />
                            </View>
                          )}
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 14, fontWeight: '700', color: DARK.text }}>{cat.label}</Text>
                            <Text style={{ fontSize: 10, color: DARK.mute, marginTop: 2 }}>/{cat.slug}</Text>
                          </View>
                          <TouchableOpacity
                            onPress={() => uploadCategoryImage(cat.slug)}
                            disabled={isUploading}
                            style={{ height: 34, borderRadius: 8, borderWidth: 1, borderColor: COLORS.primary, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' }}
                          >
                            {isUploading
                              ? <ActivityIndicator color={COLORS.primary} size="small" />
                              : <Text style={{ color: COLORS.primary, fontSize: 12, fontWeight: '600' }}>{catData?.image_url ? 'Remplacer' : 'Ajouter'}</Text>
                            }
                          </TouchableOpacity>
                        </View>
                      </DarkCard>
                    );
                  })}
                </>
              )}

              {mediaSubTab === 'featured' && (
                <>
                  <Text style={{ fontSize: 12, color: DARK.mute, marginBottom: 10 }}>Définissez jusqu'à 4 produits mis en avant sur la page d'accueil</Text>
                  <DarkCard style={{ marginBottom: 12 }}>
                    <View style={{ padding: 12 }}>
                      <Text style={{ fontSize: 12, fontWeight: '600', color: DARK.text, marginBottom: 8 }}>IDs des produits (séparés par des virgules)</Text>
                      <TextInput
                        value={featuredIds}
                        onChangeText={setFeaturedIds}
                        placeholder="ex: abc123, def456, ghi789"
                        placeholderTextColor={DARK.mute}
                        multiline
                        style={{ backgroundColor: DARK.bg, borderRadius: 8, borderWidth: 1, borderColor: DARK.border, color: DARK.text, paddingHorizontal: 12, paddingVertical: 9, fontSize: 13, minHeight: 60 }}
                      />
                      <TouchableOpacity
                        onPress={saveFeaturedProducts}
                        disabled={savingFeatured}
                        style={{ marginTop: 10, height: 40, borderRadius: 8, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' }}
                      >
                        {savingFeatured
                          ? <ActivityIndicator color="#fff" size="small" />
                          : <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Enregistrer</Text>
                        }
                      </TouchableOpacity>
                    </View>
                  </DarkCard>
                  <DarkCard>
                    <View style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: DARK.border }}>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: DARK.text }}>Sélectionner depuis la liste</Text>
                      <Text style={{ fontSize: 11, color: DARK.mute, marginTop: 2 }}>Max 4 produits · {featuredIds.split(',').filter(s => s.trim()).length} sélectionné(s)</Text>
                    </View>
                    {featuredProducts.slice(0, 20).map((p, i) => {
                      const selectedIds = featuredIds.split(',').map(s => s.trim()).filter(Boolean);
                      const isSelected = selectedIds.includes(p.id);
                      return (
                        <TouchableOpacity
                          key={p.id}
                          onPress={() => {
                            const ids = featuredIds.split(',').map(s => s.trim()).filter(Boolean);
                            if (isSelected) {
                              setFeaturedIds(ids.filter(id => id !== p.id).join(', '));
                            } else if (ids.length < 4) {
                              setFeaturedIds([...ids, p.id].join(', '));
                            }
                          }}
                          style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderTopWidth: i > 0 ? 1 : 0, borderTopColor: DARK.border }}
                        >
                          <View style={{ width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: isSelected ? COLORS.primary : DARK.border, backgroundColor: isSelected ? COLORS.primary : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                            {isSelected && <Icon name="checkCircle" size={12} color="#fff" />}
                          </View>
                          <Text style={{ flex: 1, fontSize: 13, color: DARK.text }} numberOfLines={1}>{p.name}</Text>
                          <Text style={{ fontSize: 10, color: DARK.mute, fontFamily: 'monospace' }} numberOfLines={1}>{p.id.slice(0, 8)}…</Text>
                        </TouchableOpacity>
                      );
                    })}
                    {featuredProducts.length === 0 && (
                      <View style={{ alignItems: 'center', paddingVertical: 24 }}>
                        <Text style={{ color: DARK.mute, fontSize: 13 }}>Aucun produit trouvé</Text>
                      </View>
                    )}
                  </DarkCard>
                </>
              )}
            </>
          )}

          {/* ── SETTINGS ── */}
          {!loading && section === 'settings' && (
            <>
              <SubTabBar tabs={SETTINGS_SUB_TABS} active={settingsSubTab} onSelect={setSettingsSubTab} />
              {settingsSubTab === 'accueil' && <HomepageSectionsTab />}
              {settingsSubTab === 'config' && <ConfigTab />}
              {settingsSubTab === 'onboarding' && <OnboardingTab />}
              {settingsSubTab === 'livraison' && <ShippingTab />}
              {settingsSubTab === 'paiement' && <PaymentTab />}
              {settingsSubTab === 'notifications' && <NotificationsTab />}
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={{ marginTop: 20, height: 44, borderRadius: 12, backgroundColor: 'rgba(209,67,67,0.15)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                <Icon name="logOut" size={16} color={COLORS.danger} />
                <Text style={{ color: COLORS.danger, fontWeight: '600', fontSize: 14 }}>Quitter la console</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
