import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, RADIUS, SHADOW } from '../../lib/tokens';
import { Btn, Avatar } from '../../components/UI';
import { getProduct, upsertCartItem } from '../../lib/supabase';
import { useSession } from '../../hooks/useSession';
import { sendLocalNotification } from '../../lib/notifications';

export default function ProductScreen({ route, navigation }) {
  const { productId, product: initialProduct } = route.params ?? {};
  const session = useSession();
  const [product, setProduct]         = useState(initialProduct ?? null);
  const [selectedColor, setColor]     = useState(0);
  const [selectedSize, setSize]       = useState(1);
  const [activeTab, setActiveTab]     = useState(0);
  const [addedToCart, setAdded]       = useState(false);
  const [loading, setLoading]         = useState(false);

  const colors = ['#C97B5A', '#3B3730', '#E6E1D4', '#7A8A6A'];
  const sizes  = ['XS', 'S', 'M', 'L', 'XL'];

  useEffect(() => {
    if (productId && !product) getProduct(productId).then(p => p && setProduct(p));
  }, [productId]);

  async function addToCart() {
    if (!session?.user) { Alert.alert('Connexion requise', 'Connectez-vous pour ajouter au panier.'); return; }
    setLoading(true);
    await upsertCartItem(session.user.id, product.id, { size: sizes[selectedSize] }, 1, product.price);
    setLoading(false);
    setAdded(true);
    await sendLocalNotification('Ajouté au panier 🛒', `${product.title} a été ajouté à votre panier.`);
    setTimeout(() => setAdded(false), 2000);
  }

  if (!product) return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={COLORS.primary} size="large" />
    </View>
  );

  const img = product.images?.[0];
  const discount = product.compare_price && product.price < product.compare_price
    ? Math.round((1 - product.price / product.compare_price) * 100) : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.white }} edges={['top']}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }}>

        {/* Gallery */}
        <View style={{ height: 320, backgroundColor: COLORS.primarySoft, position: 'relative' }}>
          {img
            ? <Image source={{ uri: img }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            : <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 64 }}>🛍️</Text></View>
          }
          {/* Back button */}
          <TouchableOpacity onPress={() => navigation.goBack()}
            style={{ position: 'absolute', top: 16, left: 16, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 16 }}>←</Text>
          </TouchableOpacity>
          {discount && (
            <View style={{ position: 'absolute', top: 16, right: 16, backgroundColor: COLORS.primarySoft, borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 4 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.primaryDeep }}>-{discount}%</Text>
            </View>
          )}
        </View>

        <View style={{ padding: 20, gap: 16 }}>
          {/* Price + title */}
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
              <Text style={{ fontSize: 26, fontWeight: '700', color: COLORS.primary }}>${(+(product.price ?? 0)).toFixed(2)}</Text>
              {product.compare_price && product.compare_price > product.price && (
                <Text style={{ fontSize: 15, color: COLORS.mute, textDecorationLine: 'line-through' }}>${(+(product.compare_price)).toFixed(2)}</Text>
              )}
            </View>
            <Text style={{ fontSize: 17, fontWeight: '600', color: COLORS.ink, lineHeight: 24, marginBottom: 8 }}>{product.title}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ color: '#F59E0B', fontSize: 14 }}>{'★'.repeat(Math.round(product.rating ?? 4.8))}</Text>
              <Text style={{ fontSize: 13, color: COLORS.mute }}>{product.rating ?? 4.8} · {(product.reviews_count ?? 234).toLocaleString()} avis</Text>
            </View>
          </View>

          {/* Color picker */}
          <View>
            <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.ink, marginBottom: 10 }}>Couleur</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {colors.map((c, i) => (
                <TouchableOpacity key={i} onPress={() => setColor(i)}
                  style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: c, borderWidth: i === selectedColor ? 2.5 : 0, borderColor: COLORS.primary }} />
              ))}
            </View>
          </View>

          {/* Size picker */}
          <View>
            <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.ink, marginBottom: 10 }}>Taille</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {sizes.map((s, i) => (
                <TouchableOpacity key={i} onPress={() => setSize(i)}
                  style={{ width: 44, height: 44, borderRadius: 10, borderWidth: 1.5, borderColor: i === selectedSize ? COLORS.primary : COLORS.hairline, backgroundColor: i === selectedSize ? COLORS.primarySoft : COLORS.white, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 14, fontWeight: i === selectedSize ? '700' : '400', color: i === selectedSize ? COLORS.primaryDeep : COLORS.mute }}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Seller strip */}
          <TouchableOpacity onPress={() => product.shops?.id && navigation.navigate('Shop', { shopId: product.shops.id })} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderWidth: 1.5, borderColor: COLORS.hairline, borderRadius: RADIUS.md }}>
            <Avatar size={40} initials={(product.shops?.name?.[0] ?? 'L').toUpperCase()} bg={COLORS.primarySoft} />
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.ink }}>{product.shops?.name ?? 'luna.studio'}</Text>
                {product.shops?.is_verified && (
                  <View style={{ backgroundColor: '#EFF9F4', borderRadius: RADIUS.full, paddingHorizontal: 6, paddingVertical: 2, flexDirection: 'row', gap: 3, alignItems: 'center' }}>
                    <Text style={{ fontSize: 10, color: COLORS.success }}>✓</Text>
                    <Text style={{ fontSize: 10, fontWeight: '600', color: COLORS.success }}>Vérifié</Text>
                  </View>
                )}
              </View>
              <Text style={{ fontSize: 12, color: COLORS.mute }}>{product.shops?.followers ?? 2400} abonnés</Text>
            </View>
            <Text style={{ fontSize: 16, color: COLORS.mute }}>›</Text>
          </TouchableOpacity>

          {/* Delivery info */}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {[{ emoji: '🚚', text: 'Livraison gratuite dès $30' }, { emoji: '📦', text: 'Expédition sous 2 jours' }].map((info, i) => (
              <View key={i} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, backgroundColor: COLORS.paper, borderRadius: RADIUS.sm }}>
                <Text>{info.emoji}</Text>
                <Text style={{ fontSize: 11, color: COLORS.mute, lineHeight: 15, flex: 1 }}>{info.text}</Text>
              </View>
            ))}
          </View>

          {/* Tabs */}
          <View>
            <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: COLORS.hairline, marginBottom: 14 }}>
              {['Description', 'Avis', 'Livraison'].map((t, i) => (
                <TouchableOpacity key={i} onPress={() => setActiveTab(i)} style={{ flex: 1, height: 40, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 2, borderBottomColor: i === activeTab ? COLORS.primary : 'transparent' }}>
                  <Text style={{ fontSize: 14, fontWeight: i === activeTab ? '600' : '400', color: i === activeTab ? COLORS.ink : COLORS.mute }}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {activeTab === 0 && (
              <Text style={{ fontSize: 15, color: COLORS.mute, lineHeight: 24 }}>
                {product.description ?? 'Façonné à la main par des artisans, ce produit marie robustesse et élégance minimaliste. Produit d\'origine certifiée.'}
              </Text>
            )}
            {activeTab === 1 && (
              <View style={{ gap: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Text style={{ fontSize: 32, fontWeight: '700', color: COLORS.ink }}>{product.rating ?? 4.8}</Text>
                  <View>
                    <Text style={{ color: '#F59E0B', fontSize: 16 }}>{'★'.repeat(5)}</Text>
                    <Text style={{ fontSize: 13, color: COLORS.mute }}>{(product.reviews_count ?? 234).toLocaleString()} avis vérifiés</Text>
                  </View>
                </View>
                {[{ name:'Marie L.', rating:5, text:'Qualité impeccable, exactement comme sur les photos. Livraison rapide.', date:'il y a 3 jours' },
                  { name:'Thomas R.', rating:4, text:'Très beau produit, finitions soignées.', date:'il y a 1 semaine' }].map((r, i) => (
                  <View key={i} style={{ borderTopWidth: 1, borderTopColor: COLORS.hairline, paddingTop: 14 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                      <Text style={{ fontWeight: '600', color: COLORS.ink }}>{r.name}</Text>
                      <Text style={{ fontSize: 12, color: COLORS.mute }}>{r.date}</Text>
                    </View>
                    <Text style={{ color: '#F59E0B', marginBottom: 6 }}>{'★'.repeat(r.rating)}</Text>
                    <Text style={{ fontSize: 14, color: COLORS.mute, lineHeight: 21 }}>{r.text}</Text>
                  </View>
                ))}
              </View>
            )}
            {activeTab === 2 && (
              <View style={{ gap: 12 }}>
                {[{ emoji:'🚚', title:'Standard', detail:'5 à 8 jours ouvrés', price:'$3.99' },
                  { emoji:'⚡', title:'Express',  detail:'2 à 3 jours ouvrés', price:'$8.99' }].map((m, i) => (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderWidth: 1.5, borderColor: COLORS.hairline, borderRadius: RADIUS.md }}>
                    <Text style={{ fontSize: 22 }}>{m.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: '600', color: COLORS.ink }}>{m.title}</Text>
                      <Text style={{ fontSize: 12, color: COLORS.mute }}>{m.detail}</Text>
                    </View>
                    <Text style={{ fontWeight: '600', color: COLORS.ink }}>{m.price}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Sticky CTA */}
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, paddingBottom: 28, backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.hairline, flexDirection: 'row', gap: 10 }}>
        <TouchableOpacity onPress={() => navigation.navigate('Chat', { productId: product.id, productTitle: product.title, sellerId: product.shops?.seller_id })}
          style={{ width: 50, height: 50, borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: COLORS.hairline, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 22 }}>💬</Text>
        </TouchableOpacity>
        <Btn style={{ flex: 1 }} variant="secondary" onPress={addToCart} disabled={loading}>
          {addedToCart ? '✓ Ajouté !' : 'Ajouter au panier'}
        </Btn>
        <Btn style={{ flex: 1 }} onPress={() => navigation.navigate('Cart')}>
          Acheter
        </Btn>
      </View>
    </SafeAreaView>
  );
}
