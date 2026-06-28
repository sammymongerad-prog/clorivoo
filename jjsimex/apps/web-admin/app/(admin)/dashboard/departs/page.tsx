'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

type DepartureStatus = 'open' | 'closed' | 'departed' | 'arrived';
type TransportType = 'air' | 'sea';

interface Departure {
  id: string;
  type: TransportType;
  departure_date: string;
  origin: string;
  destinations: string[];
  status: DepartureStatus;
  capacity_lbs: number;
  used_capacity_lbs: number;
  notes: string | null;
  created_at: string;
  package_count: number;
}

interface AssignablePackage {
  id: string;
  tracking_number: string;
  billed_weight_lbs: number;
  destination_city: string;
  client_name: string;
}

const STATUS_CONFIG: Record<DepartureStatus, { label: string; color: string; bg: string }> = {
  open: { label: 'Ouvert', color: '#22C55E', bg: 'rgba(34,197,94,0.14)' },
  closed: { label: 'Fermé', color: '#F59E0B', bg: 'rgba(245,158,11,0.14)' },
  departed: { label: 'En transit', color: '#3B82F6', bg: 'rgba(59,130,246,0.14)' },
  arrived: { label: 'Arrivé', color: '#A855F7', bg: 'rgba(168,85,247,0.14)' },
};

type Tab = 'upcoming' | 'active' | 'completed';

export default function DepartsPage() {
  const supabase = createClient();
  const [departures, setDepartures] = useState<Departure[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('upcoming');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState<string | null>(null);
  const [assignablePackages, setAssignablePackages] = useState<AssignablePackage[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Create form state
  const [newType, setNewType] = useState<TransportType>('air');
  const [newDate, setNewDate] = useState('');
  const [newDestinations, setNewDestinations] = useState('Port-au-Prince, Cap-Haïtien');
  const [newCapacity, setNewCapacity] = useState('');
  const [newNotes, setNewNotes] = useState('');

  const loadDepartures = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    const { data } = await supabase
      .from('departures')
      .select('*')
      .order('departure_date', { ascending: true });

    const deps = (data ?? []) as (Departure & { package_count?: number })[];

    if (deps.length > 0) {
      const ids = deps.map(d => d.id);
      const { data: pkgs } = await supabase
        .from('packages')
        .select('departure_id')
        .in('departure_id', ids);

      const countMap: Record<string, number> = {};
      for (const p of pkgs ?? []) {
        countMap[p.departure_id] = (countMap[p.departure_id] ?? 0) + 1;
      }
      for (const d of deps) {
        d.package_count = countMap[d.id] ?? 0;
      }
    }

    setDepartures(deps);
    if (showLoader) setLoading(false);
  }, []);

  useEffect(() => {
    loadDepartures();

    const ch = supabase
      .channel('departures_rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'departures' }, () => loadDepartures(false))
      .subscribe();

    return () => { supabase.removeChannel(ch); };
  }, [loadDepartures]);

  const filtered = departures.filter(d => {
    if (activeTab === 'upcoming') return d.status === 'open' || d.status === 'closed';
    if (activeTab === 'active') return d.status === 'departed';
    return d.status === 'arrived';
  });

  const counts = {
    upcoming: departures.filter(d => d.status === 'open' || d.status === 'closed').length,
    active: departures.filter(d => d.status === 'departed').length,
    completed: departures.filter(d => d.status === 'arrived').length,
  };

  // Stats
  const totalPkgs = departures.reduce((s, d) => s + d.package_count, 0);
  const openDeps = departures.filter(d => d.status === 'open');
  const avgFill = openDeps.length > 0
    ? Math.round(openDeps.reduce((s, d) => s + (d.capacity_lbs > 0 ? (d.used_capacity_lbs / d.capacity_lbs) * 100 : 0), 0) / openDeps.length)
    : 0;

  // ─── Actions ───────────────────────────────────────────────────────────────

  async function handleCreate() {
    if (!newDate || !newCapacity) return;
    setActionLoading('create');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { error } = await supabase.from('departures').insert({
        type: newType,
        departure_date: newDate,
        origin: 'Miami, FL',
        destinations: newDestinations.split(',').map(s => s.trim()).filter(Boolean),
        capacity_lbs: parseFloat(newCapacity),
        used_capacity_lbs: 0,
        status: 'open',
        notes: newNotes || null,
        created_by: session?.user?.id ?? null,
      });
      if (error) throw error;
      setShowCreateModal(false);
      setNewDate(''); setNewCapacity(''); setNewNotes('');
      loadDepartures(false);
    } catch (e: any) {
      alert(e.message);
    }
    setActionLoading(null);
  }

  async function handleClose(depId: string) {
    if (!confirm('Fermer ce départ ? Aucun colis supplémentaire ne pourra être ajouté.')) return;
    setActionLoading(depId);
    const { error } = await supabase.from('departures').update({ status: 'closed' }).eq('id', depId);
    if (error) alert(error.message);
    else loadDepartures(false);
    setActionLoading(null);
  }

  async function handleMarkDeparted(depId: string) {
    if (!confirm('Marquer ce départ comme parti ? Tous les colis passeront en transit.')) return;
    setActionLoading(depId);
    const { error } = await supabase.from('departures').update({ status: 'departed' }).eq('id', depId);
    if (!error) {
      await supabase.from('packages').update({ status: 'in_transit' }).eq('departure_id', depId).in('status', ['received_usa']);
    }
    if (error) alert(error.message);
    else loadDepartures(false);
    setActionLoading(null);
  }

  async function handleMarkArrived(depId: string) {
    if (!confirm('Marquer ce départ comme arrivé ?')) return;
    setActionLoading(depId);
    const { error } = await supabase.from('departures').update({ status: 'arrived' }).eq('id', depId);
    if (!error) {
      await supabase.from('packages').update({ status: 'arrived' }).eq('departure_id', depId).eq('status', 'in_transit');
    }
    if (error) alert(error.message);
    else loadDepartures(false);
    setActionLoading(null);
  }

  async function handleNotifyClients(depId: string) {
    setActionLoading(depId);
    const dep = departures.find(d => d.id === depId);
    if (!dep) { setActionLoading(null); return; }

    const { data: packages } = await supabase
      .from('packages')
      .select('client_id, tracking_number')
      .eq('departure_id', depId);

    if (!packages || packages.length === 0) {
      alert('Aucun colis assigné à ce départ.');
      setActionLoading(null);
      return;
    }

    const uniqueClients = Array.from(new Set(packages.map(p => p.client_id)));
    const typeLabel = dep.type === 'air' ? 'Vol' : 'Bateau';
    const destLabel = dep.destinations.join(', ');
    const dateFormatted = new Date(dep.departure_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    const title = `${typeLabel} prévu le ${dateFormatted}`;
    const message = `Votre colis est prévu sur le ${typeLabel.toLowerCase()} ${dep.origin} → ${destLabel} du ${dateFormatted}.`;

    const notifications = uniqueClients.map(clientId => ({
      user_id: clientId,
      type: 'package' as const,
      title,
      message,
    }));

    await supabase.from('notifications').insert(notifications);
    alert(`${uniqueClients.length} client(s) notifié(s).`);
    setActionLoading(null);
  }

  async function openAssignModal(depId: string) {
    setShowAssignModal(depId);
    const { data } = await supabase
      .from('packages')
      .select('id, tracking_number, billed_weight_lbs, destination_city, users!client_id(full_name)')
      .in('status', ['received_usa'])
      .is('departure_id', null)
      .order('created_at', { ascending: false });

    setAssignablePackages((data ?? []).map((p: any) => ({
      id: p.id,
      tracking_number: p.tracking_number ?? 'N/A',
      billed_weight_lbs: p.billed_weight_lbs ?? 0,
      destination_city: p.destination_city,
      client_name: p.users?.full_name ?? 'Client',
    })));
  }

  async function handleAssign(packageId: string, departureId: string) {
    setActionLoading(packageId);
    const dep = departures.find(d => d.id === departureId);
    const pkg = assignablePackages.find(p => p.id === packageId);
    if (!dep || !pkg) { setActionLoading(null); return; }

    const available = dep.capacity_lbs - dep.used_capacity_lbs;
    if (pkg.billed_weight_lbs > available) {
      alert(`Capacité insuffisante. Disponible: ${available.toFixed(1)} lbs, colis: ${pkg.billed_weight_lbs} lbs.`);
      setActionLoading(null);
      return;
    }

    const { error } = await supabase.from('packages').update({ departure_id: departureId }).eq('id', packageId);
    if (!error) {
      await supabase.from('departures').update({ used_capacity_lbs: dep.used_capacity_lbs + pkg.billed_weight_lbs }).eq('id', departureId);
      setAssignablePackages(prev => prev.filter(p => p.id !== packageId));
      loadDepartures(false);
    } else {
      alert(error.message);
    }
    setActionLoading(null);
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  function daysUntil(d: string) {
    const diff = Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
    if (diff < 0) return 'Passé';
    if (diff === 0) return "Aujourd'hui";
    if (diff === 1) return 'Demain';
    return `Dans ${diff} jours`;
  }

  function capacityPct(d: Departure) {
    return d.capacity_lbs > 0 ? Math.round((d.used_capacity_lbs / d.capacity_lbs) * 100) : 0;
  }

  function capacityColor(pct: number) {
    if (pct >= 90) return '#EF4444';
    if (pct >= 70) return '#F97316';
    return '#22C55E';
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#9CA3AF' }}>
        Chargement des départs...
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#FFFFFF' }}>Départs</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#9CA3AF' }}>Gestion des vols et bateaux Miami → Caraïbes</p>
        </div>
        <button onClick={() => setShowCreateModal(true)}
          style={{ background: '#F97316', border: 'none', borderRadius: 8, color: '#FFFFFF', padding: '10px 20px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
          + Nouveau départ
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total départs', value: departures.length },
          { label: 'Colis assignés', value: totalPkgs },
          { label: 'En transit', value: counts.active },
          { label: 'Taux remplissage', value: `${avgFill}%` },
        ].map(s => (
          <div key={s.label} style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 12, padding: '14px 18px' }}>
            <div style={{ fontSize: 12, color: '#9CA3AF' }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#FFFFFF', marginTop: 4 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 10, padding: 4, width: 'fit-content' }}>
        {([
          { key: 'upcoming' as Tab, label: 'À venir', count: counts.upcoming },
          { key: 'active' as Tab, label: 'En transit', count: counts.active },
          { key: 'completed' as Tab, label: 'Arrivés', count: counts.completed },
        ]).map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            style={{ background: activeTab === tab.key ? '#2A2A2A' : 'transparent', border: activeTab === tab.key ? '1px solid #333' : '1px solid transparent', borderRadius: 8, color: activeTab === tab.key ? '#FFFFFF' : '#9CA3AF', padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: activeTab === tab.key ? 600 : 400, display: 'flex', alignItems: 'center', gap: 8 }}>
            {tab.label}
            <span style={{ background: activeTab === tab.key ? '#F97316' : '#2A2A2A', color: '#FFFFFF', borderRadius: 20, padding: '1px 7px', fontSize: 11, fontWeight: 700 }}>{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Cards */}
      {filtered.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: filtered.length === 1 ? '1fr' : 'repeat(2, 1fr)', gap: 18 }}>
          {filtered.map(dep => {
            const pct = capacityPct(dep);
            const cColor = capacityColor(pct);
            const sc = STATUS_CONFIG[dep.status];
            return (
              <div key={dep.id} style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 16, padding: 22 }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ fontSize: 26 }}>{dep.type === 'air' ? '✈️' : '🚢'}</div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#FFFFFF' }}>
                        {dep.type === 'air' ? 'Vol' : 'Bateau'} {dep.origin} → {dep.destinations.join(', ')}
                      </div>
                      <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>
                        {formatDate(dep.departure_date)}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span style={{ background: sc.bg, color: sc.color, borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 600 }}>{sc.label}</span>
                    {dep.status === 'open' && (
                      <span style={{ background: 'rgba(249,115,22,0.12)', color: '#F97316', borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 600 }}>
                        {daysUntil(dep.departure_date)}
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ borderTop: '1px solid #2A2A2A', marginBottom: 14 }} />

                {/* Capacity bar */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: '#9CA3AF' }}>Capacité</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: cColor }}>
                      {dep.used_capacity_lbs.toFixed(0)} / {dep.capacity_lbs.toFixed(0)} lbs ({pct}%)
                    </span>
                  </div>
                  <div style={{ background: '#2A2A2A', borderRadius: 4, height: 6, overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(pct, 100)}%`, background: cColor, height: '100%', borderRadius: 4 }} />
                  </div>
                </div>

                {/* Stats 2x2 */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                  <div style={{ background: '#111', border: '1px solid #222', borderRadius: 8, padding: '10px 14px' }}>
                    <div style={{ fontSize: 11, color: '#9CA3AF' }}>Colis</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#F97316', marginTop: 2 }}>{dep.package_count}</div>
                  </div>
                  <div style={{ background: '#111', border: '1px solid #222', borderRadius: 8, padding: '10px 14px' }}>
                    <div style={{ fontSize: 11, color: '#9CA3AF' }}>Destinations</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF', marginTop: 2 }}>{dep.destinations.join(', ')}</div>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {dep.status === 'open' && (
                    <>
                      <button onClick={() => openAssignModal(dep.id)} disabled={actionLoading === dep.id}
                        style={{ background: '#F97316', border: 'none', borderRadius: 8, color: '#FFFFFF', padding: '9px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                        + Assigner colis
                      </button>
                      <button onClick={() => handleNotifyClients(dep.id)} disabled={actionLoading === dep.id}
                        style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 8, color: '#22C55E', padding: '9px', cursor: 'pointer', fontSize: 12, fontWeight: 500 }}>
                        Notifier clients
                      </button>
                      <button onClick={() => handleClose(dep.id)} disabled={actionLoading === dep.id}
                        style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 8, color: '#F59E0B', padding: '9px', cursor: 'pointer', fontSize: 12, fontWeight: 500 }}>
                        Fermer départ
                      </button>
                      <button onClick={() => handleMarkDeparted(dep.id)} disabled={actionLoading === dep.id}
                        style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 8, color: '#3B82F6', padding: '9px', cursor: 'pointer', fontSize: 12, fontWeight: 500 }}>
                        Marquer parti
                      </button>
                    </>
                  )}
                  {dep.status === 'closed' && (
                    <>
                      <button onClick={() => handleNotifyClients(dep.id)} disabled={actionLoading === dep.id}
                        style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 8, color: '#22C55E', padding: '9px', cursor: 'pointer', fontSize: 12, fontWeight: 500 }}>
                        Notifier clients
                      </button>
                      <button onClick={() => handleMarkDeparted(dep.id)} disabled={actionLoading === dep.id}
                        style={{ background: '#3B82F6', border: 'none', borderRadius: 8, color: '#FFFFFF', padding: '9px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                        Marquer parti
                      </button>
                    </>
                  )}
                  {dep.status === 'departed' && (
                    <button onClick={() => handleMarkArrived(dep.id)} disabled={actionLoading === dep.id}
                      style={{ background: '#A855F7', border: 'none', borderRadius: 8, color: '#FFFFFF', padding: '9px', cursor: 'pointer', fontSize: 12, fontWeight: 600, gridColumn: '1 / -1' }}>
                      Marquer arrivé
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 16, padding: 48, textAlign: 'center' }}>
          <p style={{ color: '#9CA3AF', fontSize: 14, margin: 0 }}>Aucun départ dans cette catégorie</p>
        </div>
      )}

      {/* ─── Create Modal ─────────────────────────────────────────────────── */}
      {showCreateModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}
          onClick={e => { if (e.target === e.currentTarget) setShowCreateModal(false); }}>
          <div style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 16, padding: 28, width: 440, maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 700, color: '#FFFFFF' }}>Nouveau départ</h2>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, color: '#9CA3AF', marginBottom: 6 }}>Mode de transport</label>
              <div style={{ display: 'flex', gap: 10 }}>
                {(['air', 'sea'] as TransportType[]).map(t => (
                  <button key={t} onClick={() => { setNewType(t); setNewCapacity(t === 'air' ? '500' : '8000'); }}
                    style={{ flex: 1, padding: '10px', borderRadius: 8, border: newType === t ? '2px solid #F97316' : '1px solid #2A2A2A', background: newType === t ? 'rgba(249,115,22,0.12)' : '#111', color: newType === t ? '#F97316' : '#9CA3AF', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
                    {t === 'air' ? '✈️ Avion' : '🚢 Bateau'}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, color: '#9CA3AF', marginBottom: 6 }}>Date de départ</label>
              <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', background: '#111', border: '1px solid #2A2A2A', borderRadius: 8, color: '#FFFFFF', fontSize: 14, boxSizing: 'border-box' }} />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, color: '#9CA3AF', marginBottom: 6 }}>Destinations (séparées par virgule)</label>
              <input type="text" value={newDestinations} onChange={e => setNewDestinations(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', background: '#111', border: '1px solid #2A2A2A', borderRadius: 8, color: '#FFFFFF', fontSize: 14, boxSizing: 'border-box' }} />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, color: '#9CA3AF', marginBottom: 6 }}>Capacité (lbs)</label>
              <input type="number" value={newCapacity} onChange={e => setNewCapacity(e.target.value)} placeholder={newType === 'air' ? '500' : '8000'}
                style={{ width: '100%', padding: '10px 12px', background: '#111', border: '1px solid #2A2A2A', borderRadius: 8, color: '#FFFFFF', fontSize: 14, boxSizing: 'border-box' }} />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, color: '#9CA3AF', marginBottom: 6 }}>Notes (optionnel)</label>
              <textarea value={newNotes} onChange={e => setNewNotes(e.target.value)} rows={2}
                style={{ width: '100%', padding: '10px 12px', background: '#111', border: '1px solid #2A2A2A', borderRadius: 8, color: '#FFFFFF', fontSize: 14, resize: 'vertical', boxSizing: 'border-box' }} />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowCreateModal(false)}
                style={{ flex: 1, padding: '11px', background: '#2A2A2A', border: 'none', borderRadius: 8, color: '#FFFFFF', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                Annuler
              </button>
              <button onClick={handleCreate} disabled={actionLoading === 'create' || !newDate || !newCapacity}
                style={{ flex: 1.4, padding: '11px', background: '#F97316', border: 'none', borderRadius: 8, color: '#FFFFFF', cursor: 'pointer', fontSize: 13, fontWeight: 700, opacity: (!newDate || !newCapacity) ? 0.5 : 1 }}>
                {actionLoading === 'create' ? 'Création...' : 'Créer le départ'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Assign Modal ─────────────────────────────────────────────────── */}
      {showAssignModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}
          onClick={e => { if (e.target === e.currentTarget) setShowAssignModal(null); }}>
          <div style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 16, padding: 28, width: 500, maxHeight: '80vh', overflowY: 'auto' }}>
            <h2 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 700, color: '#FFFFFF' }}>Assigner des colis</h2>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: '#9CA3AF' }}>
              Colis reçus non assignés ({assignablePackages.length})
            </p>

            {assignablePackages.length === 0 ? (
              <p style={{ color: '#6B7280', fontSize: 14, textAlign: 'center', padding: 24 }}>Aucun colis disponible.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {assignablePackages.map(pkg => (
                  <div key={pkg.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#111', border: '1px solid #222', borderRadius: 10, padding: '10px 14px' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#FFFFFF' }}>{pkg.tracking_number}</div>
                      <div style={{ fontSize: 12, color: '#9CA3AF' }}>{pkg.client_name} — {pkg.destination_city} — {pkg.billed_weight_lbs} lbs</div>
                    </div>
                    <button onClick={() => handleAssign(pkg.id, showAssignModal)} disabled={actionLoading === pkg.id}
                      style={{ background: '#F97316', border: 'none', borderRadius: 6, color: '#FFFFFF', padding: '6px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 600, flexShrink: 0 }}>
                      {actionLoading === pkg.id ? '...' : 'Assigner'}
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button onClick={() => setShowAssignModal(null)}
              style={{ marginTop: 16, width: '100%', padding: '11px', background: '#2A2A2A', border: 'none', borderRadius: 8, color: '#FFFFFF', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
