import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import { useNavigation } from '@react-navigation/native';
import { api } from '../../services/api';

const TULSA_REGION = {
  latitude: 36.154,
  longitude: -95.9928,
  latitudeDelta: 0.15,
  longitudeDelta: 0.15,
};

export default function MapScreen() {
  const navigation = useNavigation<any>();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEvents() {
      try {
        const data = await api.getEvents();
        const withCoords = data.filter(
          (e: any) => e.venue_latitude && e.venue_longitude,
        );
        setEvents(withCoords);
      } catch (e) {
        console.error('Failed to load events for map', e);
      } finally {
        setLoading(false);
      }
    }
    fetchEvents();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' }}>
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0f172a' }}>
      <View style={{ paddingTop: 48, paddingBottom: 12, paddingHorizontal: 16 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: 'white' }}>
          Event <Text style={{ color: '#D4AF37' }}>Map</Text>
        </Text>
        <Text style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
          {events.length} events with locations
        </Text>
      </View>

      <View style={{ flex: 1, borderTopLeftRadius: 16, borderTopRightRadius: 16, overflow: 'hidden' }}>
        <MapView
          style={{ flex: 1 }}
          initialRegion={TULSA_REGION}
          showsUserLocation={true}
          showsMyLocationButton={true}>
          {events.map((event: any) => (
            <Marker
              key={event.id}
              coordinate={{
                latitude: event.venue_latitude,
                longitude: event.venue_longitude,
              }}
              pinColor="#D4AF37">
              <Callout
                onPress={() =>
                  navigation.navigate('EventDetail', { event })
                }>
                <View style={{ width: 200, padding: 4 }}>
                  <Text
                    style={{ fontWeight: 'bold', fontSize: 13, color: '#000', marginBottom: 2 }}
                    numberOfLines={2}>
                    {event.title}
                  </Text>
                  <Text style={{ fontSize: 11, color: '#666' }}>
                    {event.venue ?? event.location ?? 'TBA'}
                  </Text>
                  <Text style={{ fontSize: 11, color: '#666', marginTop: 2 }}>
                    {event.start_time
                      ? new Date(event.start_time).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })
                      : ''}
                  </Text>
                  <Text style={{ fontSize: 10, color: '#2563eb', marginTop: 4 }}>
                    Tap for details
                  </Text>
                </View>
              </Callout>
            </Marker>
          ))}
        </MapView>
      </View>
    </View>
  );
}