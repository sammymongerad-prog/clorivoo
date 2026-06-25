'use client'

import { useEffect, useState } from 'react'
import { getAllPayments, confirmPayment, refusePayment, getPaymentStats, type Payment, type PaymentStats } from '@jjsimex/supabase/payments'
import { useAuth } from '@/contexts/AuthContext'

const methodColor: Record<string, { color: string; bg: string; border: string }> = {
  moncash: { color: '#F97316', bg: 'rgba(249,115,22,0.1)', border: 'rgba(249,115,22,0.3)' },
  zelle: { color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)', border: 'rgba(139,92,246,0.3)' },
  wire: { color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)' },
  cash: { color: '#22C55E', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.3)' },
  visa_mc: { color: '#3B82F6', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.3)' },
}

const statusColor: Record<string, { color: string; bg: string; border: string }> = {
  confirmed: { color: '#22C55E', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.3)' },
  pending: { color: '#F97316', bg: 'rgba(249,115,22,0.1)', border: 'rgba(249,115,22,0.3)' },
  failed: { color: '#EF4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)' },
  refunded: { color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)', border: 'rgba(139,92,246,0.3)' },
}

const methodLabel: Record<string, string> = {
  moncash: 'MonCash',
  zelle: 'Zelle',
  wire: 'Virement',
  cash: 'Espèces',
  visa_mc: 'Carte',
}

const statusLabel: Record<string, string> = {
  confirmed: 'Confirmé ✅',
  pending: 'En attente',
  failed: 'Échoué ❌',
  refunded: 'Remboursé',
}

export default function PaiementsPage() {
  const { user } = useAuth()
  const [payments, setPayments] = useState<Payment[]>([])
  const [stats, setStats] = useState<PaymentStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [methodFilter, setMethodFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [refuseModal, setRefuseModal] = useState<string | null>(null)
  const [refuseReason, setRefuseReason] = useState('')

  useEffect(() => {
    loadPayments()
    loadStats()
  }, [])

  async function loadPayments() {
    try {
      setLoading(true)
      const data = await getAllPayments({
        search: search || undefined,
        method: methodFilter ? (methodFilter as any) : undefined,
        status: statusFilter ? (statusFilter as any) : undefined,
      })
      setPayments(data)
    } catch (error) {
      console.error('Error loading payments:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadStats() {
    try {
      const data = await getPaymentStats('month')
      setStats(data)
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  async function handleConfirm(paymentId: string) {
    if (!user) return
    try {
      setActionLoading(paymentId)
      await confirmPayment(paymentId, user.id)
      await loadPayments()
      await loadStats()
    } catch (error) {
      alert('Erreur: ' + (error instanceof Error ? error.message : 'Impossible de confirmer'))
    } finally {
      setActionLoading(null)
    }
  }

  async function handleRefuse() {
    if (!user || !refuseModal) return
    try {
      setActionLoading(refuseModal)
      await refusePayment(refuseModal, refuseReason || 'Non spécifiée', user.id)
      await loadPayments()
      await loadStats()
      setRefuseModal(null)
      setRefuseReason('')
    } catch (error) {
      alert('Erreur: ' + (error instanceof Error ? error.message : 'Impossible de refuser'))
    } finally {
      setActionLoading(null)
    }
  }

  const filtered = payments.filter(p => {
    if (search && !p.user?.full_name?.toLowerCase().includes(search.toLowerCase()) && !p.transaction_number.toLowerCase().includes(search.toLowerCase())) return false
    if (methodFilter && p.method !== methodFilter) return false
    if (statusFilter && p.status !== statusFilter) return false
    return true
  })

  const inputStyle: React.CSSProperties = { background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 8, color: '#fff', padding: '8px 12px', fontSize: 13, outline: 'none' as const }

  return (
    <div style={{ padding: '28px 32px', background: '#0D0D0D', minHeight: '100vh', color: '#fff', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Paiements</h1>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: '#9CA3AF' }}>Transactions et encaissements</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button style={{ background: 'transparent', border: '1px solid #2A2A2A', borderRadius: 8, color: '#9CA3AF', padding: '8px 12px', cursor: 'pointer', fontSize: 18 }}>🔔</button>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#F97316', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff' }}>MJ</div>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {stats && [
          { label: 'Revenu total', value: `$${stats.total_revenue.toFixed(2)}`, delta: `${stats.period_comparison.percentage_change >= 0 ? '+' : ''}${stats.period_comparison.percentage_change.toFixed(1)}%`, deltaColor: stats.period_comparison.percentage_change >= 0 ? '#22C55E' : '#EF4444', sub: 'vs période précédente' },
          { label: 'Confirmés', value: `$${stats.confirmed_amount.toFixed(2)}`, delta: `${payments.filter(p => p.status === 'confirmed').length} transactions`, deltaColor: '#22C55E', sub: 'validés' },
          { label: 'En attente', value: `$${stats.pending_amount.toFixed(2)}`, delta: `${payments.filter(p => p.status === 'pending').length} transactions`, deltaColor: '#F97316', sub: 'à valider' },
          { label: 'Échoués/Remboursés', value: `$${(stats.failed_amount).toFixed(2)}`, delta: `${payments.filter(p => p.status === 'failed' || p.status === 'refunded').length}`, deltaColor: '#EF4444', sub: 'non confirmés' },
        ].map(kpi => (
          <div key={kpi.label} style={{ background: '#1A1A1A', border: '1px solid #222', borderRadius: 12, padding: '18px 20px' }}>
            <p style={{ margin: 0, fontSize: 12, color: '#9CA3AF' }}>{kpi.label}</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, margin: '8px 0 4px' }}>
              <span style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>{kpi.value}</span>
              {kpi.delta && <span style={{ fontSize: 12, fontWeight: 600, color: kpi.deltaColor }}>{kpi.delta}</span>}
            </div>
            <p style={{ margin: 0, fontSize: 12, color: '#9CA3AF' }}>{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div style={{ background: '#1A1A1A', border: '1px solid #222', borderRadius: 12, padding: '16px 20px', marginBottom: 20, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', fontSize: 14 }}>🔍</span>
          <input placeholder="Rechercher une transaction..." value={search} onChange={e => { setSearch(e.target.value); loadPayments() }}
            style={{ ...inputStyle, paddingLeft: 32, width: '100%', boxSizing: 'border-box' }} />
        </div>
        <select value={methodFilter} onChange={e => { setMethodFilter(e.target.value); loadPayments() }} style={{ ...inputStyle, cursor: 'pointer' }}>
          <option value="">Tous</option><option value="moncash">MonCash</option><option value="zelle">Zelle</option><option value="wire">Virement</option><option value="cash">Espèces</option><option value="visa_mc">Carte</option>
        </select>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); loadPayments() }} style={{ ...inputStyle, cursor: 'pointer' }}>
          <option value="">Tous</option><option value="confirmed">Confirmé</option><option value="pending">En attente</option><option value="failed">Échoué</option><option value="refunded">Remboursé</option>
        </select>
        <button style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 8, color: '#9CA3AF', padding: '8px 16px', cursor: 'pointer', fontSize: 13 }}>⬇ Exporter</button>
      </div>

      {/* Table */}
      <div style={{ background: '#1A1A1A', border: '1px solid #222', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '44px 2fr 1.2fr 0.8fr 1fr 1.2fr 1fr 1fr', padding: '12px 20px', borderBottom: '1px solid #222', background: '#161616' }}>
          {['', 'Client', 'Transaction', 'Méthode', 'Montant', 'Colis', 'Statut', 'Actions'].map((col, i) => (
            <div key={i} style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{col}</div>
          ))}
        </div>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#9CA3AF' }}>Chargement...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#9CA3AF' }}>Aucun paiement trouvé</div>
        ) : filtered.map(p => {
          const m = methodColor[p.method] || { color: '#9CA3AF', bg: '#2A2A2A', border: '#333' }
          const s = statusColor[p.status] || { color: '#9CA3AF', bg: '#2A2A2A', border: '#333' }
          const initials = p.user?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'UN'
          return (
            <div key={p.id}
              onMouseEnter={() => setHoveredRow(p.id)}
              onMouseLeave={() => setHoveredRow(null)}
              style={{ display: 'grid', gridTemplateColumns: '44px 2fr 1.2fr 0.8fr 1fr 1.2fr 1fr 1fr', padding: '14px 20px', borderBottom: '1px solid #1E1E1E', alignItems: 'center', background: hoveredRow === p.id ? '#1F1F1F' : 'transparent', transition: 'background 0.15s' }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#F97316', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{initials}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, gridColumn: 'span 1', marginLeft: -44 }}>
                <div style={{ marginLeft: 44 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{p.user?.full_name || 'Client'}</div>
                  <div style={{ fontSize: 12, color: '#9CA3AF' }}>{p.user?.email}</div>
                </div>
              </div>
              <div style={{ fontSize: 12, color: '#9CA3AF', fontFamily: 'monospace' }}>{p.transaction_number}</div>
              <div><span style={{ background: m.bg, color: m.color, border: `1px solid ${m.border}`, borderRadius: 20, padding: '3px 10px', fontSize: 12 }}>{methodLabel[p.method]}</span></div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>${p.amount.toFixed(2)}</div>
              <div style={{ fontSize: 12, color: '#9CA3AF', fontFamily: 'monospace' }}>{p.package?.tracking_number || '—'}</div>
              <div><span style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, borderRadius: 20, padding: '3px 10px', fontSize: 12 }}>{statusLabel[p.status]}</span></div>
              <div style={{ display: 'flex', gap: 6 }}>
                {p.status === 'pending' && (
                  <>
                    <button onClick={() => handleConfirm(p.id)} disabled={actionLoading === p.id} style={{ background: '#22C55E', border: 'none', borderRadius: 6, color: '#fff', padding: '6px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 600, opacity: actionLoading === p.id ? 0.5 : 1 }}>{actionLoading === p.id ? '...' : 'Confirmer'}</button>
                    <button onClick={() => setRefuseModal(p.id)} style={{ background: '#2A2A2A', border: '1px solid #333', borderRadius: 6, color: '#9CA3AF', padding: '6px 12px', cursor: 'pointer', fontSize: 12 }}>Refuser</button>
                  </>
                )}
                {p.status !== 'pending' && (
                  <div style={{ fontSize: 12, color: '#9CA3AF' }}>—</div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Refuse Modal */}
      {refuseModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 12, padding: 32, maxWidth: 400, width: '90%' }}>
            <h2 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700 }}>Refuser le paiement</h2>
            <p style={{ fontSize: 14, color: '#9CA3AF', marginBottom: 16 }}>Raison du refus</p>
            <textarea
              value={refuseReason}
              onChange={(e) => setRefuseReason(e.target.value)}
              placeholder="Décrire la raison du refus..."
              style={{ width: '100%', background: '#111', border: '1px solid #2A2A2A', borderRadius: 8, color: '#fff', padding: '10px 14px', fontSize: 14, marginBottom: 20, boxSizing: 'border-box', minHeight: 80, fontFamily: 'inherit' }}
            />
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => { setRefuseModal(null); setRefuseReason('') }} style={{ flex: 1, background: '#2A2A2A', border: 'none', borderRadius: 8, color: '#fff', padding: '10px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Annuler</button>
              <button onClick={handleRefuse} disabled={!refuseReason || actionLoading === refuseModal} style={{ flex: 1, background: '#EF4444', border: 'none', borderRadius: 8, color: '#fff', padding: '10px', cursor: 'pointer', fontSize: 13, fontWeight: 600, opacity: !refuseReason || actionLoading === refuseModal ? 0.5 : 1 }}>{actionLoading === refuseModal ? '...' : 'Refuser'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
