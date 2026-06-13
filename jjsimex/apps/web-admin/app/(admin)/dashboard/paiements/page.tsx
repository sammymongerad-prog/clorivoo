'use client'

import { useState } from 'react'

const methodColor: Record<string, { color: string; bg: string; border: string }> = {
  MonCash: { color: '#F97316', bg: 'rgba(249,115,22,0.1)', border: 'rgba(249,115,22,0.3)' },
  Zelle: { color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)', border: 'rgba(139,92,246,0.3)' },
  'Western Union': { color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)' },
  Cash: { color: '#22C55E', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.3)' },
}

const statutStyle: Record<string, { color: string; bg: string; border: string }> = {
  Reçu: { color: '#22C55E', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.3)' },
  'En attente': { color: '#F97316', bg: 'rgba(249,115,22,0.1)', border: 'rgba(249,115,22,0.3)' },
  Remboursé: { color: '#EF4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)' },
}

const transactions = [
  { id: 'TXN-9041', client: 'Marie Joseph', email: 'marie.joseph@gmail.com', initials: 'MJ', color: '#F97316', ref: 'PAY-2025-9041', method: 'MonCash', amount: '$240.00', colis: 'CL-0892', date: '13 juin 2025 · 09:42', status: 'Reçu' },
  { id: 'TXN-9040', client: 'Jean Pierre', email: 'jean.pierre@yahoo.com', initials: 'JP', color: '#22C55E', ref: 'PAY-2025-9040', method: 'Zelle', amount: '$180.00', colis: 'CL-0889', date: '13 juin 2025 · 08:15', status: 'Reçu' },
  { id: 'TXN-9039', client: 'Sophia Laurent', email: 'sophia.l@gmail.com', initials: 'SL', color: '#8B5CF6', ref: 'PAY-2025-9039', method: 'MonCash', amount: '$95.00', colis: 'CL-0885', date: '12 juin 2025 · 17:30', status: 'En attente' },
  { id: 'TXN-9038', client: 'Paul Moreau', email: 'paul.moreau@yahoo.fr', initials: 'PM', color: '#06B6D4', ref: 'PAY-2025-9038', method: 'Western Union', amount: '$320.00', colis: 'CL-0880', date: '12 juin 2025 · 14:22', status: 'Reçu' },
  { id: 'TXN-9037', client: 'Anne Duval', email: 'anne.duval@outlook.com', initials: 'AD', color: '#EC4899', ref: 'PAY-2025-9037', method: 'Cash', amount: '$55.00', colis: 'CL-0877', date: '12 juin 2025 · 11:05', status: 'Reçu' },
  { id: 'TXN-9036', client: 'Claude Martin', email: 'claude.martin@gmail.com', initials: 'CM', color: '#EF4444', ref: 'PAY-2025-9036', method: 'Zelle', amount: '$150.00', colis: 'CL-0871', date: '11 juin 2025 · 16:48', status: 'Remboursé' },
  { id: 'TXN-9035', client: 'Rose Dieu', email: 'rose.dieu@hotmail.com', initials: 'RD', color: '#9CA3AF', ref: 'PAY-2025-9035', method: 'MonCash', amount: '$78.00', colis: 'CL-0868', date: '11 juin 2025 · 10:20', status: 'En attente' },
  { id: 'TXN-9034', client: 'Yves Blanc', email: 'yves.blanc@gmail.com', initials: 'YB', color: '#F59E0B', ref: 'PAY-2025-9034', method: 'Western Union', amount: '$412.00', colis: 'CL-0863', date: '10 juin 2025 · 15:33', status: 'Reçu' },
]

export default function PaiementsPage() {
  const [search, setSearch] = useState('')
  const [methodFilter, setMethodFilter] = useState('Tous')
  const [statutFilter, setStatutFilter] = useState('Tous')
  const [selected, setSelected] = useState<string[]>([])
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)

  const filtered = transactions.filter(t => {
    if (search && !t.client.toLowerCase().includes(search.toLowerCase()) && !t.ref.toLowerCase().includes(search.toLowerCase())) return false
    if (methodFilter !== 'Tous' && t.method !== methodFilter) return false
    if (statutFilter !== 'Tous' && t.status !== statutFilter) return false
    return true
  })

  const inputStyle: React.CSSProperties = { background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 8, color: '#fff', padding: '8px 12px', fontSize: 13, outline: 'none' }

  return (
    <div style={{ padding: '28px 32px', background: '#0D0D0D', minHeight: '100vh', color: '#fff', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Paiements</h1>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: '#9CA3AF' }}>Transactions et encaissements</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button style={{ background: 'transparent', border: '1px solid #2A2A2A', borderRadius: 8, color: '#9CA3AF', padding: '8px 12px', cursor: 'pointer', fontSize: 18 }}>🔔</button>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#F97316', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff' }}>MJ</div>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: "Revenu aujourd'hui", value: '$847', delta: '+12%', deltaColor: '#22C55E', sub: 'vs hier' },
          { label: 'Ce mois', value: '$18,450', delta: '+8%', deltaColor: '#22C55E', sub: 'vs mois dernier' },
          { label: 'En attente', value: '$3,240', delta: '12 transactions', deltaColor: '#F97316', sub: 'à valider' },
          { label: 'Total 2025', value: '$94,820', delta: '', deltaColor: '#9CA3AF', sub: 'Jan – Juin 2025' },
        ].map(kpi => (
          <div key={kpi.label} style={{ background: '#1A1A1A', border: '1px solid #222', borderRadius: 12, padding: '18px 20px' }}>
            <p style={{ margin: 0, fontSize: 12, color: '#9CA3AF' }}>{kpi.label}</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, margin: '8px 0 4px' }}>
              <span style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>{kpi.value}</span>
              {kpi.delta && <span style={{ fontSize: 12, fontWeight: 600, color: kpi.deltaColor }}>{kpi.delta}</span>}
            </div>
            <p style={{ margin: 0, fontSize: 12, color: '#9CA3AF' }}>{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div style={{ background: '#1A1A1A', border: '1px solid #222', borderRadius: 12, padding: '16px 20px', marginBottom: 20, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', fontSize: 14 }}>🔍</span>
          <input placeholder="Rechercher une transaction..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ ...inputStyle, paddingLeft: 32, width: '100%', boxSizing: 'border-box' }} />
        </div>
        <select value={methodFilter} onChange={e => setMethodFilter(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
          <option>Tous</option><option>MonCash</option><option>Zelle</option><option>Western Union</option><option>Cash</option>
        </select>
        <select value={statutFilter} onChange={e => setStatutFilter(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
          <option>Tous</option><option>Reçu</option><option>En attente</option><option>Remboursé</option>
        </select>
        <input type="date" style={{ ...inputStyle, cursor: 'pointer' }} />
        <button style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 8, color: '#9CA3AF', padding: '8px 16px', cursor: 'pointer', fontSize: 13 }}>⬇ Exporter</button>
      </div>

      {/* Table */}
      <div style={{ background: '#1A1A1A', border: '1px solid #222', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '44px 1.8fr 1fr 0.9fr 0.8fr 1.2fr 1fr 0.8fr 0.9fr', padding: '12px 20px', borderBottom: '1px solid #222', background: '#161616' }}>
          {['', 'Client', 'Référence', 'Méthode', 'Montant', 'Colis', 'Date', 'Statut', 'Actions'].map((col, i) => (
            <div key={i} style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{col}</div>
          ))}
        </div>
        {filtered.map(tx => {
          const m = methodColor[tx.method] || { color: '#9CA3AF', bg: '#2A2A2A', border: '#333' }
          const s = statutStyle[tx.status] || { color: '#9CA3AF', bg: '#2A2A2A', border: '#333' }
          return (
            <div key={tx.id}
              onMouseEnter={() => setHoveredRow(tx.id)}
              onMouseLeave={() => setHoveredRow(null)}
              style={{ display: 'grid', gridTemplateColumns: '44px 1.8fr 1fr 0.9fr 0.8fr 1.2fr 1fr 0.8fr 0.9fr', padding: '14px 20px', borderBottom: '1px solid #1E1E1E', alignItems: 'center', background: hoveredRow === tx.id ? '#1F1F1F' : 'transparent', transition: 'background 0.15s' }}>
              <input type="checkbox" checked={selected.includes(tx.id)} onChange={() => setSelected(p => p.includes(tx.id) ? p.filter(x => x !== tx.id) : [...p, tx.id])}
                style={{ accentColor: '#F97316', cursor: 'pointer', width: 16, height: 16 }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: tx.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{tx.initials}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{tx.client}</div>
                  <div style={{ fontSize: 12, color: '#9CA3AF' }}>{tx.email}</div>
                </div>
              </div>
              <div style={{ fontSize: 12, color: '#9CA3AF', fontFamily: 'monospace' }}>{tx.ref}</div>
              <div><span style={{ background: m.bg, color: m.color, border: `1px solid ${m.border}`, borderRadius: 20, padding: '3px 10px', fontSize: 12 }}>{tx.method}</span></div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{tx.amount}</div>
              <div style={{ fontSize: 12, color: '#9CA3AF', fontFamily: 'monospace' }}>{tx.colis}</div>
              <div style={{ fontSize: 12, color: '#9CA3AF' }}>{tx.date}</div>
              <div><span style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, borderRadius: 20, padding: '3px 10px', fontSize: 12 }}>{tx.status}</span></div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button style={{ background: '#2A2A2A', border: '1px solid #333', borderRadius: 6, color: '#fff', padding: '5px 10px', cursor: 'pointer', fontSize: 12 }}>Voir</button>
                <button style={{ background: 'transparent', border: '1px solid #2A2A2A', borderRadius: 6, color: '#9CA3AF', padding: '5px 8px', cursor: 'pointer', fontSize: 14 }}>···</button>
              </div>
            </div>
          )
        })}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px' }}>
          <span style={{ fontSize: 13, color: '#9CA3AF' }}>Affichage de 1 à {filtered.length} sur 9,041 transactions</span>
          <div style={{ display: 'flex', gap: 6 }}>
            {['‹', '1', '2', '3', '...', '45', '›'].map((p, i) => (
              <button key={i} style={{ background: p === '1' ? '#F97316' : '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 6, color: p === '1' ? '#fff' : '#9CA3AF', padding: '5px 10px', cursor: 'pointer', fontSize: 13, minWidth: 32 }}>{p}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
