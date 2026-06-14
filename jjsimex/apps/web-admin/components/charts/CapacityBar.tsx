'use client';

import React from 'react';

interface CapacityBarProps {
  used: number;
  total: number;
  label?: string;
  unit?: string;
}

export function CapacityBar({ used, total, label, unit = 'kg' }: CapacityBarProps) {
  const pct = total > 0 ? Math.min(Math.round(used / total * 100), 100) : 0;
  const color = pct >= 90 ? '#EF4444' : pct >= 70 ? '#F97316' : '#22C55E';

  return (
    <div>
      {label && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
          <span style={{ color: '#9CA3AF' }}>{label}</span>
          <span style={{ color: '#E5E7EB', fontWeight: 600 }}>{used.toLocaleString('fr-FR')} / {total.toLocaleString('fr-FR')} {unit}</span>
        </div>
      )}
      <div style={{ height: 10, background: '#2A2A2A', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 999, transition: 'width 0.5s ease' }} />
      </div>
      <div style={{ fontSize: 12, color, marginTop: 4, fontWeight: 600 }}>{pct}% utilisé</div>
    </div>
  );
}
