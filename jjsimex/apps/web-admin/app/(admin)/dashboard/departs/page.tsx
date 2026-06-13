'use client';

import { useState } from 'react';

type TabKey = 'aVenir' | 'enCours' | 'completes';

const departures = {
  aVenir: [
    {
      id: 'DEP-041',
      mode: '✈️',
      title: 'Vol Miami → Port-au-Prince',
      date: '18 juin 2025',
      dateBadge: 'Dans 5 jours',
      capacity: 72,
      total: 100,
      colis: 72,
      clients: 34,
      destinations: 3,
      weight: '486 kg',
      statuses: ['Documents ✓', 'Douane OK ✓'],
      route: 'MIA → PAP',
    },
    {
      id: 'DEP-042',
      mode: '🚢',
      title: 'Bateau Miami → Saint-Domingue',
      date: '25 juin 2025',
      dateBadge: 'Dans 12 jours',
      capacity: 45,
      total: 200,
      colis: 45,
      clients: 20,
      destinations: 2,
      weight: '890 kg',
      statuses: ['Documents ✓'],
      route: 'MIA → SDQ',
    },
  ],
  enCours: [
    {
      id: 'DEP-040',
      mode: '✈️',
      title: 'Vol Miami → Cap-Haïtien',
      date: '13 juin 2025',
      dateBadge: 'En vol',
      capacity: 88,
      total: 90,
      colis: 88,
      clients: 41,
      destinations: 1,
      weight: '602 kg',
      statuses: ['Documents ✓', 'Douane OK ✓'],
      route: 'MIA → CAP',
    },
  ],
  completes: [] as typeof departures.aVenir,
};

const tabs: { key: TabKey; label: string; count: number }[] = [
  { key: 'aVenir', label: 'À venir', count: 2 },
  { key: 'enCours', label: 'En cours', count: 1 },
  { key: 'completes', label: 'Complétés', count: 28 },
];

export default function DepartsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('aVenir');

  const currentDepartures = departures[activeTab];

  return (
    <div style={{ padding: '24px 28px', minHeight: '100vh', background: '#0D0D0D', color: '#fff', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Départs</h1>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: '#9CA3AF' }}>Vols et bateaux Miami → Caraïbes</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button style={{ background: 'none', border: '1px solid #2A2A2A', borderRadius: 8, color: '#9CA3AF', width: 36, height: 36, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🔔</button>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#F97316', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff' }}>MJ</div>
          <button style={{ background: '#F97316', border: 'none', borderRadius: 8, color: '#fff', padding: '9px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            + Nouveau départ
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #222222', marginBottom: 24 }}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab.key ? '2px solid #F97316' : '2px solid transparent',
              color: activeTab === tab.key ? '#F97316' : '#9CA3AF',
              padding: '10px 20px',
              fontSize: 14,
              fontWeight: activeTab === tab.key ? 600 : 400,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'color 0.15s',
            }}
          >
            {tab.label}
            <span style={{ background: activeTab === tab.key ? 'rgba(249,115,22,0.15)' : '#2A2A2A', color: activeTab === tab.key ? '#F97316' : '#9CA3AF', borderRadius: 10, padding: '1px 7px', fontSize: 12, fontWeight: 600 }}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Cards */}
      {currentDepartures.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(440px, 1fr))', gap: 18, marginBottom: 28 }}>
          {currentDepartures.map((dep) => {
            const pct = Math.round((dep.capacity / dep.total) * 100);
            return (
              <div key={dep.id} style={{ background: '#1A1A1A', border: '1px solid #222222', borderRadius: 14, padding: '22px 22px 18px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Card header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ fontSize: 28, lineHeight: 1 }}>{dep.mode}</div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 15, color: '#fff' }}>{dep.title}</div>
                      <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{dep.id} · {dep.route}</div>
                    </div>
                  </div>
                  <div style={{ background: 'rgba(249,115,22,0.15)', color: '#F97316', borderRadius: 10, padding: '4px 10px', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>
                    {dep.dateBadge}
                  </div>
                </div>

                <div style={{ borderTop: '1px solid #222222' }} />

                {/* Capacity bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#9CA3AF', marginBottom: 6 }}>
                    <span>Capacité</span>
                    <span style={{ color: pct > 85 ? '#EF4444' : pct > 60 ? '#F97316' : '#22C55E', fontWeight: 600 }}>{pct}% ({dep.capacity}/{dep.total} colis)</span>
                  </div>
                  <div style={{ background: '#2A2A2A', borderRadius: 6, height: 8, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: pct > 85 ? '#EF4444' : pct > 60 ? '#F97316' : '#22C55E', borderRadius: 6, transition: 'width 0.3s' }} />
                  </div>
                </div>

                {/* Stats grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[
                    { label: 'Colis', value: dep.colis },
                    { label: 'Clients', value: dep.clients },
                    { label: 'Destinations', value: dep.destinations },
                    { label: 'Poids', value: dep.weight },
                  ].map((stat) => (
                    <div key={stat.label} style={{ background: '#0D0D0D', borderRadius: 8, padding: '10px 14px' }}>
                      <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 2 }}>{stat.label}</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>{stat.value}</div>
                    </div>
                  ))}
                </div>

                {/* Status badges */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {dep.statuses.map((s) => (
                    <span key={s} style={{ background: 'rgba(34,197,94,0.12)', color: '#22C55E', borderRadius: 8, padding: '4px 10px', fontSize: 12, fontWeight: 500 }}>{s}</span>
                  ))}
                </div>

                {/* Action buttons */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <button style={{ background: '#2A2A2A', border: 'none', borderRadius: 8, color: '#fff', padding: '9px 0', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>Voir colis</button>
                  <button style={{ background: '#F97316', border: 'none', borderRadius: 8, color: '#fff', padding: '9px 0', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>+ Ajouter colis</button>
                  <button style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 8, color: '#22C55E', padding: '9px 0', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>Notifier clients</button>
                  <button style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, color: '#EF4444', padding: '9px 0', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>Fermer départ</button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ background: '#1A1A1A', border: '1px solid #222222', borderRadius: 12, padding: '60px 24px', textAlign: 'center', color: '#9CA3AF', marginBottom: 28 }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📦</div>
          <div style={{ fontSize: 15, fontWeight: 500 }}>Aucun départ dans cette catégorie</div>
          <div style={{ fontSize: 13, marginTop: 6 }}>28 départs complétés au total cette année</div>
        </div>
      )}

      {/* Summary stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {[
          { label: 'Total départs', value: '31', sub: 'Cette année' },
          { label: 'Colis ce mois', value: '205', sub: '+14% vs mois dernier' },
          { label: 'En transit', value: '88', sub: 'Actuellement' },
          { label: 'Taux remplissage', value: '84%', sub: 'Moyenne globale' },
        ].map((s) => (
          <div key={s.label} style={{ background: '#1A1A1A', border: '1px solid #222222', borderRadius: 10, padding: '14px 18px' }}>
            <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 2 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: '#9CA3AF' }}>{s.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
