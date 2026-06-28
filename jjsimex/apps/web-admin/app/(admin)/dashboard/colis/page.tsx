'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getAllPackages } from '@jjsimex/supabase/packages';
import type { PackageFilters, PackageStatus } from '@jjsimex/supabase/packages';

const STATUS_LABELS: Record<PackageStatus, string> = {
  awaiting_arrival: 'En attente',
  pending: 'En attente',
  received_usa: 'Reçu USA',
  in_transit: 'En transit',
  arrived: 'Arrivé',
  ready_pickup: 'Prêt retrait',
  delivered: 'Livré',
};

const STATUS_STYLES: Record<PackageStatus, { background: string; color: string }> = {
  awaiting_arrival: { background: 'rgba(107,114,128,0.14)', color: '#6B7280' },
  pending:      { background: 'rgba(107,114,128,0.14)', color: '#6B7280' },
  received_usa: { background: 'rgba(59,130,246,0.14)',  color: '#3B82F6' },
  in_transit:   { background: 'rgba(249,115,22,0.14)',  color: '#F97316' },
  arrived:      { background: 'rgba(168,85,247,0.14)',  color: '#A855F7' },
  ready_pickup: { background: 'rgba(6,182,212,0.14)',   color: '#06B6D4' },
  delivered:    { background: 'rgba(34,197,94,0.14)',   color: '#22C55E' },
};

interface ColisRow {
  id: string;
  tracking_number: string;
  status: PackageStatus;
  transport_mode: 'air' | 'sea';
  destination_country: string;
  destination_city: string;
  weight_billed: number;
  price: number;
  created_at: string;
  users?: { first_name: string; last_name: string };
}

const PAGE_SIZE = 20;

export default function ColisPage() {
  const router = useRouter();
  const [packages, setPackages] = useState<ColisRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState<PackageFilters>({ page: 1 });
  const [searchInput, setSearchInput] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [allSelected, setAllSelected] = useState(false);

  const load = useCallback(async (f: PackageFilters) => {
    setLoading(true);
    setError('');
    try {
      const result = await getAllPackages(f);
      setPackages(result.packages as ColisRow[]);
      setTotal(result.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors du chargement.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(filters);
  }, [filters, load]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setFilters((f) => ({ ...f, search: searchInput.trim() || undefined, page: 1 }));
  }

  function setFilter<K extends keyof PackageFilters>(key: K, value: PackageFilters[K]) {
    setFilters((f) => ({ ...f, [key]: value, page: 1 }));
  }

  function toggleRow(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
      setAllSelected(false);
    } else {
      setSelected(new Set(packages.map((p) => p.id)));
      setAllSelected(true);
    }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const currentPage = filters.page ?? 1;
  const displayFrom = (currentPage - 1) * PAGE_SIZE + 1;
  const displayTo = Math.min(currentPage * PAGE_SIZE, total);

  // Stats counts from current data (approximate from total; real counts would come from API)
  const inTransitCount = packages.filter((p) => p.status === 'in_transit').length;
  const pendingCount = packages.filter((p) => p.status === 'pending').length;
  const deliveredCount = packages.filter((p) => p.status === 'delivered').length;

  const selectStyle: React.CSSProperties = {
    height: 40,
    background: '#111111',
    border: '1px solid #2A2A2A',
    borderRadius: 8,
    color: '#FFFFFF',
    padding: '0 12px',
    fontSize: 13,
    outline: 'none',
    cursor: 'pointer',
  };

  const actionBtnBase: React.CSSProperties = {
    background: '#2A2A2A',
    border: 'none',
    borderRadius: 8,
    padding: '6px 11px',
    fontSize: 11,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#FFFFFF', margin: 0 }}>Colis</h1>
          <p style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>{total} colis au total</p>
        </div>
        <button
          onClick={() => router.push('/dashboard/colis/nouveau')}
          style={{
            background: '#F97316',
            border: 'none',
            borderRadius: 8,
            padding: '10px 18px',
            color: '#FFFFFF',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          + Nouveau colis
        </button>
      </div>

      {/* Filter bar */}
      <form
        onSubmit={handleSearch}
        style={{
          background: '#1A1A1A',
          border: '1px solid #222222',
          borderRadius: 12,
          padding: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        {/* Search input */}
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#6B7280"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Rechercher par numéro, nom, ville..."
            style={{
              width: '100%',
              boxSizing: 'border-box',
              background: '#111111',
              border: '1px solid #2A2A2A',
              borderRadius: 8,
              height: 40,
              padding: '0 14px 0 38px',
              fontSize: 13,
              color: '#FFFFFF',
              outline: 'none',
              fontFamily: 'inherit',
            }}
          />
        </div>

        {/* Status select */}
        <select
          value={filters.status ?? ''}
          onChange={(e) => setFilter('status', (e.target.value as PackageStatus) || undefined)}
          style={selectStyle}
        >
          <option value="">Tous les statuts</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>

        {/* Transport mode select */}
        <select
          value={filters.transport_mode ?? ''}
          onChange={(e) => setFilter('transport_mode', (e.target.value as 'air' | 'sea') || undefined)}
          style={selectStyle}
        >
          <option value="">Mode</option>
          <option value="air">Aérien</option>
          <option value="sea">Maritime</option>
        </select>

        {/* Destination select */}
        <select
          value={filters.destination_country ?? ''}
          onChange={(e) => setFilter('destination_country', (e.target.value as 'haiti' | 'dominican_republic') || undefined)}
          style={selectStyle}
        >
          <option value="">Destination</option>
          <option value="haiti">Haïti</option>
          <option value="dominican_republic">Rép. Dominicaine</option>
        </select>

        {/* Date range */}
        <input
          type="date"
          value={filters.date_from ?? ''}
          onChange={(e) => setFilter('date_from', e.target.value || undefined)}
          style={{ ...selectStyle, padding: '0 10px' }}
        />
        <span style={{ color: '#6B7280', fontSize: 13 }}>→</span>
        <input
          type="date"
          value={filters.date_to ?? ''}
          onChange={(e) => setFilter('date_to', e.target.value || undefined)}
          style={{ ...selectStyle, padding: '0 10px' }}
        />

        {/* Reset button */}
        <button
          type="button"
          onClick={() => { setFilters({ page: 1 }); setSearchInput(''); }}
          style={{
            background: '#2A2A2A',
            border: 'none',
            borderRadius: 8,
            height: 40,
            padding: '0 16px',
            color: '#FFFFFF',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Réinitialiser
        </button>
      </form>

      {/* Stats pills */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {/* Total */}
        <div style={{
          background: '#1A1A1A',
          border: '1px solid #222222',
          borderRadius: 99,
          padding: '9px 18px',
          fontSize: 13,
          color: '#FFFFFF',
          fontWeight: 600,
        }}>
          Total : {total.toLocaleString('fr-FR')}
        </div>

        {/* En transit */}
        <div style={{
          background: '#1A1A1A',
          border: '1px solid #222222',
          borderRadius: 99,
          padding: '9px 18px',
          fontSize: 13,
          color: '#FFFFFF',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          En transit
          <span style={{
            background: 'rgba(249,115,22,0.14)',
            color: '#F97316',
            fontWeight: 700,
            padding: '2px 9px',
            borderRadius: 99,
            fontSize: 12,
          }}>
            {inTransitCount}
          </span>
        </div>

        {/* En attente */}
        <div style={{
          background: '#1A1A1A',
          border: '1px solid #222222',
          borderRadius: 99,
          padding: '9px 18px',
          fontSize: 13,
          color: '#FFFFFF',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          En attente
          <span style={{
            background: 'rgba(239,68,68,0.14)',
            color: '#EF4444',
            fontWeight: 700,
            padding: '2px 9px',
            borderRadius: 99,
            fontSize: 12,
          }}>
            {pendingCount}
          </span>
        </div>

        {/* Livrés */}
        <div style={{
          background: '#1A1A1A',
          border: '1px solid #222222',
          borderRadius: 99,
          padding: '9px 18px',
          fontSize: 13,
          color: '#FFFFFF',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          Livrés
          <span style={{
            background: 'rgba(34,197,94,0.14)',
            color: '#22C55E',
            fontWeight: 700,
            padding: '2px 9px',
            borderRadius: 99,
            fontSize: 12,
          }}>
            {deliveredCount}
          </span>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 12,
          padding: 16,
          color: '#EF4444',
          fontSize: 13,
        }}>
          {error}
        </div>
      )}

      {/* Table container */}
      <div style={{
        background: '#1A1A1A',
        border: '1px solid #222222',
        borderRadius: 12,
        overflow: 'hidden',
      }}>

        {/* Bulk action bar */}
        {selected.size > 0 && (
          <div style={{
            background: '#F97316',
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#0D0D0D', flex: 1 }}>
              {selected.size} colis sélectionnés
            </span>
            <button style={{
              background: 'rgba(13,13,13,0.15)',
              border: 'none',
              borderRadius: 8,
              padding: '8px 14px',
              color: '#0D0D0D',
              fontWeight: 700,
              fontSize: 12,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}>
              Changer statut
            </button>
            <button style={{
              background: 'rgba(13,13,13,0.15)',
              border: 'none',
              borderRadius: 8,
              padding: '8px 14px',
              color: '#0D0D0D',
              fontWeight: 700,
              fontSize: 12,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}>
              Assigner départ
            </button>
            <button style={{
              background: 'rgba(13,13,13,0.15)',
              border: 'none',
              borderRadius: 8,
              padding: '8px 14px',
              color: '#0D0D0D',
              fontWeight: 700,
              fontSize: 12,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}>
              Exporter
            </button>
            <button style={{
              background: '#0D0D0D',
              border: 'none',
              borderRadius: 8,
              padding: '8px 14px',
              color: '#EF4444',
              fontWeight: 700,
              fontSize: 12,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}>
              Supprimer
            </button>
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '64px 0', color: '#6B7280', fontSize: 13 }}>
            Chargement...
          </div>
        ) : packages.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '64px 0', color: '#6B7280', fontSize: 13 }}>
            Aucun colis trouvé.
          </div>
        ) : (
          <>
            {/* Table header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '44px 1.5fr 1.2fr 1.4fr 0.7fr 0.9fr 1.1fr 1fr 1.7fr',
              gap: 8,
              padding: '12px 16px',
              background: '#222222',
              fontSize: 11,
              fontWeight: 600,
              color: '#9CA3AF',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}>
              {/* Checkbox all */}
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div
                  onClick={toggleAll}
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 4,
                    border: '2px solid #3A3A3A',
                    background: allSelected ? '#F97316' : '#2A2A2A',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {allSelected && (
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="#0D0D0D" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              </div>
              <div>ID</div>
              <div>Client</div>
              <div>Destination</div>
              <div>Poids</div>
              <div>Mode</div>
              <div>Statut</div>
              <div>Date reçu</div>
              <div>Actions</div>
            </div>

            {/* Rows */}
            {packages.map((pkg) => {
              const isSelected = selected.has(pkg.id);
              return (
                <div
                  key={pkg.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '44px 1.5fr 1.2fr 1.4fr 0.7fr 0.9fr 1.1fr 1fr 1.7fr',
                    gap: 8,
                    padding: '12px 16px',
                    borderBottom: '1px solid #1F1F1F',
                    alignItems: 'center',
                    cursor: 'pointer',
                  }}
                  onClick={() => router.push(`/dashboard/colis/${pkg.id}`)}
                >
                  {/* Checkbox */}
                  <div
                    style={{ display: 'flex', alignItems: 'center' }}
                    onClick={(e) => { e.stopPropagation(); toggleRow(pkg.id); }}
                  >
                    <div style={{
                      width: 16,
                      height: 16,
                      borderRadius: 4,
                      border: '2px solid #3A3A3A',
                      background: isSelected ? '#F97316' : '#2A2A2A',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      {isSelected && (
                        <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6l3 3 5-5" stroke="#0D0D0D" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                  </div>

                  {/* ID / tracking */}
                  <div style={{ fontSize: 13, color: '#F97316', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {pkg.tracking_number}
                  </div>

                  {/* Client */}
                  <div style={{ fontSize: 13, color: '#FFFFFF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {pkg.users ? `${pkg.users.first_name} ${pkg.users.last_name}` : '—'}
                  </div>

                  {/* Destination */}
                  <div style={{ fontSize: 13, color: '#FFFFFF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {pkg.destination_city}
                  </div>

                  {/* Poids */}
                  <div style={{ fontSize: 13, color: '#FFFFFF' }}>
                    {pkg.weight_billed.toFixed(2)} lbs
                  </div>

                  {/* Mode */}
                  <div style={{ fontSize: 13, color: '#9CA3AF' }}>
                    {pkg.transport_mode === 'air' ? 'Aérien' : 'Maritime'}
                  </div>

                  {/* Statut badge */}
                  <div>
                    <span style={{
                      ...STATUS_STYLES[pkg.status],
                      fontSize: 11,
                      fontWeight: 600,
                      padding: '4px 10px',
                      borderRadius: 99,
                      whiteSpace: 'nowrap',
                    }}>
                      {STATUS_LABELS[pkg.status]}
                    </span>
                  </div>

                  {/* Date reçu */}
                  <div style={{ fontSize: 12, color: '#6B7280' }}>
                    {new Date(pkg.created_at).toLocaleDateString('fr-FR')}
                  </div>

                  {/* Actions */}
                  <div
                    style={{ display: 'flex', gap: 6 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => router.push(`/dashboard/colis/${pkg.id}`)}
                      style={{ ...actionBtnBase, color: '#FFFFFF' }}
                    >
                      Voir
                    </button>
                    <button
                      onClick={() => router.push(`/dashboard/colis/${pkg.id}/modifier`)}
                      style={{ ...actionBtnBase, color: '#FFFFFF' }}
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => router.push(`/dashboard/colis/${pkg.id}/statut`)}
                      style={{ ...actionBtnBase, color: '#F97316' }}
                    >
                      Statut
                    </button>
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* Pagination footer */}
        {total > 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 20px',
            borderTop: '1px solid #222222',
          }}>
            <span style={{ fontSize: 12, color: '#6B7280' }}>
              Affichage {displayFrom}–{displayTo} sur {total}
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                  if (idx > 0 && typeof arr[idx - 1] === 'number' && (p as number) - (arr[idx - 1] as number) > 1) {
                    acc.push('...');
                  }
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, idx) =>
                  p === '...' ? (
                    <span key={`ellipsis-${idx}`} style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280', fontSize: 12 }}>
                      …
                    </span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setFilters((f) => ({ ...f, page: p as number }))}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: p === currentPage ? '#F97316' : '#2A2A2A',
                        border: 'none',
                        color: p === currentPage ? '#0D0D0D' : '#9CA3AF',
                        fontWeight: p === currentPage ? 700 : 400,
                        cursor: 'pointer',
                        fontSize: 13,
                        fontFamily: 'inherit',
                      }}
                    >
                      {p}
                    </button>
                  )
                )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
