import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SHADOW } from '../../lib/tokens';
import { Avatar } from '../../components/UI';
import Icon from '../../components/Icon';
import { supabase } from '../../lib/supabase';
import { useSession } from '../../hooks/useSession';

const DARK = { bg: '#0A0812', card: '#1A1630', border: 'rgba(255,255,255,0.06)', text: '#EDE9F7', mute: 'rgba(255,255,255,0.4)', sidebar: '#0F0C1E' };

const NAV_ITEMS = [
  { key: 'overview',  icon: 'barChart', label: "Vue d'ensemble" },
  { key: 'users',     icon: 'user',     label: 'Utilisateurs' },
  { key: 'sellers',   icon: 'store',    label: 'Vendeurs',    badge: null },
  { key: 'kyc',       icon: 'lock',     label: 'KYC' },
  { key: 'reports',   icon: 'zap',      label: 'Signalements' },
  { key: 'banners',   icon: 'camera',   label: 'Bannières' },
  { key: 'settings',  icon: 'settings', label: 'Paramètres' },
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

export default function AdminConsoleScreen({ navigation }) {
  const session = useSession();
  const [section, setSection] = useState('overview');
  const [stats,   setStats]   = useState(null);
  const [users,   setUsers]   = useState([]);
  const [sellers, setSellers] = useState([]);
  const [banners, setBanners] = useState([]);
  const [kyc,     setKyc]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(null);

  const initials = (session?.user?.user_metadata?.full_name ?? 'A').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

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
    ] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('orders').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id,full_name,email,role,created_at').order('created_at', { ascending: false }).limit(10),
      supabase.from('shops').select('id,name,is_verified,is_active,seller_id').order('created_at', { ascending: false }).limit(10),
      supabase.from('banners').select('*').order('position'),
      supabase.from('kyc_requests').select('*, profiles(full_name,email)').eq('status', 'pending').limit(10),
    ]);
    setStats({ users: usersCount ?? 0, orders: ordersCount ?? 0 });
    setUsers(recentUsers ?? []);
    setSellers(recentSellers ?? []);
    setBanners(bannersData ?? []);
    setKyc(kycData ?? []);
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
            <>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 12, color: DARK.mute }}>{banners.filter(b => b.is_active).length} actives</Text>
                <TouchableOpacity style={{ backgroundColor: COLORS.primary, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 }}>
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>+ Nouvelle</Text>
                </TouchableOpacity>
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {banners.map((b, i) => (
                  <View key={b.id ?? i} style={{ width: '47%', borderRadius: 10, overflow: 'hidden', backgroundColor: DARK.card }}>
                    <View style={{ height: 60, backgroundColor: b.bg_color ?? COLORS.primary, padding: 10, justifyContent: 'center' }}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: '#fff', lineHeight: 15 }} numberOfLines={2}>{b.title}</Text>
                    </View>
                    <View style={{ padding: 6, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <View style={{ backgroundColor: b.is_active ? 'rgba(31,138,91,0.2)' : 'rgba(255,255,255,0.08)', borderRadius: 999, paddingHorizontal: 6, paddingVertical: 2 }}>
                        <Text style={{ fontSize: 9, fontWeight: '700', color: b.is_active ? COLORS.success : DARK.mute }}>{b.is_active ? 'live' : 'inactif'}</Text>
                      </View>
                      <TouchableOpacity onPress={() => toggleBanner(b)}>
                        <Text style={{ fontSize: 9, color: DARK.mute }}>{b.is_active ? 'Désactiver' : 'Activer'}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
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
