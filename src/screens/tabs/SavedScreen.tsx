import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSavedEvents } from '../../context/SavedEventsContext';
import EventCard from '../../components/EventCard';
import type { Event } from '../../types';

export default function SavedScreen() {
  const navigation = useNavigation<any>();
  const { savedEvents, loading, refresh } = useSavedEvents();
  const [refreshing, setRefreshing] = useState(false);

  async function onRefresh() {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }

  return (
    <View className="flex-1 bg-[#0f172a]">
      <View className="px-4 pt-12 pb-2">
        <Text className="text-2xl font-bold text-white">
          Saved <Text className="text-[#D4AF37]">Events</Text>
        </Text>
        <Text style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
          {savedEvents.length} saved
        </Text>
      </View>

      {loading && savedEvents.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#D4AF37" />
        </View>
      ) : (
        <FlatList
          data={savedEvents}
          keyExtractor={(item: Event) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 16 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#D4AF37"
              colors={['#D4AF37']}
              progressBackgroundColor="#1e293b"
            />
          }
          renderItem={({ item }: { item: Event }) => (
            <EventCard
              event={item}
              onPress={() => navigation.navigate('EventDetail', { event: item })}
            />
          )}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingTop: 60, paddingHorizontal: 24 }}>
              <Text style={{ color: '#64748b', fontSize: 40, marginBottom: 12 }}>☆</Text>
              <Text style={{ color: '#94a3b8', fontSize: 15, fontWeight: '600', marginBottom: 4 }}>
                No saved events yet
              </Text>
              <Text style={{ color: '#64748b', fontSize: 13, textAlign: 'center' }}>
                Tap the star on any event to save it here.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}
