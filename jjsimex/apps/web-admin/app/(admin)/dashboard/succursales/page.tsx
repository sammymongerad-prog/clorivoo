'use client';

import { useState } from 'react';

const branches = [
  {
    id: 1,
    name: 'Miami — Principal',
    city: 'Miami, FL',
    address: '3250 NW 79th Ave, Miami, FL 33122',
    phone: '+1 (305) 555-0198',
    manager: 'Jean-Pierre Moreau',
    hours: 'Lun–Sam 8h–18h',
    colisToday: 38,
    employes: 14,
    statut: 'Active',
    principal: true,
  },
  {
    id: 2,
    name: 'Boston',
    city: 'Boston, MA',
    address: '145 Southampton St, Boston, MA 02118',
    phone: '+1 (617) 555-0243',
    manager: 'Marie-Claire Dupont',
    hours: 'Lun–Ven 9h–17h',
    colisToday: 21,
    employes: 9,
    statut: 'Active',
    principal: false,
  },
  {
    id: 3,
    name: 'New York',
    city: 'New York, NY',
    address: '890 Flatbush Ave, Brooklyn, NY 11226',
    phone: '+1 (718) 555-0071',
    manager: 'Réginald Fontaine',
    hours: 'Lun–Sam 8h–19h',
    colisToday: 45,
    employes: 16,
    statut: 'Active',
    principal: false,
  },
  {
    id: 4,
    name: 'Port-au-Prince',
    city: 'Port-au-Prince, HT',
    address: 'Rue Panaméricaine, Pétion-Ville, HT',
    phone: '+509 3755-0012',
    manager: 'Claudette Beaubrun',
    hours: 'Lun–Ven 8h–16h',
    colisToday: 12,
    employes: 5,
    statut: 'Active',
    principal: false,
  },
  {
    id: 5,
    name: 'Santo Domingo',
    city: 'Santo Domingo, DO',
    address: 'Av. Winston Churchill 1099, SD',
    phone: '+1 (809) 555-0334',
    manager: 'Carlos Méndez',
    hours: 'Lun–Sam 9h–17h',
    colisToday: 8,
    employes: 3,
    statut: 'Inactive',
    principal: false,
  },
];

const cityPins = [
  { city: 'Miami, FL', color: '#F97316' },
  { city: 'Boston, MA', color: '#9CA3AF' },
  { city: 'New York, NY', color: '#9CA3AF' },
  { city: 'Port-au-Prince, HT', color: '#9CA3AF' },
  { city: 'Santo Domingo, DO', color: '#9CA3AF' },
];

export default function SuccursalesPage() {
  const [hoveredBranch, setHoveredBranch] = useState<number | null>(null);

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
            Succursales
          </h1>
          <p style={{ color: '#9CA3AF', margin: 0, fontSize: '14px' }}>
            5 bureaux — 23 villes desservies
          </p>
        </div>
        <button
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
          + Ajouter succursale
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
          { label: 'Bureaux principaux', value: '5' },
          { label: 'Points de retrait', value: '23' },
          { label: 'Employés actifs', value: '47' },
          { label: 'Colis en attente', value: '124' },
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
            <p style={{ fontSize: '28px', fontWeight: '700', margin: 0 }}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* ── Main Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Left — Branch Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {branches.map((branch) => (
            <div
              key={branch.id}
              onMouseEnter={() => setHoveredBranch(branch.id)}
              onMouseLeave={() => setHoveredBranch(null)}
              style={{
                backgroundColor: '#1A1A1A',
                border: '1px solid #222222',
                borderRadius: '12px',
                borderLeft: `4px solid ${branch.principal ? '#F97316' : '#2A2A2A'}`,
                padding: '20px',
                transition: 'border-color 0.2s',
              }}
            >
              {/* Branch Header */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '12px',
                }}
              >
                <div>
                  <p style={{ fontWeight: '700', fontSize: '15px', margin: '0 0 2px 0' }}>
                    {branch.name}
                  </p>
                  <p style={{ color: '#9CA3AF', fontSize: '13px', margin: 0 }}>
                    {branch.city}
                  </p>
                </div>
                <span
                  style={{
                    backgroundColor:
                      branch.statut === 'Active'
                        ? 'rgba(34,197,94,0.15)'
                        : 'rgba(239,68,68,0.15)',
                    color: branch.statut === 'Active' ? '#22C55E' : '#EF4444',
                    padding: '3px 10px',
                    borderRadius: '999px',
                    fontSize: '12px',
                    fontWeight: '600',
                  }}
                >
                  {branch.statut}
                </span>
              </div>

              {/* Details */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '5px',
                  marginBottom: '14px',
                }}
              >
                <p style={{ color: '#9CA3AF', fontSize: '13px', margin: 0 }}>
                  📍 {branch.address}
                </p>
                <p style={{ color: '#9CA3AF', fontSize: '13px', margin: 0 }}>
                  📞 {branch.phone}
                </p>
                <p style={{ color: '#9CA3AF', fontSize: '13px', margin: 0 }}>
                  👤 {branch.manager}
                </p>
                <p style={{ color: '#9CA3AF', fontSize: '13px', margin: 0 }}>
                  🕐 {branch.hours}
                </p>
              </div>

              {/* Mini Stats */}
              <div
                style={{
                  display: 'flex',
                  gap: '24px',
                  backgroundColor: '#0D0D0D',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  marginBottom: '14px',
                }}
              >
                <div>
                  <p style={{ color: '#9CA3AF', fontSize: '11px', margin: '0 0 2px 0' }}>
                    Colis aujourd'hui
                  </p>
                  <p style={{ fontWeight: '700', fontSize: '20px', margin: 0 }}>
                    {branch.colisToday}
                  </p>
                </div>
                <div style={{ width: '1px', backgroundColor: '#222222' }} />
                <div>
                  <p style={{ color: '#9CA3AF', fontSize: '11px', margin: '0 0 2px 0' }}>
                    Employés
                  </p>
                  <p style={{ fontWeight: '700', fontSize: '20px', margin: 0 }}>
                    {branch.employes}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  style={{
                    flex: 1,
                    backgroundColor: 'transparent',
                    border: '1px solid #F97316',
                    color: '#F97316',
                    borderRadius: '6px',
                    padding: '8px',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  Voir détail
                </button>
                <button
                  style={{
                    flex: 1,
                    backgroundColor: '#2A2A2A',
                    border: '1px solid #2A2A2A',
                    color: '#fff',
                    borderRadius: '6px',
                    padding: '8px',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  Modifier
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Right — Map Placeholder */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Map area */}
          <div
            style={{
              backgroundColor: '#1A1A1A',
              border: '2px dashed #2A2A2A',
              borderRadius: '12px',
              padding: '60px 24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              flexGrow: 1,
            }}
          >
            <div style={{ fontSize: '52px', marginBottom: '14px' }}>🗺️</div>
            <p
              style={{
                color: '#9CA3AF',
                fontSize: '16px',
                fontWeight: '600',
                margin: '0 0 6px 0',
              }}
            >
              Carte interactive
            </p>
            <p
              style={{
                color: '#9CA3AF',
                fontSize: '13px',
                margin: 0,
                textAlign: 'center',
                maxWidth: '220px',
              }}
            >
              Visualisation géographique des succursales et points de retrait
            </p>
          </div>

          {/* City Pins */}
          <div
            style={{
              backgroundColor: '#1A1A1A',
              border: '1px solid #222222',
              borderRadius: '12px',
              padding: '20px',
            }}
          >
            <p style={{ fontWeight: '600', fontSize: '14px', margin: '0 0 16px 0' }}>
              Emplacements
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {cityPins.map((pin) => (
                <div
                  key={pin.city}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
                >
                  <div
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      backgroundColor: pin.color,
                      flexShrink: 0,
                      boxShadow:
                        pin.color === '#F97316'
                          ? '0 0 6px rgba(249,115,22,0.6)'
                          : 'none',
                    }}
                  />
                  <span style={{ color: '#9CA3AF', fontSize: '14px' }}>{pin.city}</span>
                  {pin.color === '#F97316' && (
                    <span
                      style={{
                        marginLeft: 'auto',
                        fontSize: '11px',
                        color: '#F97316',
                        fontWeight: '600',
                      }}
                    >
                      Principal
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
