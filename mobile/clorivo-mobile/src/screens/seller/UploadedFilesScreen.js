import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, RADIUS, SHADOW } from '../../lib/tokens';
import { supabase } from '../../lib/supabase';
import { useSession } from '../../hooks/useSession';
import Icon from '../../components/Icon';

const BUCKET = 'seller-files';

function fileIcon(name) {
  if (!name) return '📁';
  const ext = name.split('.').pop()?.toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return '🖼️';
  if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)) return '🎬';
  if (ext === 'pdf') return '📄';
  return '📁';
}

function formatSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function UploadedFilesScreen({ navigation }) {
  const session = useSession();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  async function loadFiles() {
    if (!session?.user) return;
    try {
      const folder = session.user.id;
      const { data, error } = await supabase.storage.from(BUCKET).list(folder, { limit: 100, sortBy: { column: 'created_at', order: 'desc' } });
      if (error) throw error;
      setFiles((data ?? []).filter(f => f.name !== '.emptyFolderPlaceholder'));
    } catch {
      setFiles([]);
    }
    setLoading(false);
  }

  useFocusEffect(useCallback(() => {
    setLoading(true);
    loadFiles();
  }, [session]));

  async function handleUpload() {
    try {
      const DocumentPicker = await import('expo-document-picker');
      const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true, multiple: false });
      if (result.canceled) return;
      const asset = result.assets?.[0] ?? result;
      setUploading(true);
      const resp = await fetch(asset.uri);
      const blob = await resp.blob();
      const path = `${session.user.id}/${Date.now()}_${asset.name}`;
      const { error } = await supabase.storage.from(BUCKET).upload(path, blob, { upsert: false, contentType: blob.type || 'application/octet-stream' });
      if (error) {
        if (error.message?.includes('Bucket not found') || error.statusCode === 400) {
          await supabase.storage.createBucket(BUCKET, { public: false }).catch(() => {});
          const { error: err2 } = await supabase.storage.from(BUCKET).upload(path, blob, { upsert: false, contentType: blob.type || 'application/octet-stream' });
          if (err2) throw err2;
        } else {
          throw error;
        }
      }
      await loadFiles();
    } catch (e) {
      Alert.alert('Erreur', e?.message ?? "Impossible d'uploader le fichier.");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(filename) {
    Alert.alert('Supprimer', `Supprimer "${filename}" ?`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => {
        const path = `${session.user.id}/${filename}`;
        await supabase.storage.from(BUCKET).remove([path]).catch(() => {});
        setFiles(prev => prev.filter(f => f.name !== filename));
      }},
    ]);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.paper }} edges={['top']}>
      <View style={{ backgroundColor: COLORS.white, paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.hairline, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrowLeft" size={22} color={COLORS.ink} />
        </TouchableOpacity>
        <Text style={{ flex: 1, fontSize: 18, fontWeight: '700', color: COLORS.ink }}>Fichiers uploadés</Text>
        <TouchableOpacity onPress={handleUpload} disabled={uploading}
          style={{ backgroundColor: COLORS.primary, borderRadius: RADIUS.full, paddingHorizontal: 14, paddingVertical: 7, flexDirection: 'row', gap: 6, alignItems: 'center', opacity: uploading ? 0.7 : 1 }}>
          {uploading ? <ActivityIndicator size="small" color="#fff" /> : <Icon name="upload" size={16} color="#fff" />}
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Uploader</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={COLORS.primary} size="large" />
        </View>
      ) : files.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 }}>
          <Text style={{ fontSize: 48 }}>📁</Text>
          <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.ink }}>Aucun fichier</Text>
          <Text style={{ fontSize: 14, color: COLORS.mute, textAlign: 'center' }}>Uploadez vos fichiers pour les partager avec vos clients.</Text>
          <TouchableOpacity onPress={handleUpload}
            style={{ backgroundColor: COLORS.primary, borderRadius: RADIUS.full, paddingHorizontal: 24, paddingVertical: 12, marginTop: 8 }}>
            <Text style={{ color: '#fff', fontWeight: '700' }}>Uploader un fichier</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 12 }}>
          {files.map(f => (
            <View key={f.id ?? f.name} style={{ backgroundColor: COLORS.white, borderRadius: RADIUS.md, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 14, ...SHADOW.sm }}>
              <View style={{ width: 44, height: 44, borderRadius: RADIUS.sm, backgroundColor: COLORS.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 22 }}>{fileIcon(f.name)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.ink }} numberOfLines={1}>{f.name}</Text>
                <Text style={{ fontSize: 12, color: COLORS.mute }}>
                  {formatSize(f.metadata?.size)}{f.created_at ? '  •  ' + new Date(f.created_at).toLocaleDateString('fr-FR') : ''}
                </Text>
              </View>
              <TouchableOpacity onPress={() => handleDelete(f.name)} style={{ padding: 6 }}>
                <Icon name="trash2" size={18} color={COLORS.danger} />
              </TouchableOpacity>
            </View>
          ))}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
