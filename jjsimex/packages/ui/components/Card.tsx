import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
}

// Carte de base JJ's IMEX — fond #1A1A1A, border radius 16px
export default function Card({ children, className = '', padding = true }: CardProps) {
  return (
    <div
      className={`bg-[#1A1A1A] rounded-card border border-[#2A2A2A] ${padding ? 'p-4' : ''} ${className}`}
    >
      {children}
    </div>
  );
}
