'use client';

import React from 'react';

interface KPICardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  growth?: string;
  growthUp?: boolean;
  accent?: string;
  action?: React.ReactNode;
}

export function KPICard({ icon, label, value, growth, growthUp = true, accent = '#F97316', action }: KPICardProps) {
  return (
    <div style={{ background: '#1A1A1A', border: '1px solid #222', borderRadius: 12, padding: 20 }}>
      <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'rgba(249,115,22,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: accent }}>
        {icon}
      </div>
      <div style={{ fontSize: 13, color: '#9CA3AF', marginTop: 14 }}>{label}</div>
      <div style={{ fontSize: 30, fontWeight: 800, color: '#FFFFFF', letterSpacing: -1, marginTop: 4, lineHeight: 1 }}>{value}</div>
      {(growth || action) && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, gap: 8 }}>
          {growth && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: growthUp ? '#22C55E' : '#EF4444' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                {growthUp
                  ? <><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></>
                  : <><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></>
                }
              </svg>
              {growth}
            </div>
          )}
          {action}
        </div>
      )}
    </div>
  );
}
