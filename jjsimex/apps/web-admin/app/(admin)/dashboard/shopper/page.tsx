'use client'

import { useState } from 'react'

const siteStyle: Record<string, { color: string; bg: string }> = {
  Amazon: { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  Shein: { color: '#EC4899', bg: 'rgba(236,72,153,0.12)' },
  Nike: { color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
  Walmart: { color: '#22C55E', bg: 'rgba(34,197,94,0.12)' },
}

const requests = [
  { id: 'PS-0041', client: 'Marie Joseph', email: 'marie.joseph@gmail.com', initials: 'MJ', color: '#F97316', link: 'https://amazon.com/dp/B09XY4R2MN', site: 'Amazon', qty: 2, destination: 'Port-au-Prince', mode: '✈️', date: '13 juin 2025', status: 'En attente' },
  { id: 'PS-0040', client: 'Jean Pierre', email: 'jean.pierre@yahoo.com', initials: 'JP', color: '#22C55E', link: 'https://shein.com/products/dress-floral-p-12345678.html', site: 'Shein', qty: 1, destination: 'Santo Domingo', mode: '🚢', date: '13 juin 2025', status: 'En attente' },
  { id: 'PS-0039', client: 'Sophia Laurent', email: 'sophia.l@gmail.com', initials: 'SL', color: '#8B5CF6', link: 'https://nike.com/t/air-max-270-mens-shoes', site: 'Nike', qty: 1, destination: 'Cap-Haïtien', mode: '✈️', date: '12 juin 2025', status: 'En attente' },
  { id: 'PS-0038', client: 'Anne Duval', email: 'anne.duval@outlook.com', initials: 'AD', color: '#EC4899', link: 'https://amazon.com/dp/B0BSHF7WHW', site: 'Amazon', qty: 3, destination: 'Port-au-Prince', mode: '✈️', date: '12 juin 2025', status: 'En attente' },
  { id: 'PS-0037', client: 'Paul Moreau', email: 'paul.moreau@yahoo.fr', initials: 'PM', color: '#06B6D4', link: 'https://shein.com/products/bag-crossbody-p-98765432.html', site: 'Shein', qty: 2, destination: 'Santo Domingo', mode: '🚢', date: '11 juin 2025', status: 'En attente' },
  { id: 'PS-0036', client: 'Rose Dieu', email: 'rose.dieu@hotmail.com', initials: 'RD', color: '#9CA3AF', link: 'https://walmart.com/ip/Kitchen-Blender/123456789', site: 'Walmart', qty: 1, destination: 'Gonaïves', mode: '✈️', date: '11 juin 2025', status: 'En attente' },
  { id: 'PS-0035', client: 'Yves Blanc', email: 'yves.blanc@gmail.com', initials: 'YB', color: '#F59E0B', link: 'https://nike.com/t/dri-fit-training-tshirt', site: 'Nike', qty: 4, destination: 'Port-au-Prince', mode: '✈️', date: '10 juin 2025', status: 'En attente' },
  { id: 'PS-0034', client: 'Claude Martin', email: 'claude.martin@gmail.com', initials: 'CM', color: '#EF4444', link: 'https://amazon.com/dp/B08N5WRWNW', site: 'Amazon', qty: 1, destination: 'Cap-Haïtien', mode: '🚢', date: '10 juin 2025', status: 'En attente' },
]

const tabs = [
  { label: 'En attente', count: 8 },
  { label: 'En cours', count: 3 },
  { label: 'Complétées', count: 47 },
  { label: 'Annulées', count: 2 },
]

export default function ShopperPage() {
  const [activeTab, setActiveTab] = useState('En attente')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const selected = requests.find(r => r.id === selectedId)

  return (
    <div style={{ padding: '28px 32px', background: '#0D0D0D', minHeight: '100vh', color: '#fff', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Personal Shopper</h1>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: '#F97316', fontWeight: 500 }}>8 demandes en attente de traitement</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button style={{ background: 'transparent', border: '1px solid #2A2A2A', borderRadius: 8, color: '#9CA3AF', padding: '8px 12px', cursor: 'pointer', fontSize: 18 }}>🔔</button>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#F97316', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff' }}>MJ</div>
        </div>
      </div>

      {/* Stats pills */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { label: 'En attente', value: '8', color: '#F97316', bg: 'rgba(249,115,22,0.1)' },
          { label: 'En cours', value: '3', color: '#3B82F6', bg: 'rgba(59,130,246,0.1)' },
          { label: 'Complétées', value: '47', color: '#22C55E', bg: 'rgba(34,197,94,0.1)' },
          { label: 'CA généré', value: '$12,840', color: '#9CA3AF', bg: '#1A1A1A' },
        ].map(pill => (
          <div key={pill.label} style={{ background: pill.bg, border: '1px solid #2A2A2A', borderRadius: 20, padding: '6px 14px', fontSize: 13, display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ color: '#9CA3AF' }}>{pill.label}:</span>
            <span style={{ color: pill.color, fontWeight: 700 }}>{pill.value}</span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: '#1A1A1A', border: '1px solid #222', borderRadius: 10, padding: 4, width: 'fit-content' }}>
        {tabs.map(tab => (
          <button key={tab.label} onClick={() => setActiveTab(tab.label)}
            style={{ background: activeTab === tab.label ? '#2A2A2A' : 'transparent', border: activeTab === tab.label ? '1px solid #333' : '1px solid transparent', borderRadius: 8, color: activeTab === tab.label ? '#fff' : '#9CA3AF', padding: '7px 14px', cursor: 'pointer', fontSize: 13, fontWeight: activeTab === tab.label ? 600 : 400, display: 'flex', alignItems: 'center', gap: 7, transition: 'all 0.15s' }}>
            {tab.label}
            <span style={{ background: activeTab === tab.label ? '#F97316' : '#2A2A2A', color: '#fff', borderRadius: 20, padding: '1px 7px', fontSize: 11, fontWeight: 700 }}>{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Content: two-panel layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '60% 40%', gap: 16 }}>
        {/* Left: request list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {activeTab === 'En attente' ? requests.map(req => {
            const ss = siteStyle[req.site] || { color: '#9CA3AF', bg: '#2A2A2A' }
            const isSelected = selectedId === req.id
            return (
              <div key={req.id} onClick={() => setSelectedId(isSelected ? null : req.id)}
                style={{ background: isSelected ? '#1F1F1F' : '#1A1A1A', border: `1px solid ${isSelected ? '#F97316' : '#222'}`, borderRadius: 12, padding: '16px 18px', cursor: 'pointer', transition: 'all 0.15s' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: req.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{req.initials}</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{req.client}</div>
                      <div style={{ fontSize: 12, color: '#9CA3AF' }}>{req.email}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span style={{ background: ss.bg, color: ss.color, border: `1px solid ${ss.color}30`, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>{req.site}</span>
                    <span style={{ fontSize: 16 }}>{req.mode}</span>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>
                  🔗 <span style={{ color: '#3B82F6' }}>{req.link}</span>
                </div>
                <div style={{ display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, color: '#9CA3AF' }}>Qté: <span style={{ color: '#fff', fontWeight: 600 }}>{req.qty}</span></span>
                  <span style={{ fontSize: 12, color: '#9CA3AF' }}>Destination: <span style={{ color: '#fff', fontWeight: 600 }}>{req.destination}</span></span>
                  <span style={{ fontSize: 12, color: '#9CA3AF' }}>{req.date}</span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={e => { e.stopPropagation() }}
                    style={{ background: '#F97316', border: 'none', borderRadius: 8, color: '#fff', padding: '7px 16px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Traiter</button>
                  <button onClick={e => { e.stopPropagation() }}
                    style={{ background: '#2A2A2A', border: '1px solid #333', borderRadius: 8, color: '#9CA3AF', padding: '7px 16px', cursor: 'pointer', fontSize: 12 }}>Refuser</button>
                </div>
              </div>
            )
          }) : (
            <div style={{ background: '#1A1A1A', border: '1px solid #222', borderRadius: 12, padding: 40, textAlign: 'center' }}>
              <p style={{ color: '#9CA3AF', fontSize: 14 }}>Aucune demande dans cette catégorie</p>
            </div>
          )}
        </div>

        {/* Right: detail panel */}
        <div style={{ position: 'sticky', top: 20 }}>
          <div style={{ background: '#1A1A1A', border: `1px solid ${selected ? '#2A2A2A' : '#222'}`, borderRadius: 12, padding: 24, minHeight: 400 }}>
            {selected ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: selected.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff' }}>{selected.initials}</div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{selected.client}</div>
                    <div style={{ fontSize: 13, color: '#9CA3AF' }}>{selected.email}</div>
                  </div>
                </div>
                <div style={{ borderTop: '1px solid #2A2A2A', paddingTop: 16, marginBottom: 16 }}>
                  <p style={{ fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px' }}>Référence</p>
                  <p style={{ margin: 0, fontSize: 14, color: '#fff', fontFamily: 'monospace' }}>{selected.id}</p>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px' }}>Lien produit</p>
                  <p style={{ margin: 0, fontSize: 12, color: '#3B82F6', wordBreak: 'break-all' }}>{selected.link}</p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                  {[
                    { label: 'Site', value: selected.site },
                    { label: 'Quantité', value: String(selected.qty) },
                    { label: 'Destination', value: selected.destination },
                    { label: 'Mode', value: `${selected.mode} ${selected.mode === '✈️' ? 'Avion' : 'Bateau'}` },
                  ].map(d => (
                    <div key={d.label} style={{ background: '#111', border: '1px solid #222', borderRadius: 8, padding: '10px 14px' }}>
                      <p style={{ margin: 0, fontSize: 11, color: '#9CA3AF' }}>{d.label}</p>
                      <p style={{ margin: '4px 0 0', fontSize: 13, fontWeight: 600, color: '#fff' }}>{d.value}</p>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                  <button style={{ flex: 1, background: '#F97316', border: 'none', borderRadius: 8, color: '#fff', padding: '10px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Traiter la demande</button>
                  <button style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, color: '#EF4444', padding: '10px 16px', cursor: 'pointer', fontSize: 13 }}>Refuser</button>
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 360, border: '2px dashed #2A2A2A', borderRadius: 10 }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🛍️</div>
                <p style={{ color: '#9CA3AF', fontSize: 14, textAlign: 'center', margin: 0 }}>Détail commande</p>
                <p style={{ color: '#555', fontSize: 13, textAlign: 'center', margin: '6px 0 0' }}>Sélectionnez une demande</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
