import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Switch,
  TextInput, ActivityIndicator, Modal, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SHADOW } from '../../lib/tokens';
import { Avatar } from '../../components/UI';
import Icon from '../../components/Icon';
import { supabase, uploadImage } from '../../lib/supabase';
import { useSession } from '../../hooks/useSession';

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

const NAV_ITEMS = [
  { key: 'overview',  icon: 'barChart', label: "Vue d'ensemble" },
  { key: 'users',     icon: 'user',     label: 'Utilisateurs' },
  { key: 'sellers',   icon: 'store',    label: 'Vendeurs',    badge: null },
  { key: 'kyc',       icon: 'lock',     label: 'KYC' },
  { key: 'reports',   icon: 'zap',      label: 'Signalements' },
  { key: 'banners',   icon: 'camera',   label: 'Bannières' },
  { key: 'media',     icon: 'image',    label: 'Médias' },
  { key: 'settings',  icon: 'settings', label: 'Paramètres' },
];

const MEDIA_SUB_TABS = [
  { key: 'banners',    label: 'Bannières' },
  { key: 'categories', label: 'Catégories' },
  { key: 'featured',   label: 'Produits en vedette' },
];

const MAIN_CATEGORIES = [
  { slug: 'maison',  label: 'Maison' },
  { slug: 'mode',    label: 'Mode' },
  { slug: 'tech',    label: 'Tech' },
  { slug: 'beaute',  label: 'Beauté' },
];

function Sidebar({ active, onNav }) {
  return (
    <View style={{ width: 54, backgroundColor: '#0F0C1E', alignItems: 'center', paddingTop: 14, gap: 4 }}>
      <View style={{ width: 34, height: 34, borderRadius: 9, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
        <Text style={{ fontWeight: '800', fontSize: 20, color: '#fff' }}>c</Text>
      </View>
      {NAV_ITEMS.map(item => (
        <TouchableOpacity key={item.key} onPress={() => onNav(item.key)}
          style={{ width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: active === item.key ? 'rgba(108,77,255,0.25)' : 'transparent' }}>
          <Icon name={item.icon} size={18} color={active === item.key ? COLORS.primary : 'rgba(255,255,255,0.4)'} />
        </TouchableOpacity>
      ))}
    </View>
  );
}

function DarkCard({ children, style }) {
  return <View style={[{ backgroundColor: DARK.card, borderRadius: 12, overflow: 'hidden' }, style]}>{children}</View>;
}

function KpiCard({ label, value, delta }) {
  return (
    <View style={{ flex: 1, backgroundColor: DARK.card, borderRadius: 10, padding: 10 }}>
      <Text style={{ fontSize: 10, color: DARK.mute, marginBottom: 3 }}>{label}</Text>
      <Text style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: '700', color: DARK.text }}>{value}</Text>
      <Text style={{ fontSize: 10, color: COLORS.success, marginTop: 2 }}>↗ {delta}</Text>
    </View>
  );
}

/* ─── Banner CMS card ─────────────────────────────────────────────────── */
function BannerCard({ b, onEdit, onDelete, onToggle }) {
  return (
    <DarkCard style={{ marginBottom: 10 }}>
      {/* Preview */}
      {b.image_url ? (
        <Image
          source={{ uri: b.image_url }}
          style={{ width: '100%', height: 80 }}
          resizeMode="cover"
        />
      ) : (
        <View style={{ height: 80, backgroundColor: b.bg_color ?? COLORS.primary, paddingHorizontal: 12, paddingVertical: 10, justifyContent: 'center' }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#fff' }} numberOfLines={1}>{b.title}</Text>
          {!!b.subtitle && (
            <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 2 }} numberOfLines={1}>{b.subtitle}</Text>
          )}
        </View>
      )}

      {/* Info row */}
      <View style={{ paddingHorizontal: 10, paddingTop: 8, paddingBottom: 4 }}>
        <Text style={{ fontSize: 12, fontWeight: '600', color: DARK.text }} numberOfLines={1}>{b.title || '(sans titre)'}</Text>
        <Text style={{ fontSize: 10, color: DARK.mute, marginTop: 2 }}>Position {b.position ?? 0}</Text>
      </View>

      {/* Actions row */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingBottom: 10, paddingTop: 6, gap: 8 }}>
        {/* Active badge */}
        <View style={{ backgroundColor: b.is_active ? 'rgba(31,138,91,0.2)' : 'rgba(255,255,255,0.08)', borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2 }}>
          <Text style={{ fontSize: 9, fontWeight: '700', color: b.is_active ? COLORS.success : DARK.mute }}>
            {b.is_active ? 'live' : 'inactif'}
          </Text>
        </View>

        <View style={{ flex: 1 }} />

        {/* Toggle */}
        <TouchableOpacity onPress={() => onToggle(b)} style={{ marginRight: 6 }}>
          <Text style={{ fontSize: 10, color: COLORS.primary }}>
            {b.is_active ? 'Désactiver' : 'Activer'}
          </Text>
        </TouchableOpacity>

        {/* Edit */}
        <TouchableOpacity onPress={() => onEdit(b)} style={{ width: 28, height: 28, borderRadius: 7, backgroundColor: 'rgba(108,77,255,0.18)', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="edit" size={14} color={COLORS.primary} />
        </TouchableOpacity>

        {/* Delete */}
        <TouchableOpacity onPress={() => onDelete(b.id)} style={{ width: 28, height: 28, borderRadius: 7, backgroundColor: 'rgba(209,67,67,0.15)', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="trash" size={14} color={COLORS.danger} />
        </TouchableOpacity>
      </View>
    </DarkCard>
  );
}

/* ─── Banner Modal ───────────────────────────────────────────────────── */
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

          {/* Titre */}
          <Text style={{ fontSize: 11, color: DARK.mute, marginBottom: 5 }}>Titre</Text>
          <TextInput
            value={form.title}
            onChangeText={v => setForm(f => ({ ...f, title: v }))}
            placeholder="Titre de la bannière"
            placeholderTextColor={DARK.mute}
            style={{ backgroundColor: DARK.bg, borderRadius: 8, borderWidth: 1, borderColor: DARK.border, color: DARK.text, paddingHorizontal: 12, paddingVertical: 9, fontSize: 13, marginBottom: 10 }}
          />

          {/* Sous-titre */}
          <Text style={{ fontSize: 11, color: DARK.mute, marginBottom: 5 }}>Sous-titre</Text>
          <TextInput
            value={form.subtitle}
            onChangeText={v => setForm(f => ({ ...f, subtitle: v }))}
            placeholder="Sous-titre (optionnel)"
            placeholderTextColor={DARK.mute}
            style={{ backgroundColor: DARK.bg, borderRadius: 8, borderWidth: 1, borderColor: DARK.border, color: DARK.text, paddingHorizontal: 12, paddingVertical: 9, fontSize: 13, marginBottom: 10 }}
          />

          {/* CTA */}
          <Text style={{ fontSize: 11, color: DARK.mute, marginBottom: 5 }}>Texte du bouton CTA</Text>
          <TextInput
            value={form.cta}
            onChangeText={v => setForm(f => ({ ...f, cta: v }))}
            placeholder="Ex: Découvrir"
            placeholderTextColor={DARK.mute}
            style={{ backgroundColor: DARK.bg, borderRadius: 8, borderWidth: 1, borderColor: DARK.border, color: DARK.text, paddingHorizontal: 12, paddingVertical: 9, fontSize: 13, marginBottom: 10 }}
          />

          {/* Couleur de fond */}
          <Text style={{ fontSize: 11, color: DARK.mute, marginBottom: 8 }}>Couleur de fond</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
            {BANNER_COLORS.map(c => (
              <TouchableOpacity
                key={c}
                onPress={() => setForm(f => ({ ...f, bg_color: c }))}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 15,
                  backgroundColor: c,
                  borderWidth: form.bg_color === c ? 2 : 0,
                  borderColor: '#fff',
                }}
              />
            ))}
          </View>

          {/* Image upload */}
          <Text style={{ fontSize: 11, color: DARK.mute, marginBottom: 5 }}>Image</Text>
          {!!form.image_url && (
            <Image source={{ uri: form.image_url }} style={{ width: '100%', height: 80, borderRadius: 8, marginBottom: 8 }} resizeMode="cover" />
          )}
          <BannerImageUploadButton form={form} setForm={setForm} />

          {/* Position */}
          <Text style={{ fontSize: 11, color: DARK.mute, marginBottom: 5, marginTop: 10 }}>Position</Text>
          <TextInput
            value={String(form.position)}
            onChangeText={v => setForm(f => ({ ...f, position: parseInt(v) || 0 }))}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={DARK.mute}
            style={{ backgroundColor: DARK.bg, borderRadius: 8, borderWidth: 1, borderColor: DARK.border, color: DARK.text, paddingHorizontal: 12, paddingVertical: 9, fontSize: 13, marginBottom: 12 }}
          />

          {/* Active toggle */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <Text style={{ fontSize: 13, color: DARK.text }}>Activer la bannière</Text>
            <Switch
              value={form.is_active}
              onValueChange={v => setForm(f => ({ ...f, is_active: v }))}
              trackColor={{ false: DARK.border, true: COLORS.primary }}
              thumbColor="#fff"
            />
          </View>

          {/* Buttons */}
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

/* Separate component so hooks rules are satisfied inside modal */
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
        if (url) {
          setForm(f => ({ ...f, image_url: url }));
        }
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

/* ─── Banners CMS (reusable in both section and media sub-tab) ────────── */
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
        <BannerCard
          key={b.id}
          b={b}
          onEdit={onOpenModal}
          onDelete={onDeleteBanner}
          onToggle={onToggleBanner}
        />
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

export default function AdminConsoleScreen({ navigation }) {
  const session = useSession();
  const [section, setSection] = useState('overview');

  // Data
  const [stats,   setStats]   = useState(null);
  const [users,   setUsers]   = useState([]);
  const [sellers, setSellers] = useState([]);
  const [banners, setBanners] = useState([]);
  const [kyc,     setKyc]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(null);

  // Banner CMS state
  const [bannerModal,   setBannerModal]   = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [bannerForm,    setBannerForm]    = useState({ ...EMPTY_BANNER_FORM });
  const [savingBanner,  setSavingBanner]  = useState(false);

  // Media section state
  const [mediaSubTab,   setMediaSubTab]   = useState('banners');
  const [categories,    setCategories]    = useState([]);
  const [uploadingCat,  setUploadingCat]  = useState(null);
  const [featuredIds,   setFeaturedIds]   = useState('');
  const [savingFeatured, setSavingFeatured] = useState(false);
  const [products,      setProducts]      = useState([]);

  const initials = (session?.user?.user_metadata?.full_name ?? 'A')
    .split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    const [
      { count: usersCount },
      { count: ordersCount },
      { data: recentUsers },
      { data: recentSellers },
      { data: bannersData },
      { data: kycData },
      { data: catsData },
      { data: settingsData },
      { data: productsData },
    ] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('orders').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id,full_name,email,role,created_at').order('created_at', { ascending: false }).limit(10),
      supabase.from('shops').select('id,name,is_verified,is_active,seller_id').order('created_at', { ascending: false }).limit(10),
      supabase.from('banners').select('*').order('position'),
      supabase.from('kyc_requests').select('*, profiles(full_name,email)').eq('status', 'pending').limit(10),
      supabase.from('categories').select('slug,name,image_url').in('slug', MAIN_CATEGORIES.map(c => c.slug)),
      supabase.from('platform_settings').select('key,value').eq('key', 'featured_products').limit(1),
      supabase.from('products').select('id,name').limit(50),
    ]);
    setStats({ users: usersCount ?? 0, orders: ordersCount ?? 0 });
    setUsers(recentUsers ?? []);
    setSellers(recentSellers ?? []);
    setBanners(bannersData ?? []);
    setKyc(kycData ?? []);
    setCategories(catsData ?? []);
    if (settingsData && settingsData.length > 0) {
      setFeaturedIds(settingsData[0].value ?? '');
    }
    setProducts(productsData ?? []);
    setLoading(false);
  }

  async function handleKycDecision(id, status) {
    await supabase.from('kyc_requests').update({ status }).eq('id', id);
    setKyc(prev => prev.filter(k => k.id !== id));
  }

  async function toggleBanner(b) {
    await supabase.from('banners').update({ is_active: !b.is_active }).eq('id', b.id);
    setBanners(prev => prev.map(x => x.id === b.id ? { ...x, is_active: !x.is_active } : x));
  }

  /* ── Banner CMS ── */
  function openBannerModal(banner) {
    if (banner) {
      setEditingBanner(banner);
      setBannerForm({
        title: banner.title ?? '',
        subtitle: banner.subtitle ?? '',
        cta: banner.cta ?? '',
        bg_color: banner.bg_color ?? '#6C4DFF',
        image_url: banner.image_url ?? '',
        position: banner.position ?? 0,
        is_active: banner.is_active ?? true,
        _isNew: false,
      });
    } else {
      setEditingBanner(null);
      setBannerForm({ ...EMPTY_BANNER_FORM, _isNew: true });
    }
    setBannerModal(true);
  }

  async function saveBanner() {
    setSavingBanner(true);
    const payload = {
      title: bannerForm.title,
      subtitle: bannerForm.subtitle,
      cta: bannerForm.cta,
      bg_color: bannerForm.bg_color,
      image_url: bannerForm.image_url || null,
      position: bannerForm.position,
      is_active: bannerForm.is_active,
    };
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

  async function uploadBannerImage() {
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
        if (url) {
          setBannerForm(f => ({ ...f, image_url: url }));
        }
      }
    } catch (e) {
      console.warn('uploadBannerImage error', e);
    }
  }

  async function uploadCategoryImage(slug) {
    setUploadingCat(slug);
    try {
      const ImagePicker = await import('expo-image-picker');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const path = `categories/${slug}-${Date.now()}.jpg`;
        const url = await uploadImage(asset.uri, 'categories', path);
        if (url) {
          await supabase.from('categories').update({ image_url: url }).eq('slug', slug);
          setCategories(prev =>
            prev.map(c => c.slug === slug ? { ...c, image_url: url } : c)
          );
        }
      }
    } catch (e) {
      console.warn('uploadCategoryImage error', e);
    } finally {
      setUploadingCat(null);
    }
  }

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

  const SETTINGS = [
    { key: 'commission', icon: 'creditCard', label: 'Commission plateforme', detail: '8.5%' },
    { key: 'shipping',   icon: 'truck',      label: 'Frais de livraison',    detail: 'Configurés' },
    { key: 'security',   icon: 'lock',       label: 'Sécurité & 2FA',        detail: 'Activé' },
    { key: 'notifs',     icon: 'bell',       label: 'Notifications système', detail: 'On' },
    { key: 'roles',      icon: 'user',       label: 'Rôles & permissions',   detail: '4 rôles' },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: DARK.bg }} edges={['top']}>
      {/* Browser chrome bar */}
      <View style={{ backgroundColor: '#1A1630', flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: DARK.border }}>
        <View style={{ flexDirection: 'row', gap: 5 }}>
          {['#FF6058', '#FFBD2E', '#28C941'].map((c, i) => (
            <View key={i} style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: c }} />
          ))}
        </View>
        <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Icon name="lock" size={10} color={DARK.mute} />
          <Text style={{ fontFamily: 'monospace', fontSize: 10, color: DARK.mute }}>admin.clorivo.com/{section}</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="x" size={16} color={DARK.mute} />
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1, flexDirection: 'row' }}>
        <Sidebar active={section} onNav={setSection} />

        <ScrollView style={{ flex: 1, backgroundColor: DARK.sidebar }} contentContainerStyle={{ padding: 14, gap: 12, paddingBottom: 40 }}>
          {/* Section title */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={{ fontSize: 17, fontWeight: '800', color: DARK.text, letterSpacing: -0.5 }}>
                {NAV_ITEMS.find(n => n.key === section)?.label ?? 'Console'}
              </Text>
              <Text style={{ fontSize: 11, color: DARK.mute, marginTop: 2 }}>7 derniers jours</Text>
            </View>
            <Avatar size={28} initials={initials} bg={COLORS.primary} />
          </View>

          {loading && <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />}

          {/* ── OVERVIEW ── */}
          {!loading && section === 'overview' && (
            <>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                <KpiCard label="Utilisateurs"   value={String(stats?.users ?? 0)}   delta="+18%" />
                <KpiCard label="Commandes"      value={String(stats?.orders ?? 0)}  delta="+8%" />
                <KpiCard label="Vendeurs"       value={String(sellers.length)}       delta="+4%" />
                <KpiCard label="KYC en attente" value={String(kyc.length)}           delta="!" />
                <KpiCard label="GMV (30j)"      value="$184k"                        delta="+12%" />
                <KpiCard label="Taux retour"    value="1.9%"                         delta="−0.3" />
              </View>

              <DarkCard>
                <View style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: DARK.border, flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: DARK.text }}>En attente d'action</Text>
                  <Text style={{ fontSize: 11, color: COLORS.primary }}>Voir tout</Text>
                </View>
                {[
                  { icon: 'store', label: 'Nouvelle boutique', sub: 'En attente de vérification', badge: 'review' },
                  { icon: 'lock',  label: `${kyc.length} demandes KYC`, sub: 'À examiner',   badge: 'urgent' },
                ].map((p, i) => (
                  <TouchableOpacity key={i} onPress={() => setSection(i === 1 ? 'kyc' : 'sellers')}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderTopWidth: i > 0 ? 1 : 0, borderTopColor: DARK.border }}>
                    <View style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name={p.icon} size={15} color={DARK.mute} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 12, fontWeight: '600', color: DARK.text }}>{p.label}</Text>
                      <Text style={{ fontSize: 11, color: DARK.mute }}>{p.sub}</Text>
                    </View>
                    <View style={{ backgroundColor: p.badge === 'urgent' ? COLORS.danger : 'rgba(108,77,255,0.3)', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 }}>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: p.badge === 'urgent' ? '#fff' : COLORS.primary }}>{p.badge}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </DarkCard>
            </>
          )}

          {/* ── USERS ── */}
          {!loading && section === 'users' && (
            <>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {[['Total', String(stats?.users ?? 0)], ['Vendeurs', String(sellers.length)], ['Admins', '1']].map(([k, v], i) => (
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
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {[['Total', String(sellers.length)], ['Vérifiés', String(sellers.filter(s => s.is_verified).length)], ['En attente', String(sellers.filter(s => !s.is_verified).length)]].map(([k, v], i) => (
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
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 12, fontWeight: '600', color: DARK.text }}>{s.name ?? '—'}</Text>
                    </View>
                    <View style={{ backgroundColor: s.is_verified ? 'rgba(31,138,91,0.2)' : 'rgba(245,158,11,0.2)', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 }}>
                      <Text style={{ fontSize: 9, fontWeight: '700', color: s.is_verified ? COLORS.success : '#F59E0B' }}>
                        {s.is_verified ? 'vérifié' : 'attente'}
                      </Text>
                    </View>
                  </View>
                ))}
              </DarkCard>
            </>
          )}

          {/* ── KYC ── */}
          {!loading && section === 'kyc' && (
            kyc.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <Icon name="checkCircle" size={36} color={COLORS.success} />
                <Text style={{ color: DARK.text, fontSize: 15, marginTop: 12 }}>Aucun KYC en attente</Text>
              </View>
            ) : (
              kyc.map((k, i) => (
                <DarkCard key={k.id}>
                  <View style={{ padding: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                      <Avatar size={40} initials={(k.profiles?.full_name ?? 'KYC').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()} />
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: '700', color: DARK.text }}>{k.profiles?.full_name ?? '—'}</Text>
                        <Text style={{ fontSize: 11, color: DARK.mute }}>{k.profiles?.email ?? '—'}</Text>
                      </View>
                      <View style={{ backgroundColor: 'rgba(209,67,67,0.2)', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 }}>
                        <Text style={{ fontSize: 9, fontWeight: '700', color: COLORS.danger }}>en attente</Text>
                      </View>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TouchableOpacity onPress={() => handleKycDecision(k.id, 'rejected')}
                        style={{ flex: 1, height: 36, borderRadius: 8, borderWidth: 1.5, borderColor: COLORS.danger, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ color: COLORS.danger, fontWeight: '600', fontSize: 13 }}>Rejeter</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleKycDecision(k.id, 'approved')}
                        style={{ flex: 1, height: 36, borderRadius: 8, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ color: '#fff', fontWeight: '600', fontSize: 13 }}>Approuver</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </DarkCard>
              ))
            )
          )}

          {/* ── REPORTS ── */}
          {!loading && section === 'reports' && (
            <>
              <View style={{ backgroundColor: 'rgba(209,67,67,0.12)', borderWidth: 1, borderColor: 'rgba(209,67,67,0.3)', borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
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
              {/* Sub-tabs */}
              <View style={{ flexDirection: 'row', backgroundColor: DARK.card, borderRadius: 10, padding: 3, marginBottom: 14 }}>
                {MEDIA_SUB_TABS.map(tab => (
                  <TouchableOpacity
                    key={tab.key}
                    onPress={() => setMediaSubTab(tab.key)}
                    style={{ flex: 1, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: mediaSubTab === tab.key ? COLORS.primary : 'transparent' }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: '600', color: mediaSubTab === tab.key ? '#fff' : DARK.mute }}>
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* ─ Bannières sub-tab ─ */}
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

              {/* ─ Catégories sub-tab ─ */}
              {mediaSubTab === 'categories' && (
                <>
                  <Text style={{ fontSize: 12, color: DARK.mute, marginBottom: 10 }}>
                    Gérez les images des catégories principales
                  </Text>
                  {MAIN_CATEGORIES.map((cat, i) => {
                    const catData = categories.find(c => c.slug === cat.slug);
                    const isUploading = uploadingCat === cat.slug;
                    return (
                      <DarkCard key={cat.slug} style={{ marginBottom: 10 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 }}>
                          {/* Image preview */}
                          {catData?.image_url ? (
                            <Image
                              source={{ uri: catData.image_url }}
                              style={{ width: 56, height: 56, borderRadius: 10 }}
                              resizeMode="cover"
                            />
                          ) : (
                            <View style={{ width: 56, height: 56, borderRadius: 10, backgroundColor: DARK.bg, alignItems: 'center', justifyContent: 'center' }}>
                              <Icon name="image" size={22} color={DARK.mute} />
                            </View>
                          )}

                          {/* Label */}
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 14, fontWeight: '700', color: DARK.text }}>{cat.label}</Text>
                            <Text style={{ fontSize: 10, color: DARK.mute, marginTop: 2 }}>/{cat.slug}</Text>
                          </View>

                          {/* Upload button */}
                          <TouchableOpacity
                            onPress={() => uploadCategoryImage(cat.slug)}
                            disabled={isUploading}
                            style={{ height: 34, borderRadius: 8, borderWidth: 1, borderColor: COLORS.primary, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' }}
                          >
                            {isUploading
                              ? <ActivityIndicator color={COLORS.primary} size="small" />
                              : <Text style={{ color: COLORS.primary, fontSize: 12, fontWeight: '600' }}>
                                  {catData?.image_url ? 'Remplacer' : 'Ajouter'}
                                </Text>
                            }
                          </TouchableOpacity>
                        </View>
                      </DarkCard>
                    );
                  })}
                </>
              )}

              {/* ─ Produits en vedette sub-tab ─ */}
              {mediaSubTab === 'featured' && (
                <>
                  <Text style={{ fontSize: 12, color: DARK.mute, marginBottom: 10 }}>
                    Définissez jusqu'à 4 produits mis en avant sur la page d'accueil
                  </Text>

                  <DarkCard style={{ marginBottom: 12 }}>
                    <View style={{ padding: 12 }}>
                      <Text style={{ fontSize: 12, fontWeight: '600', color: DARK.text, marginBottom: 8 }}>
                        IDs des produits (séparés par des virgules)
                      </Text>
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

                  {/* Product picker */}
                  <DarkCard>
                    <View style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: DARK.border }}>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: DARK.text }}>
                        Sélectionner depuis la liste
                      </Text>
                      <Text style={{ fontSize: 11, color: DARK.mute, marginTop: 2 }}>
                        Max 4 produits · {featuredIds.split(',').filter(s => s.trim()).length} sélectionné(s)
                      </Text>
                    </View>
                    {products.slice(0, 20).map((p, i) => {
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
                            {isSelected && <Icon name="check" size={13} color="#fff" />}
                          </View>
                          <Text style={{ flex: 1, fontSize: 13, color: DARK.text }} numberOfLines={1}>{p.name}</Text>
                          <Text style={{ fontSize: 10, color: DARK.mute, fontFamily: 'monospace' }} numberOfLines={1}>{p.id.slice(0, 8)}…</Text>
                        </TouchableOpacity>
                      );
                    })}
                    {products.length === 0 && (
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
              <DarkCard>
                {SETTINGS.map((s, i) => (
                  <TouchableOpacity key={s.key} onPress={() => setSettingsOpen(settingsOpen === s.key ? null : s.key)}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderTopWidth: i > 0 ? 1 : 0, borderTopColor: DARK.border }}>
                    <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(108,77,255,0.18)', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name={s.icon} size={16} color={COLORS.primary} />
                    </View>
                    <Text style={{ flex: 1, fontSize: 13, fontWeight: '500', color: DARK.text }}>{s.label}</Text>
                    <Text style={{ fontSize: 12, color: DARK.mute }}>{s.detail}</Text>
                    <Icon name="chevronRight" size={15} color={DARK.mute} />
                  </TouchableOpacity>
                ))}
              </DarkCard>
              <TouchableOpacity onPress={() => navigation.goBack()}
                style={{ height: 44, borderRadius: 12, backgroundColor: 'rgba(209,67,67,0.15)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
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
