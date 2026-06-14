'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getClient } from '@jjsimex/supabase';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

const AVATAR_COLORS = ['#F97316', '#22C55E', '#3B82F6', '#A855F7', '#06B6D4', '#F59E0B', '#EC4899', '#8B5CF6'];

interface Client {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  status: string;
  created_at: string;
  package_count?: number;
  total_spent?: number;
}

interface ClientDetail extends Client {
  packages: { id: string; tracking_number: string; status: string; created_at: string }[];
  payments: { id: string; amount: number; status: string; method: string; created_at: string }[];
}

const PAGE_SIZE = 20;

export default function ClientsPage() {
  const supabase = getClient();
  const { show, ToastEl } = useToast();

  const [clients, setClients] = useState<Client[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('tous');
  const [selectedClient, setSelectedClient] = useState<ClientDetail | null>(null);
  const [modalTab, setModalTab] = useState<'info' | 'colis' | 'paiements'>('info');
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const [stats, setStats] = useState({ total: 0, actif: 0, nouveau: 0 });

  const loadClients = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('users')
      .select('id, first_name, last_name, email, phone, status, created_at', { count: 'exact' })
      .eq('role', 'client')
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
    }
    if (statusFilter !== 'tous') {
      query = query.eq('status', statusFilter);
    }

    const { data, count } = await query;
    setClients((data ?? []) as Client[]);
    setTotal(count ?? 0);
    setLoading(false);
  }, [page, search, statusFilter]);

  const loadStats = useCallback(async () => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const [tot, act, nouv] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'client'),
      supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'client').eq('status', 'actif'),
      supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'client').gte('created_at', monthStart),
    ]);
    setStats({ total: tot.count ?? 0, actif: act.count ?? 0, nouveau: nouv.count ?? 0 });
  }, []);

  useEffect(() => { loadClients(); }, [loadClients]);
  useEffect(() => { loadStats(); }, [loadStats]);

  const openClient = async (c: Client) => {
    setLoadingDetail(true);
    setSelectedClient({ ...c, packages: [], payments: [] });
    setModalTab('info');
    const [pkgs, pays] = await Promise.all([
      supabase.from('packages').select('id, tracking_number, status, created_at').eq('user_id', c.id).order('created_at', { ascending: false }).limit(10),
      supabase.from('payments').select('id, amount, status, method, created_at').eq('user_id', c.id).order('created_at', { ascending: false }).limit(10),
    ]);
    setSelectedClient({ ...c, packages: pkgs.data ?? [], payments: pays.data ?? [] });
    setLoadingDetail(false);
  };

  const changeStatus = async (clientId: string, newStatus: string) => {
    setUpdatingStatus(true);
    const { error } = await supabase.from('users').update({ status: newStatus }).eq('id', clientId);
    if (error) {
      show(`Erreur: ${error.message}`, 'error');
    } else {
      show('Statut mis à jour', 'success');
      setSelectedClient(prev => prev ? { ...prev, status: newStatus } : prev);
      loadClients();
      loadStats();
    }
    setUpdatingStatus(false);
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const avatarColor = (id: string) => AVATAR_COLORS[id.charCodeAt(0) % AVATAR_COLORS.length];
  const initials = (c: Client) => `${c.first_name[0] ?? ''}${c.last_name[0] ?? ''}`.toUpperCase();
  const fmt = (n: number) => n.toLocaleString('fr-FR');
  const fmtDate = (s: string) => new Date(s).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });

  const inputStyle: React.CSSProperties = { background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 8, color: '#fff', padding: '8px 12px', fontSize: 13, outline: 'none', fontFamily: 'inherit' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {ToastEl}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {[
          { label: 'Total clients', value: fmt(stats.total), color: '#FFFFFF' },
          { label: 'Actifs', value: fmt(stats.actif), color: '#22C55E' },
          { label: 'Inactifs', value: fmt(Math.max(0, stats.total - stats.actif)), color: '#9CA3AF' },
          { label: 'Nouveaux ce mois', value: fmt(stats.nouveau), color: '#F97316' },
        ].map(card => (
          <div key={card.label} style={{ background: '#1A1A1A', border: '1px solid #222', borderRadius: 12, padding: '16px 20px' }}>
            <p style={{ margin: 0, fontSize: 12, color: '#9CA3AF' }}>{card.label}</p>
            <p style={{ margin: '6px 0 0', fontSize: 22, fontWeight: 700, color: card.color }}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div style={{ background: '#1A1A1A', border: '1px solid #222', borderRadius: 12, padding: '14px 18px', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
          <input
            placeholder="Rechercher un client..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            style={{ ...inputStyle, paddingLeft: 32, width: '100%', boxSizing: 'border-box' }}
          />
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', fontSize: 14 }}>🔍</span>
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(0); }} style={{ ...inputStyle, cursor: 'pointer' }}>
          <option value="tous">Tous les statuts</option>
          <option value="actif">Actif</option>
          <option value="inactif">Inactif</option>
          <option value="bloqué">Bloqué</option>
        </select>
      </div>

      {/* Table */}
      <div style={{ background: '#1A1A1A', border: '1px solid #222', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 0.8fr 1fr 1fr', padding: '12px 20px', borderBottom: '1px solid #222', background: '#161616' }}>
          {['Client', 'Téléphone', 'Statut', 'Inscrit le', 'Actions'].map(h => (
            <div key={h} style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</div>
          ))}
        </div>

        {loading ? <LoadingSpinner /> : clients.map(client => (
          <div
            key={client.id}
            style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 0.8fr 1fr 1fr', padding: '14px 20px', borderBottom: '1px solid #1E1E1E', alignItems: 'center', transition: 'background 0.15s', cursor: 'pointer' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#1F1F1F')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: avatarColor(client.id), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                {initials(client)}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{client.first_name} {client.last_name}</div>
                <div style={{ fontSize: 12, color: '#9CA3AF' }}>{client.email}</div>
              </div>
            </div>
            <div style={{ fontSize: 13, color: '#fff' }}>{client.phone ?? '—'}</div>
            <div><StatusBadge status={client.status} /></div>
            <div style={{ fontSize: 12, color: '#9CA3AF' }}>{fmtDate(client.created_at)}</div>
            <div>
              <button
                onClick={() => openClient(client)}
                style={{ background: '#2A2A2A', border: '1px solid #333', borderRadius: 6, color: '#fff', padding: '5px 14px', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}
              >
                Voir
              </button>
            </div>
          </div>
        ))}

        {/* Pagination */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px' }}>
          <span style={{ fontSize: 13, color: '#9CA3AF' }}>
            {clients.length > 0 ? `${page * PAGE_SIZE + 1}–${page * PAGE_SIZE + clients.length} sur ${fmt(total)} clients` : 'Aucun client'}
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button disabled={page === 0} onClick={() => setPage(p => p - 1)} style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 6, color: '#9CA3AF', padding: '5px 10px', cursor: page === 0 ? 'default' : 'pointer', fontSize: 13, opacity: page === 0 ? 0.4 : 1, fontFamily: 'inherit' }}>‹</button>
            <span style={{ padding: '5px 12px', fontSize: 13, color: '#FFFFFF', background: '#F97316', borderRadius: 6 }}>{page + 1}</span>
            <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 6, color: '#9CA3AF', padding: '5px 10px', cursor: page >= totalPages - 1 ? 'default' : 'pointer', fontSize: 13, opacity: page >= totalPages - 1 ? 0.4 : 1, fontFamily: 'inherit' }}>›</button>
          </div>
        </div>
      </div>

      {/* Client detail modal */}
      <Modal open={!!selectedClient} onClose={() => setSelectedClient(null)} title={selectedClient ? `${selectedClient.first_name} ${selectedClient.last_name}` : ''} maxWidth={700}>
        {selectedClient && (
          <div>
            {/* Tabs */}
            <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid #2A2A2A', marginBottom: 20 }}>
              {(['info', 'colis', 'paiements'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setModalTab(tab)}
                  style={{ background: modalTab === tab ? 'rgba(249,115,22,0.12)' : 'none', border: 'none', borderBottom: modalTab === tab ? '2px solid #F97316' : '2px solid transparent', padding: '8px 18px', color: modalTab === tab ? '#F97316' : '#9CA3AF', fontSize: 13, fontWeight: modalTab === tab ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit', borderRadius: '8px 8px 0 0' }}
                >
                  {tab === 'info' ? 'Informations' : tab === 'colis' ? `Colis (${selectedClient.packages.length})` : `Paiements (${selectedClient.payments.length})`}
                </button>
              ))}
            </div>

            {loadingDetail ? <LoadingSpinner /> : (
              <>
                {modalTab === 'info' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      {[
                        { label: 'Prénom', value: selectedClient.first_name },
                        { label: 'Nom', value: selectedClient.last_name },
                        { label: 'Email', value: selectedClient.email },
                        { label: 'Téléphone', value: selectedClient.phone ?? '—' },
                        { label: 'Statut', value: selectedClient.status },
                        { label: 'Inscrit le', value: fmtDate(selectedClient.created_at) },
                      ].map(row => (
                        <div key={row.label}>
                          <div style={{ fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{row.label}</div>
                          <div style={{ fontSize: 14, color: '#FFFFFF', fontWeight: 500 }}>{row.value}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ borderTop: '1px solid #2A2A2A', paddingTop: 16 }}>
                      <div style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 10 }}>Changer le statut</div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {['actif', 'inactif', 'bloqué'].map(s => (
                          <button
                            key={s}
                            disabled={updatingStatus || selectedClient.status === s}
                            onClick={() => changeStatus(selectedClient.id, s)}
                            style={{ background: selectedClient.status === s ? '#2A2A2A' : '#1A1A1A', border: `1px solid ${selectedClient.status === s ? '#F97316' : '#2A2A2A'}`, borderRadius: 8, padding: '7px 16px', color: selectedClient.status === s ? '#F97316' : '#9CA3AF', fontSize: 13, fontWeight: 500, cursor: updatingStatus ? 'default' : 'pointer', fontFamily: 'inherit', textTransform: 'capitalize', opacity: updatingStatus ? 0.6 : 1 }}
                          >
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {modalTab === 'colis' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {selectedClient.packages.length === 0 ? (
                      <div style={{ textAlign: 'center', color: '#6B7280', padding: 30 }}>Aucun colis</div>
                    ) : selectedClient.packages.map(pkg => (
                      <div key={pkg.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#111', borderRadius: 8 }}>
                        <span style={{ fontSize: 13, color: '#F97316', fontWeight: 600 }}>{pkg.tracking_number}</span>
                        <span style={{ fontSize: 12, color: '#9CA3AF' }}>{fmtDate(pkg.created_at)}</span>
                        <StatusBadge status={pkg.status} />
                      </div>
                    ))}
                  </div>
                )}

                {modalTab === 'paiements' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {selectedClient.payments.length === 0 ? (
                      <div style={{ textAlign: 'center', color: '#6B7280', padding: 30 }}>Aucun paiement</div>
                    ) : selectedClient.payments.map(pay => (
                      <div key={pay.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#111', borderRadius: 8 }}>
                        <span style={{ fontSize: 13, color: '#E5E7EB', fontWeight: 600 }}>${pay.amount.toFixed(2)}</span>
                        <span style={{ fontSize: 12, color: '#9CA3AF' }}>{pay.method}</span>
                        <span style={{ fontSize: 12, color: '#9CA3AF' }}>{fmtDate(pay.created_at)}</span>
                        <StatusBadge status={pay.status} />
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
