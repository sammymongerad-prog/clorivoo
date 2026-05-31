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
  const [usersCount,   setUsersCount]   = useState(0);
  const [ordersCount,  setOrdersCount]  = useState(0);
  const [banners,      setBanners]      = useState([]);
  const [categories,   setCategories]   = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [products,     setProducts]     = useState([]);
  const [revenue,      setRevenue]      = useState(0);
  const [loading,      setLoading]      = useState(true);

  /* settings & media */
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

          {/* ── SELLERS ── */}
          {!loading && section === 'sellers' && (
            <>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
                {[['Total', String(sellers.length)], ['Vérifiés', String(sellers.filter(s => s.is_verified).length)], ['Attente', String(sellers.filter(s => !s.is_verified).length)]].map(([k, v], i) => (
                  <View key={i} style={{ flex: 1, backgroundColor: DARK.card, borderRadius: 10, padding: 10 }}>
                    <Text style={{ fontSize: 10, color: DARK.mute }}>{k}</Text>
                    <Text style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: '700', color: DARK.text, marginTop: 2 }}>{v}</Text>
                  </View>
                ))}
              </View>
              <DarkCard>
                {sellers.map((s, i) => (
                  <View key={s.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderTopWidth: i > 0 ? 1 : 0, borderTopColor: DARK.border }}>
                    <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>{(s.name ?? '?')[0]?.toUpperCase()}</Text>
                    </View>
                    <Text style={{ flex: 1, fontSize: 12, fontWeight: '600', color: DARK.text }}>{s.name ?? '—'}</Text>
                    <TouchableOpacity
                      onPress={async () => {
                        const newVal = !s.is_verified;
                        await supabase.from('shops').update({ is_verified: newVal }).eq('id', s.id);
                        setSellers(prev => prev.map(x => x.id === s.id ? { ...x, is_verified: newVal } : x));
                      }}
                      style={{ backgroundColor: s.is_verified ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 }}
                    >
                      <Text style={{ fontSize: 11, fontWeight: '700', color: s.is_verified ? '#EF4444' : '#10B981' }}>
                        {s.is_verified ? 'Révoquer' : 'Vérifier'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </DarkCard>
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
              <DarkCard style={{ marginBottom: 14 }}>
                {SETTINGS.map((s, i) => (
                  <TouchableOpacity
                    key={s.key}
                    onPress={() => setSettingsOpen(settingsOpen === s.key ? null : s.key)}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderTopWidth: i > 0 ? 1 : 0, borderTopColor: DARK.border }}
                  >
                    <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(108,77,255,0.18)', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name={s.icon} size={16} color={COLORS.primary} />
                    </View>
                    <Text style={{ flex: 1, fontSize: 13, fontWeight: '500', color: DARK.text }}>{s.label}</Text>
                    <Text style={{ fontSize: 12, color: DARK.mute }}>{s.detail}</Text>
                    <Icon name="chevronRight" size={15} color={DARK.mute} />
                  </TouchableOpacity>
                ))}
              </DarkCard>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={{ height: 44, borderRadius: 12, backgroundColor: 'rgba(209,67,67,0.15)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
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
