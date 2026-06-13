import Link from 'next/link';

const RECENT_PACKAGES = [
  { id: 'JJI-2025-01247', client: 'Jean Pierre', dest: 'Delmas 31, PAP', poids: '3.2 lbs', mode: 'avion', statut: 'En transit', statusColor: '#3B82F6' },
  { id: 'JJI-2025-01246', client: 'Marie Dessalines', dest: 'Cap-Haïtien', poids: '1.8 lbs', mode: 'avion', statut: 'Livré', statusColor: '#22C55E' },
  { id: 'JJI-2025-01245', client: 'Paul Duvalier', dest: 'Santiago, RD', poids: '5.1 lbs', mode: 'bateau', statut: 'En transit', statusColor: '#3B82F6' },
  { id: 'JJI-2025-01244', client: 'Rose Fleurival', dest: 'Pétion-Ville', poids: '2.4 lbs', mode: 'avion', statut: 'À Miami', statusColor: '#F97316' },
  { id: 'JJI-2025-01243', client: 'Marc Antoine', dest: 'Gonaïves', poids: '4.0 lbs', mode: 'bateau', statut: 'En attente', statusColor: '#6B7280' },
];

const BRANCHES = [
  { name: 'Delmas 31, PAP', delivered: 423, clients: 312, perf: 85 },
  { name: 'Cap-Haïtien', delivered: 187, clients: 143, perf: 72 },
  { name: 'Gonaïves', delivered: 98, clients: 78, perf: 61 },
  { name: 'Santiago, RD', delivered: 124, clients: 96, perf: 78 },
];

function KpiCard({ icon, label, value, growth, growthColor, action }: {
  icon: React.ReactNode; label: string; value: string; growth: string; growthColor: string; action?: React.ReactNode;
}) {
  return (
    <div style={{ background: '#1A1A1A', border: '1px solid #222222', borderRadius: 12, padding: 20 }}>
      <div style={{ width: 42, height: 42, borderRadius: '50%', background: '#2A2A2A', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F97316' }}>
        {icon}
      </div>
      <div style={{ fontSize: 13, color: '#9CA3AF', marginTop: 14 }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 800, color: value.startsWith('47') ? '#F97316' : '#FFFFFF', letterSpacing: -1, marginTop: 4 }}>{value}</div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: growthColor }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>
          </svg>
          {growth}
        </div>
        {action}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        <KpiCard
          label="Colis ce mois"
          value="1,247"
          growth="+12% vs mois dernier"
          growthColor="#22C55E"
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="m3.27 6.96 8.73 5.05 8.73-5.05"/><path d="M12 22.08V12"/></svg>}
        />
        <KpiCard
          label="Revenus ce mois"
          value="$18,450"
          growth="+8% vs mois dernier"
          growthColor="#22C55E"
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}
        />
        <KpiCard
          label="Nouveaux clients"
          value="342"
          growth="+23% vs mois dernier"
          growthColor="#22C55E"
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
        />
        <KpiCard
          label="En attente traitement"
          value="47"
          growth="+5 depuis hier"
          growthColor="#EF4444"
          action={<button style={{ background: '#F97316', border: 'none', borderRadius: 8, padding: '7px 12px', color: '#0D0D0D', fontFamily: 'inherit', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Traiter →</button>}
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
        />
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '65fr 35fr', gap: 16 }}>
        {/* Revenue chart placeholder */}
        <div style={{ background: '#1A1A1A', border: '1px solid #222222', borderRadius: 12, padding: 20, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#FFFFFF' }}>Revenus &amp; Colis — Juin 2025</div>
            <div style={{ display: 'flex', gap: 4, background: '#111111', border: '1px solid #2A2A2A', borderRadius: 8, padding: 4 }}>
              <button style={{ background: '#2A2A2A', border: 'none', borderRadius: 6, padding: '5px 10px', color: '#FFFFFF', fontFamily: 'inherit', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>Revenus</button>
              <button style={{ background: 'none', border: 'none', borderRadius: 6, padding: '5px 10px', color: '#6B7280', fontFamily: 'inherit', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>Colis</button>
            </div>
          </div>
          {/* Bar chart */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 160, paddingBottom: 24, position: 'relative' }}>
            {[42, 58, 35, 72, 48, 65, 80, 55, 90, 68, 75, 85, 60, 92].map((h, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ width: '100%', height: `${h}%`, background: i === 13 ? '#F97316' : 'rgba(249,115,22,0.25)', borderRadius: '4px 4px 0 0' }} />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#6B7280', marginTop: 4 }}>
            {['1', '3', '5', '7', '9', '11', '13', '15', '17', '19', '21', '23', '25', '27'].map(d => <span key={d}>{d}</span>)}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
          {/* Pie */}
          <div style={{ background: '#1A1A1A', border: '1px solid #222222', borderRadius: 12, padding: 20, flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#FFFFFF', marginBottom: 16 }}>Répartition destinations</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <svg width="130" height="130" viewBox="0 0 130 130">
                <circle cx="65" cy="65" r="52" fill="none" stroke="#2E2E2E" strokeWidth="16"/>
                <circle cx="65" cy="65" r="52" fill="none" stroke="#F97316" strokeWidth="16" strokeDasharray="222.2 104.5" strokeLinecap="butt" transform="rotate(-90 65 65)"/>
                <text x="65" y="62" textAnchor="middle" fill="#FFFFFF" fontFamily="Sora, sans-serif" fontSize="20" fontWeight="800">1,247</text>
                <text x="65" y="80" textAnchor="middle" fill="#9CA3AF" fontFamily="Sora, sans-serif" fontSize="10">colis</text>
              </svg>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 3, background: '#F97316', display: 'inline-block' }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#FFFFFF' }}>Haïti — 68%</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#9CA3AF', marginLeft: 18, marginTop: 2 }}>849 colis</div>
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 3, background: '#C9CDD3', display: 'inline-block' }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#FFFFFF' }}>Rép. Dom. — 32%</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#9CA3AF', marginLeft: 18, marginTop: 2 }}>398 colis</div>
                </div>
              </div>
            </div>
          </div>

          {/* Transport */}
          <div style={{ background: '#1A1A1A', border: '1px solid #222222', borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#FFFFFF', marginBottom: 16 }}>Mode transport</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 7, color: '#FFFFFF', fontWeight: 600 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/></svg>
                    Avion
                  </span>
                  <span style={{ color: '#F97316', fontWeight: 700 }}>74%</span>
                </div>
                <div style={{ height: 8, borderRadius: 99, background: '#2A2A2A', overflow: 'hidden' }}>
                  <div style={{ width: '74%', height: '100%', borderRadius: 99, background: '#F97316' }} />
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 7, color: '#FFFFFF', fontWeight: 600 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M19.38 20A11.6 11.6 0 0 0 21 14l-9-4-9 4c0 2.9.94 5.34 2.81 7.76"/><path d="M19 13V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6"/></svg>
                    Bateau
                  </span>
                  <span style={{ color: '#C9CDD3', fontWeight: 700 }}>26%</span>
                </div>
                <div style={{ height: 8, borderRadius: 99, background: '#2A2A2A', overflow: 'hidden' }}>
                  <div style={{ width: '26%', height: '100%', borderRadius: 99, background: '#6B7280' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table + Alerts */}
      <div style={{ display: 'grid', gridTemplateColumns: '60fr 40fr', gap: 16 }}>
        {/* Recent packages table */}
        <div style={{ background: '#1A1A1A', border: '1px solid #222222', borderRadius: 12, padding: 20, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#FFFFFF' }}>Derniers colis reçus</div>
            <Link href="/dashboard/colis" style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, color: '#F97316', textDecoration: 'none' }}>Voir tout →</Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.1fr 1.2fr 0.7fr 0.5fr 1fr 0.6fr', gap: 8, padding: '10px 12px', fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '1px solid #2A2A2A' }}>
            <div>ID</div><div>Client</div><div>Destination</div><div>Poids</div><div>Mode</div><div>Statut</div><div />
          </div>
          {RECENT_PACKAGES.map((pkg) => (
            <div key={pkg.id} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.1fr 1.2fr 0.7fr 0.5fr 1fr 0.6fr', gap: 8, padding: '13px 12px', alignItems: 'center', borderBottom: '1px solid #1F1F1F' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#FFFFFF', whiteSpace: 'nowrap' }}>{pkg.id}</div>
              <div style={{ fontSize: 12, color: '#C9CDD3', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{pkg.client}</div>
              <div style={{ fontSize: 12, color: '#9CA3AF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{pkg.dest}</div>
              <div style={{ fontSize: 12, color: '#9CA3AF' }}>{pkg.poids}</div>
              <div style={{ color: pkg.mode === 'avion' ? '#F97316' : '#9CA3AF' }}>
                {pkg.mode === 'avion'
                  ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/></svg>
                  : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/></svg>
                }
              </div>
              <div>
                <span style={{ background: `${pkg.statusColor}22`, color: pkg.statusColor, fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 99, whiteSpace: 'nowrap' }}>{pkg.statut}</span>
              </div>
              <Link href={`/dashboard/colis/${pkg.id}`} style={{ background: '#2A2A2A', border: 'none', borderRadius: 8, padding: '6px 12px', color: '#FFFFFF', fontFamily: 'inherit', fontSize: 11, fontWeight: 600, cursor: 'pointer', textDecoration: 'none', display: 'inline-block', textAlign: 'center' }}>Voir</Link>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
          {/* Alerts */}
          <div style={{ background: '#1A1A1A', border: '1px solid #222222', borderRadius: 12, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="m10.29 3.86-8.18 14.14a2 2 0 0 0 1.71 3h16.36a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#FFFFFF' }}>Alertes &amp; Urgences</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { color: '#EF4444', title: 'Vol Vendredi 14 Juin', sub: 'Capacité à 87% — 47 lbs restantes', btn: 'Gérer le vol →' },
                { color: '#F97316', title: '8 demandes Personal Shopper', sub: 'En attente de devis depuis +2h', btn: 'Traiter →' },
                { color: '#EAB308', title: 'Paiement non confirmé', sub: 'JJI-2025-00851 — $24.50 en attente', btn: 'Vérifier →' },
              ].map((alert, i) => (
                <div key={i} style={{ background: '#161616', borderLeft: `3px solid ${alert.color}`, borderRadius: '0 8px 8px 0', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF' }}>{alert.title}</div>
                    <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{alert.sub}</div>
                  </div>
                  <button style={{ flexShrink: 0, background: '#2A2A2A', border: 'none', borderRadius: 8, padding: '7px 11px', color: '#FFFFFF', fontFamily: 'inherit', fontSize: 11, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>{alert.btn}</button>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming departures */}
          <div style={{ background: '#1A1A1A', border: '1px solid #222222', borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#FFFFFF', marginBottom: 14 }}>Prochains départs</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/></svg>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF' }}>Vol Miami → PAP</div>
                      <div style={{ fontSize: 12, color: '#9CA3AF' }}>Vendredi 14 Juin</div>
                    </div>
                  </div>
                  <span style={{ background: 'rgba(239,68,68,0.14)', color: '#EF4444', fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 99 }}>Bientôt complet</span>
                </div>
                <div style={{ height: 7, borderRadius: 99, background: '#2A2A2A', overflow: 'hidden', marginTop: 10 }}>
                  <div style={{ width: '87%', height: '100%', borderRadius: 99, background: '#F97316' }} />
                </div>
                <div style={{ fontSize: 11, color: '#6B7280', marginTop: 6 }}>453 lbs / 500 lbs — 47 lbs restantes</div>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M19.38 20A11.6 11.6 0 0 0 21 14l-9-4-9 4c0 2.9.94 5.34 2.81 7.76"/></svg>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF' }}>Bateau Miami → PAP</div>
                      <div style={{ fontSize: 12, color: '#9CA3AF' }}>Lundi 24 Juin</div>
                    </div>
                  </div>
                  <span style={{ background: 'rgba(34,197,94,0.14)', color: '#22C55E', fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 99 }}>Disponible</span>
                </div>
                <div style={{ height: 7, borderRadius: 99, background: '#2A2A2A', overflow: 'hidden', marginTop: 10 }}>
                  <div style={{ width: '23%', height: '100%', borderRadius: 99, background: '#22C55E' }} />
                </div>
                <div style={{ fontSize: 11, color: '#6B7280', marginTop: 6 }}>1,840 lbs / 8,000 lbs</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Branches */}
      <div style={{ background: '#1A1A1A', border: '1px solid #222222', borderRadius: 12, padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#FFFFFF' }}>Performance par succursale</div>
          <div style={{ fontSize: 13, color: '#9CA3AF' }}>Ce mois</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {BRANCHES.map((b) => (
            <div key={b.name} style={{ background: '#161616', borderRadius: 10, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 700, color: '#FFFFFF' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                {b.name}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14, fontSize: 12, color: '#9CA3AF' }}>
                <span>Colis livrés</span><span style={{ fontWeight: 800, color: '#FFFFFF', fontSize: 15 }}>{b.delivered}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 12, color: '#9CA3AF' }}>
                <span>Clients servis</span><span style={{ fontWeight: 600, color: '#C9CDD3' }}>{b.clients}</span>
              </div>
              <div style={{ height: 6, borderRadius: 99, background: '#2A2A2A', overflow: 'hidden', marginTop: 12 }}>
                <div style={{ width: `${b.perf}%`, height: '100%', borderRadius: 99, background: '#F97316' }} />
              </div>
              <div style={{ fontSize: 11, color: '#6B7280', marginTop: 6 }}>Performance {b.perf}%</div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
