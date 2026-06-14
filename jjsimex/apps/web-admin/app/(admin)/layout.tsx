'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getClient } from '@jjsimex/supabase';

const NAV_ITEMS = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    href: '/dashboard',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/>
        <rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>
      </svg>
    ),
  },
  {
    key: 'colis',
    label: 'Colis',
    href: '/dashboard/colis',
    badgeKey: 'pending_packages',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
        <path d="m3.27 6.96 8.73 5.05 8.73-5.05"/><path d="M12 22.08V12"/>
      </svg>
    ),
  },
  {
    key: 'clients',
    label: 'Clients',
    href: '/dashboard/clients',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    key: 'shopper',
    label: 'Personal Shopper',
    href: '/dashboard/shopper',
    badgeKey: 'pending_shopper',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/>
        <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>
      </svg>
    ),
  },
  {
    key: 'departs',
    label: 'Départs',
    href: '/dashboard/departs',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>
      </svg>
    ),
  },
  {
    key: 'paiements',
    label: 'Paiements',
    href: '/dashboard/paiements',
    badgeKey: 'pending_payments',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
      </svg>
    ),
  },
  {
    key: 'succursales',
    label: 'Succursales',
    href: '/dashboard/succursales',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
      </svg>
    ),
  },
  {
    key: 'marketing',
    label: 'Marketing',
    href: '/dashboard/marketing',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>
      </svg>
    ),
  },
  {
    key: 'parametres',
    label: 'Paramètres',
    href: '/dashboard/parametres',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
    ),
  },
];

interface AdminUser {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
}

interface Badges {
  pending_packages: number;
  pending_shopper: number;
  pending_payments: number;
}

function Sidebar({ pathname, badges, user, onSignOut }: { pathname: string; badges: Badges; user: AdminUser | null; onSignOut: () => void }) {
  const initials = user ? `${user.first_name[0]}${user.last_name[0]}`.toUpperCase() : '??';
  const fullName = user ? `${user.first_name} ${user.last_name}` : 'Admin';

  return (
    <aside style={{ width: 260, flexShrink: 0, background: '#111111', borderRight: '1px solid #2A2A2A', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '26px 22px 20px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', fontWeight: 800, fontSize: 21, letterSpacing: -0.6, color: '#F97316', lineHeight: 1 }}>
          <span style={{ color: '#FFFFFF' }}>JJ</span>
          <span>&apos;s</span>
          <span style={{ marginLeft: 5, color: '#FFFFFF' }}>IMEX</span>
        </div>
        <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 6 }}>Panel Administrateur</div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 0', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          const badgeCount = item.badgeKey ? badges[item.badgeKey as keyof Badges] : 0;
          return (
            <Link
              key={item.key}
              href={item.href}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '11px 22px',
                background: isActive ? '#1A1A1A' : 'transparent',
                borderLeft: isActive ? '3px solid #F97316' : '3px solid transparent',
                color: isActive ? '#F97316' : '#9CA3AF',
                textDecoration: 'none', cursor: 'pointer',
              }}
            >
              {item.icon}
              <span style={{ fontSize: 14, fontWeight: isActive ? 600 : 500, flex: 1 }}>{item.label}</span>
              {badgeCount > 0 && (
                <span style={{ background: '#F97316', color: '#0D0D0D', fontSize: 11, fontWeight: 700, minWidth: 20, height: 20, padding: '0 6px', boxSizing: 'border-box', borderRadius: 99, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  {badgeCount > 99 ? '99+' : badgeCount}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      <div style={{ borderTop: '1px solid #2A2A2A', padding: '16px 22px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#F97316', color: '#0D0D0D', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{initials}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fullName}</div>
          <div style={{ fontSize: 12, color: '#9CA3AF' }}>{user?.role ?? 'Admin'}</div>
        </div>
        <button onClick={onSignOut} style={{ width: 34, height: 34, borderRadius: 8, background: 'none', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444', cursor: 'pointer' }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </button>
      </div>
    </aside>
  );
}

function AdminHeader({ pathname, user, totalBadges }: { pathname: string; user: AdminUser | null; totalBadges: number }) {
  const title = NAV_ITEMS.find(i => pathname === i.href || (i.href !== '/dashboard' && pathname.startsWith(i.href)))?.label ?? 'Dashboard';
  const firstName = user?.first_name ?? 'Admin';
  const initials = user ? `${user.first_name[0]}${user.last_name[0]}`.toUpperCase() : '??';

  return (
    <header style={{ height: 64, flexShrink: 0, background: '#0D0D0D', borderBottom: '1px solid #2A2A2A', display: 'flex', alignItems: 'center', gap: 20, padding: '0 24px' }}>
      <div style={{ flexShrink: 0 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#FFFFFF', lineHeight: 1.1 }}>{title}</div>
        <div style={{ fontSize: 12, color: '#9CA3AF' }}>Bienvenue, {firstName} 👋</div>
      </div>

      <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
        <div style={{ position: 'relative', width: 400 }}>
          <input
            placeholder="Rechercher un colis, client..."
            style={{ width: '100%', height: 40, boxSizing: 'border-box', background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 8, color: '#FFFFFF', padding: '0 42px 0 14px', fontFamily: 'inherit', fontSize: 13, outline: 'none' }}
          />
          <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#F97316', display: 'flex' }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </div>
        </div>
      </div>

      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 16 }}>
        <button style={{ position: 'relative', width: 40, height: 40, borderRadius: 8, background: '#1A1A1A', border: '1px solid #2A2A2A', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', cursor: 'pointer' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          {totalBadges > 0 && (
            <span style={{ position: 'absolute', top: 6, right: 7, minWidth: 15, height: 15, padding: '0 3px', boxSizing: 'border-box', borderRadius: 99, background: '#F97316', color: '#0D0D0D', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #0D0D0D' }}>
              {totalBadges > 99 ? '99+' : totalBadges}
            </span>
          )}
        </button>
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#F97316', color: '#0D0D0D', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>{initials}</div>
      </div>
    </header>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = getClient();

  const [user, setUser] = useState<AdminUser | null>(null);
  const [badges, setBadges] = useState<Badges>({ pending_packages: 0, pending_shopper: 0, pending_payments: 0 });

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }

      const { data } = await supabase.from('users').select('id, first_name, last_name, role').eq('id', session.user.id).single();
      if (data) setUser(data as AdminUser);
    })();
  }, []);

  useEffect(() => {
    const loadBadges = async () => {
      const [pkgRes, shopRes, payRes] = await Promise.all([
        supabase.from('packages').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('shopper_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('payments').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      ]);
      setBadges({
        pending_packages: pkgRes.count ?? 0,
        pending_shopper: shopRes.count ?? 0,
        pending_payments: payRes.count ?? 0,
      });
    };

    loadBadges();

    const ch = supabase.channel('admin-badges')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'packages' }, loadBadges)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shopper_requests' }, loadBadges)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, loadBadges)
      .subscribe();

    return () => { supabase.removeChannel(ch); };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const totalBadges = badges.pending_packages + badges.pending_shopper + badges.pending_payments;

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#0D0D0D', overflow: 'hidden', fontFamily: "'Sora', sans-serif" }}>
      <Sidebar pathname={pathname} badges={badges} user={user} onSignOut={handleSignOut} />
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <AdminHeader pathname={pathname} user={user} totalBadges={totalBadges} />
        <main style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          {children}
        </main>
      </div>
    </div>
  );
}
