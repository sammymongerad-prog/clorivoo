import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, RADIUS, SHADOW } from '../../lib/tokens';
import { createProduct } from '../../lib/supabase';
import { useSession } from '../../hooks/useSession';
import Icon from '../../components/Icon';

function parseCSV(text) {
  const lines = text.split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  return lines.slice(1).map(line => {
    const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    const obj = {};
    headers.forEach((h, i) => { obj[h] = vals[i] ?? ''; });
    return obj;
  }).filter(r => r.title || r.name);
}

export default function BulkUploadScreen({ navigation }) {
  const session = useSession();
  const [filename, setFilename] = useState(null);
  const [rows, setRows] = useState([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);

  async function pickFile() {
    try {
      const DocumentPicker = await import('expo-document-picker');
      const result = await DocumentPicker.getDocumentAsync({ type: ['text/csv', 'text/plain', 'application/csv'], copyToCacheDirectory: true });
      if (result.canceled) return;
      const asset = result.assets?.[0] ?? result;
      setFilename(asset.name ?? 'fichier.csv');
      const resp = await fetch(asset.uri);
      const text = await resp.text();
      const parsed = parseCSV(text);
      setRows(parsed);
      setDone(false);
      setProgress(0);
    } catch {
      Alert.alert('Erreur', 'Impossible de lire le fichier CSV.');
    }
  }

  async function handleImport() {
    if (rows.length === 0) return;
    setImporting(true);
    setProgress(0);
    let ok = 0;
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      try {
        await createProduct({
          title: r.title || r.name || 'Produit sans nom',
          price: parseFloat(r.price) || 0,
          stock: parseInt(r.stock, 10) || 0,
          description: r.description || '',
          seller_id: session.user.id,
          status: 'active',
        });
        ok++;
      } catch {}
      setProgress(i + 1);
    }
    setImporting(false);
    setDone(true);
    Alert.alert('Import terminé', `${ok} produit(s) importé(s) sur ${rows.length}.`);
  }

  function downloadTemplate() {
    Alert.alert('Modèle CSV', 'Colonnes: title,price,stock,description\nExemple:\n"Produit A",19.99,10,"Description"');
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.paper }} edges={['top']}>
      <View style={{ backgroundColor: COLORS.white, paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.hairline, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrowLeft" size={22} color={COLORS.ink} />
        </TouchableOpacity>
        <Text style={{ flex: 1, fontSize: 18, fontWeight: '700', color: COLORS.ink }}>Import en masse</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 16 }}>
        <View style={{ backgroundColor: COLORS.white, borderRadius: RADIUS.md, padding: 20, ...SHADOW.sm }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.ink, marginBottom: 8 }}>Instructions</Text>
          <Text style={{ fontSize: 14, color: COLORS.mute, lineHeight: 22 }}>
            Téléchargez le modèle CSV, remplissez-le et importez-le ici. Colonnes requises : title, price, stock. Colonne optionnelle : description.
          </Text>
        </View>

        <TouchableOpacity onPress={downloadTemplate}
          style={{ backgroundColor: COLORS.white, borderRadius: RADIUS.md, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, ...SHADOW.sm }}>
          <View style={{ width: 40, height: 40, borderRadius: RADIUS.sm, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="upload" size={20} color="#3B82F6" />
          </View>
          <Text style={{ flex: 1, fontSize: 15, fontWeight: '600', color: COLORS.ink }}>Télécharger modèle CSV</Text>
          <Icon name="chevronRight" size={18} color={COLORS.mute} />
        </TouchableOpacity>

        <TouchableOpacity onPress={pickFile}
          style={{ backgroundColor: COLORS.primary, borderRadius: RADIUS.md, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <Icon name="upload" size={20} color="#fff" />
          <Text style={{ fontSize: 15, fontWeight: '700', color: '#fff' }}>Importer CSV</Text>
        </TouchableOpacity>

        {filename && (
          <View style={{ backgroundColor: COLORS.white, borderRadius: RADIUS.md, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, ...SHADOW.sm }}>
            <Text style={{ fontSize: 20 }}>📄</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.ink }} numberOfLines={1}>{filename}</Text>
              <Text style={{ fontSize: 12, color: COLORS.mute }}>{rows.length} ligne(s) détectée(s)</Text>
            </View>
          </View>
        )}

        {rows.length > 0 && (
          <View style={{ backgroundColor: COLORS.white, borderRadius: RADIUS.md, overflow: 'hidden', ...SHADOW.sm }}>
            <View style={{ flexDirection: 'row', backgroundColor: COLORS.paper, padding: 12, borderBottomWidth: 1, borderBottomColor: COLORS.hairline }}>
              <Text style={{ flex: 2, fontSize: 12, fontWeight: '700', color: COLORS.mute }}>TITRE</Text>
              <Text style={{ flex: 1, fontSize: 12, fontWeight: '700', color: COLORS.mute }}>PRIX</Text>
              <Text style={{ flex: 1, fontSize: 12, fontWeight: '700', color: COLORS.mute }}>STOCK</Text>
            </View>
            {rows.slice(0, 10).map((r, i) => (
              <View key={i} style={{ flexDirection: 'row', padding: 12, borderBottomWidth: 1, borderBottomColor: COLORS.hairline }}>
                <Text style={{ flex: 2, fontSize: 13, color: COLORS.ink }} numberOfLines={1}>{r.title || r.name || '-'}</Text>
                <Text style={{ flex: 1, fontSize: 13, color: COLORS.primary }}>${r.price || '0'}</Text>
                <Text style={{ flex: 1, fontSize: 13, color: COLORS.ink }}>{r.stock || '0'}</Text>
              </View>
            ))}
            {rows.length > 10 && (
              <View style={{ padding: 12, alignItems: 'center' }}>
                <Text style={{ fontSize: 12, color: COLORS.mute }}>... et {rows.length - 10} autre(s)</Text>
              </View>
            )}
          </View>
        )}

        {importing && (
          <View style={{ backgroundColor: COLORS.white, borderRadius: RADIUS.md, padding: 16, alignItems: 'center', gap: 12, ...SHADOW.sm }}>
            <ActivityIndicator color={COLORS.primary} />
            <Text style={{ fontSize: 14, color: COLORS.mute }}>{progress}/{rows.length} produits importés...</Text>
            <View style={{ width: '100%', height: 6, backgroundColor: COLORS.hairline, borderRadius: 3 }}>
              <View style={{ width: `${(progress / rows.length) * 100}%`, height: 6, backgroundColor: COLORS.primary, borderRadius: 3 }} />
            </View>
          </View>
        )}

        {rows.length > 0 && !importing && !done && (
          <TouchableOpacity onPress={handleImport}
            style={{ backgroundColor: COLORS.success, borderRadius: RADIUS.md, padding: 16, alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Importer {rows.length} produit(s)</Text>
          </TouchableOpacity>
        )}

        {done && (
          <View style={{ backgroundColor: '#ECFDF5', borderRadius: RADIUS.md, padding: 16, alignItems: 'center', gap: 6 }}>
            <Text style={{ fontSize: 24 }}>✅</Text>
            <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.success }}>Import terminé !</Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
