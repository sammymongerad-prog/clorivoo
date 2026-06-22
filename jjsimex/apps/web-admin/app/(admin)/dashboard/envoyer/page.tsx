'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { StatusBadge } from '@/components/ui/StatusBadge';

const CATEGORIES: Record<string, { label: string; icon: string }> = {
  telephone: { label: 'Téléphone', icon: '📱' },
  ordinateur: { label: 'Ordinateur', icon: '💻' },
  vetements: { label: 'Vêtements', icon: '👕' },
  chaussures: { label: 'Chaussures', icon: '👟' },
  electronique: { label: 'Électronique', icon: '🔌' },
  maison: { label: 'Maison', icon: '🏠' },
  cosmetiques: { label: 'Cosmétiques', icon: '💄' },
  autre: { label: 'Autre', icon: '📦' },
};

type Tab = 'awaiting' | 'tracking_added' | 'all';

interface Shipment {
  id: string;
  request_number: string;
  tracking_number: string | null;
  category: string | null;
  description: string | null;
  real_weight_lbs: number;
  billed_weight_lbs: number;
  declared_value: number;
  quantity: number;
  destination_city: string;
  destination_country: string;
  transport_mode: string;
  total_price: number;
  shipping_rate: number;
  insurance_amount: number;
  status: string;
  carrier_name: string | null;
  carrier_tracking_number: string | null;
  client_photo_1_url: string | null;
  client_photo_2_url: string | null;
  recipient_first_name: string | null;
  recipient_last_name: string | null;
  recipient_phone: string | null;
  recipient_address: string | null;
  created_at: string;
  users: { full_name: string; phone_whatsapp: string | null; email: string } | null;
}

interface ReceiveModalState {
  shipment: Shipment | null;
  realWeight: string;
  photos: { front: File | null; back: File | null; left: File | null; right: File | null };
  previews: { front: string | null; back: string | null; left: string | null; right: string | null };
  submitting: boolean;
}

export default function EnvoyerPage() {
  const supabase = createClient();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('awaiting');
  const [modal, setModal] = useState<ReceiveModalState>({
    shipment: null, realWeight: '', photos: { front: null, back: null, left: null, right: null },
    previews: { front: null, back: null, left: null, right: null }, submitting: false,
  });
  const [lightbox, setLightbox] = useState<string | null>(null);

  const loadShipments = useCallback(async () => {
    const { data } = await supabase
      .from('packages')
      .select('id, request_number, tracking_number, category, description, real_weight_lbs, billed_weight_lbs, declared_value, quantity, destination_city, destination_country, transport_mode, total_price, shipping_rate, insurance_amount, status, carrier_name, carrier_tracking_number, client_photo_1_url, client_photo_2_url, recipient_first_name, recipient_last_name, recipient_phone, recipient_address, created_at, users!packages_client_id_fkey(full_name, phone_whatsapp, email)')
      .not('request_number', 'is', null)
      .order('created_at', { ascending: false });
    setShipments((data ?? []) as Shipment[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadShipments();
    const ch = supabase.channel('envoyer-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'packages' }, () => loadShipments())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [loadShipments]);

  const filtered = shipments.filter(s => {
    if (tab === 'awaiting') return s.status === 'awaiting_arrival' && !s.carrier_tracking_number;
    if (tab === 'tracking_added') return s.status === 'awaiting_arrival' && !!s.carrier_tracking_number;
    return true;
  });

  const countAwaiting = shipments.filter(s => s.status === 'awaiting_arrival').length;
  const countNoTracking = shipments.filter(s => s.status === 'awaiting_arrival' && !s.carrier_tracking_number).length;
  const countWithTracking = shipments.filter(s => s.status === 'awaiting_arrival' && !!s.carrier_tracking_number).length;

  const openReceiveModal = (s: Shipment) => {
    setModal({
      shipment: s, realWeight: String(s.real_weight_lbs || s.billed_weight_lbs || ''),
      photos: { front: null, back: null, left: null, right: null },
      previews: { front: null, back: null, left: null, right: null }, submitting: false,
    });
  };

  const setModalPhoto = (side: 'front' | 'back' | 'left' | 'right', file: File | null) => {
    setModal(m => {
      const photos = { ...m.photos, [side]: file };
      const previews = { ...m.previews };
      if (file) {
        const reader = new FileReader();
        reader.onload = e => setModal(mm => ({ ...mm, previews: { ...mm.previews, [side]: e.target?.result as string } }));
        reader.readAsDataURL(file);
      } else {
        previews[side] = null;
      }
      return { ...m, photos, previews };
    });
  };

  const uploadPhoto = async (file: File, prefix: string): Promise<string | null> => {
    const ext = file.name.split('.').pop();
    const path = `admin-${prefix}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('shipment-photos').upload(path, file);
    if (error) return null;
    return supabase.storage.from('shipment-photos').getPublicUrl(path).data.publicUrl;
  };

  const handleReceiveFixed = async () => {
    if (!modal.shipment) return;
    setModal(m => ({ ...m, submitting: true }));

    const urls: Record<string, string | null> = { front: null, back: null, left: null, right: null };
    for (const side of ['front', 'back', 'left', 'right'] as const) {
      if (modal.photos[side]) urls[side] = await uploadPhoto(modal.photos[side]!, side);
    }

    const weight = parseFloat(modal.realWeight) || modal.shipment.billed_weight_lbs;

    // Get client_id
    const { data: pkgData } = await supabase.from('packages').select('client_id').eq('id', modal.shipment.id).single();

    const { error } = await supabase.from('packages').update({
      status: 'received_usa',
      real_weight_lbs: weight,
      billed_weight_lbs: weight,
      admin_photo_front_url: urls.front,
      admin_photo_back_url: urls.back,
      admin_photo_left_url: urls.left,
      admin_photo_right_url: urls.right,
    }).eq('id', modal.shipment.id);

    if (!error && pkgData) {
      await supabase.from('notifications').insert({
        user_id: pkgData.client_id,
        title: 'Colis reçu à Miami !',
        message: `Votre colis ${modal.shipment.request_number} a été reçu dans notre entrepôt. Poids vérifié: ${weight} lbs.`,
        type: 'package',
      });

      setModal({ shipment: null, realWeight: '', photos: { front: null, back: null, left: null, right: null }, previews: { front: null, back: null, left: null, right: null }, submitting: false });
      loadShipments();
    } else {
      setModal(m => ({ ...m, submitting: false }));
    }
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: '#FFFFFF', margin: 0 }}>Demandes d&apos;envoi</h1>

      {/* Stats pills */}
      <div style={{ display: 'flex', gap: 10 }}>
        <Pill label="Total en attente" value={countAwaiting} color="#F97316" />
        <Pill label="Sans tracking" value={countNoTracking} color="#EF4444" />
        <Pill label="Tracking ajouté" value={countWithTracking} color="#22C55E" />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, background: '#111', border: '1px solid #2A2A2A', borderRadius: 10, padding: 4, width: 'fit-content' }}>
        {([
          { key: 'awaiting' as Tab, label: 'En attente de réception', count: countNoTracking },
          { key: 'tracking_added' as Tab, label: 'Tracking ajouté', count: countWithTracking },
          { key: 'all' as Tab, label: 'Toutes', count: shipments.length },
        ]).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{
              background: tab === t.key ? '#2A2A2A' : 'none', border: 'none', borderRadius: 6,
              padding: '8px 16px', color: tab === t.key ? '#FFFFFF' : '#6B7280',
              fontFamily: 'inherit', fontSize: 13, fontWeight: 500, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
            {t.label}
            <span style={{ background: tab === t.key ? '#F97316' : '#2A2A2A', color: tab === t.key ? '#0D0D0D' : '#6B7280', fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 99 }}>{t.count}</span>
          </button>
        ))}
      </div>

      {/* Shipment cards */}
      {loading ? (
        <div style={{ textAlign: 'center', color: '#6B7280', padding: 40 }}>Chargement...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#6B7280', padding: 40, fontSize: 14 }}>Aucune demande dans cette catégorie</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(s => (
            <ShipmentCard key={s.id} s={s} onReceive={() => openReceiveModal(s)} onImageClick={setLightbox} />
          ))}
        </div>
      )}

      {/* Receive modal */}
      {modal.shipment && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={() => !modal.submitting && setModal(m => ({ ...m, shipment: null }))}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 16, padding: 24, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#FFFFFF', marginBottom: 4 }}>Marquer comme reçu</div>
            <div style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 20 }}>Demande {modal.shipment.request_number} — {modal.shipment.users?.full_name}</div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, color: '#9CA3AF', marginBottom: 4 }}>Poids réel vérifié (lbs)</label>
              <input type="number" value={modal.realWeight} onChange={e => setModal(m => ({ ...m, realWeight: e.target.value }))}
                style={{ width: '100%', boxSizing: 'border-box', background: '#0D0D0D', border: '1px solid #2A2A2A', borderRadius: 8, color: '#FFFFFF', padding: '10px 12px', fontSize: 14, fontFamily: 'inherit', outline: 'none' }} />
            </div>

            <div style={{ fontSize: 14, fontWeight: 600, color: '#FFFFFF', marginBottom: 10 }}>Photos admin (4 angles)</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 20 }}>
              {(['front', 'back', 'left', 'right'] as const).map(side => (
                <div key={side} style={{ border: '1px dashed #2A2A2A', borderRadius: 10, padding: 12, textAlign: 'center', position: 'relative' }}>
                  {modal.previews[side] ? (
                    <>
                      <img src={modal.previews[side]!} alt={side} style={{ width: '100%', height: 80, objectFit: 'cover', borderRadius: 6 }} />
                      <button onClick={() => setModalPhoto(side, null)} style={{ position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: '50%', background: '#EF4444', border: 'none', color: '#FFF', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>✕</button>
                    </>
                  ) : (
                    <label style={{ cursor: 'pointer' }}>
                      <div style={{ fontSize: 11, color: '#6B7280', textTransform: 'capitalize', marginBottom: 4 }}>{side === 'front' ? 'Face' : side === 'back' ? 'Dos' : side === 'left' ? 'Gauche' : 'Droite'}</div>
                      <div style={{ display: 'inline-block', padding: '6px 12px', background: '#2A2A2A', borderRadius: 6, color: '#FFFFFF', fontSize: 11, fontWeight: 600 }}>📷 Choisir</div>
                      <input type="file" accept="image/*" onChange={e => { if (e.target.files?.[0]) setModalPhoto(side, e.target.files[0]); }} style={{ display: 'none' }} />
                    </label>
                  )}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setModal(m => ({ ...m, shipment: null }))} disabled={modal.submitting}
                style={{ flex: 1, padding: 12, background: '#2A2A2A', border: 'none', borderRadius: 10, color: '#9CA3AF', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Annuler</button>
              <button onClick={handleReceiveFixed} disabled={modal.submitting || !modal.realWeight}
                style={{ flex: 2, padding: 12, background: '#F97316', border: 'none', borderRadius: 10, color: '#0D0D0D', fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: modal.submitting ? 0.6 : 1 }}>
                {modal.submitting ? 'Traitement...' : 'Confirmer la réception'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image lightbox */}
      {lightbox && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1001, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="Photo" style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 8 }} />
        </div>
      )}
    </div>
  );
}

function Pill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#1A1A1A', border: '1px solid #222', borderRadius: 10, padding: '8px 14px' }}>
      <span style={{ fontSize: 20, fontWeight: 800, color }}>{value}</span>
      <span style={{ fontSize: 12, color: '#9CA3AF' }}>{label}</span>
    </div>
  );
}

function ShipmentCard({ s, onReceive, onImageClick }: { s: Shipment; onReceive: () => void; onImageClick: (url: string) => void }) {
  const cat = CATEGORIES[s.category ?? ''] ?? { label: s.category ?? '—', icon: '📦' };
  const hasTracking = !!s.carrier_tracking_number;
  const clientPhone = s.users?.phone_whatsapp?.replace(/\D/g, '');

  return (
    <div style={{ background: '#1A1A1A', border: '1px solid #222', borderRadius: 12, padding: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: '50%', background: '#F97316', color: '#0D0D0D', fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {(s.users?.full_name ?? '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF' }}>{s.users?.full_name ?? '—'}</div>
            <div style={{ fontSize: 12, color: '#9CA3AF' }}>{s.users?.phone_whatsapp ?? s.users?.email ?? '—'}</div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#F97316' }}>{s.request_number}</div>
          <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{new Date(s.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
        </div>
      </div>

      {/* Info grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 14 }}>
        <InfoCell label="Catégorie" value={`${cat.icon} ${cat.label}`} />
        <InfoCell label="Poids estimé" value={`${s.billed_weight_lbs} lbs`} />
        <InfoCell label="Valeur déclarée" value={`$${s.declared_value}`} />
        <InfoCell label="Quantité" value={String(s.quantity ?? 1)} />
        <InfoCell label="Transport" value={s.transport_mode === 'air' ? '✈ Avion' : '🚢 Bateau'} />
        <InfoCell label="Prix estimé" value={`$${Number(s.total_price).toFixed(2)}`} accent />
      </div>

      {/* Description */}
      {s.description && (
        <div style={{ fontSize: 13, color: '#E5E7EB', background: '#111', borderRadius: 8, padding: '10px 12px', marginBottom: 12 }}>
          {s.description}
        </div>
      )}

      {/* Client photos */}
      {(s.client_photo_1_url || s.client_photo_2_url) && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {s.client_photo_1_url && (
            <img src={s.client_photo_1_url} alt="Photo client 1" onClick={() => onImageClick(s.client_photo_1_url!)}
              style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8, border: '1px solid #2A2A2A', cursor: 'pointer' }} />
          )}
          {s.client_photo_2_url && (
            <img src={s.client_photo_2_url} alt="Photo client 2" onClick={() => onImageClick(s.client_photo_2_url!)}
              style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8, border: '1px solid #2A2A2A', cursor: 'pointer' }} />
          )}
        </div>
      )}

      {/* Recipient */}
      {s.recipient_first_name && (
        <div style={{ background: '#111', borderRadius: 8, padding: '10px 12px', marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Destinataire</div>
          <div style={{ fontSize: 13, color: '#FFFFFF' }}>{s.recipient_first_name} {s.recipient_last_name}</div>
          <div style={{ fontSize: 12, color: '#9CA3AF' }}>
            {s.recipient_phone && `${s.recipient_phone} · `}{s.destination_city}, {s.destination_country === 'haiti' ? 'Haïti' : 'Rép. Dom.'}
          </div>
          {s.recipient_address && <div style={{ fontSize: 12, color: '#9CA3AF' }}>{s.recipient_address}</div>}
        </div>
      )}

      {/* Tracking status */}
      <div style={{ background: '#111', borderRadius: 8, padding: '10px 12px', marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 11, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Tracking transporteur US</div>
          {hasTracking ? (
            <div style={{ fontSize: 13, color: '#FFFFFF' }}>
              {s.carrier_name && <span style={{ color: '#9CA3AF' }}>{s.carrier_name} · </span>}
              <span style={{ fontWeight: 600 }}>{s.carrier_tracking_number}</span>
            </div>
          ) : (
            <div style={{ fontSize: 12, color: '#F97316', fontWeight: 600 }}>En attente du tracking client</div>
          )}
        </div>
        <StatusBadge status={s.status} />
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8 }}>
        {clientPhone && (
          <a href={`https://wa.me/${clientPhone}`} target="_blank" rel="noopener noreferrer"
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 10, background: '#25D366', border: 'none', borderRadius: 8, color: '#FFFFFF', fontSize: 13, fontWeight: 600, textDecoration: 'none', cursor: 'pointer' }}>
            💬 Contacter
          </a>
        )}
        {s.status === 'awaiting_arrival' && (
          <button onClick={onReceive}
            style={{ flex: 2, padding: 10, background: '#F97316', border: 'none', borderRadius: 8, color: '#0D0D0D', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            📦 Marquer comme reçu
          </button>
        )}
      </div>
    </div>
  );
}

function InfoCell({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div style={{ background: '#111', borderRadius: 8, padding: '8px 10px' }}>
      <div style={{ fontSize: 10, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: accent ? 700 : 500, color: accent ? '#F97316' : '#FFFFFF' }}>{value}</div>
    </div>
  );
}
