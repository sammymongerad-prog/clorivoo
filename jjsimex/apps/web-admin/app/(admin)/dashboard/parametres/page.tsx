'use client';

import { useState, useEffect, useCallback } from 'react';
import { getShippingRates, updateShippingRate, getExchangeRates, updateExchangeRate } from '@jjsimex/supabase/shipping';
import type { ShippingRate, ExchangeRate } from '@jjsimex/supabase/shipping';
import { useAuth } from '@/contexts/AuthContext';

const TABS = ['Tarifs', 'Taux de change', 'Comptes employés', 'Général'] as const;
type Tab = (typeof TABS)[number];

const tabBtn = (active: boolean): React.CSSProperties => ({
  height: 38, padding: '0 18px', border: 'none', fontFamily: 'Sora, sans-serif', fontSize: 13,
  fontWeight: active ? 600 : 400, cursor: 'pointer', borderRadius: '8px 8px 0 0',
  background: active ? 'rgba(249,115,22,0.12)' : 'transparent',
  color: active ? '#F97316' : '#9CA3AF',
  borderBottom: active ? '2px solid #F97316' : '2px solid transparent',
});

const inputStyle: React.CSSProperties = {
  width: '100%', height: 44, background: '#141414', border: '1px solid #2A2A2A',
  borderRadius: 8, color: '#FFFFFF', padding: '0 14px', fontFamily: 'Sora, sans-serif',
  fontSize: 14, boxSizing: 'border-box', outline: 'none',
};

// ─── Onglet Tarifs ─────────────────────────────────────────────────────────────

function TarifsTab({ adminId }: { adminId: string }) {
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [editing, setEditing] = useState<Record<string, { air: string; sea: string }>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getShippingRates()
      .then(r => { setRates(r); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  function startEdit(r: ShippingRate) {
    setEditing(prev => ({
      ...prev,
      [r.id]: { air: String(r.air_rate_per_lb), sea: String(r.sea_rate_per_lb) },
    }));
  }

  async function saveRate(r: ShippingRate) {
    const e = editing[r.id];
    if (!e) return;
    setSaving(r.id);
    try {
      const updated = await updateShippingRate(
        r.id,
        { air_rate_per_lb: parseFloat(e.air), sea_rate_per_lb: parseFloat(e.sea) },
        adminId,
      );
      setRates(prev => prev.map(x => x.id === r.id ? updated : x));
      setEditing(prev => { const n = { ...prev }; delete n[r.id]; return n; });
      setSaved(r.id);
      setTimeout(() => setSaved(null), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(null);
    }
  }

  const haiti = rates.filter(r => r.destination_country === 'haiti');
  const dr = rates.filter(r => r.destination_country === 'dr');

  if (loading) return <div style={{ color: '#9CA3AF', textAlign: 'center', paddingTop: 60 }}>Chargement des tarifs…</div>;
  if (error) return <div style={{ color: '#EF4444', padding: 16 }}>Erreur : {error}</div>;

  function RateTable({ rows, title }: { rows: ShippingRate[]; title: string }) {
    return (
      <div style={{ background: '#1A1A1A', border: '1px solid #222', borderRadius: 16, padding: 20 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#FFFFFF', marginBottom: 16 }}>{title}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', gap: 0 }}>
          {['Ville', 'Avion / lb', 'Bateau / lb', ''].map(h => (
            <div key={h} style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '8px 12px', borderBottom: '1px solid #2A2A2A' }}>{h}</div>
          ))}
          {rows.map(r => {
            const isEdit = !!editing[r.id];
            const isSaving = saving === r.id;
            const isSaved = saved === r.id;
            return [
              <div key={`${r.id}-city`} style={{ padding: '12px', borderBottom: '1px solid #1F1F1F', display: 'flex', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: '#FFFFFF', fontWeight: 600 }}>{r.destination_city}</span>
                {!r.is_active && <span style={{ marginLeft: 8, background: 'rgba(239,68,68,0.14)', color: '#EF4444', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99 }}>Inactif</span>}
              </div>,
              <div key={`${r.id}-air`} style={{ padding: '10px 12px', borderBottom: '1px solid #1F1F1F', display: 'flex', alignItems: 'center' }}>
                {isEdit
                  ? <input style={inputStyle} type="number" step="0.5" min="0"
                      value={editing[r.id]?.air ?? ''} onChange={e => setEditing(p => ({ ...p, [r.id]: { ...p[r.id], air: e.target.value } }))} />
                  : <span style={{ fontSize: 14, fontWeight: 700, color: '#F97316' }}>${r.air_rate_per_lb}</span>
                }
              </div>,
              <div key={`${r.id}-sea`} style={{ padding: '10px 12px', borderBottom: '1px solid #1F1F1F', display: 'flex', alignItems: 'center' }}>
                {isEdit
                  ? <input style={inputStyle} type="number" step="0.5" min="0"
                      value={editing[r.id]?.sea ?? ''} onChange={e => setEditing(p => ({ ...p, [r.id]: { ...p[r.id], sea: e.target.value } }))} />
                  : <span style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF' }}>${r.sea_rate_per_lb}</span>
                }
              </div>,
              <div key={`${r.id}-action`} style={{ padding: '10px 12px', borderBottom: '1px solid #1F1F1F', display: 'flex', alignItems: 'center', gap: 8 }}>
                {isEdit ? (
                  <>
                    <button onClick={() => saveRate(r)} disabled={isSaving}
                      style={{ height: 32, padding: '0 12px', background: isSaved ? '#22C55E' : '#F97316', border: 'none', borderRadius: 7, color: '#0D0D0D', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                      {isSaving ? '…' : isSaved ? '✓' : 'Sauver'}
                    </button>
                    <button onClick={() => setEditing(p => { const n = { ...p }; delete n[r.id]; return n; })}
                      style={{ height: 32, padding: '0 10px', background: '#2A2A2A', border: 'none', borderRadius: 7, color: '#9CA3AF', fontSize: 12, cursor: 'pointer' }}>
                      ✕
                    </button>
                  </>
                ) : (
                  <button onClick={() => startEdit(r)}
                    style={{ height: 32, padding: '0 12px', background: '#2A2A2A', border: 'none', borderRadius: 7, color: '#FFFFFF', fontSize: 12, cursor: 'pointer' }}>
                    ✎ Modifier
                  </button>
                )}
              </div>,
            ];
          })}
        </div>
        <div style={{ marginTop: 14, padding: '10px 14px', background: '#141414', borderRadius: 10, fontSize: 12, color: '#6B7280' }}>
          ⚡ Les modifications sont répercutées immédiatement dans le calculateur client.
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
      <RateTable rows={haiti} title="🇭🇹 Tarifs Haïti" />
      <RateTable rows={dr} title="🇩🇴 Tarifs Rép. Dominicaine" />
    </div>
  );
}

// ─── Onglet Taux de change ─────────────────────────────────────────────────────

function TauxTab({ adminId }: { adminId: string }) {
  const [rates, setRates] = useState<ExchangeRate | null>(null);
  const [form, setForm] = useState({ usd_to_htg: '', usd_to_dop: '', eur_to_htg: '', cad_to_htg: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getExchangeRates()
      .then(r => {
        setRates(r);
        setForm({
          usd_to_htg: String(r.usd_to_htg),
          usd_to_dop: String(r.usd_to_dop),
          eur_to_htg: String(r.eur_to_htg),
          cad_to_htg: String(r.cad_to_htg),
        });
        setLoading(false);
      })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const updated = await updateExchangeRate({
        usd_to_htg: parseFloat(form.usd_to_htg),
        usd_to_dop: parseFloat(form.usd_to_dop),
        eur_to_htg: parseFloat(form.eur_to_htg),
        cad_to_htg: parseFloat(form.cad_to_htg),
      }, adminId);
      setRates(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div style={{ color: '#9CA3AF', textAlign: 'center', paddingTop: 60 }}>Chargement…</div>;

  return (
    <div style={{ maxWidth: 600 }}>
      <div style={{ background: '#1A1A1A', border: '1px solid #222', borderRadius: 16, padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#FFFFFF' }}>Taux de change</div>
          {rates && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: rates.is_auto ? '#22C55E' : '#F97316' }} />
              <span style={{ fontSize: 12, color: '#9CA3AF' }}>
                {rates.is_auto ? 'Automatique' : 'Manuel'} · Mis à jour {new Date(rates.updated_at).toLocaleDateString('fr-FR')}
              </span>
            </div>
          )}
        </div>

        {error && <div style={{ background: 'rgba(239,68,68,0.1)', borderRadius: 8, padding: '10px 14px', color: '#EF4444', fontSize: 13, marginBottom: 16 }}>{error}</div>}

        {[
          { key: 'usd_to_htg', label: '1 USD → HTG (Gourde haïtienne)', icon: '🇭🇹' },
          { key: 'usd_to_dop', label: '1 USD → DOP (Peso dominicain)', icon: '🇩🇴' },
          { key: 'eur_to_htg', label: '1 EUR → HTG', icon: '🇪🇺' },
          { key: 'cad_to_htg', label: '1 CAD → HTG', icon: '🇨🇦' },
        ].map(({ key, label, icon }) => (
          <div key={key} style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 6 }}>{icon} {label}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="number" step="0.5" min="0"
                style={{ ...inputStyle, flex: 1 }}
                value={form[key as keyof typeof form]}
                onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
              />
              {rates && (
                <div style={{ background: '#2A2A2A', borderRadius: 8, padding: '0 12px', height: 44, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 12, color: '#6B7280' }}>Actuel : </span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF', marginLeft: 4 }}>{(rates as any)[key]}</span>
                </div>
              )}
            </div>
          </div>
        ))}

        <button onClick={handleSave} disabled={saving}
          style={{ width: '100%', height: 46, background: saved ? '#22C55E' : '#F97316', border: 'none', borderRadius: 10, color: '#0D0D0D', fontFamily: 'Sora, sans-serif', fontSize: 14, fontWeight: 700, cursor: 'pointer', marginTop: 8 }}>
          {saving ? 'Sauvegarde…' : saved ? '✓ Taux mis à jour !' : 'Sauvegarder les taux'}
        </button>

        <div style={{ marginTop: 14, padding: '10px 14px', background: '#141414', borderRadius: 10, fontSize: 12, color: '#6B7280' }}>
          ⚡ La barre ticker de l'app client se met à jour en temps réel via Supabase Realtime.
        </div>
      </div>
    </div>
  );
}

// ─── Onglet Employés (placeholder) ────────────────────────────────────────────

function EmployesTab() {
  return (
    <div style={{ background: '#1A1A1A', border: '1px solid #222', borderRadius: 16, padding: 40, textAlign: 'center' }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>👥</div>
      <div style={{ fontSize: 15, fontWeight: 600, color: '#FFFFFF', marginBottom: 8 }}>Gestion des employés</div>
      <div style={{ fontSize: 13, color: '#6B7280' }}>4 comptes actifs — Super Admin requis pour modification</div>
    </div>
  );
}

// ─── Onglet Général (placeholder) ─────────────────────────────────────────────

function GeneralTab() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      {[['🏢', 'Informations société', 'Nom, adresse, SIRET'], ['📱', 'App mobile', 'Version, store links'], ['🔐', 'Sécurité', 'MFA, logs accès'], ['📧', 'Emails', 'Templates, SMTP']].map(([icon, title, sub]) => (
        <div key={title} style={{ background: '#1A1A1A', border: '1px solid #222', borderRadius: 14, padding: 20, cursor: 'pointer' }}>
          <div style={{ fontSize: 28, marginBottom: 10 }}>{icon}</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF' }}>{title}</div>
          <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>{sub}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Page principale ───────────────────────────────────────────────────────────

export default function ParametresPage() {
  const [tab, setTab] = useState<Tab>('Tarifs');
  const { profile } = useAuth();
  const adminId = profile?.id ?? '';

  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ height: 64, flexShrink: 0, background: '#0D0D0D', borderBottom: '1px solid #2A2A2A', display: 'flex', alignItems: 'center', gap: 14, padding: '0 24px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#FFFFFF', lineHeight: 1.1 }}>Paramètres</div>
          <div style={{ fontSize: 12, color: '#9CA3AF' }}>Configuration de la plateforme</div>
        </div>
        <button style={{ position: 'relative', width: 40, height: 40, borderRadius: 8, background: '#1A1A1A', border: '1px solid #2A2A2A', color: '#FFFFFF', cursor: 'pointer', fontSize: 18 }}>🔔</button>
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#F97316', color: '#0D0D0D', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>MJ</div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, padding: '14px 24px 0', borderBottom: '1px solid #2A2A2A', flexShrink: 0 }}>
        {TABS.map(t => <button key={t} onClick={() => setTab(t)} style={tabBtn(tab === t)}>{t}</button>)}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        {tab === 'Tarifs' && <TarifsTab adminId={adminId} />}
        {tab === 'Taux de change' && <TauxTab adminId={adminId} />}
        {tab === 'Comptes employés' && <EmployesTab />}
        {tab === 'Général' && <GeneralTab />}
      </div>
    </div>
  );
}
