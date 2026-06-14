'use client';

import React, { useEffect } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onDismiss: () => void;
}

export function Toast({ message, type = 'success', onDismiss }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3000);
    return () => clearTimeout(t);
  }, [message, onDismiss]);

  const colors = {
    success: { bg: '#14532D', border: '#22C55E', icon: '✓' },
    error:   { bg: '#450A0A', border: '#EF4444', icon: '✕' },
    info:    { bg: '#1e3a5f', border: '#3B82F6', icon: 'ℹ' },
  };
  const c = colors[type];

  return (
    <div style={{ position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, background: c.bg, border: `1px solid ${c.border}`, borderRadius: 999, padding: '12px 24px', color: '#FFFFFF', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
      <span style={{ color: c.border }}>{c.icon}</span>
      {message}
    </div>
  );
}

export function useToast() {
  const [toast, setToast] = React.useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const show = (message: string, type: 'success' | 'error' | 'info' = 'success') => setToast({ message, type });
  const dismiss = () => setToast(null);
  const ToastEl = toast ? <Toast message={toast.message} type={toast.type} onDismiss={dismiss} /> : null;
  return { show, ToastEl };
}
