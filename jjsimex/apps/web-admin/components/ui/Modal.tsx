'use client';

import React, { useEffect } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: number;
}

export function Modal({ open, onClose, title, children, maxWidth = 640 }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: '#111111', border: '1px solid #2A2A2A', borderRadius: 20, width: '100%', maxWidth, maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}
      >
        {title && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 28px 0' }}>
            <span style={{ fontSize: 18, fontWeight: 700, color: '#FFFFFF' }}>{title}</span>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#9CA3AF', fontSize: 22, cursor: 'pointer', lineHeight: 1, padding: 0 }}>✕</button>
          </div>
        )}
        <div style={{ padding: 28, paddingTop: title ? 20 : 28 }}>{children}</div>
      </div>
    </div>
  );
}
