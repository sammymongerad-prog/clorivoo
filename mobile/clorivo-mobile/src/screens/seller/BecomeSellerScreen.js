import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image,
  Alert, ActivityIndicator, Modal, TextInput, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, RADIUS, SHADOW } from '../../lib/tokens';
import Icon from '../../components/Icon';
import { supabase, uploadImage } from '../../lib/supabase';
import { useSession } from '../../hooks/useSession';

const SHOP_CATEGORIES = ['Maison', 'Mode', 'Tech', 'Beauté', 'Sport', 'Enfants', 'Jardin', 'Autre'];

const DOC_TYPES = [
  { key: 'passport', emoji: '🛂', label: 'Passeport' },
  { key: 'id_card', emoji: '🪪', label: 'Carte nationale d\'identité' },
  { key: 'work_permit', emoji: '💼', label: 'Permis de travail' },
  { key: 'driver_license', emoji: '🚗', label: 'Permis de conduire' },
];

const STEP_TITLES = [
  'Informations personnelles',
  'Votre boutique',
  'Vérification d\'identité',
  'Selfie en direct',
];

function FieldLabel({ children }) {
  return (
    <Text style={{ fontSize: 12, fontWeight: '600', color: COLORS.mute, marginBottom: 6, marginTop: 14 }}>
      {children}
    </Text>
  );
}

function StyledInput({ value, onChangeText, placeholder, keyboardType, multiline, numberOfLines }) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={COLORS.mute}
      keyboardType={keyboardType}
      multiline={multiline}
      numberOfLines={numberOfLines}
      style={{
        borderWidth: 1.5,
        borderColor: COLORS.hairline,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 14,
        color: COLORS.ink,
        backgroundColor: COLORS.paper,
        minHeight: multiline ? 80 : undefined,
        textAlignVertical: multiline ? 'top' : 'auto',
      }}
    />
  );
}

function ProgressDots({ current, total }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={{
            width: i === current ? 28 : 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: i === current ? COLORS.primary : i < current ? COLORS.primary + '60' : COLORS.hairline,
          }}
        />
      ))}
    </View>
  );
}

function DocUploadBox({ uri, onPress, label }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        width: '48%',
        height: 100,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: uri ? COLORS.primary : COLORS.hairline,
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: uri ? COLORS.primarySoft : COLORS.paper,
        overflow: 'hidden',
      }}
    >
      {uri ? (
        <Image source={{ uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
      ) : (
        <>
          <Icon name="image" size={24} color={COLORS.mute} />
          <Text style={{ fontSize: 11, color: COLORS.mute, marginTop: 6, textAlign: 'center', paddingHorizontal: 8 }}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

export default function BecomeSellerScreen({ navigation }) {
  const session = useSession();
  const userId = session?.user?.id;

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [successModal, setSuccessModal] = useState(false);

  // Step 1
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [email, setEmail] = useState(session?.user?.email ?? '');
  const [phone, setPhone] = useState('');
  const [nationality, setNationality] = useState('');
  const [country, setCountry] = useState('');

  // Step 2
  const [shopName, setShopName] = useState('');
  const [shopDescription, setShopDescription] = useState('');
  const [shopCategory, setShopCategory] = useState('');

  // Step 3
  const [docType, setDocType] = useState('');
  const [docFrontUri, setDocFrontUri] = useState('');
  const [docBackUri, setDocBackUri] = useState('');

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
        showAlert('Selfie requis', 'Veuillez prendre votre selfie.');
        return false;
      }
    }
    return true;
  }

  function nextStep() {
    if (!validateStep()) return;
    if (step < 3) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  }

  async function pickDocImage(side) {
    try {
      const IP = await import('expo-image-picker');
      const perm = await IP.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        showAlert('Permission refusée', 'Accès à la galerie requis.');
        return;
      }
      const result = await IP.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled && result.assets?.[0]) {
        if (side === 'front') setDocFrontUri(result.assets[0].uri);
        else setDocBackUri(result.assets[0].uri);
      }
    } catch (e) {
      console.warn('pickDocImage error', e);
    }
  }

  async function takeSelfie() {
    try {
      const IP = await import('expo-image-picker');
      const perm = await IP.requestCameraPermissionsAsync();
      if (!perm.granted) {
        showAlert('Permission refusée', 'Accès caméra requis.');
        return;
      }
      const result = await IP.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        cameraType: 'front',
      });
      if (!result.canceled && result.assets?.[0]) {
        setSelfieUri(result.assets[0].uri);
      }
    } catch (e) {
      console.warn('takeSelfie error', e);
    }
  }

  async function handleSubmit() {
    if (!validateStep()) return;
    setSubmitting(true);
    try {
      const [frontResult, backResult, selfieResult] = await Promise.all([
        uploadImage('kyc-docs', `${userId}/front.jpg`, docFrontUri),
        uploadImage('kyc-docs', `${userId}/back.jpg`, docBackUri),
        uploadImage('kyc-docs', `${userId}/selfie.jpg`, selfieUri),
      ]);

      const { error: insertError } = await supabase.from('kyc_requests').insert({
        seller_id: userId,
        status: 'pending',
        doc_type: docType,
        doc_front_url: frontResult?.url ?? null,
        doc_back_url: backResult?.url ?? null,
        selfie_url: selfieResult?.url ?? null,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        birth_date: birthDate.trim(),
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
      showAlert('Erreur', 'Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setSubmitting(false);
    }
  }

  function renderStep1() {
    return (
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
        <FieldLabel>Prénom *</FieldLabel>
        <StyledInput value={firstName} onChangeText={setFirstName} placeholder="Votre prénom" />

        <FieldLabel>Nom *</FieldLabel>
        <StyledInput value={lastName} onChangeText={setLastName} placeholder="Votre nom" />

        <FieldLabel>Date de naissance</FieldLabel>
        <StyledInput value={birthDate} onChangeText={setBirthDate} placeholder="JJ/MM/AAAA" />

        <FieldLabel>E-mail</FieldLabel>
        <StyledInput value={email} onChangeText={setEmail} placeholder="votre@email.com" keyboardType="email-address" />

        <FieldLabel>Numéro de téléphone *</FieldLabel>
        <StyledInput value={phone} onChangeText={setPhone} placeholder="+33 6 00 00 00 00" keyboardType="phone-pad" />

        <FieldLabel>Nationalité</FieldLabel>
        <StyledInput value={nationality} onChangeText={setNationality} placeholder="Française" />

        <FieldLabel>Pays de résidence</FieldLabel>
        <StyledInput value={country} onChangeText={setCountry} placeholder="France" />

        <View style={{ height: 100 }} />
      </ScrollView>
    );
  }

  function renderStep2() {
    return (
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
        <FieldLabel>Nom de la boutique *</FieldLabel>
        <StyledInput value={shopName} onChangeText={setShopName} placeholder="Ma Super Boutique" />

        <FieldLabel>Description</FieldLabel>
        <StyledInput
          value={shopDescription}
          onChangeText={setShopDescription}
          placeholder="Décrivez votre boutique en quelques mots..."
          multiline
          numberOfLines={3}
        />

        <FieldLabel>Catégorie</FieldLabel>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
          {SHOP_CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat}
              onPress={() => setShopCategory(cat)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 20,
                borderWidth: 1.5,
                borderColor: shopCategory === cat ? COLORS.primary : COLORS.hairline,
                backgroundColor: shopCategory === cat ? COLORS.primarySoft : COLORS.white,
              }}
            >
              <Text style={{
                fontSize: 13,
                fontWeight: '600',
                color: shopCategory === cat ? COLORS.primary : COLORS.mute,
              }}>
                {cat}
              </Text>
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
        <Text style={{ fontSize: 13, color: COLORS.mute, marginBottom: 16 }}>
          Choisissez votre document officiel
        </Text>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
          {DOC_TYPES.map(doc => (
            <TouchableOpacity
              key={doc.key}
              onPress={() => setDocType(doc.key)}
              style={{
                width: '48%',
                borderRadius: 12,
                borderWidth: 2,
                borderColor: docType === doc.key ? COLORS.primary : COLORS.hairline,
                backgroundColor: docType === doc.key ? COLORS.primarySoft : COLORS.white,
                padding: 14,
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Text style={{ fontSize: 28 }}>{doc.emoji}</Text>
              <Text style={{
                fontSize: 12,
                fontWeight: '600',
                color: docType === doc.key ? COLORS.primary : COLORS.ink,
                textAlign: 'center',
              }}>
                {doc.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {!!docType && (
          <>
            <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.ink, marginBottom: 12 }}>
              Photos du document
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
              <DocUploadBox
                uri={docFrontUri}
                onPress={() => pickDocImage('front')}
                label="Recto du document"
              />
              <DocUploadBox
                uri={docBackUri}
                onPress={() => pickDocImage('back')}
                label="Verso du document"
              />
            </View>

            <View style={{ backgroundColor: '#FFFBEB', borderRadius: 10, padding: 12, marginBottom: 16, flexDirection: 'row', gap: 8 }}>
              <Text style={{ fontSize: 13 }}>📸</Text>
              <Text style={{ fontSize: 12, color: '#92400E', flex: 1 }}>
                Les photos doivent être nettes et prises en temps réel.
              </Text>
            </View>

            <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'center' }}>
              {[
                { emoji: '🔒', label: 'Chiffré' },
                { emoji: '🛡️', label: 'Sécurisé' },
                { emoji: '✓', label: 'Conforme RGPD' },
              ].map((b, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.paper, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 }}>
                  <Text style={{ fontSize: 12 }}>{b.emoji}</Text>
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

        {/* Face outline */}
        <View style={{ marginBottom: 24 }}>
          <View style={{
            width: 180,
            height: 220,
            borderRadius: 90,
            borderWidth: 3,
            borderColor: COLORS.primary,
            borderStyle: 'dashed',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            backgroundColor: COLORS.primarySoft,
          }}>
            {selfieUri ? (
              <Image source={{ uri: selfieUri }} style={{ width: 180, height: 220 }} resizeMode="cover" />
            ) : (
              <Text style={{ fontSize: 72 }}>👤</Text>
            )}
          </View>
        </View>

        {/* Instructions */}
        <View style={{ width: '100%', marginBottom: 20, gap: 10 }}>
          {[
            'Regardez directement la caméra',
            'Assurez-vous d\'être dans un endroit bien éclairé',
            'Retirez vos lunettes si possible',
          ].map((instruction, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: COLORS.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="checkCircle" size={13} color={COLORS.primary} />
              </View>
              <Text style={{ fontSize: 13, color: COLORS.ink, flex: 1 }}>{instruction}</Text>
            </View>
          ))}
        </View>

        {/* Warning */}
        <View style={{ backgroundColor: '#FFF7ED', borderRadius: 10, padding: 12, marginBottom: 20, width: '100%', flexDirection: 'row', gap: 8 }}>
          <Text style={{ fontSize: 14 }}>⚠️</Text>
          <Text style={{ fontSize: 12, color: '#92400E', flex: 1 }}>
            Appareil photo uniquement. L'importation depuis la galerie est désactivée.
          </Text>
        </View>

        {/* Camera button */}
        <TouchableOpacity
          onPress={takeSelfie}
          style={{
            backgroundColor: COLORS.primary,
            borderRadius: 14,
            height: 52,
            width: '100%',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            gap: 10,
            marginBottom: 16,
          }}
        >
          <Icon name="camera" size={18} color="#fff" />
          <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>
            {selfieUri ? 'Reprendre le selfie' : 'Prendre le selfie'}
          </Text>
        </TouchableOpacity>

        {/* Security indicators */}
        <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          {[
            { icon: 'lock', label: 'Chiffrement AES-256' },
            { icon: 'shield', label: 'Données sécurisées' },
            { icon: 'checkCircle', label: 'Vérification IA' },
          ].map((b, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.paper, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 }}>
              <Icon name={b.icon} size={11} color={COLORS.mute} />
              <Text style={{ fontSize: 11, color: COLORS.mute, fontWeight: '600' }}>{b.label}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top']}>
      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: COLORS.hairline }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <TouchableOpacity onPress={() => step > 0 ? setStep(step - 1) : navigation.goBack()} style={{ marginRight: 12 }}>
            <Icon name="chevronLeft" size={22} color={COLORS.ink} />
          </TouchableOpacity>
          <Text style={{ fontSize: 18, fontWeight: '800', color: COLORS.ink, flex: 1, letterSpacing: -0.5 }}>
            Devenir vendeur
          </Text>
          <Text style={{ fontSize: 12, color: COLORS.mute }}>{step + 1} / 4</Text>
        </View>
        <ProgressDots current={step} total={4} />
        <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.primary, textAlign: 'center' }}>
          {STEP_TITLES[step]}
        </Text>
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
        <TouchableOpacity
          onPress={nextStep}
          disabled={submitting}
          style={{
            backgroundColor: COLORS.primary,
            borderRadius: 14,
            height: 52,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: submitting ? 0.7 : 1,
          }}
        >
          {submitting
            ? <ActivityIndicator color="#fff" />
            : <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>
                {step === 3 ? 'Soumettre ma demande' : 'Suivant'}
              </Text>
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
          <View style={{ backgroundColor: '#fff', borderRadius: 24, padding: 32, alignItems: 'center', width: '100%', ...SHADOW.sm }}>
            <Text style={{ fontSize: 56, marginBottom: 16 }}>✅</Text>
            <Text style={{ fontSize: 22, fontWeight: '800', color: COLORS.ink, marginBottom: 10, textAlign: 'center', letterSpacing: -0.5 }}>
              Demande soumise
            </Text>
            <Text style={{ fontSize: 14, color: COLORS.mute, textAlign: 'center', lineHeight: 20, marginBottom: 28 }}>
              Notre équipe examinera vos documents dans les 24-48h. Vous recevrez une notification dès que votre compte vendeur sera activé.
            </Text>
            <TouchableOpacity
              onPress={() => {
                setSuccessModal(false);
                navigation.navigate('Tabs');
              }}
              style={{ backgroundColor: COLORS.primary, borderRadius: 14, height: 52, width: '100%', alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>OK, compris !</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
