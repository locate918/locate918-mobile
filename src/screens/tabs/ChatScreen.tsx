import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

const INITIAL_MESSAGE: Message = {
  role: 'assistant',
  text: "Welcome to Tulsa! I'm Tully and I can help you find concerts, plan a date night, discover family activities, or uncover hidden gems. What are you looking for?",
};

export default function ChatScreen() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  async function handleSend() {
    const text = input.trim();
    if (!text || isTyping) return;

    const userMessage: Message = { role: 'user', text };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Build conversation history for the API
    const history = [...messages, userMessage].map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.text }],
    }));

    try {
      const response = await api.chatWithTully(
        text,
        user?.id ?? null,
        history,
        null,
      );

      setMessages(prev => [
        ...prev,
        { role: 'assistant', text: response.message },
      ]);
    } catch (e) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: "I'm having trouble connecting right now. Please try again in a moment.",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  }

  function renderMessage({ item }: { item: Message }) {
    const isUser = item.role === 'user';

    return (
      <View
        style={{
          alignSelf: isUser ? 'flex-end' : 'flex-start',
          maxWidth: '80%',
          marginBottom: 12,
          backgroundColor: isUser ? '#D4AF37' : '#1e293b',
          borderRadius: 16,
          borderTopRightRadius: isUser ? 4 : 16,
          borderTopLeftRadius: isUser ? 16 : 4,
          paddingHorizontal: 14,
          paddingVertical: 10,
        }}>
        {!isUser && (
          <Text
            style={{
              fontSize: 10,
              fontWeight: 'bold',
              color: '#D4AF37',
              marginBottom: 4,
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}>
            Tully
          </Text>
        )}
        <Text
          style={{
            fontSize: 14,
            lineHeight: 20,
            color: isUser ? '#000' : '#e2e8f0',
          }}>
          {item.text}
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#0f172a' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}>
      {/* Header */}
      <View style={{ paddingTop: 48, paddingBottom: 12, paddingHorizontal: 16 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: 'white' }}>
          Chat with <Text style={{ color: '#D4AF37' }}>Tully</Text>
        </Text>
        <Text style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
          Your AI guide to Tulsa events
        </Text>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(_, i) => i.toString()}
        renderItem={renderMessage}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 8 }}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: true })
        }
        onLayout={() =>
          flatListRef.current?.scrollToEnd({ animated: false })
        }
      />

      {/* Typing indicator */}
      {isTyping && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingBottom: 8,
          }}>
          <ActivityIndicator size="small" color="#D4AF37" />
          <Text style={{ color: '#64748b', fontSize: 12, marginLeft: 8 }}>
            Tully is thinking...
          </Text>
        </View>
      )}

      {/* Input */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 12,
          paddingVertical: 10,
          borderTopWidth: 1,
          borderTopColor: '#1e293b',
          backgroundColor: '#0f172a',
        }}>
        <TextInput
          style={{
            flex: 1,
            backgroundColor: '#1e293b',
            borderRadius: 20,
            paddingHorizontal: 16,
            paddingVertical: 10,
            fontSize: 14,
            color: 'white',
            marginRight: 8,
          }}
          placeholder="Ask Tully anything..."
          placeholderTextColor="#64748b"
          value={input}
          onChangeText={setInput}
          onSubmitEditing={handleSend}
          returnKeyType="send"
          editable={!isTyping}
        />
        <TouchableOpacity
          onPress={handleSend}
          disabled={!input.trim() || isTyping}
          style={{
            backgroundColor: input.trim() && !isTyping ? '#D4AF37' : '#334155',
            width: 40,
            height: 40,
            borderRadius: 20,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
          <Text style={{ fontSize: 16, color: input.trim() && !isTyping ? '#000' : '#64748b' }}>
            ↑
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}