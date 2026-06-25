'use client';

import { useState, useEffect, useCallback } from 'react';
import { sendBulkNotification } from '@jjsimex/supabase/push';
import { sendEmail } from '@jjsimex/emails';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

interface CampaignLog {
  id: string;
  title: string;
  message: string;
  target: string;
  channel: string;
  sent_count: number;
  created_at: string;
}

function statusStyle(status: string) {
  if (status === 'Actif')
    return { color: '#22C55E', bg: 'rgba(34,197,94,0.15)' };
  if (status === 'Planifié')
    return { color: '#F97316', bg: 'rgba(249,115,22,0.15)' };
  return { color: '#9CA3AF', bg: 'rgba(156,163,175,0.15)' };
}

interface PromoForm {
  title: string;
  subtitle: string;
  body: string;
  ctaText: string;
  ctaUrl: string;
  badge: string;
  highlight: string;
  target: 'all' | 'haiti' | 'dr';
  sendPush: boolean;
  sendEmailFlag: boolean;
}

const defaultForm: PromoForm = {
  title: '',
  subtitle: '',
  body: '',
  ctaText: 'En savoir plus',
  ctaUrl: 'https://jjsimex.com',
  badge: '',
  highlight: '',
  target: 'all',
  sendPush: true,
  sendEmailFlag: true,
};

const inputStyle: React.CSSProperties = {
  background: '#0D0D0D',
  border: '1px solid #2A2A2A',
  borderRadius: '8px',
  color: '#fff',
  padding: '10px 12px',
  fontSize: '13px',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
};

export default function MarketingPage() {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<PromoForm>(defaultForm);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent: number; failed: number } | null>(null);
  const [toast, setToast] = useState('');
  const [campaigns, setCampaigns] = useState<CampaignLog[]>([]);
  const [totalCampaigns, setTotalCampaigns] = useState(0);
  const [totalSent, setTotalSent] = useState(0);
  const [activeClients, setActiveClients] = useState(0);

  const loadCampaigns = useCallback(async () => {
    const { data } = await supabase
      .from('bulk_notifications_log')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) {
      setCampaigns(data);
      setTotalCampaigns(data.length);
      setTotalSent(data.reduce((sum, c) => sum + (c.sent_count || 0), 0));
    }
  }, []);

  const loadActiveClients = useCallback(async () => {
    const { count } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true)
      .eq('role', 'client');
    if (count !== null) setActiveClients(count);
  }, []);

  useEffect(() => { loadCampaigns(); loadActiveClients(); }, [loadCampaigns, loadActiveClients]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  async function handleSendPromo() {
    if (!form.title || !form.body) return;
    setSending(true);
    setResult(null);

    try {
      let pushResult = { sent: 0, failed: 0 };

      // Push notifications
      if (form.sendPush) {
        const { sendBulkNotification } = await import('@jjsimex/supabase/push');
        pushResult = await sendBulkNotification(
          form.title,
          form.body,
          form.target as 'haiti' | 'dr' | 'all',
          { screen: 'dashboard' },
        );
      }

      // Emails
      if (form.sendEmailFlag) {
        let query = supabase
          .from('users')
          .select('email, first_name, is_active')
          .eq('is_active', true)
          .eq('role', 'client');

        if (form.target !== 'all') {
          query = query.eq('destination_country', form.target) as typeof query;
        }

        const { data: users } = await query;

        if (users) {
          await Promise.allSettled(
            users.map((u) =>
              sendEmail('promo_marketing', u.email, {
                title: form.title,
                subtitle: form.subtitle || undefined,
                body: form.body,
                ctaText: form.ctaText,
                ctaUrl: form.ctaUrl,
                badge: form.badge || undefined,
                highlight: form.highlight || undefined,
              }),
            ),
          );
        }
      }

      // Persist to bulk_notifications_log
      const { data: me } = await supabase.auth.getUser();
      await supabase.from('bulk_notifications_log').insert({
        title: form.title,
        message: form.body,
        target: form.target,
        channel: [form.sendPush && 'push', form.sendEmailFlag && 'email'].filter(Boolean).join('+'),
        sent_count: pushResult.sent,
        created_by: me?.user?.id ?? null,
      });

      setResult(pushResult);
      setShowModal(false);
      setForm(defaultForm);
      await loadCampaigns();
      showToast(`Campagne envoyée ! Push: ${pushResult.sent} reçus`);
    } catch (err) {
      console.error(err);
      showToast('Erreur lors de l\'envoi de la campagne.');
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      style={{
        backgroundColor: '#0D0D0D',
        minHeight: '100vh',
        padding: '32px',
        color: '#fff',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '32px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: '700', margin: '0 0 4px 0' }}>
            Marketing
          </h1>
          <p style={{ color: '#9CA3AF', margin: 0, fontSize: '14px' }}>
            Promos, notifications et engagement
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{
            backgroundColor: '#F97316',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
          }}
        >
          + Nouvelle campagne
        </button>
      </div>

      {/* ── Stats Row ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
          marginBottom: '32px',
        }}
      >
        {[
          { label: 'Campagnes envoyées', value: totalCampaigns.toLocaleString() },
          { label: 'Clients actifs', value: activeClients.toLocaleString() },
          { label: 'Messages envoyés', value: totalSent.toLocaleString() },
          { label: 'Parrainages ce mois', value: '—' },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              backgroundColor: '#1A1A1A',
              border: '1px solid #222222',
              borderRadius: '12px',
              padding: '20px',
            }}
          >
            <p style={{ color: '#9CA3AF', fontSize: '13px', margin: '0 0 8px 0' }}>
              {stat.label}
            </p>
            <p style={{ fontSize: '28px', fontWeight: '700', margin: 0 }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* ── 2-Column Layout ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '60% 40%', gap: '24px' }}>
        {/* Left — Campaigns */}
        <div>
          <h2 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 16px 0' }}>
            Campagnes actives
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {campaigns.length === 0 && (
              <p style={{ color: '#9CA3AF', fontSize: '14px' }}>Aucune campagne envoyée pour le moment.</p>
            )}
            {campaigns.map((c) => {
              const channelColor = c.channel.includes('push') ? '#F97316' : '#60A5FA';
              const channelBg = c.channel.includes('push') ? 'rgba(249,115,22,0.15)' : 'rgba(96,165,250,0.15)';
              const targetLabel = c.target === 'all' ? 'Tous' : c.target === 'haiti' ? 'Haiti' : 'RD';
              const dateStr = new Date(c.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
              return (
                <div
                  key={c.id}
                  style={{
                    backgroundColor: '#1A1A1A',
                    border: '1px solid #222222',
                    borderRadius: '12px',
                    padding: '20px',
                  }}
                >
                  {/* Top row */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <p style={{ fontWeight: '700', fontSize: '15px', margin: 0 }}>
                        {c.title}
                      </p>
                      <span
                        style={{
                          backgroundColor: channelBg,
                          color: channelColor,
                          padding: '2px 8px',
                          borderRadius: '999px',
                          fontSize: '11px',
                          fontWeight: '600',
                        }}
                      >
                        {c.channel}
                      </span>
                    </div>
                    <span
                      style={{
                        backgroundColor: 'rgba(156,163,175,0.15)',
                        color: '#9CA3AF',
                        padding: '3px 10px',
                        borderRadius: '999px',
                        fontSize: '12px',
                        fontWeight: '600',
                      }}
                    >
                      {targetLabel}
                    </span>
                  </div>

                  {/* Message preview */}
                  <p style={{ color: '#9CA3AF', fontSize: '13px', margin: '0 0 12px 0', lineHeight: '1.4' }}>
                    {c.message.length > 120 ? c.message.slice(0, 120) + '...' : c.message}
                  </p>

                  {/* Counts */}
                  <div
                    style={{
                      display: 'flex',
                      gap: '24px',
                      marginBottom: '12px',
                    }}
                  >
                    <div>
                      <p style={{ color: '#9CA3AF', fontSize: '12px', margin: '0 0 2px 0' }}>
                        Messages envoyés
                      </p>
                      <p style={{ fontWeight: '600', fontSize: '15px', margin: 0 }}>
                        {c.sent_count.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Date */}
                  <p style={{ color: '#9CA3AF', fontSize: '12px', margin: 0 }}>
                    {dateStr}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right — Parrainage + Notifications */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Parrainage Card */}
          <div
            style={{
              backgroundColor: '#1A1A1A',
              border: '1px solid #222222',
              borderRadius: '12px',
              padding: '20px',
            }}
          >
            <h2 style={{ fontSize: '15px', fontWeight: '600', margin: '0 0 16px 0' }}>
              Programme de parrainage
            </h2>

            <p style={{ color: '#9CA3AF', fontSize: '13px', margin: 0, lineHeight: '1.5' }}>
              Aucune donnée pour le moment. Le programme de parrainage n'est pas encore connecté.
            </p>
          </div>

          {/* Scheduled Notifications */}
          <div
            style={{
              backgroundColor: '#1A1A1A',
              border: '1px solid #222222',
              borderRadius: '12px',
              padding: '20px',
            }}
          >
            <h2 style={{ fontSize: '15px', fontWeight: '600', margin: '0 0 16px 0' }}>
              Notifications programmées
            </h2>
            <p style={{ color: '#9CA3AF', fontSize: '13px', margin: 0, lineHeight: '1.5' }}>
              Aucune notification programmée pour le moment.
            </p>
          </div>
        </div>
      </div>

      {/* ── Toast ── */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '32px', left: '50%', transform: 'translateX(-50%)',
          backgroundColor: '#14532D', border: '1px solid #22C55E',
          borderRadius: '999px', padding: '12px 24px',
          color: '#FFFFFF', fontSize: '14px', fontWeight: '600', zIndex: 9999,
        }}>
          {toast}
        </div>
      )}

      {/* ── Nouvelle campagne modal ── */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '20px',
        }}>
          <div style={{
            backgroundColor: '#111111', border: '1px solid #2A2A2A',
            borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '560px',
            maxHeight: '90vh', overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>Nouvelle campagne</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: '#9CA3AF', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ color: '#9CA3AF', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Titre *
                </label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Ex: Promo vol juin -10%" style={inputStyle} />
              </div>

              <div>
                <label style={{ color: '#9CA3AF', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Sous-titre
                </label>
                <input value={form.subtitle} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))}
                  placeholder="Ex: Offre limitée" style={inputStyle} />
              </div>

              <div>
                <label style={{ color: '#9CA3AF', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Message *
                </label>
                <textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                  placeholder="Contenu de la campagne..." rows={4}
                  style={{ ...inputStyle, resize: 'vertical' }} />
              </div>

              <div>
                <label style={{ color: '#9CA3AF', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Chiffre mis en avant (optionnel)
                </label>
                <input value={form.highlight} onChange={e => setForm(f => ({ ...f, highlight: e.target.value }))}
                  placeholder="Ex: -10% SUR TOUS LES ENVOIS" style={inputStyle} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ color: '#9CA3AF', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Texte bouton
                  </label>
                  <input value={form.ctaText} onChange={e => setForm(f => ({ ...f, ctaText: e.target.value }))}
                    style={inputStyle} />
                </div>
                <div>
                  <label style={{ color: '#9CA3AF', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    URL bouton
                  </label>
                  <input value={form.ctaUrl} onChange={e => setForm(f => ({ ...f, ctaUrl: e.target.value }))}
                    style={inputStyle} />
                </div>
              </div>

              <div>
                <label style={{ color: '#9CA3AF', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Cible
                </label>
                <select value={form.target} onChange={e => setForm(f => ({ ...f, target: e.target.value as PromoForm['target'] }))}
                  style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="all">Tous les clients</option>
                  <option value="haiti">Haïti seulement</option>
                  <option value="dr">République Dominicaine seulement</option>
                </select>
              </div>

              <div style={{ backgroundColor: '#1A1A1A', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label style={{ color: '#9CA3AF', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Canaux d'envoi
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: '#FFFFFF', fontSize: '14px' }}>
                  <input type="checkbox" checked={form.sendPush} onChange={e => setForm(f => ({ ...f, sendPush: e.target.checked }))} />
                  🔔 Notifications push
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: '#FFFFFF', fontSize: '14px' }}>
                  <input type="checkbox" checked={form.sendEmailFlag} onChange={e => setForm(f => ({ ...f, sendEmailFlag: e.target.checked }))} />
                  ✉️ Emails
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button onClick={() => setShowModal(false)} style={{ flex: 1, height: '46px', backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '10px', color: '#FFFFFF', fontSize: '14px', cursor: 'pointer', fontWeight: '600' }}>
                Annuler
              </button>
              <button
                onClick={handleSendPromo}
                disabled={sending || !form.title || !form.body}
                style={{ flex: 1.5, height: '46px', backgroundColor: sending ? '#666' : '#F97316', border: 'none', borderRadius: '10px', color: '#FFFFFF', fontSize: '14px', fontWeight: '700', cursor: sending ? 'not-allowed' : 'pointer' }}
              >
                {sending ? 'Envoi en cours...' : '🚀 Envoyer la campagne'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
