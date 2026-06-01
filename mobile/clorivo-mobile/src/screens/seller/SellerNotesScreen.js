import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, RADIUS, SHADOW } from '../../lib/tokens';
import { supabase } from '../../lib/supabase';
import { useSession } from '../../hooks/useSession';
import Icon from '../../components/Icon';

const STORAGE_KEY = 'seller_notes_local';

export default function SellerNotesScreen({ navigation }) {
  const session = useSession();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [useLocal, setUseLocal] = useState(false);

  async function loadNotes() {
    if (!session?.user) return;
    try {
      const { data, error } = await supabase.from('seller_notes')
        .select('*').eq('seller_id', session.user.id)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      setNotes(data ?? []);
      setUseLocal(false);
    } catch {
      setUseLocal(true);
      const raw = await AsyncStorage.getItem(STORAGE_KEY).catch(() => null);
      const all = raw ? JSON.parse(raw) : [];
      setNotes(all.filter(n => n.seller_id === session.user.id).sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at)));
    }
    setLoading(false);
  }

  useFocusEffect(useCallback(() => {
    setLoading(true);
    loadNotes();
  }, [session]));

  async function saveNote(id, content) {
    const now = new Date().toISOString();
    if (useLocal) {
      const raw = await AsyncStorage.getItem(STORAGE_KEY).catch(() => null);
      let all = raw ? JSON.parse(raw) : [];
      if (id) {
        all = all.map(n => n.id === id ? { ...n, content, updated_at: now } : n);
      } else {
        all = [{ id: Date.now().toString(), seller_id: session.user.id, content, updated_at: now }, ...all];
      }
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(all));
      setNotes(all.filter(n => n.seller_id === session.user.id).sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at)));
    } else {
      if (id) {
        await supabase.from('seller_notes').update({ content, updated_at: now }).eq('id', id).catch(() => {});
      } else {
        await supabase.from('seller_notes').insert({ seller_id: session.user.id, content, updated_at: now }).catch(() => {});
      }
      await loadNotes();
    }
    setEditingId(null);
    setEditContent('');
  }

  async function deleteNote(id) {
    Alert.alert('Supprimer', 'Supprimer cette note ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => {
        if (useLocal) {
          const raw = await AsyncStorage.getItem(STORAGE_KEY).catch(() => null);
          let all = raw ? JSON.parse(raw) : [];
          all = all.filter(n => n.id !== id);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(all));
          setNotes(prev => prev.filter(n => n.id !== id));
        } else {
          await supabase.from('seller_notes').delete().eq('id', id).catch(() => {});
          setNotes(prev => prev.filter(n => n.id !== id));
        }
      }},
    ]);
  }

  function startNew() {
    setEditingId('new');
    setEditContent('');
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.paper }} edges={['top']}>
      <View style={{ backgroundColor: COLORS.white, paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.hairline, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrowLeft" size={22} color={COLORS.ink} />
        </TouchableOpacity>
        <Text style={{ flex: 1, fontSize: 18, fontWeight: '700', color: COLORS.ink }}>Mes notes</Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={COLORS.primary} size="large" />
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 12 }}>
          {editingId === 'new' && (
            <View style={{ backgroundColor: COLORS.white, borderRadius: RADIUS.md, padding: 16, ...SHADOW.sm }}>
              <TextInput
                style={{ fontSize: 14, color: COLORS.ink, minHeight: 100, textAlignVertical: 'top', borderWidth: 1, borderColor: COLORS.hairline, borderRadius: RADIUS.sm, padding: 12, marginBottom: 12 }}
                placeholder="Écrivez votre note..."
                placeholderTextColor={COLORS.mute}
                multiline
                autoFocus
                value={editContent}
                onChangeText={setEditContent}
              />
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity onPress={() => { setEditingId(null); setEditContent(''); }}
                  style={{ flex: 1, borderWidth: 1, borderColor: COLORS.hairline, borderRadius: RADIUS.sm, paddingVertical: 10, alignItems: 'center' }}>
                  <Text style={{ color: COLORS.mute, fontWeight: '600' }}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => saveNote(null, editContent)}
                  style={{ flex: 2, backgroundColor: COLORS.primary, borderRadius: RADIUS.sm, paddingVertical: 10, alignItems: 'center' }}>
                  <Text style={{ color: '#fff', fontWeight: '700' }}>Sauvegarder</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {notes.length === 0 && editingId !== 'new' ? (
            <View style={{ alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 }}>
              <Text style={{ fontSize: 48 }}>📝</Text>
              <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.ink }}>Aucune note</Text>
              <Text style={{ fontSize: 14, color: COLORS.mute }}>Appuyez sur + pour créer une note</Text>
            </View>
          ) : notes.map(note => (
            <View key={note.id} style={{ backgroundColor: COLORS.white, borderRadius: RADIUS.md, padding: 16, ...SHADOW.sm }}>
              {editingId === note.id ? (
                <>
                  <TextInput
                    style={{ fontSize: 14, color: COLORS.ink, minHeight: 80, textAlignVertical: 'top', borderWidth: 1, borderColor: COLORS.primary, borderRadius: RADIUS.sm, padding: 10, marginBottom: 10 }}
                    multiline
                    autoFocus
                    value={editContent}
                    onChangeText={setEditContent}
                  />
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TouchableOpacity onPress={() => { setEditingId(null); setEditContent(''); }}
                      style={{ flex: 1, borderWidth: 1, borderColor: COLORS.hairline, borderRadius: RADIUS.sm, paddingVertical: 8, alignItems: 'center' }}>
                      <Text style={{ color: COLORS.mute, fontWeight: '600' }}>Annuler</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => saveNote(note.id, editContent)}
                      style={{ flex: 2, backgroundColor: COLORS.primary, borderRadius: RADIUS.sm, paddingVertical: 8, alignItems: 'center' }}>
                      <Text style={{ color: '#fff', fontWeight: '700' }}>Sauvegarder</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <>
                  <Text style={{ fontSize: 14, color: COLORS.ink, lineHeight: 21, marginBottom: 10 }} numberOfLines={4}>{note.content}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 12, color: COLORS.mute }}>
                      {new Date(note.updated_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 16 }}>
                      <TouchableOpacity onPress={() => { setEditingId(note.id); setEditContent(note.content); }}>
                        <Icon name="edit" size={18} color={COLORS.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => deleteNote(note.id)}>
                        <Icon name="trash2" size={18} color={COLORS.danger} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </>
              )}
            </View>
          ))}
          <View style={{ height: 80 }} />
        </ScrollView>
      )}

      <TouchableOpacity onPress={startNew}
        style={{ position: 'absolute', bottom: 32, right: 24, backgroundColor: COLORS.primary, borderRadius: RADIUS.full, width: 56, height: 56, alignItems: 'center', justifyContent: 'center', ...SHADOW.md }}>
        <Icon name="plus" size={24} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}
