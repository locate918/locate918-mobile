import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { user, signOut } = useAuth();

  return (
    <View style={{ flex: 1, backgroundColor: '#0f172a', paddingHorizontal: 24, paddingTop: 48 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', color: 'white', marginBottom: 24 }}>
        Profile
      </Text>

      <View style={{ backgroundColor: '#1e293b', borderRadius: 12, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
        <Text style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Email</Text>
        <Text style={{ fontSize: 16, fontWeight: '600', color: 'white' }}>{user?.email ?? '—'}</Text>

        <Text style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginTop: 16, marginBottom: 4 }}>User ID</Text>
        <Text style={{ fontSize: 12, color: '#64748b' }}>{user?.id ?? '—'}</Text>
      </View>

      <TouchableOpacity
        style={{ backgroundColor: '#1e293b', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', paddingVertical: 14, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 12 }}
        onPress={() => navigation.navigate('Preferences')}>
        <Text style={{ color: 'white', fontSize: 15, fontWeight: '600' }}>Your Interests</Text>
        <Text style={{ color: '#64748b', fontSize: 18 }}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={{ backgroundColor: 'rgba(239,68,68,0.15)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)', paddingVertical: 14, borderRadius: 12, alignItems: 'center' }}
        onPress={signOut}>
        <Text style={{ color: '#ef4444', fontSize: 15, fontWeight: '600' }}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
}