'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getPackageDetail, updatePackageStatus, addInternalNote } from '@jjsimex/supabase/packages';
import type { PackageStatus } from '@jjsimex/supabase/packages';
import { createClient } from '@/lib/supabase/client';

const STATUS_LABELS: Record<PackageStatus, string> = {
  pending: 'En attente',
  received_usa: 'Reçu USA',
  in_transit: 'En transit',
  arrived: 'Arrivé',
  ready_pickup: 'Prêt à retirer',
  delivered: 'Livré',
};

const STATUS_NEXT: Partial<Record<PackageStatus, PackageStatus[]>> = {
  pending: ['received_usa'],
  received_usa: ['in_transit'],
  in_transit: ['arrived'],
  arrived: ['ready_pickup'],
  ready_pickup: ['delivered'],
};

const STATUS_COLORS: Record<PackageStatus, string> = {
  pending: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
  received_usa: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
  in_transit: 'text-orange-400 bg-orange-400/10 border-orange-400/30',
  arrived: 'text-purple-400 bg-purple-400/10 border-purple-400/30',
  ready_pickup: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/30',
  delivered: 'text-green-400 bg-green-400/10 border-green-400/30',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PackageDetail = any;

export default function ColisDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [pkg, setPkg] = useState<PackageDetail>(null);
  const [adminId, setAdminId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusModal, setStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState<PackageStatus | ''>('');
  const [statusNote, setStatusNote] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState('');
  const [noteText, setNoteText] = useState('');
  const [noteLoading, setNoteLoading] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      setAdminId(user.id);

      try {
        const data = await getPackageDetail(id, user.id);
        setPkg(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erreur lors du chargement.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, router]);

  async function handleStatusChange() {
    if (!newStatus) return;
    setStatusLoading(true);
    setStatusError('');
    try {
      await updatePackageStatus(id, newStatus, statusNote || undefined, adminId);
      const refreshed = await getPackageDetail(id, adminId);
      setPkg(refreshed);
      setStatusModal(false);
      setNewStatus('');
      setStatusNote('');
    } catch (e) {
      setStatusError(e instanceof Error ? e.message : 'Erreur lors du changement de statut.');
    } finally {
      setStatusLoading(false);
    }
  }

  async function handleAddNote() {
    if (!noteText.trim()) return;
    setNoteLoading(true);
    try {
      await addInternalNote(id, noteText.trim(), adminId);
      const refreshed = await getPackageDetail(id, adminId);
      setPkg(refreshed);
      setNoteText('');
    } catch {
      // Note non critique
    } finally {
      setNoteLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-brand-gray text-sm">
        Chargement...
      </div>
    );
  }

  if (error || !pkg) {
    return (
      <div className="space-y-4">
        <button onClick={() => router.back()} className="text-brand-gray text-sm hover:text-white">
          ← Retour
        </button>
        <div className="bg-red-500/10 border border-red-500/30 rounded-card p-4 text-red-400 text-sm">
          {error || 'Colis introuvable.'}
        </div>
      </div>
    );
  }

  const nextStatuses = STATUS_NEXT[pkg.status as PackageStatus] ?? [];

  return (
    <div className="space-y-6 max-w-4xl">
      {/* En-tête */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="text-brand-gray hover:text-white transition-colors">
          ←
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-brand-orange">{pkg.tracking_number}</h1>
            <span className={`text-xs font-medium px-2 py-1 rounded-full border ${STATUS_COLORS[pkg.status as PackageStatus]}`}>
              {STATUS_LABELS[pkg.status as PackageStatus]}
            </span>
          </div>
          <p className="text-brand-gray text-sm mt-1">
            Créé le {new Date(pkg.created_at).toLocaleDateString('fr-FR')}
          </p>
        </div>
        {nextStatuses.length > 0 && (
          <button
            onClick={() => setStatusModal(true)}
            className="bg-brand-orange text-white px-4 py-2 rounded-btn font-semibold text-sm hover:bg-brand-orange-dark transition-colors"
          >
            Changer statut
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Infos colis */}
        <div className="bg-brand-card border border-brand-border rounded-card p-5 space-y-4">
          <h2 className="text-white font-semibold text-sm uppercase tracking-wider">Informations colis</h2>
          <dl className="space-y-3">
            <Row label="Client" value={pkg.users ? `${pkg.users.first_name} ${pkg.users.last_name}` : '—'} />
            <Row label="Transport" value={pkg.transport_mode === 'air' ? 'Aérien' : 'Maritime'} />
            <Row label="Destination" value={`${pkg.destination_city}, ${pkg.destination_country === 'haiti' ? 'Haïti' : 'Rép. Dom.'}`} />
            <Row label="Adresse" value={pkg.destination_address} />
            <Row label="Poids réel" value={`${pkg.weight_real} lbs`} />
            <Row label="Poids facturé" value={`${pkg.weight_billed?.toFixed(2)} lbs`} />
            <Row label="Prix" value={`$${pkg.price?.toFixed(2)}`} valueClass="text-green-400 font-bold" />
            {pkg.declared_value && <Row label="Valeur déclarée" value={`$${pkg.declared_value}`} />}
            {pkg.insurance_amount > 0 && <Row label="Assurance" value={`$${pkg.insurance_amount}`} />}
          </dl>
        </div>

        {/* Paiements */}
        <div className="bg-brand-card border border-brand-border rounded-card p-5 space-y-4">
          <h2 className="text-white font-semibold text-sm uppercase tracking-wider">Paiements</h2>
          {pkg.payments?.length > 0 ? (
            <div className="space-y-2">
              {pkg.payments.map((p: { id: string; amount: number; status: string; method: string; transaction_number?: string }) => (
                <div key={p.id} className="bg-brand-bg rounded-input p-3 flex justify-between items-center">
                  <div>
                    <p className="text-white text-sm font-medium">${p.amount?.toFixed(2)}</p>
                    <p className="text-brand-gray text-xs capitalize">{p.method}</p>
                    {p.transaction_number && <p className="text-brand-gray text-xs">{p.transaction_number}</p>}
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${p.status === 'paid' ? 'bg-green-400/10 text-green-400' : 'bg-yellow-400/10 text-yellow-400'}`}>
                    {p.status === 'paid' ? 'Payé' : p.status === 'pending' ? 'En attente' : p.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-brand-gray text-sm">Aucun paiement enregistré.</p>
          )}
        </div>
      </div>

      {/* Historique statuts */}
      <div className="bg-brand-card border border-brand-border rounded-card p-5 space-y-4">
        <h2 className="text-white font-semibold text-sm uppercase tracking-wider">Historique</h2>
        {pkg.package_status_history?.length > 0 ? (
          <div className="space-y-3">
            {pkg.package_status_history.map((h: { id: string; status: PackageStatus; notes?: string; created_at: string; users?: { first_name: string; last_name: string } }) => (
              <div key={h.id} className="flex gap-4 items-start">
                <div className="mt-1 w-2 h-2 rounded-full bg-brand-orange flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white text-sm font-medium">{STATUS_LABELS[h.status]}</span>
                    {h.users && (
                      <span className="text-brand-gray text-xs">par {h.users.first_name} {h.users.last_name}</span>
                    )}
                    <span className="text-brand-gray text-xs ml-auto">
                      {new Date(h.created_at).toLocaleString('fr-FR')}
                    </span>
                  </div>
                  {h.notes && <p className="text-brand-gray text-sm mt-1">{h.notes}</p>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-brand-gray text-sm">Aucun historique.</p>
        )}
      </div>

      {/* Notes internes */}
      <div className="bg-brand-card border border-brand-border rounded-card p-5 space-y-4">
        <h2 className="text-white font-semibold text-sm uppercase tracking-wider">Notes internes</h2>
        {pkg.internal_notes && (
          <p className="text-brand-gray text-sm whitespace-pre-wrap">{pkg.internal_notes}</p>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Ajouter une note interne..."
            className="flex-1 bg-brand-bg border border-brand-border rounded-input px-3 py-2 text-sm text-white placeholder-brand-gray focus:outline-none focus:border-brand-orange"
          />
          <button
            onClick={handleAddNote}
            disabled={noteLoading || !noteText.trim()}
            className="bg-brand-orange text-white px-4 py-2 rounded-btn text-sm font-semibold hover:bg-brand-orange-dark transition-colors disabled:opacity-50"
          >
            {noteLoading ? '...' : 'Ajouter'}
          </button>
        </div>
      </div>

      {/* Modal changement de statut */}
      {statusModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setStatusModal(false)}>
          <div className="bg-brand-card border border-brand-border rounded-card p-6 w-full max-w-md mx-4 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-white font-semibold text-lg">Changer le statut</h2>

            <div className="space-y-2">
              {nextStatuses.map((s) => (
                <button
                  key={s}
                  onClick={() => setNewStatus(s)}
                  className={`w-full text-left px-4 py-3 rounded-input border transition-colors ${newStatus === s ? 'border-brand-orange bg-brand-orange/10 text-white' : 'border-brand-border bg-brand-bg text-brand-gray hover:border-brand-orange/50'}`}
                >
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>

            <textarea
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
              placeholder="Note (optionnelle)..."
              rows={3}
              className="w-full bg-brand-bg border border-brand-border rounded-input px-3 py-2 text-sm text-white placeholder-brand-gray focus:outline-none focus:border-brand-orange resize-none"
            />

            {statusError && (
              <p className="text-red-400 text-sm">{statusError}</p>
            )}

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setStatusModal(false)}
                className="px-4 py-2 text-brand-gray text-sm hover:text-white"
              >
                Annuler
              </button>
              <button
                onClick={handleStatusChange}
                disabled={statusLoading || !newStatus}
                className="bg-brand-orange text-white px-6 py-2 rounded-btn font-semibold text-sm hover:bg-brand-orange-dark transition-colors disabled:opacity-50"
              >
                {statusLoading ? 'Mise à jour...' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, valueClass = 'text-white' }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex justify-between items-start gap-4">
      <dt className="text-brand-gray text-sm flex-shrink-0">{label}</dt>
      <dd className={`text-sm text-right ${valueClass}`}>{value}</dd>
    </div>
  );
}
