import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';

export default function LoginScreen() {
  const { signInWithPassword, signUpWithPassword } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError('');
    setMessage('');
    setLoading(true);

    try {
      if (mode === 'signin') {
        const { error: authError } = await signInWithPassword(email, password);
        if (authError) setError(authError.message);
      } else {
        const { data, error: authError } = await signUpWithPassword(email, password);
        if (authError) {
          setError(authError.message);
        } else if (!data?.session) {
          setMessage('Account created! Check your email to confirm.');
        }
      }
    } catch {
      setError('Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#0f172a' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 28 }}>
        {/* Logo */}
        <View style={{ alignItems: 'center', marginBottom: 48 }}>
          <Text style={{ fontSize: 42, fontWeight: 'bold', color: '#D4AF37', letterSpacing: 1 }}>
            locate918
          </Text>
          <Text style={{ fontSize: 13, color: '#64748b', marginTop: 6 }}>
            Experience Tulsa
          </Text>
        </View>

        {/* Subtitle */}
        <Text style={{ fontSize: 14, color: '#94a3b8', textAlign: 'center', marginBottom: 28 }}>
          {mode === 'signin' ? 'Sign in to your account' : 'Create a new account'}
        </Text>

        {/* Error / Success */}
        {error ? (
          <View style={{ backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)', borderRadius: 10, padding: 12, marginBottom: 16 }}>
            <Text style={{ color: '#ef4444', fontSize: 13, textAlign: 'center' }}>{error}</Text>
          </View>
        ) : null}
        {message ? (
          <View style={{ backgroundColor: 'rgba(34,197,94,0.1)', borderWidth: 1, borderColor: 'rgba(34,197,94,0.3)', borderRadius: 10, padding: 12, marginBottom: 16 }}>
            <Text style={{ color: '#22c55e', fontSize: 13, textAlign: 'center' }}>{message}</Text>
          </View>
        ) : null}

        {/* Email */}
        <TextInput
          style={{
            backgroundColor: '#1e293b',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.1)',
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 14,
            fontSize: 15,
            color: 'white',
            marginBottom: 12,
          }}
          placeholder="Email"
          placeholderTextColor="#475569"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        {/* Password */}
        <TextInput
          style={{
            backgroundColor: '#1e293b',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.1)',
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 14,
            fontSize: 15,
            color: 'white',
            marginBottom: 24,
          }}
          placeholder="Password"
          placeholderTextColor="#475569"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        {/* Submit */}
        <TouchableOpacity
          style={{
            backgroundColor: !email || !password || loading ? '#334155' : '#D4AF37',
            paddingVertical: 15,
            borderRadius: 12,
            alignItems: 'center',
            marginBottom: 16,
          }}
          onPress={handleSubmit}
          disabled={loading || !email || !password}>
          {loading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={{ color: '#000', fontSize: 16, fontWeight: '700' }}>
              {mode === 'signin' ? 'Sign In' : 'Create Account'}
            </Text>
          )}
        </TouchableOpacity>

        {/* Toggle */}
        <TouchableOpacity
          onPress={() => setMode(mode === 'signin' ? 'signup' : 'signin')}>
          <Text style={{ color: '#D4AF37', textAlign: 'center', fontSize: 13 }}>
            {mode === 'signin'
              ? "Don't have an account? Sign up"
              : 'Already have an account? Sign in'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}