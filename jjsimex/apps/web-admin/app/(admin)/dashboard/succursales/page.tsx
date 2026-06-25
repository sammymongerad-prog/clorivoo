'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getAllBranches,
  toggleBranchStatus,
  isBranchOpen,
  type Branch,
} from '@jjsimex/supabase/branches';

export default function SuccursalesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredBranch, setHoveredBranch] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchBranches = useCallback(async () => {
    try {
      const data = await getAllBranches();
      setBranches(data);
    } catch (err) {
      console.error('Failed to fetch branches:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  const handleToggle = async (branch: Branch) => {
    setTogglingId(branch.id);
    try {
      await toggleBranchStatus(branch.id, !branch.is_active);
      await fetchBranches();
    } catch (err) {
      console.error('Failed to toggle branch:', err);
    } finally {
      setTogglingId(null);
    }
  };

  // Compute stats from real data
  const activeBranches = branches.filter((b) => b.is_active);
  const uniqueCities = new Set(branches.map((b) => b.city)).size;
  const totalBranches = branches.length;

  // City pins derived from real data
  const cityPins = branches.map((b) => ({
    city: `${b.city}, ${b.country}`,
    color: isBranchOpen(b) ? '#F97316' : '#9CA3AF',
    isOpen: isBranchOpen(b),
  }));

  if (loading) {
    return (
      <div
        style={{
          backgroundColor: '#0D0D0D',
          minHeight: '100vh',
          padding: '32px',
          color: '#9CA3AF',
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '16px',
        }}
      >
        Chargement des succursales...
      </div>
    );
  }

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
      {/* -- Header -- */}
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
            {totalBranches} bureau{totalBranches !== 1 ? 'x' : ''} — {uniqueCities} ville
            {uniqueCities !== 1 ? 's' : ''} desservie{uniqueCities !== 1 ? 's' : ''}
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

      {/* -- Stats Row -- */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
          marginBottom: '32px',
        }}
      >
        {[
          { label: 'Total succursales', value: String(totalBranches) },
          { label: 'Succursales actives', value: String(activeBranches.length) },
          { label: 'Villes desservies', value: String(uniqueCities) },
          {
            label: 'Ouvertes maintenant',
            value: String(branches.filter((b) => isBranchOpen(b)).length),
          },
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

      {/* -- Empty State -- */}
      {branches.length === 0 && (
        <div
          style={{
            backgroundColor: '#1A1A1A',
            border: '1px solid #222222',
            borderRadius: '12px',
            padding: '60px 24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <p
            style={{
              color: '#9CA3AF',
              fontSize: '16px',
              fontWeight: '600',
              margin: '0 0 6px 0',
            }}
          >
            Aucune succursale pour le moment
          </p>
          <p style={{ color: '#9CA3AF', fontSize: '13px', margin: 0 }}>
            Cliquez sur &quot;+ Ajouter succursale&quot; pour commencer.
          </p>
        </div>
      )}

      {/* -- Main Grid -- */}
      {branches.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Left - Branch Cards */}
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
                  borderLeft: `4px solid ${isBranchOpen(branch) ? '#F97316' : '#2A2A2A'}`,
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
                      {branch.city}, {branch.country}
                    </p>
                  </div>
                  <span
                    style={{
                      backgroundColor: branch.is_active
                        ? 'rgba(34,197,94,0.15)'
                        : 'rgba(239,68,68,0.15)',
                      color: branch.is_active ? '#22C55E' : '#EF4444',
                      padding: '3px 10px',
                      borderRadius: '999px',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}
                    onClick={() => handleToggle(branch)}
                  >
                    {togglingId === branch.id
                      ? '...'
                      : branch.is_active
                        ? 'Active'
                        : 'Inactive'}
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
                  {branch.address && (
                    <p style={{ color: '#9CA3AF', fontSize: '13px', margin: 0 }}>
                      {branch.address}
                    </p>
                  )}
                  {branch.phone && (
                    <p style={{ color: '#9CA3AF', fontSize: '13px', margin: 0 }}>
                      {branch.phone}
                    </p>
                  )}
                  {branch.opening_hours && (
                    <p style={{ color: '#9CA3AF', fontSize: '13px', margin: 0 }}>
                      {branch.opening_hours}
                    </p>
                  )}
                </div>

                {/* Open/Closed indicator */}
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
                      Statut actuel
                    </p>
                    <p
                      style={{
                        fontWeight: '700',
                        fontSize: '14px',
                        margin: 0,
                        color: isBranchOpen(branch) ? '#22C55E' : '#EF4444',
                      }}
                    >
                      {isBranchOpen(branch) ? 'Ouvert' : 'Ferme'}
                    </p>
                  </div>
                  {branch.opening_hours && (
                    <>
                      <div style={{ width: '1px', backgroundColor: '#222222' }} />
                      <div>
                        <p style={{ color: '#9CA3AF', fontSize: '11px', margin: '0 0 2px 0' }}>
                          Horaires
                        </p>
                        <p style={{ fontWeight: '700', fontSize: '14px', margin: 0 }}>
                          {branch.opening_hours}
                        </p>
                      </div>
                    </>
                  )}
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
                    Voir detail
                  </button>
                  <button
                    onClick={() => handleToggle(branch)}
                    disabled={togglingId === branch.id}
                    style={{
                      flex: 1,
                      backgroundColor: '#2A2A2A',
                      border: '1px solid #2A2A2A',
                      color: '#fff',
                      borderRadius: '6px',
                      padding: '8px',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: togglingId === branch.id ? 'wait' : 'pointer',
                      opacity: togglingId === branch.id ? 0.5 : 1,
                    }}
                  >
                    {branch.is_active ? 'Desactiver' : 'Activer'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Right - Map Placeholder */}
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
              <div style={{ fontSize: '52px', marginBottom: '14px' }}>&#x1F5FA;&#xFE0F;</div>
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
                Visualisation geographique des succursales et points de retrait
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
                    {pin.isOpen && (
                      <span
                        style={{
                          marginLeft: 'auto',
                          fontSize: '11px',
                          color: '#F97316',
                          fontWeight: '600',
                        }}
                      >
                        Ouvert
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
