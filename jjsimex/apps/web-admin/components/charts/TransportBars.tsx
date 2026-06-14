'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface TransportBarsProps {
  air: number;
  sea: number;
}

export function TransportBars({ air, sea }: TransportBarsProps) {
  const data = [
    { name: '✈ Aérien', value: air, color: '#3B82F6' },
    { name: '🚢 Maritime', value: sea, color: '#06B6D4' },
  ];
  return (
    <ResponsiveContainer width="100%" height={120}>
      <BarChart data={data} layout="vertical" barCategoryGap="30%">
        <XAxis type="number" tick={{ fill: '#6B7280', fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey="name" tick={{ fill: '#9CA3AF', fontSize: 13 }} axisLine={false} tickLine={false} width={90} />
        <Tooltip
          formatter={(v: number) => [v, 'Colis']}
          contentStyle={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 8, fontSize: 13 }}
          labelStyle={{ display: 'none' }}
        />
        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
          {data.map((d, i) => <Cell key={i} fill={d.color} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
