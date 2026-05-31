import React, { useState, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image,
  Alert, ActivityIndicator, Modal, Platform, FlatList, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, RADIUS, SHADOW } from '../../lib/tokens';
import Icon from '../../components/Icon';
import { supabase, uploadImage } from '../../lib/supabase';
import { useSession } from '../../hooks/useSession';

// ─── Data ─────────────────────────────────────────────────────────────────────

const SHOP_CATEGORIES = ['Maison', 'Mode', 'Tech', 'Beauté', 'Sport', 'Enfants', 'Jardin', 'Autre'];

const DOC_TYPES = [
  { key: 'passport',       icon: 'user',         label: 'Passeport' },
  { key: 'id_card',        icon: 'creditCard',   label: 'Carte nationale d\'identité' },
  { key: 'work_permit',    icon: 'tag',          label: 'Permis de travail' },
  { key: 'driver_license', icon: 'truck',        label: 'Permis de conduire' },
];

const STEP_TITLES = [
  'Informations personnelles',
  'Votre boutique',
  'Vérification d\'identité',
  'Selfie en direct',
];

const DAYS   = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));
const MONTHS = [
  { v: '01', l: 'Janvier' }, { v: '02', l: 'Février' }, { v: '03', l: 'Mars' },
  { v: '04', l: 'Avril' },   { v: '05', l: 'Mai' },     { v: '06', l: 'Juin' },
  { v: '07', l: 'Juillet' }, { v: '08', l: 'Août' },    { v: '09', l: 'Septembre' },
  { v: '10', l: 'Octobre' }, { v: '11', l: 'Novembre' },{ v: '12', l: 'Décembre' },
];
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 80 }, (_, i) => String(currentYear - 18 - i));

const COUNTRIES = [
  'Afghanistan','Afrique du Sud','Algérie','Allemagne','Angola','Arabie saoudite','Argentine',
  'Australie','Autriche','Azerbaïdjan','Bahreïn','Bangladesh','Belgique','Bénin','Bolivie',
  'Bosnie-Herzégovine','Brésil','Bulgarie','Burkina Faso','Burundi','Cambodge','Cameroun',
  'Canada','Cap-Vert','Chili','Chine','Chypre','Colombie','Comores','Congo','Corée du Sud',
  'Côte d\'Ivoire','Croatie','Cuba','Danemark','Djibouti','Égypte','Émirats arabes unis',
  'Équateur','Érythrée','Espagne','Estonie','Éthiopie','Finlande','France','Gabon','Gambie',
  'Ghana','Grèce','Guinée','Guinée-Bissau','Guinée équatoriale','Haïti','Hongrie','Inde',
  'Indonésie','Iran','Irak','Irlande','Israël','Italie','Jamaïque','Japon','Jordanie',
  'Kazakhstan','Kenya','Koweït','Laos','Lettonie','Liban','Libye','Lituanie','Luxembourg',
  'Macédoine du Nord','Madagascar','Malaisie','Mali','Malte','Maroc','Mauritanie','Mexique',
  'Moldova','Mongolie','Mozambique','Myanmar','Namibie','Népal','Nicaragua','Niger','Nigéria',
  'Norvège','Nouvelle-Zélande','Oman','Ouganda','Pakistan','Palestine','Panama','Paraguay',
  'Pays-Bas','Pérou','Philippines','Pologne','Portugal','Qatar','République centrafricaine',
  'République dominicaine','République tchèque','Roumanie','Royaume-Uni','Russie','Rwanda',
  'Sénégal','Serbie','Sierra Leone','Singapour','Slovaquie','Slovénie','Somalie','Soudan',
  'Sri Lanka','Suède','Suisse','Syrie','Taïwan','Tanzanie','Tchad','Thaïlande','Togo',
  'Tunisie','Turkménistan','Turquie','Ukraine','Uruguay','Venezuela','Vietnam','Yémen',
  'Zambie','Zimbabwe',
];

// ─── Small UI components ───────────────────────────────────────────────────────

function FieldLabel({ children }) {
  return (
    <Text style={{ fontSize: 12, fontWeight: '600', color: COLORS.mute, marginBottom: 6, marginTop: 16 }}>
      {children}
    </Text>
  );
}

function ProgressDots({ current, total }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
      {Array.from({ length: total }).map((_, i) => (
        <View key={i} style={{
          width: i === current ? 28 : 10,
          height: 10,
          borderRadius: 5,
          backgroundColor: i === current ? COLORS.primary : i < current ? COLORS.primary + '60' : COLORS.hairline,
        }} />
      ))}
    </View>
  );
}

function DocUploadBox({ uri, onPress, label }) {
  return (
    <TouchableOpacity onPress={onPress} style={{
      width: '48%', height: 110, borderRadius: 12,
      borderWidth: 2, borderColor: uri ? COLORS.primary : COLORS.hairline,
      borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center',
      backgroundColor: uri ? COLORS.primarySoft : COLORS.paper, overflow: 'hidden',
    }}>
      {uri
        ? <Image source={{ uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        : <>
            <Icon name="upload" size={22} color={COLORS.mute} />
            <Text style={{ fontSize: 11, color: COLORS.mute, marginTop: 8, textAlign: 'center', paddingHorizontal: 8 }}>{label}</Text>
          </>
      }
    </TouchableOpacity>
  );
}

// ─── Scroll-wheel picker ───────────────────────────────────────────────────────
// Each column is a FlatList that snaps to items
const ITEM_H = 40;

function WheelPicker({ items, selectedValue, onSelect, labelKey }) {
  const flatRef = useRef(null);
  const idx = items.findIndex(it => (labelKey ? it.v : it) === selectedValue);

  function onMomentumEnd(e) {
    const newIdx = Math.round(e.nativeEvent.contentOffset.y / ITEM_H);
    const clamped = Math.max(0, Math.min(newIdx, items.length - 1));
    const val = labelKey ? items[clamped].v : items[clamped];
    onSelect(val);
  }

  return (
    <View style={{ height: ITEM_H * 5, width: '100%', overflow: 'hidden' }}>
      {/* Highlight band */}
      <View style={{ position: 'absolute', top: ITEM_H * 2, left: 0, right: 0, height: ITEM_H, backgroundColor: COLORS.primarySoft, borderRadius: 8 }} pointerEvents="none" />
      <FlatList
        ref={flatRef}
        data={items}
        keyExtractor={(it, i) => String(i)}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_H}
        decelerationRate="fast"
        onMomentumScrollEnd={onMomentumEnd}
        initialScrollIndex={Math.max(0, idx)}
        getItemLayout={(_, i) => ({ length: ITEM_H, offset: ITEM_H * i, index: i })}
        contentContainerStyle={{ paddingVertical: ITEM_H * 2 }}
        renderItem={({ item, index }) => {
          const val = labelKey ? item.v : item;
          const label = labelKey ? item.l : item;
          const active = val === selectedValue;
          return (
            <TouchableOpacity onPress={() => {
              onSelect(val);
              flatRef.current?.scrollToIndex({ index, animated: true });
            }} style={{ height: ITEM_H, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: active ? 16 : 14, fontWeight: active ? '700' : '400', color: active ? COLORS.primary : COLORS.mute }}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

function DatePicker({ day, month, year, onDayChange, onMonthChange, onYearChange }) {
  return (
    <View style={{ flexDirection: 'row', gap: 8, borderWidth: 1.5, borderColor: COLORS.hairline, borderRadius: 12, padding: 10, backgroundColor: COLORS.paper }}>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 10, color: COLORS.mute, fontWeight: '600', textAlign: 'center', marginBottom: 4 }}>JOUR</Text>
        <WheelPicker items={DAYS} selectedValue={day} onSelect={onDayChange} />
      </View>
      <View style={{ width: 1, backgroundColor: COLORS.hairline }} />
      <View style={{ flex: 2 }}>
        <Text style={{ fontSize: 10, color: COLORS.mute, fontWeight: '600', textAlign: 'center', marginBottom: 4 }}>MOIS</Text>
        <WheelPicker items={MONTHS} selectedValue={month} onSelect={onMonthChange} labelKey />
      </View>
      <View style={{ width: 1, backgroundColor: COLORS.hairline }} />
      <View style={{ flex: 1.5 }}>
        <Text style={{ fontSize: 10, color: COLORS.mute, fontWeight: '600', textAlign: 'center', marginBottom: 4 }}>ANNÉE</Text>
        <WheelPicker items={YEARS} selectedValue={year} onSelect={onYearChange} />
      </View>
    </View>
  );
}

// ─── Country/Nationality picker modal ─────────────────────────────────────────

function CountryPickerModal({ visible, title, selected, onSelect, onClose }) {
  const [search, setSearch] = useState('');
  const filtered = COUNTRIES.filter(c => c.toLowerCase().includes(search.toLowerCase()));

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '80%' }}>
          <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.hairline, flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ flex: 1, fontSize: 16, fontWeight: '700', color: COLORS.ink }}>{title}</Text>
            <TouchableOpacity onPress={onClose}><Icon name="x" size={20} color={COLORS.mute} /></TouchableOpacity>
          </View>
          <View style={{ paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.hairline }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.paper, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, gap: 8 }}>
              <Icon name="search" size={16} color={COLORS.mute} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Rechercher..."
                placeholderTextColor={COLORS.mute}
                style={{ flex: 1, fontSize: 14, color: COLORS.ink }}
              />
            </View>
          </View>
          <FlatList
            data={filtered}
            keyExtractor={item => item}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => { onSelect(item); onClose(); setSearch(''); }}
                style={{ paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.hairline, flexDirection: 'row', alignItems: 'center', backgroundColor: item === selected ? COLORS.primarySoft : '#fff' }}>
                <Text style={{ flex: 1, fontSize: 15, color: item === selected ? COLORS.primary : COLORS.ink, fontWeight: item === selected ? '700' : '400' }}>{item}</Text>
                {item === selected && <Icon name="checkCircle" size={16} color={COLORS.primary} />}
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );
}

// ─── Main screen ───────────────────────────────────────────────────────────────

export default function BecomeSellerScreen({ navigation }) {
  const session = useSession();
  const userId = session?.user?.id;

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [successModal, setSuccessModal] = useState(false);

  // Step 1
  const [firstName, setFirstName]   = useState('');
  const [lastName, setLastName]     = useState('');
  const [birthDay, setBirthDay]     = useState('01');
  const [birthMonth, setBirthMonth] = useState('01');
  const [birthYear, setBirthYear]   = useState(String(currentYear - 25));
  const [email, setEmail]           = useState(session?.user?.email ?? '');
  const [phone, setPhone]           = useState('');
  const [nationality, setNationality] = useState('');
  const [country, setCountry]         = useState('');
  const [natPickerOpen, setNatPickerOpen] = useState(false);
  const [countryPickerOpen, setCountryPickerOpen] = useState(false);

  // Step 2
  const [shopName, setShopName]           = useState('');
  const [shopDescription, setShopDescription] = useState('');
  const [shopCategory, setShopCategory]   = useState('');

  // Step 3
  const [docType, setDocType]     = useState('');
  const [docFrontUri, setDocFrontUri] = useState('');
  const [docBackUri, setDocBackUri]   = useState('');

  // Step 4
  const [selfieUri, setSelfieUri] = useState('');

  function showAlert(title, msg) {
    if (Platform.OS === 'web') {
      window.alert(`${title}${msg ? '\n' + msg : ''}`);
    } else {
      Alert.alert(title, msg);
    }
  }

  function validateStep() {
    if (step === 0) {
      if (!firstName.trim() || !lastName.trim() || !phone.trim()) {
        showAlert('Champs requis', 'Prénom, nom et téléphone sont obligatoires.');
        return false;
      }
    } else if (step === 1) {
      if (!shopName.trim()) {
        showAlert('Champs requis', 'Le nom de la boutique est obligatoire.');
        return false;
      }
    } else if (step === 2) {
      if (!docType) {
        showAlert('Document requis', 'Veuillez choisir un type de document.');
        return false;
      }
      if (!docFrontUri || !docBackUri) {
        showAlert('Photos requises', 'Veuillez télécharger le recto et le verso de votre document.');
        return false;
      }
    } else if (step === 3) {
      if (!selfieUri) {
        showAlert('Selfie requis', 'Veuillez prendre votre selfie avant de soumettre.');
        return false;
      }
    }
    return true;
  }

  function nextStep() {
    if (!validateStep()) return;
    if (step < 3) setStep(step + 1);
    else handleSubmit();
  }

  async function pickDocImage(side) {
    try {
      const IP = await import('expo-image-picker');
      const { status } = await IP.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') { showAlert('Permission refusée', 'Accès à la galerie requis.'); return; }
      const result = await IP.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, quality: 0.8 });
      if (!result.canceled && result.assets?.[0]) {
        if (side === 'front') setDocFrontUri(result.assets[0].uri);
        else setDocBackUri(result.assets[0].uri);
      }
    } catch (e) { console.warn('pickDocImage error', e); }
  }

  async function takeSelfie() {
    try {
      const IP = await import('expo-image-picker');
      const { status } = await IP.requestCameraPermissionsAsync();
      if (status !== 'granted') { showAlert('Permission refusée', 'Accès à la caméra requis pour le selfie.'); return; }
      // On web, launchCameraAsync may open file picker — that's a web browser limitation
      const result = await IP.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });
      if (!result.canceled && result.assets?.[0]) {
        setSelfieUri(result.assets[0].uri);
      }
    } catch (e) {
      console.warn('takeSelfie error', e);
      showAlert('Erreur', 'Impossible d\'accéder à la caméra. Vérifiez les permissions.');
    }
  }

  async function handleSubmit() {
    if (!validateStep()) return;
    setSubmitting(true);
    try {
      const birthDate = `${birthDay}/${birthMonth}/${birthYear}`;
      const ts = Date.now();

      const [frontRes, backRes, selfieRes] = await Promise.all([
        uploadImage('kyc-docs', `${userId}/front_${ts}.jpg`, docFrontUri),
        uploadImage('kyc-docs', `${userId}/back_${ts}.jpg`, docBackUri),
        uploadImage('kyc-docs', `${userId}/selfie_${ts}.jpg`, selfieUri),
      ]);

      // uploadImage returns { url, error } — check for errors
      if (frontRes.error) throw new Error('Erreur upload recto: ' + frontRes.error.message);
      if (backRes.error) throw new Error('Erreur upload verso: ' + backRes.error.message);
      if (selfieRes.error) throw new Error('Erreur upload selfie: ' + selfieRes.error.message);

      const { error: insertError } = await supabase.from('kyc_requests').insert({
        seller_id: userId,
        status: 'pending',
        doc_type: docType,
        doc_front_url: frontRes.url,
        doc_back_url: backRes.url,
        selfie_url: selfieRes.url,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        birth_date: birthDate,
        phone: phone.trim(),
        nationality: nationality.trim(),
        country: country.trim(),
        shop_name: shopName.trim(),
        shop_description: shopDescription.trim(),
        shop_category: shopCategory,
      });

      if (insertError) throw insertError;

      await supabase.from('profiles').update({ kyc_status: 'pending' }).eq('id', userId);

      setSuccessModal(true);
    } catch (e) {
      console.warn('submit error', e);
      showAlert('Erreur', e.message ?? 'Une erreur est survenue. Vérifiez votre connexion et réessayez.');
    } finally {
      setSubmitting(false);
    }
  }

  // ─── Step renderers ──────────────────────────────────────────────────────────

  function renderStep1() {
    return (
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <FieldLabel>Prénom *</FieldLabel>
        <TextInput value={firstName} onChangeText={setFirstName} placeholder="Votre prénom" placeholderTextColor={COLORS.mute}
          style={{ borderWidth: 1.5, borderColor: COLORS.hairline, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: COLORS.ink, backgroundColor: COLORS.paper }} />

        <FieldLabel>Nom *</FieldLabel>
        <TextInput value={lastName} onChangeText={setLastName} placeholder="Votre nom" placeholderTextColor={COLORS.mute}
          style={{ borderWidth: 1.5, borderColor: COLORS.hairline, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: COLORS.ink, backgroundColor: COLORS.paper }} />

        <FieldLabel>Date de naissance</FieldLabel>
        <DatePicker day={birthDay} month={birthMonth} year={birthYear}
          onDayChange={setBirthDay} onMonthChange={setBirthMonth} onYearChange={setBirthYear} />

        <FieldLabel>E-mail</FieldLabel>
        <TextInput value={email} onChangeText={setEmail} placeholder="votre@email.com" placeholderTextColor={COLORS.mute} keyboardType="email-address"
          style={{ borderWidth: 1.5, borderColor: COLORS.hairline, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: COLORS.ink, backgroundColor: COLORS.paper }} />

        <FieldLabel>Numéro de téléphone *</FieldLabel>
        <TextInput value={phone} onChangeText={setPhone} placeholder="+1 555 000 0000" placeholderTextColor={COLORS.mute} keyboardType="phone-pad"
          style={{ borderWidth: 1.5, borderColor: COLORS.hairline, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: COLORS.ink, backgroundColor: COLORS.paper }} />

        <FieldLabel>Nationalité</FieldLabel>
        <TouchableOpacity onPress={() => setNatPickerOpen(true)}
          style={{ borderWidth: 1.5, borderColor: COLORS.hairline, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.paper }}>
          <Text style={{ flex: 1, fontSize: 14, color: nationality ? COLORS.ink : COLORS.mute }}>
            {nationality || 'Sélectionner votre nationalité'}
          </Text>
          <Icon name="chevronDown" size={16} color={COLORS.mute} />
        </TouchableOpacity>

        <FieldLabel>Pays de résidence</FieldLabel>
        <TouchableOpacity onPress={() => setCountryPickerOpen(true)}
          style={{ borderWidth: 1.5, borderColor: COLORS.hairline, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.paper }}>
          <Text style={{ flex: 1, fontSize: 14, color: country ? COLORS.ink : COLORS.mute }}>
            {country || 'Sélectionner votre pays de résidence'}
          </Text>
          <Icon name="chevronDown" size={16} color={COLORS.mute} />
        </TouchableOpacity>

        <View style={{ height: 100 }} />

        <CountryPickerModal visible={natPickerOpen} title="Nationalité" selected={nationality} onSelect={setNationality} onClose={() => setNatPickerOpen(false)} />
        <CountryPickerModal visible={countryPickerOpen} title="Pays de résidence" selected={country} onSelect={setCountry} onClose={() => setCountryPickerOpen(false)} />
      </ScrollView>
    );
  }

  function renderStep2() {
    return (
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <FieldLabel>Nom de la boutique *</FieldLabel>
        <TextInput value={shopName} onChangeText={setShopName} placeholder="Ma Super Boutique" placeholderTextColor={COLORS.mute}
          style={{ borderWidth: 1.5, borderColor: COLORS.hairline, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: COLORS.ink, backgroundColor: COLORS.paper }} />

        <FieldLabel>Description</FieldLabel>
        <TextInput value={shopDescription} onChangeText={setShopDescription} placeholder="Décrivez votre boutique en quelques mots..." placeholderTextColor={COLORS.mute}
          multiline numberOfLines={3}
          style={{ borderWidth: 1.5, borderColor: COLORS.hairline, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: COLORS.ink, backgroundColor: COLORS.paper, minHeight: 80, textAlignVertical: 'top' }} />

        <FieldLabel>Catégorie</FieldLabel>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
          {SHOP_CATEGORIES.map(cat => (
            <TouchableOpacity key={cat} onPress={() => setShopCategory(cat)}
              style={{ paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, borderWidth: 1.5, borderColor: shopCategory === cat ? COLORS.primary : COLORS.hairline, backgroundColor: shopCategory === cat ? COLORS.primarySoft : COLORS.white }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: shopCategory === cat ? COLORS.primary : COLORS.mute }}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    );
  }

  function renderStep3() {
    return (
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
        <Text style={{ fontSize: 13, color: COLORS.mute, marginBottom: 16 }}>Choisissez votre document officiel</Text>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
          {DOC_TYPES.map(doc => {
            const active = docType === doc.key;
            return (
              <TouchableOpacity key={doc.key} onPress={() => setDocType(doc.key)}
                style={{ width: '48%', borderRadius: 12, borderWidth: 2, borderColor: active ? COLORS.primary : COLORS.hairline, backgroundColor: active ? COLORS.primarySoft : COLORS.white, padding: 16, alignItems: 'center', gap: 8 }}>
                <View style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: active ? COLORS.primary + '15' : COLORS.paper, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: active ? COLORS.primary + '30' : COLORS.hairline }}>
                  <Icon name={doc.icon} size={22} color={active ? COLORS.primary : COLORS.ink} />
                </View>
                <Text style={{ fontSize: 12, fontWeight: '600', color: active ? COLORS.primary : COLORS.ink, textAlign: 'center' }}>{doc.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {!!docType && (
          <>
            <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.ink, marginBottom: 12 }}>Photos du document</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 }}>
              <DocUploadBox uri={docFrontUri} onPress={() => pickDocImage('front')} label={'Recto\n(avant)'} />
              <DocUploadBox uri={docBackUri}  onPress={() => pickDocImage('back')}  label={'Verso\n(arrière)'} />
            </View>

            <View style={{ backgroundColor: '#FFFBEB', borderRadius: 10, padding: 12, marginBottom: 16, flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
              <Icon name="camera" size={14} color="#92400E" />
              <Text style={{ fontSize: 12, color: '#92400E', flex: 1, lineHeight: 18 }}>
                Les photos doivent être nettes et prises en temps réel.
              </Text>
            </View>

            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              {[
                { icon: 'lock',        label: 'Chiffré' },
                { icon: 'shield',      label: 'Sécurisé' },
                { icon: 'checkCircle', label: 'Conforme RGPD' },
              ].map((b, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: COLORS.paper, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: COLORS.hairline }}>
                  <Icon name={b.icon} size={12} color={COLORS.mute} />
                  <Text style={{ fontSize: 11, color: COLORS.mute, fontWeight: '600' }}>{b.label}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    );
  }

  function renderStep4() {
    return (
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, alignItems: 'center' }} showsVerticalScrollIndicator={false}>
        <Text style={{ fontSize: 13, color: COLORS.mute, marginBottom: 24, textAlign: 'center' }}>
          Prenez une photo de vous maintenant
        </Text>

        {/* Face oval */}
        <View style={{ marginBottom: 28 }}>
          <View style={{ width: 190, height: 230, borderRadius: 95, borderWidth: 3, borderColor: COLORS.primary, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', backgroundColor: COLORS.primarySoft }}>
            {selfieUri
              ? <Image source={{ uri: selfieUri }} style={{ width: 190, height: 230 }} resizeMode="cover" />
              : <>
                  <Icon name="user" size={72} color={COLORS.primary + '66'} />
                  <Text style={{ fontSize: 11, color: COLORS.primary, marginTop: 8, fontWeight: '600', opacity: 0.6 }}>Cadrez votre visage</Text>
                </>
            }
          </View>
          {/* Corner dots for face-detection feel */}
          {[{ t: -6, l: -6 }, { t: -6, r: -6 }, { b: -6, l: -6 }, { b: -6, r: -6 }].map((pos, i) => (
            <View key={i} style={{ position: 'absolute', width: 16, height: 16, borderRadius: 3, backgroundColor: COLORS.primary, top: pos.t, left: pos.l, right: pos.r, bottom: pos.b }} />
          ))}
        </View>

        {/* Instructions */}
        <View style={{ width: '100%', marginBottom: 20, gap: 10 }}>
          {['Regardez directement la caméra', 'Assurez-vous d\'être dans un endroit bien éclairé', 'Retirez vos lunettes si possible'].map((instr, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: COLORS.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="checkCircle" size={13} color={COLORS.primary} />
              </View>
              <Text style={{ fontSize: 13, color: COLORS.ink, flex: 1 }}>{instr}</Text>
            </View>
          ))}
        </View>

        {/* Warning */}
        <View style={{ backgroundColor: '#FFF7ED', borderRadius: 10, padding: 12, marginBottom: 20, width: '100%', flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
          <Icon name="eye" size={14} color="#92400E" />
          <Text style={{ fontSize: 12, color: '#92400E', flex: 1, lineHeight: 18 }}>
            Appareil photo uniquement. L'importation depuis la galerie est désactivée pour des raisons de sécurité.
          </Text>
        </View>

        {/* Camera button */}
        <TouchableOpacity onPress={takeSelfie}
          style={{ backgroundColor: COLORS.primary, borderRadius: 14, height: 52, width: '100%', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10, marginBottom: 20 }}>
          <Icon name="camera" size={18} color="#fff" />
          <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>
            {selfieUri ? 'Reprendre le selfie' : 'Prendre le selfie'}
          </Text>
        </TouchableOpacity>

        {/* Security indicators */}
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          {[
            { icon: 'lock',        label: 'Chiffrement AES-256' },
            { icon: 'lock',        label: 'Données sécurisées' },
            { icon: 'checkCircle', label: 'Vérification IA' },
          ].map((b, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: COLORS.paper, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: COLORS.hairline }}>
              <Icon name={b.icon} size={12} color={COLORS.mute} />
              <Text style={{ fontSize: 11, color: COLORS.mute, fontWeight: '600' }}>{b.label}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    );
  }

  // ─── Layout ──────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top']}>
      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: COLORS.hairline }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <TouchableOpacity onPress={() => step > 0 ? setStep(step - 1) : navigation.goBack()} style={{ marginRight: 12 }}>
            <Icon name="arrowLeft" size={22} color={COLORS.ink} />
          </TouchableOpacity>
          <Text style={{ fontSize: 18, fontWeight: '800', color: COLORS.ink, flex: 1, letterSpacing: -0.5 }}>Devenir vendeur</Text>
          <Text style={{ fontSize: 12, color: COLORS.mute }}>{step + 1} / 4</Text>
        </View>
        <ProgressDots current={step} total={4} />
        <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.primary, textAlign: 'center' }}>{STEP_TITLES[step]}</Text>
      </View>

      {/* Step content */}
      <View style={{ flex: 1 }}>
        {step === 0 && renderStep1()}
        {step === 1 && renderStep2()}
        {step === 2 && renderStep3()}
        {step === 3 && renderStep4()}
      </View>

      {/* Bottom button */}
      <View style={{ padding: 20, paddingBottom: 32, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: COLORS.hairline }}>
        <TouchableOpacity onPress={nextStep} disabled={submitting}
          style={{ backgroundColor: COLORS.primary, borderRadius: 14, height: 52, alignItems: 'center', justifyContent: 'center', opacity: submitting ? 0.7 : 1 }}>
          {submitting
            ? <ActivityIndicator color="#fff" />
            : <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>{step === 3 ? 'Soumettre ma demande' : 'Suivant'}</Text>
          }
        </TouchableOpacity>
        {step > 0 && (
          <TouchableOpacity onPress={() => setStep(step - 1)} style={{ marginTop: 12, alignItems: 'center' }}>
            <Text style={{ fontSize: 14, color: COLORS.mute, fontWeight: '500' }}>Précédent</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Success modal */}
      <Modal visible={successModal} transparent animationType="fade" onRequestClose={() => {}}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 30 }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 24, padding: 32, alignItems: 'center', width: '100%' }}>
            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
              <Icon name="checkCircle" size={40} color={COLORS.primary} />
            </View>
            <Text style={{ fontSize: 22, fontWeight: '800', color: COLORS.ink, marginBottom: 10, textAlign: 'center', letterSpacing: -0.5 }}>Demande soumise !</Text>
            <Text style={{ fontSize: 14, color: COLORS.mute, textAlign: 'center', lineHeight: 22, marginBottom: 28 }}>
              Notre équipe examinera vos documents dans les 24-48h. Vous recevrez une notification dès que votre compte vendeur sera activé.
            </Text>
            <TouchableOpacity onPress={() => { setSuccessModal(false); navigation.navigate('Tabs'); }}
              style={{ backgroundColor: COLORS.primary, borderRadius: 14, height: 52, width: '100%', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>OK, compris !</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
