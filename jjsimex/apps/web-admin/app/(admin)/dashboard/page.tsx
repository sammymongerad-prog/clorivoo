'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getPackageStats, getAllPackages } from '@jjsimex/supabase/packages';
import { getPaymentStats } from '@jjsimex/supabase/payments';
import { KPICard } from '@/components/ui/KPICard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { RevenueChart } from '@/components/charts/RevenueChart';
import { DestinationDonut } from '@/components/charts/DestinationDonut';
import { TransportBars } from '@/components/charts/TransportBars';

const DEST_COLORS: Record<string, string> = {
  HT: '#F97316', DO: '#3B82F6', MQ: '#A855F7', GP: '#06B6D4', FR: '#22C55E',
};

const MONTH_LABELS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

interface PackageRow {
  id: string;
  tracking_number: string;
  users?: { first_name?: string; last_name?: string };
  destination_city?: string;
  destination_country?: string;
  weight_billed?: number;
  transport_mode?: string;
  status: string;
  created_at: string;
}

interface PkgStats {
  total: number;
  count_growth: number;
  revenue: number;
  revenue_growth: number;
  by_status: Record<string, number>;
  by_country: Record<string, number>;
  by_transport: Record<string, number>;
}

interface PayStats {
  total_confirmed: number;
  growth_percentage: number;
}

export default function DashboardPage() {
  const [pkgStats, setPkgStats] = useState<PkgStats | null>(null);
  const [payStats, setPayStats] = useState<PayStats | null>(null);
  const [recentPkgs, setRecentPkgs] = useState<PackageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [ps, pays, pkgs] = await Promise.all([
          getPackageStats(period),
          getPaymentStats(period === 'year' ? 'year' : period === 'week' ? 'week' : 'month'),
          getAllPackages({ limit: 8 } as Parameters<typeof getAllPackages>[0]),
        ]);
        setPkgStats(ps as PkgStats);
        setPayStats(pays as PayStats);
        setRecentPkgs((pkgs as PackageRow[]) ?? []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [period]);

  const now = new Date();
  const chartData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now);
    d.setMonth(d.getMonth() - (5 - i));
    return { month: MONTH_LABELS[d.getMonth()], revenue: 0, packages: 0 };
  });

  const destData = pkgStats
    ? Object.entries(pkgStats.by_country).map(([k, v]) => ({
        name: k, value: v as number, color: DEST_COLORS[k] ?? '#6B7280',
      }))
    : [];

  const airCount = (pkgStats?.by_transport?.['air'] as number) ?? 0;
  const seaCount = (pkgStats?.by_transport?.['sea'] as number) ?? 0;

  const fmt = (n: number) => n.toLocaleString('fr-FR');
  const fmtUSD = (n: number) => `$${n.toLocaleString('fr-FR', { minimumFractionDigits: 0 })}`;
  const fmtGrowth = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Period selector */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#FFFFFF', margin: 0 }}>Tableau de bord</h1>
        <div style={{ display: 'flex', gap: 4, background: '#111111', border: '1px solid #2A2A2A', borderRadius: 10, padding: 4 }}>
          {(['week', 'month', 'year'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{ background: period === p ? '#2A2A2A' : 'none', border: 'none', borderRadius: 6, padding: '6px 14px', color: period === p ? '#FFFFFF' : '#6B7280', fontFamily: 'inherit', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
            >
              {p === 'week' ? '7 jours' : p === 'month' ? '30 jours' : '1 an'}
            </button>
          ))}
        </div>
      </div>

      {loading ? <LoadingSpinner /> : (
        <>
          {/* KPI row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            <KPICard
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="m3.27 6.96 8.73 5.05 8.73-5.05"/><path d="M12 22.08V12"/></svg>}
              label="Colis reçus"
              value={fmt(pkgStats?.total ?? 0)}
              growth={fmtGrowth(pkgStats?.count_growth ?? 0)}
              growthUp={(pkgStats?.count_growth ?? 0) >= 0}
            />
            <KPICard
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}
              label="Revenus colis"
              value={fmtUSD(pkgStats?.revenue ?? 0)}
              growth={fmtGrowth(pkgStats?.revenue_growth ?? 0)}
              growthUp={(pkgStats?.revenue_growth ?? 0) >= 0}
              accent="#22C55E"
            />
            <KPICard
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>}
              label="Paiements confirmés"
              value={fmtUSD(payStats?.total_confirmed ?? 0)}
              growth={fmtGrowth(payStats?.growth_percentage ?? 0)}
              growthUp={(payStats?.growth_percentage ?? 0) >= 0}
              accent="#3B82F6"
            />
            <KPICard
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
              label="En attente traitement"
              value={fmt((pkgStats?.by_status?.['pending'] as number) ?? 0)}
              growth="À traiter"
              growthUp={false}
              action={
                <Link href="/dashboard/colis?status=pending" style={{ background: '#F97316', borderRadius: 8, padding: '7px 12px', color: '#0D0D0D', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
                  Traiter →
                </Link>
              }
            />
          </div>

          {/* Charts row */}
          <div style={{ display: 'grid', gridTemplateColumns: '65fr 35fr', gap: 16 }}>
            <div style={{ background: '#1A1A1A', border: '1px solid #222222', borderRadius: 12, padding: 20, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#FFFFFF' }}>Revenus &amp; Colis — 6 derniers mois</span>
                <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#9CA3AF' }}>
                  <span><span style={{ color: '#F97316' }}>■</span> Revenus</span>
                  <span><span style={{ color: '#3B82F6' }}>■</span> Colis</span>
                </div>
              </div>
              <RevenueChart data={chartData} />
            </div>

            <div style={{ background: '#1A1A1A', border: '1px solid #222222', borderRadius: 12, padding: 20, minWidth: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#FFFFFF', marginBottom: 16 }}>Destinations</div>
              {destData.length > 0 ? (
                <DestinationDonut data={destData} />
              ) : (
                <div style={{ color: '#6B7280', fontSize: 14, textAlign: 'center', paddingTop: 40 }}>Aucune donnée</div>
              )}
            </div>
          </div>

          {/* Transport + Recent packages */}
          <div style={{ display: 'grid', gridTemplateColumns: '35fr 65fr', gap: 16 }}>
            <div style={{ background: '#1A1A1A', border: '1px solid #222222', borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#FFFFFF', marginBottom: 16 }}>Mode de transport</div>
              <TransportBars air={airCount} sea={seaCount} />
              <div style={{ marginTop: 16, display: 'flex', gap: 16 }}>
                <div style={{ flex: 1, background: '#111', borderRadius: 10, padding: '12px 16px', textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#3B82F6' }}>{fmt(airCount)}</div>
                  <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>✈ Aérien</div>
                </div>
                <div style={{ flex: 1, background: '#111', borderRadius: 10, padding: '12px 16px', textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#06B6D4' }}>{fmt(seaCount)}</div>
                  <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>🚢 Maritime</div>
                </div>
              </div>
            </div>

            <div style={{ background: '#1A1A1A', border: '1px solid #222222', borderRadius: 12, padding: 20, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#FFFFFF' }}>Colis récents</span>
                <Link href="/dashboard/colis" style={{ fontSize: 13, color: '#F97316', textDecoration: 'none', fontWeight: 600 }}>Voir tout →</Link>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #2A2A2A' }}>
                      {['Tracking', 'Client', 'Destination', 'Poids', 'Mode', 'Statut'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recentPkgs.map(pkg => (
                      <tr key={pkg.id} style={{ borderBottom: '1px solid #111111' }}>
                        <td style={{ padding: '12px 12px', fontSize: 13, color: '#F97316', fontWeight: 600, whiteSpace: 'nowrap' }}>
                          <Link href={`/dashboard/colis/${pkg.id}`} style={{ color: '#F97316', textDecoration: 'none' }}>{pkg.tracking_number}</Link>
                        </td>
                        <td style={{ padding: '12px 12px', fontSize: 13, color: '#E5E7EB', whiteSpace: 'nowrap' }}>
                          {pkg.users?.first_name} {pkg.users?.last_name}
                        </td>
                        <td style={{ padding: '12px 12px', fontSize: 13, color: '#9CA3AF', whiteSpace: 'nowrap' }}>
                          {pkg.destination_city}, {pkg.destination_country}
                        </td>
                        <td style={{ padding: '12px 12px', fontSize: 13, color: '#E5E7EB', whiteSpace: 'nowrap' }}>
                          {pkg.weight_billed ? `${pkg.weight_billed} lbs` : '—'}
                        </td>
                        <td style={{ padding: '12px 12px', fontSize: 13, color: '#9CA3AF' }}>
                          {pkg.transport_mode === 'air' ? '✈ Avion' : '🚢 Bateau'}
                        </td>
                        <td style={{ padding: '12px 12px' }}>
                          <StatusBadge status={pkg.status} />
                        </td>
                      </tr>
                    ))}
                    {recentPkgs.length === 0 && (
                      <tr><td colSpan={6} style={{ padding: '30px 12px', textAlign: 'center', color: '#6B7280', fontSize: 14 }}>Aucun colis récent</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
