'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { KPICard } from '@/components/ui/KPICard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { RevenueChart } from '@/components/charts/RevenueChart';
import { DestinationDonut } from '@/components/charts/DestinationDonut';
import { TransportBars } from '@/components/charts/TransportBars';

const DEST_COLORS: Record<string, string> = {
  haiti: '#F97316', dr: '#3B82F6',
};
const DEST_LABELS: Record<string, string> = {
  haiti: 'Haïti', dr: 'Rép. Dom.',
};

const MONTH_LABELS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

interface DashboardData {
  totalPackages: number;
  totalRevenue: number;
  confirmedPayments: number;
  pendingCount: number;
  byCountry: Record<string, number>;
  airCount: number;
  seaCount: number;
  recentPackages: any[];
  chartData: { month: string; revenue: number; packages: number }[];
  nextDepartures: any[];
}

function getDateRange(period: 'week' | 'month' | 'year') {
  const now = new Date();
  const start = new Date(now);
  if (period === 'week') start.setDate(now.getDate() - 7);
  else if (period === 'month') start.setDate(now.getDate() - 30);
  else start.setFullYear(now.getFullYear() - 1);
  return start.toISOString();
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');

  const loadDashboard = useCallback(async (showLoader = true) => {
    const supabase = createClient();
    if (showLoader) setLoading(true);
    const since = getDateRange(period);

    const [pkgRes, payRes, recentRes, depRes] = await Promise.all([
      supabase.from('packages').select('id, total_price, destination_country, transport_mode, status, created_at').gte('created_at', since),
      supabase.from('payments').select('id, amount, status').gte('created_at', since),
      supabase.from('packages').select('id, tracking_number, client_id, destination_city, destination_country, billed_weight_lbs, transport_mode, status, created_at, users!packages_client_id_fkey(full_name)').order('created_at', { ascending: false }).limit(8),
      supabase.from('departures').select('*').in('status', ['open', 'closed']).order('departure_date', { ascending: true }).limit(4),
    ]);

    const packages = pkgRes.data ?? [];
    const payments = payRes.data ?? [];
    const recentPackages = recentRes.data ?? [];
    const departures = depRes.data ?? [];

    const totalPackages = packages.length;
    const totalRevenue = packages.reduce((s: number, p: any) => s + Number(p.total_price || 0), 0);
    const confirmedPayments = payments.filter((p: any) => p.status === 'confirmed').reduce((s: number, p: any) => s + Number(p.amount || 0), 0);
    const pendingCount = packages.filter((p: any) => p.status === 'received_usa').length;

    const byCountry: Record<string, number> = {};
    const airCount = packages.filter((p: any) => p.transport_mode === 'air').length;
    const seaCount = packages.filter((p: any) => p.transport_mode === 'sea').length;
    packages.forEach((p: any) => {
      const c = p.destination_country || 'unknown';
      byCountry[c] = (byCountry[c] || 0) + 1;
    });

    // Build chart data for last 6 months
    const now = new Date();
    const chartData = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now);
      d.setMonth(d.getMonth() - (5 - i));
      const m = d.getMonth();
      const y = d.getFullYear();
      const monthPkgs = packages.filter((p: any) => {
        const pd = new Date(p.created_at);
        return pd.getMonth() === m && pd.getFullYear() === y;
      });
      return {
        month: MONTH_LABELS[m],
        revenue: Math.round(monthPkgs.reduce((s: number, p: any) => s + Number(p.total_price || 0), 0)),
        packages: monthPkgs.length,
      };
    });

    setData({ totalPackages, totalRevenue, confirmedPayments, pendingCount, byCountry, airCount, seaCount, recentPackages, chartData, nextDepartures: departures });
    setLoading(false);
  }, [period]);

  useEffect(() => {
    loadDashboard();
    const supabase = createClient();
    const ch = supabase.channel('dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'packages' }, () => loadDashboard(false))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, () => loadDashboard(false))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [loadDashboard]);

  const fmt = (n: number) => n.toLocaleString('fr-FR');
  const fmtUSD = (n: number) => `$${n.toLocaleString('fr-FR', { minimumFractionDigits: 0 })}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
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

      {loading ? <LoadingSpinner /> : data && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            <KPICard
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="m3.27 6.96 8.73 5.05 8.73-5.05"/><path d="M12 22.08V12"/></svg>}
              label="Colis reçus"
              value={fmt(data.totalPackages)}
            />
            <KPICard
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}
              label="Revenus colis"
              value={fmtUSD(data.totalRevenue)}
              accent="#22C55E"
            />
            <KPICard
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>}
              label="Paiements confirmés"
              value={fmtUSD(data.confirmedPayments)}
              accent="#3B82F6"
            />
            <KPICard
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
              label="En attente traitement"
              value={fmt(data.pendingCount)}
              action={
                <Link href="/dashboard/colis?status=received_usa" style={{ background: '#F97316', borderRadius: 8, padding: '7px 12px', color: '#0D0D0D', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
                  Traiter →
                </Link>
              }
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '65fr 35fr', gap: 16 }}>
            <div style={{ background: '#1A1A1A', border: '1px solid #222222', borderRadius: 12, padding: 20, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#FFFFFF' }}>Revenus &amp; Colis — 6 derniers mois</span>
                <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#9CA3AF' }}>
                  <span><span style={{ color: '#F97316' }}>■</span> Revenus</span>
                  <span><span style={{ color: '#3B82F6' }}>■</span> Colis</span>
                </div>
              </div>
              <RevenueChart data={data.chartData} />
            </div>

            <div style={{ background: '#1A1A1A', border: '1px solid #222222', borderRadius: 12, padding: 20, minWidth: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#FFFFFF', marginBottom: 16 }}>Destinations</div>
              {Object.keys(data.byCountry).length > 0 ? (
                <DestinationDonut data={Object.entries(data.byCountry).map(([k, v]) => ({
                  name: DEST_LABELS[k] ?? k, value: v, color: DEST_COLORS[k] ?? '#6B7280',
                }))} />
              ) : (
                <div style={{ color: '#6B7280', fontSize: 14, textAlign: 'center', paddingTop: 40 }}>Aucune donnée</div>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '35fr 65fr', gap: 16 }}>
            <div style={{ background: '#1A1A1A', border: '1px solid #222222', borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#FFFFFF', marginBottom: 16 }}>Mode de transport</div>
              <TransportBars air={data.airCount} sea={data.seaCount} />
              <div style={{ marginTop: 16, display: 'flex', gap: 16 }}>
                <div style={{ flex: 1, background: '#111', borderRadius: 10, padding: '12px 16px', textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#3B82F6' }}>{fmt(data.airCount)}</div>
                  <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>✈ Aérien</div>
                </div>
                <div style={{ flex: 1, background: '#111', borderRadius: 10, padding: '12px 16px', textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#06B6D4' }}>{fmt(data.seaCount)}</div>
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
                    {data.recentPackages.map((pkg: any) => (
                      <tr key={pkg.id} style={{ borderBottom: '1px solid #111111' }}>
                        <td style={{ padding: '12px 12px', fontSize: 13, color: '#F97316', fontWeight: 600, whiteSpace: 'nowrap' }}>
                          <Link href={`/dashboard/colis/${pkg.id}`} style={{ color: '#F97316', textDecoration: 'none' }}>{pkg.tracking_number}</Link>
                        </td>
                        <td style={{ padding: '12px 12px', fontSize: 13, color: '#E5E7EB', whiteSpace: 'nowrap' }}>
                          {pkg.users?.full_name ?? '—'}
                        </td>
                        <td style={{ padding: '12px 12px', fontSize: 13, color: '#9CA3AF', whiteSpace: 'nowrap' }}>
                          {pkg.destination_city}{pkg.destination_country ? `, ${DEST_LABELS[pkg.destination_country] ?? pkg.destination_country}` : ''}
                        </td>
                        <td style={{ padding: '12px 12px', fontSize: 13, color: '#E5E7EB', whiteSpace: 'nowrap' }}>
                          {pkg.billed_weight_lbs ? `${pkg.billed_weight_lbs} lbs` : '—'}
                        </td>
                        <td style={{ padding: '12px 12px', fontSize: 13, color: '#9CA3AF' }}>
                          {pkg.transport_mode === 'air' ? '✈ Avion' : '🚢 Bateau'}
                        </td>
                        <td style={{ padding: '12px 12px' }}>
                          <StatusBadge status={pkg.status} />
                        </td>
                      </tr>
                    ))}
                    {data.recentPackages.length === 0 && (
                      <tr><td colSpan={6} style={{ padding: '30px 12px', textAlign: 'center', color: '#6B7280', fontSize: 14 }}>Aucun colis récent</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {data.nextDepartures.length > 0 && (
            <div style={{ background: '#1A1A1A', border: '1px solid #222222', borderRadius: 12, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#FFFFFF' }}>Prochains départs</span>
                <Link href="/dashboard/departs" style={{ fontSize: 13, color: '#F97316', textDecoration: 'none', fontWeight: 600 }}>Voir tout →</Link>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(data.nextDepartures.length, 4)}, 1fr)`, gap: 12 }}>
                {data.nextDepartures.map((dep: any) => {
                  const pct = dep.capacity_lbs > 0 ? Math.round((Number(dep.used_capacity_lbs) / Number(dep.capacity_lbs)) * 100) : 0;
                  return (
                    <div key={dep.id} style={{ background: '#111', borderRadius: 10, padding: 16, border: '1px solid #2A2A2A' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        <span style={{ fontSize: 18 }}>{dep.type === 'air' ? '✈' : '🚢'}</span>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF' }}>{dep.type === 'air' ? 'Aérien' : 'Maritime'}</span>
                        <StatusBadge status={dep.status} />
                      </div>
                      <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 8 }}>
                        {new Date(dep.departure_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                      <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 4 }}>
                        {dep.used_capacity_lbs} / {dep.capacity_lbs} lbs
                      </div>
                      <div style={{ height: 6, background: '#2A2A2A', borderRadius: 3 }}>
                        <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, background: pct > 80 ? '#EF4444' : '#F97316', borderRadius: 3 }} />
                      </div>
                      <div style={{ fontSize: 11, color: pct > 80 ? '#EF4444' : '#6B7280', marginTop: 4, textAlign: 'right' }}>{pct}%</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
