import React from 'react';

type BadgeVariant = 'orange' | 'green' | 'red' | 'gray' | 'blue';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
}

// Composant Badge réutilisable dans le web admin
const VARIANTS: Record<BadgeVariant, string> = {
  orange: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
  green: 'bg-green-500/20 text-green-400 border border-green-500/30',
  red: 'bg-red-500/20 text-red-400 border border-red-500/30',
  gray: 'bg-[#2A2A2A] text-[#9CA3AF] border border-[#3A3A3A]',
  blue: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
};

export default function Badge({ label, variant = 'gray', size = 'sm' }: BadgeProps) {
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1';
  return (
    <span className={`inline-flex items-center rounded-full font-medium ${sizeClass} ${VARIANTS[variant]}`}>
      {label}
    </span>
  );
}
