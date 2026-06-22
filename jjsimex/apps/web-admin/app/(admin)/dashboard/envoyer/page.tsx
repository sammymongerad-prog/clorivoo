'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const STEPS = ['Client', 'Catégorie', 'Détails', 'Transport', 'Confirmation'];

const CATEGORIES = [
  { key: 'telephone', label: 'Téléphone', icon: '📱' },
  { key: 'ordinateur', label: 'Ordinateur', icon: '💻' },
  { key: 'vetements', label: 'Vêtements', icon: '👕' },
  { key: 'chaussures', label: 'Chaussures', icon: '👟' },
  { key: 'electronique', label: 'Électronique', icon: '🔌' },
  { key: 'maison', label: 'Maison', icon: '🏠' },
  { key: 'cosmetiques', label: 'Cosmétiques', icon: '💄' },
  { key: 'autre', label: 'Autre', icon: '📦' },
];

const LOYALTY_DISCOUNTS: Record<string, number> = { bronze: 0, silver: 0.05, gold: 0.10 };

interface Client {
  id: string;
  full_name: string;
  email: string;
  phone_whatsapp: string | null;
  destination_city: string | null;
  destination_country: string | null;
  us_suite: string | null;
  loyalty_level: string;
}

interface ShippingRate {
  destination_city: string;
  destination_country: string;
  air_rate_per_lb: number;
  sea_rate_per_lb: number;
}

interface FormData {
  client: Client | null;
  category: string;
  description: string;
  weight: string;
  declaredValue: string;
  quantity: string;
  photo1: File | null;
  photo2: File | null;
  recipientFirst: string;
  recipientLast: string;
  recipientPhone: string;
  recipientCity: string;
  recipientCountry: string;
  recipientAddress: string;
  transportMode: 'air' | 'sea';
}

export default function EnvoyerPage() {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>({
    client: null, category: '', description: '', weight: '', declaredValue: '', quantity: '1',
    photo1: null, photo2: null,
    recipientFirst: '', recipientLast: '', recipientPhone: '', recipientCity: '', recipientCountry: 'haiti', recipientAddress: '',
    transportMode: 'air',
  });
  const [search, setSearch] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [creating, setCreating] = useState(false);
  const [showNewClient, setShowNewClient] = useState(false);
  const [newClient, setNewClient] = useState({ full_name: '', email: '', phone_whatsapp: '', destination_city: '', destination_country: 'haiti' });
  const [photo1Preview, setPhoto1Preview] = useState<string | null>(null);
  const [photo2Preview, setPhoto2Preview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.from('shipping_rates').select('destination_city, destination_country, air_rate_per_lb, sea_rate_per_lb').eq('is_active', true).then(({ data }) => {
      if (data) setRates(data as ShippingRate[]);
    });
  }, []);

  const searchClients = useCallback(async (q: string) => {
    if (q.length < 2) { setClients([]); return; }
    const { data } = await supabase.from('users').select('id, full_name, email, phone_whatsapp, destination_city, destination_country, us_suite, loyalty_level').eq('role', 'client').or(`full_name.ilike.%${q}%,email.ilike.%${q}%,phone_whatsapp.ilike.%${q}%`).limit(8);
    setClients((data ?? []) as Client[]);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => searchClients(search), 300);
    return () => clearTimeout(t);
  }, [search, searchClients]);

  const handleCreateClient = async () => {
    if (!newClient.full_name || !newClient.email) return;
    setCreating(true);
    const { data, error } = await supabase.from('users').insert({
      ...newClient, role: 'client', loyalty_level: 'bronze',
    }).select('id, full_name, email, phone_whatsapp, destination_city, destination_country, us_suite, loyalty_level').single();
    if (data && !error) {
      setForm(f => ({ ...f, client: data as Client }));
      setShowNewClient(false);
      setNewClient({ full_name: '', email: '', phone_whatsapp: '', destination_city: '', destination_country: 'haiti' });
    }
    setCreating(false);
  };

  const handleFileChange = (key: 'photo1' | 'photo2', file: File | null) => {
    setForm(f => ({ ...f, [key]: file }));
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (key === 'photo1') setPhoto1Preview(e.target?.result as string);
        else setPhoto2Preview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      if (key === 'photo1') setPhoto1Preview(null);
      else setPhoto2Preview(null);
    }
  };

  const citiesForCountry = rates.filter(r => r.destination_country === form.recipientCountry);
  const selectedRate = rates.find(r => r.destination_city === form.recipientCity && r.destination_country === form.recipientCountry);
  const weight = parseFloat(form.weight) || 0;
  const ratePerLb = selectedRate ? (form.transportMode === 'air' ? Number(selectedRate.air_rate_per_lb) : Number(selectedRate.sea_rate_per_lb)) : 0;
  const discount = LOYALTY_DISCOUNTS[form.client?.loyalty_level ?? 'bronze'] ?? 0;
  const shippingCost = Math.round(weight * ratePerLb * (1 - discount) * 100) / 100;
  const insurance = 100;
  const totalEstimated = shippingCost + insurance;

  const uploadPhoto = async (file: File, prefix: string): Promise<string | null> => {
    const ext = file.name.split('.').pop();
    const path = `${prefix}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('shipment-photos').upload(path, file);
    if (error) return null;
    const { data: { publicUrl } } = supabase.storage.from('shipment-photos').getPublicUrl(path);
    return publicUrl;
  };

  const handleSubmit = async (openWhatsApp: boolean) => {
    if (!form.client) return;
    setSubmitting(true);

    let photo1Url: string | null = null;
    let photo2Url: string | null = null;
    if (form.photo1) photo1Url = await uploadPhoto(form.photo1, 'p1');
    if (form.photo2) photo2Url = await uploadPhoto(form.photo2, 'p2');

    const { data: pkg, error } = await supabase.from('packages').insert({
      client_id: form.client.id,
      status: 'awaiting_arrival',
      category: form.category,
      description: form.description,
      real_weight_lbs: weight,
      billed_weight_lbs: weight,
      declared_value: parseFloat(form.declaredValue) || 0,
      quantity: parseInt(form.quantity) || 1,
      destination_city: form.recipientCity,
      destination_country: form.recipientCountry,
      transport_mode: form.transportMode,
      shipping_rate: ratePerLb,
      total_price: totalEstimated,
      insurance_amount: insurance,
      recipient_first_name: form.recipientFirst,
      recipient_last_name: form.recipientLast,
      recipient_phone: form.recipientPhone,
      recipient_address: form.recipientAddress,
      client_photo_1_url: photo1Url,
      client_photo_2_url: photo2Url,
      notes: `Créé par admin pour ${form.client.full_name}`,
    }).select('id, request_number').single();

    if (error || !pkg) {
      console.error('Insert error:', error);
      setSubmitting(false);
      return;
    }

    // Send notification to client
    await supabase.from('notifications').insert({
      user_id: form.client.id,
      title: 'Nouvelle demande créée',
      message: `Votre demande ${pkg.request_number} a été créée. Ajoutez votre numéro de tracking quand disponible.`,
      type: 'package',
    });

    if (openWhatsApp && form.client.phone_whatsapp) {
      const phone = form.client.phone_whatsapp.replace(/\D/g, '');
      const msg = encodeURIComponent(
        `Bonjour ${form.client.full_name},\n\nVotre demande d'envoi a été créée !\n\n` +
        `📦 Réf: ${pkg.request_number}\n` +
        `📋 ${form.category} — ${form.description}\n` +
        `⚖️ ${weight} lbs | ${form.transportMode === 'air' ? '✈ Avion' : '🚢 Bateau'}\n` +
        `📍 ${form.recipientCity}, ${form.recipientCountry === 'haiti' ? 'Haïti' : 'Rép. Dom.'}\n` +
        `💰 Total estimé: $${totalEstimated.toFixed(2)}\n\n` +
        `Envoyez-nous le tracking de votre colis dès que possible.\n\nMerci, JJ's IMEX`
      );
      window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
    }

    router.push(`/dashboard/colis?success=${pkg.request_number}`);
  };

  const canContinue = () => {
    switch (step) {
      case 0: return !!form.client;
      case 1: return !!form.category;
      case 2: return !!form.description && !!form.weight && !!form.recipientFirst && !!form.recipientLast && !!form.recipientPhone && !!form.recipientCity;
      case 3: return !!form.transportMode;
      default: return true;
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: '#FFFFFF', margin: 0 }}>Envoyer un colis</h1>

      {/* Progress */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
        {STEPS.map((s, i) => (
          <React.Fragment key={s}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700,
                background: i <= step ? '#F97316' : '#2A2A2A',
                color: i <= step ? '#0D0D0D' : '#6B7280',
              }}>{i + 1}</div>
              <span style={{ fontSize: 12, fontWeight: 600, color: i <= step ? '#FFFFFF' : '#6B7280', whiteSpace: 'nowrap' }}>{s}</span>
            </div>
            {i < STEPS.length - 1 && <div style={{ flex: 1, height: 2, background: i < step ? '#F97316' : '#2A2A2A', margin: '0 8px' }} />}
          </React.Fragment>
        ))}
      </div>

      {/* Step 1: Client */}
      {step === 0 && (
        <div style={{ background: '#1A1A1A', border: '1px solid #222', borderRadius: 12, padding: 24 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#FFFFFF', marginBottom: 16 }}>Pour quel client ?</div>

          {form.client ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16, background: '#111', borderRadius: 10, border: '1px solid #F97316' }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#F97316', color: '#0D0D0D', fontWeight: 700, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {form.client.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF' }}>{form.client.full_name}</div>
                <div style={{ fontSize: 12, color: '#9CA3AF' }}>{form.client.email} {form.client.phone_whatsapp && `· ${form.client.phone_whatsapp}`}</div>
                {form.client.us_suite && <div style={{ fontSize: 11, color: '#F97316', marginTop: 2 }}>Suite: {form.client.us_suite}</div>}
              </div>
              <button onClick={() => setForm(f => ({ ...f, client: null }))} style={{ background: '#2A2A2A', border: 'none', borderRadius: 8, padding: '8px 14px', color: '#9CA3AF', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Changer</button>
            </div>
          ) : (
            <>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher par nom, email ou téléphone..."
                style={{ width: '100%', boxSizing: 'border-box', background: '#0D0D0D', border: '1px solid #2A2A2A', borderRadius: 8, color: '#FFFFFF', padding: '12px 14px', fontSize: 13, fontFamily: 'inherit', outline: 'none', marginBottom: 12 }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 280, overflowY: 'auto' }}>
                {clients.map(c => (
                  <button key={c.id} onClick={() => { setForm(f => ({ ...f, client: c, recipientCity: c.destination_city || '', recipientCountry: c.destination_country || 'haiti' })); setSearch(''); setClients([]); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: '#111', border: '1px solid #2A2A2A', borderRadius: 8, cursor: 'pointer', textAlign: 'left' }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#F97316', color: '#0D0D0D', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {c.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#FFFFFF' }}>{c.full_name}</div>
                      <div style={{ fontSize: 11, color: '#9CA3AF' }}>{c.email}{c.destination_city ? ` · ${c.destination_city}` : ''}</div>
                    </div>
                  </button>
                ))}
                {search.length >= 2 && clients.length === 0 && <div style={{ color: '#6B7280', fontSize: 13, textAlign: 'center', padding: 16 }}>Aucun client trouvé</div>}
              </div>

              {!showNewClient ? (
                <button onClick={() => setShowNewClient(true)} style={{ marginTop: 12, width: '100%', padding: 12, background: 'none', border: '1px dashed #F97316', borderRadius: 8, color: '#F97316', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                  + Créer un nouveau client
                </button>
              ) : (
                <div style={{ marginTop: 12, padding: 16, background: '#111', borderRadius: 10, border: '1px solid #2A2A2A' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF', marginBottom: 12 }}>Nouveau client</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <Input label="Nom complet *" value={newClient.full_name} onChange={v => setNewClient(n => ({ ...n, full_name: v }))} span={2} />
                    <Input label="Email *" value={newClient.email} onChange={v => setNewClient(n => ({ ...n, email: v }))} />
                    <Input label="Téléphone WhatsApp" value={newClient.phone_whatsapp} onChange={v => setNewClient(n => ({ ...n, phone_whatsapp: v }))} />
                    <div>
                      <label style={labelStyle}>Pays</label>
                      <select value={newClient.destination_country} onChange={e => setNewClient(n => ({ ...n, destination_country: e.target.value, destination_city: '' }))} style={inputStyle}>
                        <option value="haiti">Haïti</option>
                        <option value="dr">Rép. Dominicaine</option>
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Ville</label>
                      <select value={newClient.destination_city} onChange={e => setNewClient(n => ({ ...n, destination_city: e.target.value }))} style={inputStyle}>
                        <option value="">Sélectionner...</option>
                        {rates.filter(r => r.destination_country === newClient.destination_country).map(r => (
                          <option key={r.destination_city} value={r.destination_city}>{r.destination_city}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    <button onClick={() => setShowNewClient(false)} style={{ flex: 1, padding: 10, background: '#2A2A2A', border: 'none', borderRadius: 8, color: '#9CA3AF', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Annuler</button>
                    <button onClick={handleCreateClient} disabled={creating || !newClient.full_name || !newClient.email} style={{ flex: 1, padding: 10, background: '#F97316', border: 'none', borderRadius: 8, color: '#0D0D0D', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: creating ? 0.6 : 1 }}>
                      {creating ? 'Création...' : 'Créer'}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Step 2: Category */}
      {step === 1 && (
        <div style={{ background: '#1A1A1A', border: '1px solid #222', borderRadius: 12, padding: 24 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#FFFFFF', marginBottom: 16 }}>Catégorie du colis</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {CATEGORIES.map(c => (
              <button key={c.key} onClick={() => setForm(f => ({ ...f, category: c.key }))}
                style={{
                  padding: 16, background: '#111', border: form.category === c.key ? '2px solid #F97316' : '1px solid #2A2A2A',
                  borderRadius: 10, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                }}>
                <span style={{ fontSize: 28 }}>{c.icon}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: form.category === c.key ? '#F97316' : '#9CA3AF' }}>{c.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Details + Recipient + Photos */}
      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: '#1A1A1A', border: '1px solid #222', borderRadius: 12, padding: 24 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#FFFFFF', marginBottom: 16 }}>Le produit</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Input label="Description *" value={form.description} onChange={v => setForm(f => ({ ...f, description: v }))} span={2} />
              <Input label="Poids estimé (lbs) *" value={form.weight} onChange={v => setForm(f => ({ ...f, weight: v }))} type="number" />
              <Input label="Valeur déclarée ($)" value={form.declaredValue} onChange={v => setForm(f => ({ ...f, declaredValue: v }))} type="number" />
              <Input label="Quantité" value={form.quantity} onChange={v => setForm(f => ({ ...f, quantity: v }))} type="number" />
            </div>
          </div>

          <div style={{ background: '#1A1A1A', border: '1px solid #222', borderRadius: 12, padding: 24 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#FFFFFF', marginBottom: 12 }}>Photos du produit (optionnel)</div>
            <div style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.3)', borderRadius: 8, padding: 12, marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: '#F97316', fontWeight: 600 }}>⚠ Écrivez le nom du client et du destinataire sur le colis avant la photo</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <PhotoUpload label="Photo 1" preview={photo1Preview} onChange={f => handleFileChange('photo1', f)} onClear={() => handleFileChange('photo1', null)} />
              <PhotoUpload label="Photo 2" preview={photo2Preview} onChange={f => handleFileChange('photo2', f)} onClear={() => handleFileChange('photo2', null)} />
            </div>
          </div>

          <div style={{ background: '#1A1A1A', border: '1px solid #222', borderRadius: 12, padding: 24 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#FFFFFF', marginBottom: 16 }}>Destinataire</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Input label="Prénom *" value={form.recipientFirst} onChange={v => setForm(f => ({ ...f, recipientFirst: v }))} />
              <Input label="Nom *" value={form.recipientLast} onChange={v => setForm(f => ({ ...f, recipientLast: v }))} />
              <Input label="Téléphone *" value={form.recipientPhone} onChange={v => setForm(f => ({ ...f, recipientPhone: v }))} />
              <div>
                <label style={labelStyle}>Pays</label>
                <select value={form.recipientCountry} onChange={e => setForm(f => ({ ...f, recipientCountry: e.target.value, recipientCity: '' }))} style={inputStyle}>
                  <option value="haiti">Haïti</option>
                  <option value="dr">Rép. Dominicaine</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Ville *</label>
                <select value={form.recipientCity} onChange={e => setForm(f => ({ ...f, recipientCity: e.target.value }))} style={inputStyle}>
                  <option value="">Sélectionner...</option>
                  {citiesForCountry.map(r => (
                    <option key={r.destination_city} value={r.destination_city}>{r.destination_city}</option>
                  ))}
                </select>
              </div>
              <Input label="Adresse complète" value={form.recipientAddress} onChange={v => setForm(f => ({ ...f, recipientAddress: v }))} />
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Transport */}
      {step === 3 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: '#1A1A1A', border: '1px solid #222', borderRadius: 12, padding: 24 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#FFFFFF', marginBottom: 16 }}>Mode de transport</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {(['air', 'sea'] as const).map(mode => {
                const r = selectedRate;
                const rate = r ? (mode === 'air' ? Number(r.air_rate_per_lb) : Number(r.sea_rate_per_lb)) : 0;
                const cost = Math.round(weight * rate * (1 - discount) * 100) / 100;
                return (
                  <button key={mode} onClick={() => setForm(f => ({ ...f, transportMode: mode }))}
                    style={{
                      padding: 20, background: '#111', border: form.transportMode === mode ? '2px solid #F97316' : '1px solid #2A2A2A',
                      borderRadius: 12, cursor: 'pointer', textAlign: 'left',
                    }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>{mode === 'air' ? '✈' : '🚢'}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: form.transportMode === mode ? '#F97316' : '#FFFFFF' }}>
                      {mode === 'air' ? 'Avion' : 'Bateau'}
                    </div>
                    <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>
                      {mode === 'air' ? '3-5 jours' : '2-4 semaines'}
                    </div>
                    <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>${rate}/lb</div>
                    {discount > 0 && <div style={{ fontSize: 11, color: '#22C55E', marginTop: 2 }}>-{(discount * 100).toFixed(0)}% fidélité</div>}
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#F97316', marginTop: 8 }}>${cost.toFixed(2)}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ background: '#1A1A1A', border: '1px solid #222', borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF', marginBottom: 12 }}>Résumé</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <SummaryRow label="Catégorie" value={CATEGORIES.find(c => c.key === form.category)?.label ?? form.category} />
              <SummaryRow label="Description" value={form.description} />
              <SummaryRow label="Poids estimé" value={`${weight} lbs`} />
              <SummaryRow label="Mode" value={form.transportMode === 'air' ? '✈ Avion' : '🚢 Bateau'} />
              <SummaryRow label="Destination" value={`${form.recipientCity}, ${form.recipientCountry === 'haiti' ? 'Haïti' : 'Rép. Dom.'}`} />
              <div style={{ borderTop: '1px solid #2A2A2A', paddingTop: 8, marginTop: 4 }} />
              <SummaryRow label="Expédition" value={`$${shippingCost.toFixed(2)}`} />
              <SummaryRow label="Assurance" value="$100.00" />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 800, color: '#F97316', marginTop: 4 }}>
                <span>TOTAL ESTIMÉ</span>
                <span>${totalEstimated.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 5: Confirmation */}
      {step === 4 && (
        <div style={{ background: '#1A1A1A', border: '1px solid #222', borderRadius: 12, padding: 24 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#FFFFFF', marginBottom: 16 }}>Récapitulatif final</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ padding: 14, background: '#111', borderRadius: 10, border: '1px solid #2A2A2A' }}>
              <div style={{ fontSize: 11, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Client</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF' }}>{form.client?.full_name}</div>
              <div style={{ fontSize: 12, color: '#9CA3AF' }}>{form.client?.email} {form.client?.phone_whatsapp && `· ${form.client.phone_whatsapp}`}</div>
            </div>

            <div style={{ padding: 14, background: '#111', borderRadius: 10, border: '1px solid #2A2A2A' }}>
              <div style={{ fontSize: 11, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Colis</div>
              <div style={{ fontSize: 14, color: '#FFFFFF' }}>
                {CATEGORIES.find(c => c.key === form.category)?.icon} {CATEGORIES.find(c => c.key === form.category)?.label} — {form.description}
              </div>
              <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{weight} lbs · Qty: {form.quantity} · Valeur: ${form.declaredValue || '0'}</div>
            </div>

            <div style={{ padding: 14, background: '#111', borderRadius: 10, border: '1px solid #2A2A2A' }}>
              <div style={{ fontSize: 11, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Destinataire</div>
              <div style={{ fontSize: 14, color: '#FFFFFF' }}>{form.recipientFirst} {form.recipientLast}</div>
              <div style={{ fontSize: 12, color: '#9CA3AF' }}>{form.recipientPhone} · {form.recipientCity}, {form.recipientCountry === 'haiti' ? 'Haïti' : 'Rép. Dom.'}</div>
              {form.recipientAddress && <div style={{ fontSize: 12, color: '#9CA3AF' }}>{form.recipientAddress}</div>}
            </div>

            <div style={{ padding: 14, background: '#111', borderRadius: 10, border: '1px solid #2A2A2A' }}>
              <div style={{ fontSize: 11, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Transport & Tarif</div>
              <div style={{ fontSize: 14, color: '#FFFFFF' }}>{form.transportMode === 'air' ? '✈ Avion (3-5 jours)' : '🚢 Bateau (2-4 semaines)'}</div>
              <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>Expédition: ${shippingCost.toFixed(2)} · Assurance: $100</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#F97316', marginTop: 6 }}>Total: ${totalEstimated.toFixed(2)}</div>
            </div>

            {(photo1Preview || photo2Preview) && (
              <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                {photo1Preview && <img src={photo1Preview} alt="Photo 1" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid #2A2A2A' }} />}
                {photo2Preview && <img src={photo2Preview} alt="Photo 2" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid #2A2A2A' }} />}
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 20 }}>
            <button onClick={() => handleSubmit(false)} disabled={submitting}
              style={{ padding: 14, background: '#F97316', border: 'none', borderRadius: 10, color: '#0D0D0D', fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: submitting ? 0.6 : 1 }}>
              {submitting ? 'Création...' : 'Créer la demande'}
            </button>
            <button onClick={() => handleSubmit(true)} disabled={submitting || !form.client?.phone_whatsapp}
              style={{ padding: 14, background: '#25D366', border: 'none', borderRadius: 10, color: '#FFFFFF', fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: (submitting || !form.client?.phone_whatsapp) ? 0.5 : 1 }}>
              {submitting ? 'Création...' : 'Créer + WhatsApp'}
            </button>
          </div>
        </div>
      )}

      {/* Navigation buttons */}
      {step < 4 && (
        <div style={{ display: 'flex', gap: 12 }}>
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)} style={{ flex: 1, padding: 14, background: '#2A2A2A', border: 'none', borderRadius: 10, color: '#9CA3AF', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              ← Retour
            </button>
          )}
          <button onClick={() => setStep(s => s + 1)} disabled={!canContinue()}
            style={{ flex: 2, padding: 14, background: canContinue() ? '#F97316' : '#2A2A2A', border: 'none', borderRadius: 10, color: canContinue() ? '#0D0D0D' : '#6B7280', fontSize: 14, fontWeight: 700, cursor: canContinue() ? 'pointer' : 'default' }}>
            Continuer →
          </button>
        </div>
      )}
    </div>
  );
}

// --- Sub-components ---

const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, color: '#9CA3AF', marginBottom: 4, fontWeight: 500 };
const inputStyle: React.CSSProperties = { width: '100%', boxSizing: 'border-box', background: '#0D0D0D', border: '1px solid #2A2A2A', borderRadius: 8, color: '#FFFFFF', padding: '10px 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none' };

function Input({ label, value, onChange, type = 'text', span }: { label: string; value: string; onChange: (v: string) => void; type?: string; span?: number }) {
  return (
    <div style={span === 2 ? { gridColumn: 'span 2' } : undefined}>
      <label style={labelStyle}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} style={inputStyle} />
    </div>
  );
}

function PhotoUpload({ label, preview, onChange, onClear }: { label: string; preview: string | null; onChange: (f: File) => void; onClear: () => void }) {
  return (
    <div style={{ border: '1px dashed #2A2A2A', borderRadius: 10, padding: 16, textAlign: 'center', position: 'relative' }}>
      {preview ? (
        <>
          <img src={preview} alt={label} style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 8 }} />
          <button onClick={onClear} style={{ position: 'absolute', top: 8, right: 8, width: 24, height: 24, borderRadius: '50%', background: '#EF4444', border: 'none', color: '#FFF', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>✕</button>
        </>
      ) : (
        <>
          <div style={{ fontSize: 24, color: '#6B7280', marginBottom: 4 }}>📷</div>
          <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 8 }}>{label}</div>
          <label style={{ display: 'inline-block', padding: '8px 16px', background: '#2A2A2A', borderRadius: 8, color: '#FFFFFF', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            Choisir
            <input type="file" accept="image/*" onChange={e => { if (e.target.files?.[0]) onChange(e.target.files[0]); }} style={{ display: 'none' }} />
          </label>
        </>
      )}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
      <span style={{ color: '#9CA3AF' }}>{label}</span>
      <span style={{ color: '#FFFFFF', fontWeight: 500 }}>{value}</span>
    </div>
  );
}
