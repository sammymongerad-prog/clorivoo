'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getAllPackages } from '@jjsimex/supabase/packages';
import type { PackageFilters, PackageStatus } from '@jjsimex/supabase/packages';

const STATUS_LABELS: Record<PackageStatus, string> = {
  pending: 'En attente',
  received_usa: 'Reçu USA',
  in_transit: 'En transit',
  arrived: 'Arrivé',
  ready_pickup: 'Prêt à retirer',
  delivered: 'Livré',
};

const STATUS_COLORS: Record<PackageStatus, string> = {
  pending: 'text-yellow-400 bg-yellow-400/10',
  received_usa: 'text-blue-400 bg-blue-400/10',
  in_transit: 'text-orange-400 bg-orange-400/10',
  arrived: 'text-purple-400 bg-purple-400/10',
  ready_pickup: 'text-cyan-400 bg-cyan-400/10',
  delivered: 'text-green-400 bg-green-400/10',
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

export default function ColisPage() {
  const router = useRouter();
  const [packages, setPackages] = useState<ColisRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState<PackageFilters>({ page: 1 });
  const [searchInput, setSearchInput] = useState('');

  const load = useCallback(async (f: PackageFilters) => {
    setLoading(true);
    setError('');
    try {
      const result = await getAllPackages(f);
      setPackages(result.data as ColisRow[]);
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

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Colis</h1>
          <p className="text-brand-gray text-sm mt-1">{total} colis au total</p>
        </div>
        <button
          onClick={() => router.push('/dashboard/colis/nouveau')}
          className="bg-brand-orange text-white px-4 py-2 rounded-btn font-semibold text-sm hover:bg-brand-orange-dark transition-colors"
        >
          + Nouveau colis
        </button>
      </div>

      {/* Filtres */}
      <div className="bg-brand-card border border-brand-border rounded-card p-4 space-y-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Rechercher par numéro de suivi, nom, ville..."
            className="flex-1 bg-brand-bg border border-brand-border rounded-input px-3 py-2 text-sm text-white placeholder-brand-gray focus:outline-none focus:border-brand-orange"
          />
          <button
            type="submit"
            className="bg-brand-orange text-white px-4 py-2 rounded-btn text-sm font-semibold hover:bg-brand-orange-dark transition-colors"
          >
            Rechercher
          </button>
        </form>

        <div className="flex flex-wrap gap-3">
          <select
            value={filters.status ?? ''}
            onChange={(e) => setFilter('status', (e.target.value as PackageStatus) || undefined)}
            className="bg-brand-bg border border-brand-border rounded-input px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-orange"
          >
            <option value="">Tous les statuts</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>

          <select
            value={filters.transport_mode ?? ''}
            onChange={(e) => setFilter('transport_mode', (e.target.value as 'air' | 'sea') || undefined)}
            className="bg-brand-bg border border-brand-border rounded-input px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-orange"
          >
            <option value="">Transport</option>
            <option value="air">Aérien</option>
            <option value="sea">Maritime</option>
          </select>

          <select
            value={filters.destination_country ?? ''}
            onChange={(e) => setFilter('destination_country', (e.target.value as 'haiti' | 'dominican_republic') || undefined)}
            className="bg-brand-bg border border-brand-border rounded-input px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-orange"
          >
            <option value="">Destination</option>
            <option value="haiti">Haïti</option>
            <option value="dominican_republic">Rép. Dominicaine</option>
          </select>

          <input
            type="date"
            value={filters.date_from ?? ''}
            onChange={(e) => setFilter('date_from', e.target.value || undefined)}
            className="bg-brand-bg border border-brand-border rounded-input px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-orange"
          />
          <input
            type="date"
            value={filters.date_to ?? ''}
            onChange={(e) => setFilter('date_to', e.target.value || undefined)}
            className="bg-brand-bg border border-brand-border rounded-input px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-orange"
          />

          {(filters.status || filters.transport_mode || filters.destination_country || filters.date_from || filters.date_to || filters.search) && (
            <button
              onClick={() => { setFilters({ page: 1 }); setSearchInput(''); }}
              className="text-brand-gray text-sm underline"
            >
              Réinitialiser
            </button>
          )}
        </div>
      </div>

      {/* Erreur */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-card p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Tableau */}
      <div className="bg-brand-card border border-brand-border rounded-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-brand-gray text-sm">
            Chargement...
          </div>
        ) : packages.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-brand-gray text-sm">
            Aucun colis trouvé.
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-brand-border">
                <th className="text-left px-4 py-3 text-xs text-brand-gray font-medium uppercase tracking-wider">Suivi</th>
                <th className="text-left px-4 py-3 text-xs text-brand-gray font-medium uppercase tracking-wider">Client</th>
                <th className="text-left px-4 py-3 text-xs text-brand-gray font-medium uppercase tracking-wider">Statut</th>
                <th className="text-left px-4 py-3 text-xs text-brand-gray font-medium uppercase tracking-wider">Transport</th>
                <th className="text-left px-4 py-3 text-xs text-brand-gray font-medium uppercase tracking-wider">Destination</th>
                <th className="text-right px-4 py-3 text-xs text-brand-gray font-medium uppercase tracking-wider">Poids</th>
                <th className="text-right px-4 py-3 text-xs text-brand-gray font-medium uppercase tracking-wider">Prix</th>
                <th className="text-left px-4 py-3 text-xs text-brand-gray font-medium uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody>
              {packages.map((pkg) => (
                <tr
                  key={pkg.id}
                  onClick={() => router.push(`/dashboard/colis/${pkg.id}`)}
                  className="border-b border-brand-border hover:bg-white/5 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 text-brand-orange font-bold text-sm">{pkg.tracking_number}</td>
                  <td className="px-4 py-3 text-white text-sm">
                    {pkg.users ? `${pkg.users.first_name} ${pkg.users.last_name}` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_COLORS[pkg.status]}`}>
                      {STATUS_LABELS[pkg.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-brand-gray text-sm capitalize">
                    {pkg.transport_mode === 'air' ? 'Aérien' : 'Maritime'}
                  </td>
                  <td className="px-4 py-3 text-white text-sm">{pkg.destination_city}</td>
                  <td className="px-4 py-3 text-white text-sm text-right">{pkg.weight_billed.toFixed(2)} lbs</td>
                  <td className="px-4 py-3 text-green-400 font-semibold text-sm text-right">${pkg.price.toFixed(2)}</td>
                  <td className="px-4 py-3 text-brand-gray text-xs">
                    {new Date(pkg.created_at).toLocaleDateString('fr-FR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-brand-gray text-sm">
            Page {filters.page} sur {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              disabled={(filters.page ?? 1) <= 1}
              onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) - 1 }))}
              className="px-4 py-2 bg-brand-card border border-brand-border rounded-btn text-sm text-white disabled:opacity-30 hover:bg-white/5 transition-colors"
            >
              Précédent
            </button>
            <button
              disabled={(filters.page ?? 1) >= totalPages}
              onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) + 1 }))}
              className="px-4 py-2 bg-brand-card border border-brand-border rounded-btn text-sm text-white disabled:opacity-30 hover:bg-white/5 transition-colors"
            >
              Suivant
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
