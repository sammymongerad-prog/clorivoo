'use client'

import { useState } from 'react'

const clients = [
  { id: 'CL-0001', name: 'Marie Joseph', email: 'marie.joseph@gmail.com', phone: '+509 3456-7890', status: 'Actif', colis: 12, spent: '$1,240', lastPurchase: '12 juin 2025', initials: 'MJ', color: '#F97316' },
  { id: 'CL-0002', name: 'Jean Pierre', email: 'jean.pierre@yahoo.com', phone: '+1 305-234-5678', status: 'Actif', colis: 8, spent: '$890', lastPurchase: '11 juin 2025', initials: 'JP', color: '#22C55E' },
  { id: 'CL-0003', name: 'Rose Dieu', email: 'rose.dieu@hotmail.com', phone: '+509 4567-8901', status: 'Inactif', colis: 3, spent: '$320', lastPurchase: '2 mai 2025', initials: 'RD', color: '#9CA3AF' },
  { id: 'CL-0004', name: 'Claude Martin', email: 'claude.martin@gmail.com', phone: '+1 809-345-6789', status: 'Bloqué', colis: 0, spent: '$150', lastPurchase: '15 mars 2025', initials: 'CM', color: '#EF4444' },
  { id: 'CL-0005', name: 'Sophia Laurent', email: 'sophia.l@gmail.com', phone: '+509 2345-6789', status: 'Actif', colis: 21, spent: '$2,780', lastPurchase: '13 juin 2025', initials: 'SL', color: '#8B5CF6' },
  { id: 'CL-0006', name: 'Paul Moreau', email: 'paul.moreau@yahoo.fr', phone: '+1 305-987-6543', status: 'Actif', colis: 5, spent: '$560', lastPurchase: '10 juin 2025', initials: 'PM', color: '#06B6D4' },
  { id: 'CL-0007', name: 'Yves Blanc', email: 'yves.blanc@gmail.com', phone: '+509 3789-0123', status: 'Inactif', colis: 1, spent: '$89', lastPurchase: '20 avr. 2025', initials: 'YB', color: '#F59E0B' },
  { id: 'CL-0008', name: 'Anne Duval', email: 'anne.duval@outlook.com', phone: '+1 809-876-5432', status: 'Actif', colis: 16, spent: '$1,890', lastPurchase: '12 juin 2025', initials: 'AD', color: '#EC4899' },
]

const statusColor = (s: string) => s === 'Actif' ? '#22C55E' : s === 'Bloqué' ? '#EF4444' : '#9CA3AF'
const statusBg = (s: string) => s === 'Actif' ? 'rgba(34,197,94,0.12)' : s === 'Bloqué' ? 'rgba(239,68,68,0.12)' : 'rgba(156,163,175,0.12)'

export default function ClientsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('Tous')
  const [countryFilter, setCountryFilter] = useState('Tous')
  const [selected, setSelected] = useState<string[]>([])
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)

  const filtered = clients.filter(c => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.email.toLowerCase().includes(search.toLowerCase())) return false
    if (statusFilter !== 'Tous' && c.status !== statusFilter) return false
    return true
  })

  const toggleSelect = (id: string) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const inputStyle: React.CSSProperties = {
    background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 8, color: '#fff',
    padding: '8px 12px', fontSize: 13, outline: 'none', width: '100%'
  }
  const selectStyle: React.CSSProperties = { ...inputStyle, width: 'auto', cursor: 'pointer' }

  return (
    <div style={{ padding: '28px 32px', background: '#0D0D0D', minHeight: '100vh', color: '#fff', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#fff' }}>Clients</h1>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: '#9CA3AF' }}>Gestion des comptes</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {[
            { label: 'Total', value: '22,847', color: '#9CA3AF', bg: '#1A1A1A' },
            { label: 'Actifs', value: '18,234', color: '#22C55E', bg: 'rgba(34,197,94,0.1)' },
            { label: 'Inactifs', value: '4,613', color: '#9CA3AF', bg: '#1A1A1A' },
            { label: 'Nouveaux ce mois', value: '342', color: '#F97316', bg: 'rgba(249,115,22,0.1)' },
          ].map(pill => (
            <div key={pill.label} style={{ background: pill.bg, border: `1px solid #2A2A2A`, borderRadius: 20, padding: '6px 14px', fontSize: 13, display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={{ color: '#9CA3AF' }}>{pill.label}:</span>
              <span style={{ color: pill.color, fontWeight: 600 }}>{pill.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Filter bar */}
      <div style={{ background: '#1A1A1A', border: '1px solid #222', borderRadius: 12, padding: '16px 20px', marginBottom: 20, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', fontSize: 14 }}>🔍</span>
          <input placeholder="Rechercher un client..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ ...inputStyle, paddingLeft: 32 }} />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={selectStyle}>
          <option>Tous</option><option>Actif</option><option>Inactif</option><option>Bloqué</option>
        </select>
        <select value={countryFilter} onChange={e => setCountryFilter(e.target.value)} style={selectStyle}>
          <option>Tous</option><option>Haïti</option><option>Rép. Dom.</option><option>USA</option>
        </select>
        <button style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 8, color: '#9CA3AF', padding: '8px 16px', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
          ⬇ Exporter
        </button>
      </div>

      {/* Stats summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
        {[
          { label: 'Total clients', value: '22,847', sub: '+2.4% ce mois' },
          { label: 'Actifs ce mois', value: '18,234', sub: '79.8% du total' },
          { label: 'Nouveaux ce mois', value: '342', sub: '+18% vs mois dernier' },
          { label: 'Moy. colis/client', value: '7.3', sub: 'sur 12 mois glissants' },
        ].map(card => (
          <div key={card.label} style={{ background: '#1A1A1A', border: '1px solid #222', borderRadius: 12, padding: '16px 20px' }}>
            <p style={{ margin: 0, fontSize: 12, color: '#9CA3AF' }}>{card.label}</p>
            <p style={{ margin: '6px 0 4px', fontSize: 22, fontWeight: 700, color: '#fff' }}>{card.value}</p>
            <p style={{ margin: 0, fontSize: 12, color: '#9CA3AF' }}>{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: '#1A1A1A', border: '1px solid #222', borderRadius: 12, overflow: 'hidden' }}>
        {/* Table header */}
        <div style={{ display: 'grid', gridTemplateColumns: '44px 2fr 1fr 1.2fr 0.8fr 0.7fr 1fr 1fr 1.2fr', padding: '12px 20px', borderBottom: '1px solid #222', background: '#161616' }}>
          {['', 'Client', 'ID Client', 'Téléphone', 'Statut', 'Colis', 'Total dépensé', 'Dernier achat', 'Actions'].map((col, i) => (
            <div key={i} style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{col}</div>
          ))}
        </div>
        {/* Rows */}
        {filtered.map(client => (
          <div key={client.id}
            onMouseEnter={() => setHoveredRow(client.id)}
            onMouseLeave={() => setHoveredRow(null)}
            style={{ display: 'grid', gridTemplateColumns: '44px 2fr 1fr 1.2fr 0.8fr 0.7fr 1fr 1fr 1.2fr', padding: '14px 20px', borderBottom: '1px solid #1E1E1E', alignItems: 'center', background: hoveredRow === client.id ? '#1F1F1F' : 'transparent', transition: 'background 0.15s' }}>
            <div>
              <input type="checkbox" checked={selected.includes(client.id)} onChange={() => toggleSelect(client.id)}
                style={{ accentColor: '#F97316', cursor: 'pointer', width: 16, height: 16 }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: client.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                {client.initials}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{client.name}</div>
                <div style={{ fontSize: 12, color: '#9CA3AF' }}>{client.email}</div>
              </div>
            </div>
            <div style={{ fontSize: 13, color: '#9CA3AF', fontFamily: 'monospace' }}>{client.id}</div>
            <div style={{ fontSize: 13, color: '#fff' }}>{client.phone}</div>
            <div>
              <span style={{ background: statusBg(client.status), color: statusColor(client.status), border: `1px solid ${statusColor(client.status)}30`, borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 500 }}>
                {client.status}
              </span>
            </div>
            <div style={{ fontSize: 13, color: '#fff', fontWeight: 600 }}>{client.colis}</div>
            <div style={{ fontSize: 13, color: '#fff', fontWeight: 600 }}>{client.spent}</div>
            <div style={{ fontSize: 12, color: '#9CA3AF' }}>{client.lastPurchase}</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button style={{ background: '#2A2A2A', border: '1px solid #333', borderRadius: 6, color: '#fff', padding: '5px 12px', cursor: 'pointer', fontSize: 12 }}>Voir</button>
              <button style={{ background: 'transparent', border: '1px solid #2A2A2A', borderRadius: 6, color: '#9CA3AF', padding: '5px 8px', cursor: 'pointer', fontSize: 14 }}>···</button>
            </div>
          </div>
        ))}
        {/* Pagination */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px' }}>
          <span style={{ fontSize: 13, color: '#9CA3AF' }}>Affichage de 1 à {filtered.length} sur 22,847 clients</span>
          <div style={{ display: 'flex', gap: 6 }}>
            {['‹', '1', '2', '3', '...', '12', '›'].map((p, i) => (
              <button key={i} style={{ background: p === '1' ? '#F97316' : '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 6, color: p === '1' ? '#fff' : '#9CA3AF', padding: '5px 10px', cursor: 'pointer', fontSize: 13, minWidth: 32 }}>{p}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
