import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  Linking,
  Share,
} from 'react-native';
import type { Event } from '../types';
import {
  trackEventDetailView,
  trackOutboundTicket,
  trackOutboundVenue,
} from '../services/analytics';
import { useSavedEvents } from '../context/SavedEventsContext';

export default function EventDetailScreen({ route, navigation }: any) {
  const event: Event = route.params.event;
  const { isSaved, toggleSave } = useSavedEvents();
  const saved = isSaved(event.id);

  // Fire the event_detail beacon once per screen open (fire-and-forget).
  useEffect(() => {
    trackEventDetailView(event);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openVenueWebsite() {
    if (!event.venue_website) {
      return;
    }
    trackOutboundVenue(event, event.venue_website);
    Linking.openURL(event.venue_website);
  }

  function openEventSource() {
    if (!event.source_url) {
      return;
    }
    trackOutboundTicket(event, event.source_url);
    Linking.openURL(event.source_url);
  }
  const startDate = event.start_time ? new Date(event.start_time) : null;
  const formattedDate = startDate
    ? startDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    : 'Date TBA';
  const formattedTime = startDate
    ? startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    : null;
  const endTime = event.end_time
    ? new Date(event.end_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    : null;
  const priceText =
    event.price_min != null || event.price_max != null
      ? event.price_min === 0 && (!event.price_max || event.price_max === 0)
        ? 'Free'
        : `$${event.price_min ?? 0}${event.price_max ? ' – $' + event.price_max : ''}`
      : null;

  function handleShare() {
    const url = event.source_url || event.venue_website || '';
    const dateStr = startDate ? formattedDate : '';
    Share.share({
      message: `Check out ${event.title}${event.venue ? ' at ' + event.venue : ''}${dateStr ? ' on ' + dateStr : ''}${url ? '\n' + url : ''}`,
    });
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0f172a' }}>
      <ScrollView>
        {event.image_url ? (
          <Image source={{ uri: event.image_url }} style={{ width: '100%', height: 240 }} resizeMode="cover" />
        ) : (
          <View style={{ height: 160, backgroundColor: '#162b4a', justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: '#D4AF37', fontSize: 56, fontWeight: 'bold', opacity: 0.2 }}>918</Text>
          </View>
        )}

        <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 }}>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: 'white', marginBottom: 8 }}>
            {event.title}
          </Text>

          <Text style={{ fontSize: 14, fontWeight: '600', color: '#D4AF37', marginBottom: 2 }}>
            {formattedDate}
          </Text>
          {formattedTime && (
            <Text style={{ fontSize: 13, color: '#94a3b8', marginBottom: 16 }}>
              {formattedTime}{endTime ? ` – ${endTime}` : ''}
            </Text>
          )}

          {(event.venue || event.location) && (
            <View style={{ backgroundColor: '#1e293b', borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
              <Text style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Venue</Text>
              <Text style={{ fontSize: 16, fontWeight: '600', color: 'white' }}>{event.venue ?? event.location}</Text>
              {event.venue_address && (
                <Text style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>{event.venue_address}</Text>
              )}
            </View>
          )}

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 }}>
            {priceText && (
              <View style={{ backgroundColor: 'rgba(212,175,55,0.1)', borderWidth: 1, borderColor: 'rgba(212,175,55,0.2)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, marginRight: 8, marginBottom: 8 }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: '#D4AF37' }}>{priceText}</Text>
              </View>
            )}
            {event.family_friendly && (
              <View style={{ backgroundColor: 'rgba(168,85,247,0.1)', borderWidth: 1, borderColor: 'rgba(168,85,247,0.2)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, marginRight: 8, marginBottom: 8 }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: '#c084fc' }}>Family Friendly</Text>
              </View>
            )}
            {event.outdoor && (
              <View style={{ backgroundColor: 'rgba(56,189,248,0.1)', borderWidth: 1, borderColor: 'rgba(56,189,248,0.2)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, marginRight: 8, marginBottom: 8 }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: '#38bdf8' }}>Outdoor</Text>
              </View>
            )}
          </View>

          {event.categories?.length > 0 && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 }}>
              {event.categories.map((cat: string, i: number) => (
                <View key={i} style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4, marginRight: 6, marginBottom: 6 }}>
                  <Text style={{ fontSize: 11, color: '#cbd5e1', textTransform: 'capitalize' }}>{cat}</Text>
                </View>
              ))}
            </View>
          )}

          {event.description && (
            <View style={{ marginBottom: 24 }}>
              <Text style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>About</Text>
              <Text style={{ fontSize: 14, color: '#cbd5e1', lineHeight: 22 }}>{event.description}</Text>
            </View>
          )}

          {event.venue_website && (
            <TouchableOpacity
              style={{ backgroundColor: '#D4AF37', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginBottom: 10 }}
              onPress={openVenueWebsite}>
              <Text style={{ color: '#000', fontSize: 15, fontWeight: '700' }}>Visit Venue Website</Text>
            </TouchableOpacity>
          )}
          {event.source_url && (
            <TouchableOpacity
              style={{ borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', paddingVertical: 14, borderRadius: 12, alignItems: 'center' }}
              onPress={openEventSource}>
              <Text style={{ color: '#94a3b8', fontSize: 15, fontWeight: '600' }}>View Event Source</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      <TouchableOpacity
        style={{ position: 'absolute', top: 44, left: 16, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 20, width: 40, height: 40, justifyContent: 'center', alignItems: 'center' }}
        onPress={() => navigation.goBack()}>
        <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>←</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={{ position: 'absolute', top: 44, right: 64, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 20, width: 40, height: 40, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: saved ? '#D4AF37' : 'transparent' }}
        onPress={() => toggleSave(event)}>
        <Text style={{ color: saved ? '#D4AF37' : 'white', fontSize: 18 }}>{saved ? '★' : '☆'}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={{ position: 'absolute', top: 44, right: 16, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 20, width: 40, height: 40, justifyContent: 'center', alignItems: 'center' }}
        onPress={handleShare}>
        <Text style={{ color: 'white', fontSize: 16 }}>↗</Text>
      </TouchableOpacity>
    </View>
  );
}