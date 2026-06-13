'use client';

import { useState } from 'react';

const transactions = [
  { id: 'TXN-8821', client: 'Marie Joseph', initials: 'MJ', ref: 'REF-20250612-001', method: 'MonCash', amount: '$140', colis: 'COL-1142', date: '12 juin 2025, 10:32', status: 'Reçu' },
  { id: 'TXN-8820', client: 'Marc Beaumont', initials: 'MB', ref: 'REF-20250612-002', method: 'Zelle', amount: '$275', colis: 'COL-1139', date: '12 juin 2025, 09:14', status: 'Reçu' },
  { id: 'TXN-8819', client: 'Anne Martin', initials: 'AM', ref: 'REF-20250611-018', method: 'Western Union', amount: '$520', colis: 'COL-1130', date: '11 juin 2025, 16:45', status: 'En attente' },
  { id: 'TXN-8818', client: 'Jean Pierre', initials: 'JP', ref: 'REF-20250611-015', method: 'Cash', amount: '$85', colis: 'COL-1128', date: '11 juin 2025, 14:20', status: 'Reçu' },
  { id: 'TXN-8817', client: 'Claude Noel', initials: 'CN', ref: 'REF-20250611-010', method: 'MonCash', amount: '$210', colis: 'COL-1125', date: '11 juin 2025, 11:05', status: 'En attente' },
  { id: 'TXN-8816', client: 'Sophie Dupont', initials: 'SD', ref: 'REF-20250610-022', method: 'Zelle', amount: '$320', colis: 'COL-1118', date: '10 juin 2025, 17:30', status: 'Remboursé' },
  { id: 'TXN-8815', client: 'Isabelle Faustin', initials: 'IF', ref: 'REF-20250610-019', method: 'Western Union', amount: '$95', colis: 'COL-1115', date: '10 juin 2025, 13:22', status: 'Reçu' },
  { id: 'TXN-8814', client: 'Robert Charles', initials: 'RC', ref: 'REF-20250609-031', method: 'Cash', amount: '$450', colis: 'COL-1101', date: '09 juin 2025, 10:00', status: 'En attente' },
];

const methodColors: Record<string, { bg: string; color: string }> = {
  MonCash: { bg: 'rgba(249,115,22,0.15)', color: '#F97316' },
  Zelle: { bg: 'rgba(99,102,241,0.15)', color: '#818CF8' },
  'Western Union': { bg: 'rgba(234,179,8,0.15)', color: '#EAB308' },
  Cash: { bg: 'rgba(34,197,94,0.15)', color: '#22C55E' },
};

const statusColors: Record<string, { bg: string; color: string }> = {
  Reçu: { bg: 'rgba(34,197,94,0.15)', color: '#22C55E' },
  'En attente': { bg: 'rgba(249,115,22,0.15)', color: '#F97316' },
  Remboursé: { bg: 'rgba(239,68,68,0.15)', color: '#EF4444' },
};

export default function PaiementsPage() {
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState('Tous');
  const [statusFilter, setStatusFilter] = useState('Tous');
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  const filtered = transactions.filter((t) => {
    const matchSearch = t.client.toLowerCase().includes(search.toLowerCase()) || t.ref.toLowerCase().includes(search.toLowerCase());
    const matchMethod = methodFilter === 'Tous' || t.method === methodFilter;
    const matchStatus = statusFilter === 'Tous' || t.status === statusFilter;
    return matchSearch && matchMethod && matchStatus;
  });

  const inputStyle: React.CSSProperties = {
    background: '#1A1A1A',
    border: '1px solid #2A2A2A',
    borderRadius: 8,
    color: '#fff',
    padding: '8px 12px',
    fontSize: 13,
    outline: 'none',
  };

  return (
    <div style={{ padding: '24px 28px', minHeight: '100vh', background: '#0D0D0D', color: '#fff', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Paiements</h1>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: '#9CA3AF' }}>Transactions et encaissements</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button style={{ background: 'none', border: '1px solid #2A2A2A', borderRadius: 8, color: '#9CA3AF', width: 36, height: 36, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🔔</button>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#F97316', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff' }}>MJ</div>
        </div>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: "Revenu aujourd'hui", value: '$847', badge: '+12%', badgeColor: '#22C55E', sub: 'vs hier' },
          { label: 'Ce mois', value: '$18 450', badge: '+8%', badgeColor: '#22C55E', sub: 'vs mois dernier' },
          { label: 'En attente', value: '$3 240', badge: '3 txns', badgeColor: '#F97316', sub: 'à valider' },
          { label: 'Total 2025', value: '$94 820', badge: null, badgeColor: '', sub: 'cumul annuel' },
        ].map((kpi) => (
          <div key={kpi.label} style={{ background: '#1A1A1A', border: '1px solid #222222', borderRadius: 12, padding: '16px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: '#9CA3AF' }}>{kpi.label}</span>
              {kpi.badge && (
                <span style={{ background: `${kpi.badgeColor}22`, color: kpi.badgeColor, borderRadius: 8, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>{kpi.badge}</span>
              )}
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{kpi.value}</div>
            <div style={{ fontSize: 12, color: '#9CA3AF' }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <input
          style={{ ...inputStyle, width: 240 }}
          placeholder="Chercher client ou référence..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select style={{ ...inputStyle, cursor: 'pointer' }} value={methodFilter} onChange={(e) => setMethodFilter(e.target.value)}>
          <option>Tous</option>
          <option>MonCash</option>
          <option>Zelle</option>
          <option>Western Union</option>
          <option>Cash</option>
        </select>
        <select style={{ ...inputStyle, cursor: 'pointer' }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option>Tous</option>
          <option>Reçu</option>
          <option>En attente</option>
          <option>Remboursé</option>
        </select>
        <div style={{ display: 'flex', gap: 6 }}>
          <input type="date" style={{ ...inputStyle, fontSize: 12 }} defaultValue="2025-06-01" />
          <input type="date" style={{ ...inputStyle, fontSize: 12 }} defaultValue="2025-06-12" />
        </div>
        <button style={{ marginLeft: 'auto', background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 8, color: '#9CA3AF', padding: '8px 16px', fontSize: 13, cursor: 'pointer' }}>
          ↓ Exporter
        </button>
      </div>

      {/* Table */}
      <div style={{ background: '#1A1A1A', border: '1px solid #222222', borderRadius: 12, overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '44px 1.8fr 1fr 0.9fr 0.8fr 1.2fr 1fr 0.8fr 0.9fr', padding: '12px 16px', borderBottom: '1px solid #222222', fontSize: 12, color: '#9CA3AF', fontWeight: 500 }}>
          <div><input type="checkbox" style={{ accentColor: '#F97316' }} /></div>
          <div>Client</div>
          <div>Référence</div>
          <div>Méthode</div>
          <div>Montant</div>
          <div>Colis</div>
          <div>Date</div>
          <div>Statut</div>
          <div>Actions</div>
        </div>

        {/* Rows */}
        {filtered.map((txn) => (
          <div
            key={txn.id}
            onMouseEnter={() => setHoveredRow(txn.id)}
            onMouseLeave={() => setHoveredRow(null)}
            style={{
              display: 'grid',
              gridTemplateColumns: '44px 1.8fr 1fr 0.9fr 0.8fr 1.2fr 1fr 0.8fr 0.9fr',
              padding: '14px 16px',
              borderBottom: '1px solid #222222',
              alignItems: 'center',
              backgroundColor: hoveredRow === txn.id ? '#1F1F1F' : 'transparent',
              transition: 'background 0.15s',
              fontSize: 13,
            }}
          >
            <div><input type="checkbox" style={{ accentColor: '#F97316' }} /></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#2A2A2A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#F97316', flexShrink: 0 }}>
                {txn.initials}
              </div>
              <span style={{ fontWeight: 500, color: '#fff' }}>{txn.client}</span>
            </div>
            <div style={{ color: '#9CA3AF', fontSize: 12 }}>{txn.ref}</div>
            <div>
              <span style={{ background: methodColors[txn.method]?.bg, color: methodColors[txn.method]?.color, borderRadius: 8, padding: '3px 9px', fontSize: 12, fontWeight: 500 }}>
                {txn.method}
              </span>
            </div>
            <div style={{ fontWeight: 700, color: '#fff' }}>{txn.amount}</div>
            <div style={{ color: '#9CA3AF', fontSize: 12 }}>{txn.colis}</div>
            <div style={{ color: '#9CA3AF', fontSize: 12 }}>{txn.date}</div>
            <div>
              <span style={{ background: statusColors[txn.status]?.bg, color: statusColors[txn.status]?.color, borderRadius: 10, padding: '3px 9px', fontSize: 12, fontWeight: 500 }}>
                {txn.status}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button style={{ background: '#2A2A2A', border: 'none', borderRadius: 6, color: '#fff', padding: '5px 10px', fontSize: 12, cursor: 'pointer' }}>Voir</button>
              <button style={{ background: '#2A2A2A', border: 'none', borderRadius: 6, color: '#9CA3AF', padding: '5px 8px', fontSize: 14, cursor: 'pointer' }}>···</button>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div style={{ padding: '40px 16px', textAlign: 'center', color: '#9CA3AF', fontSize: 14 }}>Aucune transaction trouvée.</div>
        )}

        {/* Pagination */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', fontSize: 13, color: '#9CA3AF' }}>
          <span>Affichage de {filtered.length} sur {transactions.length} transactions</span>
          <div style={{ display: 'flex', gap: 6 }}>
            {['←', '1', '2', '3', '...', '8', '→'].map((p, i) => (
              <button key={i} style={{ background: p === '1' ? '#F97316' : '#2A2A2A', border: 'none', borderRadius: 6, color: p === '1' ? '#fff' : '#9CA3AF', width: 30, height: 30, cursor: 'pointer', fontSize: 13 }}>{p}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
