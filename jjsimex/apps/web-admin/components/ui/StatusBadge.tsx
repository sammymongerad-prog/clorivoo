import React from 'react';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  // Package statuses
  awaiting_arrival: { label: 'En attente', color: '#F59E0B', bg: 'rgba(245,158,11,0.14)' },
  pending:      { label: 'En attente',   color: '#6B7280', bg: 'rgba(107,114,128,0.14)' },
  received_usa: { label: 'Reçu USA',     color: '#3B82F6', bg: 'rgba(59,130,246,0.14)' },
  in_transit:   { label: 'En transit',   color: '#F97316', bg: 'rgba(249,115,22,0.14)' },
  arrived:      { label: 'Arrivé',       color: '#A855F7', bg: 'rgba(168,85,247,0.14)' },
  ready_pickup: { label: 'Prêt retrait', color: '#06B6D4', bg: 'rgba(6,182,212,0.14)' },
  delivered:    { label: 'Livré',        color: '#22C55E', bg: 'rgba(34,197,94,0.14)' },
  // Payment statuses
  confirmed:    { label: 'Confirmé',     color: '#22C55E', bg: 'rgba(34,197,94,0.14)' },
  failed:       { label: 'Échoué',       color: '#EF4444', bg: 'rgba(239,68,68,0.14)' },
  refunded:     { label: 'Remboursé',    color: '#3B82F6', bg: 'rgba(59,130,246,0.14)' },
  // Shopper statuses
  quoted:       { label: 'Devis envoyé', color: '#3B82F6', bg: 'rgba(59,130,246,0.14)' },
  cancelled:    { label: 'Annulé',       color: '#EF4444', bg: 'rgba(239,68,68,0.14)' },
  purchased:    { label: 'Acheté',       color: '#A855F7', bg: 'rgba(168,85,247,0.14)' },
  shipped:      { label: 'Expédié',      color: '#22C55E', bg: 'rgba(34,197,94,0.14)' },
  // Generic
  actif:        { label: 'Actif',        color: '#22C55E', bg: 'rgba(34,197,94,0.14)' },
  inactif:      { label: 'Inactif',      color: '#6B7280', bg: 'rgba(107,114,128,0.14)' },
  bloqué:       { label: 'Bloqué',       color: '#EF4444', bg: 'rgba(239,68,68,0.14)' },
};

interface StatusBadgeProps {
  status: string;
  label?: string;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, label, size = 'sm' }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status.toLowerCase()] ?? { label: status, color: '#9CA3AF', bg: 'rgba(156,163,175,0.14)' };
  const padding = size === 'md' ? '5px 12px' : '3px 9px';
  const fontSize = size === 'md' ? 13 : 11;
  return (
    <span style={{ backgroundColor: config.bg, color: config.color, fontSize, fontWeight: 600, padding, borderRadius: 999, whiteSpace: 'nowrap' }}>
      {label ?? config.label}
    </span>
  );
}
