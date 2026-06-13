'use client';

import { useState } from 'react';

const TABS = ['Tarifs', 'Taux de change', 'Comptes employés', 'Général'] as const;
type Tab = (typeof TABS)[number];

const rateHistory = [
  {
    date: '10 juin 2026',
    user: 'J. Moreau',
    field: 'Avion → Haïti',
    old: '$8.50/lb',
    next: '$9.50/lb',
  },
  {
    date: '02 mai 2026',
    user: 'C. Beaubrun',
    field: 'Bateau → Rép. Dom.',
    old: '$5.00/lb',
    next: '$5.50/lb',
  },
  {
    date: '15 avr. 2026',
    user: 'J. Moreau',
    field: 'Avion → Rép. Dom.',
    old: '$10.00/lb',
    next: '$11.00/lb',
  },
];

export default function ParametresPage() {
  const [activeTab, setActiveTab] = useState<Tab>('Tarifs');

  // Avion rates
  const [avionHaiti, setAvionHaiti] = useState('9.50');
  const [avionDom, setAvionDom] = useState('11.00');
  // Bateau rates
  const [bateauHaiti, setBateauHaiti] = useState('4.50');
  const [bateauDom, setBateauDom] = useState('5.50');

  // Toggles & limits
  const [assuranceEnabled, setAssuranceEnabled] = useState(true);
  const [assuranceLimit, setAssuranceLimit] = useState('100');
  const [minimumEnabled, setMinimumEnabled] = useState(true);
  const [minimumValue, setMinimumValue] = useState('5');

  // Focus tracking
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  const inputStyle = (id: string) => ({
    backgroundColor: '#0D0D0D',
    border: `1px solid ${focusedInput === id ? '#F97316' : '#2A2A2A'}`,
    borderRadius: '6px',
    color: '#fff',
    fontSize: '15px',
    fontWeight: '600',
    padding: '8px 12px',
    width: '120px',
    outline: 'none',
    transition: 'border-color 0.2s',
  });

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
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: '700', margin: '0 0 4px 0' }}>
          Paramètres
        </h1>
        <p style={{ color: '#9CA3AF', margin: 0, fontSize: '14px' }}>
          Configuration de la plateforme
        </p>
      </div>

      {/* ── Tabs ── */}
      <div
        style={{
          display: 'flex',
          gap: '4px',
          backgroundColor: '#1A1A1A',
          border: '1px solid #222222',
          borderRadius: '10px',
          padding: '4px',
          marginBottom: '28px',
          width: 'fit-content',
        }}
      >
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              backgroundColor: activeTab === tab ? '#F97316' : 'transparent',
              color: activeTab === tab ? '#fff' : '#9CA3AF',
              border: 'none',
              borderRadius: '7px',
              padding: '8px 20px',
              fontSize: '14px',
              fontWeight: activeTab === tab ? '600' : '400',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── Tab: Tarifs ── */}
      {activeTab === 'Tarifs' && (
        <>
          {/* Two rate cards side by side */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '24px',
              marginBottom: '32px',
            }}
          >
            {/* Avion Card */}
            <div
              style={{
                backgroundColor: '#1A1A1A',
                border: '1px solid #222222',
                borderRadius: '12px',
                padding: '24px',
              }}
            >
              {/* Card Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginBottom: '24px',
                }}
              >
                <span style={{ fontSize: '24px' }}>✈️</span>
                <h2 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>
                  Tarifs Avion
                </h2>
              </div>

              {/* Rate Rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                {[
                  {
                    label: 'Haïti',
                    id: 'avionHaiti',
                    value: avionHaiti,
                    set: setAvionHaiti,
                  },
                  {
                    label: 'Rép. Dominicaine',
                    id: 'avionDom',
                    value: avionDom,
                    set: setAvionDom,
                  },
                ].map((row) => (
                  <div
                    key={row.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '14px 16px',
                      backgroundColor: '#0D0D0D',
                      borderRadius: '8px',
                    }}
                  >
                    <span style={{ fontSize: '14px', color: '#9CA3AF' }}>{row.label}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: '#F97316', fontWeight: '700' }}>$</span>
                      <input
                        type="number"
                        value={row.value}
                        onChange={(e) => row.set(e.target.value)}
                        onFocus={() => setFocusedInput(row.id)}
                        onBlur={() => setFocusedInput(null)}
                        style={inputStyle(row.id)}
                      />
                      <span style={{ color: '#9CA3AF', fontSize: '13px' }}>/lb</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Assurance Toggle */}
              <div
                style={{
                  padding: '14px 16px',
                  backgroundColor: '#0D0D0D',
                  borderRadius: '8px',
                  marginBottom: '12px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: assuranceEnabled ? '12px' : '0',
                  }}
                >
                  <span style={{ fontSize: '14px', fontWeight: '500' }}>
                    Assurance gratuite
                  </span>
                  <button
                    onClick={() => setAssuranceEnabled(!assuranceEnabled)}
                    style={{
                      width: '44px',
                      height: '24px',
                      borderRadius: '999px',
                      backgroundColor: assuranceEnabled ? '#F97316' : '#2A2A2A',
                      border: 'none',
                      cursor: 'pointer',
                      position: 'relative',
                      transition: 'background-color 0.2s',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        top: '3px',
                        left: assuranceEnabled ? '23px' : '3px',
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        backgroundColor: '#fff',
                        transition: 'left 0.2s',
                      }}
                    />
                  </button>
                </div>
                {assuranceEnabled && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#9CA3AF', fontSize: '13px' }}>Limite:</span>
                    <span style={{ color: '#F97316', fontWeight: '700' }}>$</span>
                    <input
                      type="number"
                      value={assuranceLimit}
                      onChange={(e) => setAssuranceLimit(e.target.value)}
                      onFocus={() => setFocusedInput('assuranceLimit')}
                      onBlur={() => setFocusedInput(null)}
                      style={{ ...inputStyle('assuranceLimit'), width: '80px' }}
                    />
                  </div>
                )}
              </div>

              {/* Minimum Toggle */}
              <div
                style={{
                  padding: '14px 16px',
                  backgroundColor: '#0D0D0D',
                  borderRadius: '8px',
                  marginBottom: '20px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: minimumEnabled ? '12px' : '0',
                  }}
                >
                  <span style={{ fontSize: '14px', fontWeight: '500' }}>
                    Minimum de facturation
                  </span>
                  <button
                    onClick={() => setMinimumEnabled(!minimumEnabled)}
                    style={{
                      width: '44px',
                      height: '24px',
                      borderRadius: '999px',
                      backgroundColor: minimumEnabled ? '#F97316' : '#2A2A2A',
                      border: 'none',
                      cursor: 'pointer',
                      position: 'relative',
                      transition: 'background-color 0.2s',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        top: '3px',
                        left: minimumEnabled ? '23px' : '3px',
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        backgroundColor: '#fff',
                        transition: 'left 0.2s',
                      }}
                    />
                  </button>
                </div>
                {minimumEnabled && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#9CA3AF', fontSize: '13px' }}>Valeur:</span>
                    <span style={{ color: '#F97316', fontWeight: '700' }}>$</span>
                    <input
                      type="number"
                      value={minimumValue}
                      onChange={(e) => setMinimumValue(e.target.value)}
                      onFocus={() => setFocusedInput('minimumValue')}
                      onBlur={() => setFocusedInput(null)}
                      style={{ ...inputStyle('minimumValue'), width: '80px' }}
                    />
                  </div>
                )}
              </div>

              {/* Save */}
              <button
                style={{
                  width: '100%',
                  backgroundColor: '#F97316',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px',
                  fontSize: '14px',
                  fontWeight: '700',
                  cursor: 'pointer',
                }}
              >
                Sauvegarder — Avion
              </button>
            </div>

            {/* Bateau Card */}
            <div
              style={{
                backgroundColor: '#1A1A1A',
                border: '1px solid #222222',
                borderRadius: '12px',
                padding: '24px',
              }}
            >
              {/* Card Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginBottom: '24px',
                }}
              >
                <span style={{ fontSize: '24px' }}>🚢</span>
                <h2 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>
                  Tarifs Bateau
                </h2>
              </div>

              {/* Rate Rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                {[
                  {
                    label: 'Haïti',
                    id: 'bateauHaiti',
                    value: bateauHaiti,
                    set: setBateauHaiti,
                  },
                  {
                    label: 'Rép. Dominicaine',
                    id: 'bateauDom',
                    value: bateauDom,
                    set: setBateauDom,
                  },
                ].map((row) => (
                  <div
                    key={row.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '14px 16px',
                      backgroundColor: '#0D0D0D',
                      borderRadius: '8px',
                    }}
                  >
                    <span style={{ fontSize: '14px', color: '#9CA3AF' }}>{row.label}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: '#F97316', fontWeight: '700' }}>$</span>
                      <input
                        type="number"
                        value={row.value}
                        onChange={(e) => row.set(e.target.value)}
                        onFocus={() => setFocusedInput(row.id)}
                        onBlur={() => setFocusedInput(null)}
                        style={inputStyle(row.id)}
                      />
                      <span style={{ color: '#9CA3AF', fontSize: '13px' }}>/lb</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Spacer to align save button */}
              <div style={{ height: '162px' }} />

              {/* Save */}
              <button
                style={{
                  width: '100%',
                  backgroundColor: '#F97316',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px',
                  fontSize: '14px',
                  fontWeight: '700',
                  cursor: 'pointer',
                }}
              >
                Sauvegarder — Bateau
              </button>
            </div>
          </div>

          {/* ── Rate History Table ── */}
          <div
            style={{
              backgroundColor: '#1A1A1A',
              border: '1px solid #222222',
              borderRadius: '12px',
              padding: '24px',
            }}
          >
            <h2 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 20px 0' }}>
              Historique des modifications
            </h2>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Date', 'Utilisateur', 'Champ modifié', 'Ancienne valeur', 'Nouvelle valeur'].map(
                    (col) => (
                      <th
                        key={col}
                        style={{
                          textAlign: 'left',
                          color: '#9CA3AF',
                          fontSize: '12px',
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          paddingBottom: '12px',
                          borderBottom: '1px solid #222222',
                        }}
                      >
                        {col}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {rateHistory.map((row, i) => (
                  <tr key={i}>
                    {[
                      <span key="date" style={{ color: '#9CA3AF', fontSize: '14px' }}>
                        {row.date}
                      </span>,
                      <span key="user" style={{ fontSize: '14px' }}>
                        {row.user}
                      </span>,
                      <span key="field" style={{ fontSize: '14px', color: '#9CA3AF' }}>
                        {row.field}
                      </span>,
                      <span
                        key="old"
                        style={{
                          fontSize: '14px',
                          color: '#EF4444',
                          textDecoration: 'line-through',
                        }}
                      >
                        {row.old}
                      </span>,
                      <span key="new" style={{ fontSize: '14px', color: '#22C55E', fontWeight: '600' }}>
                        {row.next}
                      </span>,
                    ].map((cell, ci) => (
                      <td
                        key={ci}
                        style={{
                          padding: '14px 0',
                          paddingRight: '16px',
                          borderBottom: i < rateHistory.length - 1 ? '1px solid #222222' : 'none',
                        }}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── Placeholder for other tabs ── */}
      {activeTab !== 'Tarifs' && (
        <div
          style={{
            backgroundColor: '#1A1A1A',
            border: '2px dashed #2A2A2A',
            borderRadius: '12px',
            padding: '60px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <p style={{ color: '#9CA3AF', fontSize: '16px', margin: 0 }}>
            Section «{activeTab}» — en cours de développement
          </p>
        </div>
      )}
    </div>
  );
}
