import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, RADIUS } from '../../lib/tokens';
import { Avatar } from '../../components/UI';
import { getMessages, sendMessage, subscribeToMessages } from '../../lib/supabase';
import { useSession } from '../../hooks/useSession';

export default function ChatScreen({ route, navigation }) {
  const { conversationId, name, productTitle } = route.params ?? {};
  const session = useSession();
  const [messages, setMessages] = useState([]);
  const [text, setText]         = useState('');
  const [loading, setLoading]   = useState(true);
  const [sending, setSending]   = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!conversationId) return;
    getMessages(conversationId).then(msgs => {
      setMessages(msgs ?? []);
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 100);
    });

    const unsub = subscribeToMessages(conversationId, msg => {
      setMessages(prev => [...prev, msg]);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    });
    return () => unsub?.();
  }, [conversationId]);

  async function handleSend() {
    if (!text.trim() || sending) return;
    setSending(true);
    setText('');
    await sendMessage(conversationId, session.user.id, text.trim());
    setSending(false);
  }

  const myId = session?.user?.id;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.paper }} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={{ backgroundColor: COLORS.white, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: COLORS.hairline }}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ fontSize: 22, color: COLORS.ink }}>←</Text>
        </TouchableOpacity>
        <Avatar size={38} initials={name?.[0]?.toUpperCase() ?? '?'} bg={COLORS.primary} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.ink }}>{name ?? 'Vendeur'}</Text>
          {productTitle && <Text style={{ fontSize: 11, color: COLORS.mute }} numberOfLines={1}>{productTitle}</Text>}
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={0}>
        {loading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator color={COLORS.primary} />
          </View>
        ) : (
          <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 8 }}>
            {messages.map((msg, i) => {
              const mine = msg.sender_id === myId;
              return (
                <View key={msg.id ?? i} style={{ alignItems: mine ? 'flex-end' : 'flex-start' }}>
                  <View style={{ maxWidth: '78%', backgroundColor: mine ? COLORS.primary : COLORS.white, borderRadius: RADIUS.md, borderBottomRightRadius: mine ? 4 : RADIUS.md, borderBottomLeftRadius: mine ? RADIUS.md : 4, paddingHorizontal: 14, paddingVertical: 10 }}>
                    <Text style={{ fontSize: 14, color: mine ? '#fff' : COLORS.ink, lineHeight: 20 }}>{msg.content}</Text>
                    <Text style={{ fontSize: 10, color: mine ? 'rgba(255,255,255,0.6)' : COLORS.mute, marginTop: 4, textAlign: 'right' }}>
                      {new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        )}

        {/* Input bar */}
        <View style={{ backgroundColor: COLORS.white, flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 1, borderTopColor: COLORS.hairline }}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Écrivez un message…"
            placeholderTextColor={COLORS.mute}
            multiline
            style={{ flex: 1, fontSize: 14, color: COLORS.ink, backgroundColor: COLORS.paper, borderRadius: RADIUS.md, paddingHorizontal: 14, paddingVertical: 10, maxHeight: 100 }}
          />
          <TouchableOpacity onPress={handleSend} disabled={!text.trim() || sending}
            style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: text.trim() ? COLORS.primary : COLORS.hairline, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 20 }}>↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
