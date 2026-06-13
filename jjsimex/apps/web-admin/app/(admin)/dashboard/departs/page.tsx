'use client'

import { useState } from 'react'

const departures = [
  {
    id: 'DEP-2025-089', mode: '✈️', title: 'Vol Miami → Port-au-Prince', date: '18 juin 2025', badge: 'Dans 5 jours',
    badgeColor: '#F97316', capacity: 72, capacityMax: 100, capacityColor: '#F97316',
    stats: [
      { label: 'Colis', value: '142' }, { label: 'Clients', value: '38' },
      { label: 'Destinations', value: 'PAP' }, { label: 'Poids total', value: '320 kg' }
    ],
    docs: ['Documents ✓', 'Douane OK ✓'],
  },
  {
    id: 'DEP-2025-090', mode: '🚢', title: 'Bateau Miami → Santo Domingo', date: '25 juin 2025', badge: 'Dans 12 jours',
    badgeColor: '#22C55E', capacity: 45, capacityMax: 100, capacityColor: '#22C55E',
    stats: [
      { label: 'Colis', value: '89' }, { label: 'Clients', value: '24' },
      { label: 'Destinations', value: 'SDQ' }, { label: 'Poids total', value: '210 kg' }
    ],
    docs: ['Documents ✓', 'Douane En cours'],
  },
]

const enCours = [
  {
    id: 'DEP-2025-088', mode: '✈️', title: 'Vol Miami → Cap-Haïtien', date: '13 juin 2025', badge: 'En transit',
    badgeColor: '#3B82F6', capacity: 100, capacityMax: 100, capacityColor: '#3B82F6',
    stats: [
      { label: 'Colis', value: '198' }, { label: 'Clients', value: '52' },
      { label: 'Destinations', value: 'CAP' }, { label: 'Poids total', value: '445 kg' }
    ],
    docs: ['Documents ✓', 'Douane ✓'],
  },
]

const tabs = [
  { label: 'À venir', count: 2 },
  { label: 'En cours', count: 1 },
  { label: 'Complétés', count: 28 },
]

export default function DepartsPage() {
  const [activeTab, setActiveTab] = useState('À venir')

  const currentDeps = activeTab === 'À venir' ? departures : activeTab === 'En cours' ? enCours : []

  return (
    <div style={{ padding: '28px 32px', background: '#0D0D0D', minHeight: '100vh', color: '#fff', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Départs</h1>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: '#9CA3AF' }}>Vols et bateaux Miami → Caraïbes</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button style={{ background: 'transparent', border: '1px solid #2A2A2A', borderRadius: 8, color: '#9CA3AF', padding: '8px 12px', cursor: 'pointer', fontSize: 18 }}>🔔</button>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#F97316', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff' }}>MJ</div>
          <button style={{ background: '#F97316', border: 'none', borderRadius: 8, color: '#fff', padding: '9px 18px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>+ Nouveau départ</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: '#1A1A1A', border: '1px solid #222', borderRadius: 10, padding: 4, width: 'fit-content' }}>
        {tabs.map(tab => (
          <button key={tab.label} onClick={() => setActiveTab(tab.label)}
            style={{ background: activeTab === tab.label ? '#2A2A2A' : 'transparent', border: activeTab === tab.label ? '1px solid #333' : '1px solid transparent', borderRadius: 8, color: activeTab === tab.label ? '#fff' : '#9CA3AF', padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: activeTab === tab.label ? 600 : 400, display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.15s' }}>
            {tab.label}
            <span style={{ background: activeTab === tab.label ? '#F97316' : '#2A2A2A', color: '#fff', borderRadius: 20, padding: '1px 7px', fontSize: 11, fontWeight: 700 }}>{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Cards grid */}
      {currentDeps.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: currentDeps.length === 1 ? '1fr' : 'repeat(2, 1fr)', gap: 20, marginBottom: 28 }}>
          {currentDeps.map(dep => (
            <div key={dep.id} style={{ background: '#1A1A1A', border: '1px solid #222', borderRadius: 16, padding: 24 }}>
              {/* Card header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ fontSize: 28 }}>{dep.mode}</div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{dep.title}</div>
                    <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{dep.id} · {dep.date}</div>
                  </div>
                </div>
                <span style={{ background: `${dep.badgeColor}18`, color: dep.badgeColor, border: `1px solid ${dep.badgeColor}40`, borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 600 }}>{dep.badge}</span>
              </div>
              <div style={{ borderTop: '1px solid #2A2A2A', marginBottom: 16 }} />
              {/* Capacity */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: '#9CA3AF' }}>Capacité utilisée</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: dep.capacityColor }}>{dep.capacity}%</span>
                </div>
                <div style={{ background: '#2A2A2A', borderRadius: 4, height: 6, overflow: 'hidden' }}>
                  <div style={{ width: `${dep.capacity}%`, background: dep.capacityColor, height: '100%', borderRadius: 4, transition: 'width 0.3s' }} />
                </div>
              </div>
              {/* 2x2 stats */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                {dep.stats.map(s => (
                  <div key={s.label} style={{ background: '#111', border: '1px solid #222', borderRadius: 8, padding: '10px 14px' }}>
                    <div style={{ fontSize: 11, color: '#9CA3AF' }}>{s.label}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginTop: 2 }}>{s.value}</div>
                  </div>
                ))}
              </div>
              {/* Operational badges */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                {dep.docs.map(d => (
                  <span key={d} style={{ background: 'rgba(34,197,94,0.1)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 20, padding: '4px 12px', fontSize: 12 }}>{d}</span>
                ))}
              </div>
              {/* Action buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <button style={{ background: '#2A2A2A', border: '1px solid #333', borderRadius: 8, color: '#fff', padding: '9px', cursor: 'pointer', fontSize: 12, fontWeight: 500 }}>Voir colis</button>
                <button style={{ background: '#F97316', border: 'none', borderRadius: 8, color: '#fff', padding: '9px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>+ Ajouter colis</button>
                <button style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 8, color: '#22C55E', padding: '9px', cursor: 'pointer', fontSize: 12, fontWeight: 500 }}>Notifier clients</button>
                <button style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, color: '#EF4444', padding: '9px', cursor: 'pointer', fontSize: 12, fontWeight: 500 }}>Fermer départ</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ background: '#1A1A1A', border: '1px solid #222', borderRadius: 16, padding: 48, textAlign: 'center', marginBottom: 28 }}>
          <p style={{ color: '#9CA3AF', fontSize: 14 }}>Aucun départ dans cette catégorie</p>
        </div>
      )}

      {/* Summary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {[
          { label: 'Total départs', value: '31', sub: 'Tous statuts confondus' },
          { label: 'Colis ce mois', value: '429', sub: '+12% vs mois dernier' },
          { label: 'En transit', value: '198', sub: '1 vol en cours' },
          { label: 'Taux remplissage', value: '72%', sub: 'Moyenne des départs' },
        ].map(s => (
          <div key={s.label} style={{ background: '#1A1A1A', border: '1px solid #222', borderRadius: 12, padding: '16px 20px' }}>
            <p style={{ margin: 0, fontSize: 12, color: '#9CA3AF' }}>{s.label}</p>
            <p style={{ margin: '6px 0 4px', fontSize: 22, fontWeight: 700, color: '#fff' }}>{s.value}</p>
            <p style={{ margin: 0, fontSize: 12, color: '#9CA3AF' }}>{s.sub}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
