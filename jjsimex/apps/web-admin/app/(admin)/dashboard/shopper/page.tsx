'use client'

import { useEffect, useState } from 'react'
import { getAllShopperRequests, sendQuote, markAsPurchased, markAsShipped, cancelRequest, type ShopperRequest } from '@jjsimex/supabase/shopper'
import { useAuth } from '@/contexts/AuthContext'

const siteStyle: Record<string, { color: string; bg: string }> = {
  Amazon: { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  Shein: { color: '#EC4899', bg: 'rgba(236,72,153,0.12)' },
  Nike: { color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
  Walmart: { color: '#22C55E', bg: 'rgba(34,197,94,0.12)' },
}

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function getColorForName(name: string): string {
  const colors = ['#F97316', '#22C55E', '#8B5CF6', '#EC4899', '#06B6D4', '#9CA3AF', '#F59E0B', '#EF4444']
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return colors[hash % colors.length]
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function getModeEmoji(mode: string): string {
  return mode === 'air' ? '✈️' : '🚢'
}

export default function ShopperPage() {
  const { user } = useAuth()
  const [requests, setRequests] = useState<ShopperRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('pending')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showQuoteModal, setShowQuoteModal] = useState(false)
  const [quotePrice, setQuotePrice] = useState('')
  const [quoteLoading, setQuoteLoading] = useState(false)

  useEffect(() => {
    loadRequests()
  }, [])

  async function loadRequests() {
    try {
      setLoading(true)
      const data = await getAllShopperRequests()
      setRequests(data)
    } catch (error) {
      console.error('Erreur lors du chargement des demandes:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSendQuote() {
    if (!user || !selectedId || !quotePrice) return
    try {
      setQuoteLoading(true)
      await sendQuote(selectedId, parseFloat(quotePrice), user.id)
      await loadRequests()
      setShowQuoteModal(false)
      setQuotePrice('')
      setSelectedId(null)
    } catch (error) {
      alert('Erreur: ' + (error instanceof Error ? error.message : 'Impossible d\'envoyer le devis'))
    } finally {
      setQuoteLoading(false)
    }
  }

  const filteredRequests = requests.filter(r => {
    if (activeTab === 'pending') return r.status === 'pending'
    if (activeTab === 'processing') return r.status === 'quoted'
    if (activeTab === 'completed') return r.status === 'shipped'
    if (activeTab === 'cancelled') return r.status === 'cancelled'
    return true
  })

  const statusCounts = {
    pending: requests.filter(r => r.status === 'pending').length,
    processing: requests.filter(r => r.status === 'quoted').length,
    completed: requests.filter(r => r.status === 'shipped').length,
    cancelled: requests.filter(r => r.status === 'cancelled').length,
  }

  const tabs = [
    { id: 'pending', label: 'En attente', count: statusCounts.pending },
    { id: 'processing', label: 'En cours', count: statusCounts.processing },
    { id: 'completed', label: 'Complétées', count: statusCounts.completed },
    { id: 'cancelled', label: 'Annulées', count: statusCounts.cancelled },
  ]

  const selected = requests.find(r => r.id === selectedId)

  return (
    <div style={{ padding: '28px 32px', background: '#0D0D0D', minHeight: '100vh', color: '#fff', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Personal Shopper</h1>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: '#F97316', fontWeight: 500 }}>{statusCounts.pending} demandes en attente de traitement</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button style={{ background: 'transparent', border: '1px solid #2A2A2A', borderRadius: 8, color: '#9CA3AF', padding: '8px 12px', cursor: 'pointer', fontSize: 18 }}>🔔</button>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#F97316', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff' }}>{user?.email?.slice(0, 2).toUpperCase()}</div>
        </div>
      </div>

      {/* Stats pills */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { label: 'En attente', value: String(statusCounts.pending), color: '#F97316', bg: 'rgba(249,115,22,0.1)' },
          { label: 'En cours', value: String(statusCounts.processing), color: '#3B82F6', bg: 'rgba(59,130,246,0.1)' },
          { label: 'Complétées', value: String(statusCounts.completed), color: '#22C55E', bg: 'rgba(34,197,94,0.1)' },
          { label: 'Annulées', value: String(statusCounts.cancelled), color: '#9CA3AF', bg: '#1A1A1A' },
        ].map(pill => (
          <div key={pill.label} style={{ background: pill.bg, border: '1px solid #2A2A2A', borderRadius: 20, padding: '6px 14px', fontSize: 13, display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ color: '#9CA3AF' }}>{pill.label}:</span>
            <span style={{ color: pill.color, fontWeight: 700 }}>{pill.value}</span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: '#1A1A1A', border: '1px solid #222', borderRadius: 10, padding: 4, width: 'fit-content' }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{ background: activeTab === tab.id ? '#2A2A2A' : 'transparent', border: activeTab === tab.id ? '1px solid #333' : '1px solid transparent', borderRadius: 8, color: activeTab === tab.id ? '#fff' : '#9CA3AF', padding: '7px 14px', cursor: 'pointer', fontSize: 13, fontWeight: activeTab === tab.id ? 600 : 400, display: 'flex', alignItems: 'center', gap: 7, transition: 'all 0.15s' }}>
            {tab.label}
            <span style={{ background: activeTab === tab.id ? '#F97316' : '#2A2A2A', color: '#fff', borderRadius: 20, padding: '1px 7px', fontSize: 11, fontWeight: 700 }}>{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Content: two-panel layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '60% 40%', gap: 16 }}>
        {/* Left: request list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {loading ? (
            <div style={{ background: '#1A1A1A', border: '1px solid #222', borderRadius: 12, padding: 40, textAlign: 'center' }}>
              <p style={{ color: '#9CA3AF', fontSize: 14 }}>Chargement...</p>
            </div>
          ) : filteredRequests.length > 0 ? filteredRequests.map(req => {
            const ss = siteStyle[req.merchant] || { color: '#9CA3AF', bg: '#2A2A2A' }
            const isSelected = selectedId === req.id
            const initials = getInitials(req.client_id)
            const color = getColorForName(req.client_id)
            return (
              <div key={req.id} onClick={() => setSelectedId(isSelected ? null : req.id)}
                style={{ background: isSelected ? '#1F1F1F' : '#1A1A1A', border: `1px solid ${isSelected ? '#F97316' : '#222'}`, borderRadius: 12, padding: '16px 18px', cursor: 'pointer', transition: 'all 0.15s' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{initials}</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{req.request_number}</div>
                      <div style={{ fontSize: 12, color: '#9CA3AF' }}>{req.destination_city}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span style={{ background: ss.bg, color: ss.color, border: `1px solid ${ss.color}30`, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>{req.merchant}</span>
                    <span style={{ fontSize: 16 }}>{getModeEmoji(req.transport_mode)}</span>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>
                  🔗 <span style={{ color: '#3B82F6' }}>{req.product_url}</span>
                </div>
                <div style={{ display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, color: '#9CA3AF' }}>Qté: <span style={{ color: '#fff', fontWeight: 600 }}>{req.quantity}</span></span>
                  <span style={{ fontSize: 12, color: '#9CA3AF' }}>Prix: <span style={{ color: '#fff', fontWeight: 600 }}>${req.estimated_price.toFixed(2)}</span></span>
                  <span style={{ fontSize: 12, color: '#9CA3AF' }}>{formatDate(req.created_at)}</span>
                </div>
              </div>
            )
          }) : (
            <div style={{ background: '#1A1A1A', border: '1px solid #222', borderRadius: 12, padding: 40, textAlign: 'center' }}>
              <p style={{ color: '#9CA3AF', fontSize: 14 }}>Aucune demande dans cette catégorie</p>
            </div>
          )}
        </div>

        {/* Right: detail panel */}
        <div style={{ position: 'sticky', top: 20 }}>
          <div style={{ background: '#1A1A1A', border: `1px solid ${selected ? '#2A2A2A' : '#222'}`, borderRadius: 12, padding: 24, minHeight: 400 }}>
            {selected ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: getColorForName(selected.client_id), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff' }}>{getInitials(selected.client_id)}</div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{selected.request_number}</div>
                    <div style={{ fontSize: 13, color: '#9CA3AF' }}>{selected.status}</div>
                  </div>
                </div>
                <div style={{ borderTop: '1px solid #2A2A2A', paddingTop: 16, marginBottom: 16 }}>
                  <p style={{ fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px' }}>Lien produit</p>
                  <p style={{ margin: 0, fontSize: 12, color: '#3B82F6', wordBreak: 'break-all' }}>{selected.product_url}</p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                  {[
                    { label: 'Marchand', value: selected.merchant },
                    { label: 'Quantité', value: String(selected.quantity) },
                    { label: 'Destination', value: selected.destination_city },
                    { label: 'Mode', value: selected.transport_mode === 'air' ? 'Avion' : 'Bateau' },
                  ].map(d => (
                    <div key={d.label} style={{ background: '#111', border: '1px solid #222', borderRadius: 8, padding: '10px 14px' }}>
                      <p style={{ margin: 0, fontSize: 11, color: '#9CA3AF' }}>{d.label}</p>
                      <p style={{ margin: '4px 0 0', fontSize: 13, fontWeight: 600, color: '#fff' }}>{d.value}</p>
                    </div>
                  ))}
                </div>
                {selected.notes && (
                  <div style={{ background: '#111', border: '1px solid #222', borderRadius: 8, padding: '10px 14px', marginBottom: 16 }}>
                    <p style={{ margin: 0, fontSize: 11, color: '#9CA3AF' }}>Notes</p>
                    <p style={{ margin: '4px 0 0', fontSize: 12, color: '#D1D5DB' }}>{selected.notes}</p>
                  </div>
                )}
                <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                  {selected.status === 'pending' && (
                    <>
                      <button onClick={() => setShowQuoteModal(true)} style={{ flex: 1, background: '#F97316', border: 'none', borderRadius: 8, color: '#fff', padding: '10px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Envoyer un devis</button>
                      <button onClick={() => cancelRequest(selected.id, 'Admin refusal', user?.id || '')} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, color: '#EF4444', padding: '10px 16px', cursor: 'pointer', fontSize: 13 }}>Refuser</button>
                    </>
                  )}
                  {selected.status === 'quoted' && (
                    <>
                      <button onClick={() => markAsPurchased(selected.id, user?.id || '')} style={{ flex: 1, background: '#22C55E', border: 'none', borderRadius: 8, color: '#fff', padding: '10px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Marquer comme acheté</button>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 360, border: '2px dashed #2A2A2A', borderRadius: 10 }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🛍️</div>
                <p style={{ color: '#9CA3AF', fontSize: 14, textAlign: 'center', margin: 0 }}>Détail commande</p>
                <p style={{ color: '#555', fontSize: 13, textAlign: 'center', margin: '6px 0 0' }}>Sélectionnez une demande</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quote Modal */}
      {showQuoteModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 12, padding: 32, maxWidth: 400, width: '90%' }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Envoyer un devis</h2>
            <p style={{ fontSize: 14, color: '#9CA3AF', marginBottom: 16 }}>Prix final du produit (avant expédition)</p>
            <input
              type="number"
              step="0.01"
              min="0"
              value={quotePrice}
              onChange={(e) => setQuotePrice(e.target.value)}
              placeholder="$0.00"
              style={{ width: '100%', background: '#111', border: '1px solid #2A2A2A', borderRadius: 8, color: '#fff', padding: '10px 14px', fontSize: 14, marginBottom: 20, boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowQuoteModal(false)} style={{ flex: 1, background: '#2A2A2A', border: 'none', borderRadius: 8, color: '#fff', padding: '10px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Annuler</button>
              <button onClick={handleSendQuote} disabled={!quotePrice || quoteLoading} style={{ flex: 1, background: '#F97316', border: 'none', borderRadius: 8, color: '#fff', padding: '10px', cursor: 'pointer', fontSize: 13, fontWeight: 600, opacity: !quotePrice || quoteLoading ? 0.5 : 1 }}>{quoteLoading ? 'Envoi...' : 'Envoyer'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
