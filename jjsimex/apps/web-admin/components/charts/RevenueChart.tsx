'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface RevenueChartProps {
  data: { month: string; revenue: number; packages: number }[];
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 8, padding: '10px 14px' }}>
      <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 6 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ fontSize: 13, fontWeight: 600, color: p.name === 'revenue' ? '#F97316' : '#3B82F6' }}>
          {p.name === 'revenue' ? `${p.value.toLocaleString('fr-FR')} USD` : `${p.value} colis`}
        </div>
      ))}
    </div>
  );
};

export function RevenueChart({ data }: RevenueChartProps) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} barGap={4} barCategoryGap="30%">
        <CartesianGrid strokeDasharray="3 3" stroke="#1E1E1E" vertical={false} />
        <XAxis dataKey="month" tick={{ fill: '#6B7280', fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} axisLine={false} tickLine={false} width={48} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
        <Bar dataKey="revenue" fill="#F97316" radius={[4, 4, 0, 0]} />
        <Bar dataKey="packages" fill="#3B82F6" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
