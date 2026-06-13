'use client';

import { useState } from 'react';

type Tab = 'attente' | 'cours' | 'done' | 'annule';

const DEMANDES = [
  { id: 'PS-001', client: 'Marie Joseph', initials: 'MJ', color: '#7C3AED', email: 'marie.joseph@gmail.com', produit: 'Nike Air Max 270 React - Taille 40', lien: 'https://nike.com/t/air-max-270', site: 'Nike', siteColor: '#E53E3E', qty: 1, dest: 'Port-au-Prince', mode: 'avion', date: 'Aujourd\'hui 09:14', montant: '$158', statut: 'attente' as Tab },
  { id: 'PS-002', client: 'Jean-Pierre Dumas', initials: 'JD', color: '#0891B2', email: 'jp.dumas@hotmail.com', produit: 'Set de 3 robes d\'été - Taille M', lien: 'https://shein.com/p/123', site: 'Shein', siteColor: '#EA4C89', qty: 3, dest: 'Cap-Haïtien', mode: 'bateau', date: 'Hier 16:30', montant: '$67', statut: 'attente' as Tab },
  { id: 'PS-003', client: 'Sophie Belizaire', initials: 'SB', color: '#059669', email: 'sophie.b@yahoo.fr', produit: 'iPad 10ème génération 64GB Wifi', lien: 'https://amazon.com/dp/XXXX', site: 'Amazon', siteColor: '#F97316', qty: 1, dest: 'Santo Domingo', mode: 'avion', date: 'Hier 11:05', montant: '$449', statut: 'cours' as Tab },
  { id: 'PS-004', client: 'Robert Thermidor', initials: 'RT', color: '#7C3AED', email: 'r.thermidor@outlook.com', produit: 'Adidas Ultraboost 22 - Taille 42', lien: 'https://adidas.com/us/ultraboost', site: 'Adidas', siteColor: '#1A1A2E', qty: 1, dest: 'Port-au-Prince', mode: 'avion', date: '11 juin 2025', montant: '$190', statut: 'done' as Tab },
  { id: 'PS-005', client: 'Claude Alexis', initials: 'CA', color: '#D97706', email: 'claude.alexis@gmail.com', produit: 'Écouteurs Sony WH-1000XM5', lien: 'https://amazon.com/dp/YYYY', site: 'Amazon', siteColor: '#F97316', qty: 1, dest: 'Pétion-Ville', mode: 'avion', date: '10 juin 2025', montant: '$348', statut: 'attente' as Tab },
];

const TABS: { key: Tab; label: string; count: number }[] = [
  { key: 'attente', label: 'En attente', count: 8 },
  { key: 'cours', label: 'En cours', count: 3 },
  { key: 'done', label: 'Complétées', count: 47 },
  { key: 'annule', label: 'Annulées', count: 2 },
];

const SITE_COLORS: Record<string, string> = {
  Amazon: '#F97316', Shein: '#EA4C89', Nike: '#E53E3E', Adidas: '#1A1A2E', eBay: '#E43137', Walmart: '#0071CE',
};

export default function ShopperPage() {
  const [tab, setTab] = useState<Tab>('attente');
  const [selected, setSelected] = useState<string | null>(null);

  const filtered = DEMANDES.filter(d => d.statut === tab);
  const selectedItem = DEMANDES.find(d => d.id === selected);

  const tabStyle = (t: Tab): React.CSSProperties => ({
    height: 38, padding: '0 18px', borderRadius: '8px 8px 0 0', border: 'none',
    fontFamily: 'Sora, sans-serif', fontSize: 13, fontWeight: 600, cursor: 'pointer',
    background: tab === t ? 'rgba(249,115,22,0.12)' : 'transparent',
    color: tab === t ? '#F97316' : '#9CA3AF',
    borderBottom: tab === t ? '2px solid #F97316' : '2px solid transparent',
  });

  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ height: 64, flexShrink: 0, background: '#0D0D0D', borderBottom: '1px solid #2A2A2A', display: 'flex', alignItems: 'center', gap: 14, padding: '0 24px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#FFFFFF', lineHeight: 1.1 }}>Personal Shopper</div>
          <div style={{ fontSize: 12, color: '#F97316', fontWeight: 600 }}>8 demandes en attente de traitement</div>
        </div>
        <button style={{ position: 'relative', width: 40, height: 40, borderRadius: 8, background: '#1A1A1A', border: '1px solid #2A2A2A', color: '#FFFFFF', cursor: 'pointer', fontSize: 18 }}>
          🔔<span style={{ position: 'absolute', top: 6, right: 7, minWidth: 15, height: 15, background: '#F97316', borderRadius: 99, color: '#0D0D0D', fontSize: 9, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #0D0D0D', padding: '0 3px' }}>5</span>
        </button>
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#F97316', color: '#0D0D0D', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>MJ</div>
      </div>

      {/* Stats pills */}
      <div style={{ display: 'flex', gap: 10, padding: '12px 24px 0', flexShrink: 0 }}>
        {[['8', 'En attente', '#F97316', 'rgba(249,115,22,0.14)'], ['3', 'En cours', '#A5B4FC', '#1E1B4B'], ['47', 'Complétées', '#22C55E', 'rgba(34,197,94,0.14)'], ['$12,450', 'CA généré', '#FFFFFF', '#2A2A2A']].map(([v, l, c, bg]) => (
          <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 8, background: bg as string, borderRadius: 99, padding: '7px 14px' }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: c as string }}>{v}</span>
            <span style={{ fontSize: 12, color: '#9CA3AF' }}>{l}</span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, padding: '12px 24px 0', borderBottom: '1px solid #2A2A2A', flexShrink: 0 }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={tabStyle(t.key)}>
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      {/* Content split */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left: list */}
        <div style={{ width: '60%', overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 12, borderRight: '1px solid #2A2A2A' }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#6B7280', paddingTop: 60, fontSize: 14 }}>Aucune demande dans cette catégorie</div>
          ) : filtered.map(d => (
            <div key={d.id} onClick={() => setSelected(d.id === selected ? null : d.id)}
              style={{ background: selected === d.id ? 'rgba(249,115,22,0.07)' : '#1A1A1A', border: `1px solid ${selected === d.id ? '#F97316' : '#1F1F1F'}`, borderRadius: 16, padding: 16, cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{ width: 42, height: 42, borderRadius: '50%', background: d.color, color: '#FFFFFF', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{d.initials}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF' }}>{d.client}</div>
                  <div style={{ fontSize: 12, color: '#9CA3AF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.email}</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span style={{ background: `${SITE_COLORS[d.site] ?? '#2A2A2A'}22`, color: SITE_COLORS[d.site] ?? '#9CA3AF', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 99 }}>{d.site}</span>
                  <span style={{ background: d.mode === 'avion' ? 'rgba(249,115,22,0.14)' : 'rgba(59,130,246,0.14)', color: d.mode === 'avion' ? '#F97316' : '#3B82F6', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 99 }}>{d.mode === 'avion' ? '✈️' : '🚢'}</span>
                </div>
              </div>
              <div style={{ fontSize: 13, color: '#FFFFFF', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 8 }}>{d.produit}</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: 12 }}>
                  <span style={{ fontSize: 12, color: '#9CA3AF' }}>Qté: {d.qty}</span>
                  <span style={{ fontSize: 12, color: '#9CA3AF' }}>→ {d.dest}</span>
                  <span style={{ fontSize: 12, color: '#6B7280' }}>{d.date}</span>
                </div>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#F97316' }}>{d.montant}</span>
              </div>
              {tab === 'attente' && (
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button onClick={e => e.stopPropagation()} style={{ flex: 1, height: 36, background: '#F97316', border: 'none', borderRadius: 8, color: '#0D0D0D', fontFamily: 'Sora, sans-serif', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Traiter</button>
                  <button onClick={e => e.stopPropagation()} style={{ flex: 1, height: 36, background: '#2A2A2A', border: 'none', borderRadius: 8, color: '#FFFFFF', fontFamily: 'Sora, sans-serif', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Refuser</button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Right: detail */}
        <div style={{ width: '40%', overflowY: 'auto', padding: 24 }}>
          {selectedItem ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ background: '#1A1A1A', border: '1px solid #1F1F1F', borderRadius: 16, padding: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 14 }}>Détail demande — {selectedItem.id}</div>
                {[['Client', `${selectedItem.client} (${selectedItem.initials})`], ['Email', selectedItem.email], ['Produit', selectedItem.produit], ['Lien', selectedItem.lien], ['Site', selectedItem.site], ['Quantité', String(selectedItem.qty)], ['Destination', selectedItem.dest], ['Mode', selectedItem.mode === 'avion' ? '✈️ Avion' : '🚢 Bateau'], ['Montant estimé', selectedItem.montant], ['Date demande', selectedItem.date]].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid #242424' }}>
                    <span style={{ fontSize: 13, color: '#9CA3AF' }}>{k}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#FFFFFF', textAlign: 'right', maxWidth: '60%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v}</span>
                  </div>
                ))}
              </div>
              {tab === 'attente' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <button style={{ height: 46, background: '#F97316', border: 'none', borderRadius: 12, color: '#0D0D0D', fontFamily: 'Sora, sans-serif', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Commencer le traitement</button>
                  <button style={{ height: 46, background: '#2A2A2A', border: 'none', borderRadius: 12, color: '#FFFFFF', fontFamily: 'Sora, sans-serif', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Demander plus d'infos</button>
                  <button style={{ height: 46, background: '#2D0A0A', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 12, color: '#EF4444', fontFamily: 'Sora, sans-serif', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Refuser la demande</button>
                </div>
              )}
            </div>
          ) : (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '2px dashed #2A2A2A', borderRadius: 16, gap: 12 }}>
              <div style={{ fontSize: 40 }}>🛍️</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#6B7280' }}>Sélectionnez une demande</div>
              <div style={{ fontSize: 12, color: '#4B5563', textAlign: 'center' }}>Cliquez sur une demande<br />pour voir les détails</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
