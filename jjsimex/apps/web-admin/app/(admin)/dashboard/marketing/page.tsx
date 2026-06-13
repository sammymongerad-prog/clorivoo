'use client';

import { useState } from 'react';
import { sendBulkNotification } from '@jjsimex/supabase/push';
import { sendEmail } from '@jjsimex/emails';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

const campaigns = [
  {
    id: 1,
    name: 'Promo Vol juin -10%',
    type: 'WhatsApp',
    typeColor: '#22C55E',
    typeBg: 'rgba(34,197,94,0.15)',
    targets: 3200,
    sent: 3200,
    openRate: 72,
    startDate: '01 juin 2026',
    endDate: '30 juin 2026',
    status: 'Actif',
  },
  {
    id: 2,
    name: 'Rappel colis en attente',
    type: 'Push',
    typeColor: '#F97316',
    typeBg: 'rgba(249,115,22,0.15)',
    targets: 1850,
    sent: 1240,
    openRate: 58,
    startDate: '10 juin 2026',
    endDate: '20 juin 2026',
    status: 'Planifié',
  },
  {
    id: 3,
    name: 'Bienvenue nouveaux clients',
    type: 'Email',
    typeColor: '#60A5FA',
    typeBg: 'rgba(96,165,250,0.15)',
    targets: 3400,
    sent: 3400,
    openRate: 81,
    startDate: '01 mai 2026',
    endDate: '31 mai 2026',
    status: 'Terminé',
  },
];

const topReferrers = [
  { initials: 'JM', name: 'Jean-Marie L.', count: 12, color: '#F97316' },
  { initials: 'CB', name: 'Claudette B.', count: 9, color: '#60A5FA' },
  { initials: 'RF', name: 'Réginald F.', count: 7, color: '#22C55E' },
];

const scheduledNotifs = [
  {
    time: 'Demain, 09h00',
    message: 'Votre colis JJS-4821 est prêt à être retiré à Miami.',
  },
  {
    time: 'Jeu 19 juin, 14h00',
    message: 'Prochain départ avion: 25 juin. Déposez vos colis avant le 22.',
  },
  {
    time: 'Ven 20 juin, 10h00',
    message: 'Offre spéciale: -5% sur tout envoi bateau ce weekend!',
  },
];

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

      setResult(pushResult);
      setShowModal(false);
      setForm(defaultForm);
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
          { label: 'Campagnes actives', value: '3' },
          { label: 'Clients ciblés', value: '8,450' },
          { label: 'Taux ouverture', value: '68%' },
          { label: 'Parrainages ce mois', value: '47' },
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
            {campaigns.map((c) => {
              const s = statusStyle(c.status);
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
                        {c.name}
                      </p>
                      <span
                        style={{
                          backgroundColor: c.typeBg,
                          color: c.typeColor,
                          padding: '2px 8px',
                          borderRadius: '999px',
                          fontSize: '11px',
                          fontWeight: '600',
                        }}
                      >
                        {c.type}
                      </span>
                    </div>
                    <span
                      style={{
                        backgroundColor: s.bg,
                        color: s.color,
                        padding: '3px 10px',
                        borderRadius: '999px',
                        fontSize: '12px',
                        fontWeight: '600',
                      }}
                    >
                      {c.status}
                    </span>
                  </div>

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
                        Clients ciblés
                      </p>
                      <p style={{ fontWeight: '600', fontSize: '15px', margin: 0 }}>
                        {c.targets.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p style={{ color: '#9CA3AF', fontSize: '12px', margin: '0 0 2px 0' }}>
                        Messages envoyés
                      </p>
                      <p style={{ fontWeight: '600', fontSize: '15px', margin: 0 }}>
                        {c.sent.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p style={{ color: '#9CA3AF', fontSize: '12px', margin: '0 0 2px 0' }}>
                        Taux d'ouverture
                      </p>
                      <p style={{ fontWeight: '600', fontSize: '15px', margin: 0 }}>
                        {c.openRate}%
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div style={{ marginBottom: '12px' }}>
                    <div
                      style={{
                        height: '6px',
                        backgroundColor: '#2A2A2A',
                        borderRadius: '999px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${c.openRate}%`,
                          backgroundColor: '#F97316',
                          borderRadius: '999px',
                          transition: 'width 0.4s',
                        }}
                      />
                    </div>
                  </div>

                  {/* Dates */}
                  <p style={{ color: '#9CA3AF', fontSize: '12px', margin: '0 0 14px 0' }}>
                    📅 {c.startDate} → {c.endDate}
                  </p>

                  {/* Buttons */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      style={{
                        flex: 1,
                        backgroundColor: 'transparent',
                        border: '1px solid #F97316',
                        color: '#F97316',
                        borderRadius: '6px',
                        padding: '7px',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: 'pointer',
                      }}
                    >
                      Voir rapport
                    </button>
                    <button
                      style={{
                        flex: 1,
                        backgroundColor: '#2A2A2A',
                        border: '1px solid #2A2A2A',
                        color: '#fff',
                        borderRadius: '6px',
                        padding: '7px',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: 'pointer',
                      }}
                    >
                      Modifier
                    </button>
                  </div>
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

            {/* Stats */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px',
                marginBottom: '20px',
              }}
            >
              {[
                { label: 'Parrainages', value: '47' },
                { label: 'Générés', value: '$235' },
                { label: 'Conversion', value: '89%' },
              ].map((s) => (
                <div
                  key={s.label}
                  style={{
                    backgroundColor: '#0D0D0D',
                    borderRadius: '8px',
                    padding: '10px',
                    textAlign: 'center',
                  }}
                >
                  <p style={{ fontWeight: '700', fontSize: '18px', margin: '0 0 2px 0' }}>
                    {s.value}
                  </p>
                  <p style={{ color: '#9CA3AF', fontSize: '11px', margin: 0 }}>
                    {s.label}
                  </p>
                </div>
              ))}
            </div>

            {/* Leaderboard */}
            <p style={{ color: '#9CA3AF', fontSize: '12px', margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Top parrains
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {topReferrers.map((r, i) => (
                <div
                  key={r.name}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <span
                    style={{
                      color: '#9CA3AF',
                      fontSize: '13px',
                      width: '16px',
                      textAlign: 'center',
                    }}
                  >
                    {i + 1}
                  </span>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: r.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: '700',
                      color: '#fff',
                      flexShrink: 0,
                    }}
                  >
                    {r.initials}
                  </div>
                  <span style={{ fontSize: '14px', flex: 1 }}>{r.name}</span>
                  <span
                    style={{
                      backgroundColor: 'rgba(249,115,22,0.15)',
                      color: '#F97316',
                      padding: '2px 8px',
                      borderRadius: '999px',
                      fontSize: '12px',
                      fontWeight: '600',
                    }}
                  >
                    {r.count} refs
                  </span>
                </div>
              ))}
            </div>
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {scheduledNotifs.map((n, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    backgroundColor: '#0D0D0D',
                    borderRadius: '8px',
                    padding: '12px',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <p
                      style={{
                        color: '#F97316',
                        fontSize: '12px',
                        fontWeight: '600',
                        margin: '0 0 4px 0',
                      }}
                    >
                      🕐 {n.time}
                    </p>
                    <p style={{ color: '#9CA3AF', fontSize: '13px', margin: 0, lineHeight: '1.4' }}>
                      {n.message}
                    </p>
                  </div>
                  <button
                    style={{
                      backgroundColor: 'transparent',
                      border: '1px solid #EF4444',
                      color: '#EF4444',
                      borderRadius: '6px',
                      padding: '4px 10px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
                  >
                    Annuler
                  </button>
                </div>
              ))}
            </div>
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
