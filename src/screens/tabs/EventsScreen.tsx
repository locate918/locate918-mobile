import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  RefreshControl,
  TextInput,
  ScrollView,
  Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { api } from '../../services/api';
import type { Event, Venue } from '../../types';
import EventCard from '../../components/EventCard';
import { FILTER_CATEGORIES as CATEGORIES } from '../../constants/categories';

const LOGO = require('../../assets/logo.png');

function getWeekRange() {
  const now = new Date();
  const day = now.getDay();
  const start = new Date(now);
  start.setDate(now.getDate() - day);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export default function EventsScreen() {
  const navigation = useNavigation<any>();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [ui, setUi] = useState({
    search: '',
    tab: 'thisWeek' as 'thisWeek' | 'allEvents' | 'byVenue' | 'forYou',
    category: 'all',
    venue: null as string | null,
    venueSearch: '',
  });

  // Recommendations ("For You") — loaded lazily on first visit to the tab.
  const [recommendations, setRecommendations] = useState<Event[]>([]);
  const [recsLoading, setRecsLoading] = useState(false);
  const [recsLoaded, setRecsLoaded] = useState(false);

  // Real venue metadata, keyed by lowercased venue name (from GET /api/venues).
  const [venueMeta, setVenueMeta] = useState<Record<string, Venue>>({});

  async function loadEvents() {
    try {
      const data = await api.getEvents();
      setEvents(data);
      setError('');
    } catch (e: any) {
      setError(e.message || 'Failed to load events');
    }
  }

  async function loadRecommendations() {
    setRecsLoading(true);
    try {
      const data = await api.getRecommendations();
      setRecommendations(Array.isArray(data) ? data : []);
    } catch {
      // non-critical; leave recommendations empty
    } finally {
      setRecsLoaded(true);
      setRecsLoading(false);
    }
  }

  async function loadVenueMeta() {
    try {
      const data = await api.getVenues();
      const map: Record<string, Venue> = {};
      (Array.isArray(data) ? data : []).forEach(v => {
        if (v.name) map[v.name.toLowerCase()] = v;
      });
      setVenueMeta(map);
    } catch {
      // non-critical; venue header just won't show extra metadata
    }
  }

  useEffect(() => {
    loadEvents().finally(() => setLoading(false));
  }, []);

  // Lazy-load per-tab data the first time each tab is opened.
  useEffect(() => {
    if (ui.tab === 'forYou' && !recsLoaded) {
      loadRecommendations();
    }
    if (ui.tab === 'byVenue' && Object.keys(venueMeta).length === 0) {
      loadVenueMeta();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ui.tab]);

  async function onRefresh() {
    setRefreshing(true);
    await (ui.tab === 'forYou' ? loadRecommendations() : loadEvents());
    setRefreshing(false);
  }

  // Venue list
  const venueMap: Record<string, number> = {};
  events.forEach((e: Event) => {
    const v = e.venue || e.location;
    if (v) venueMap[v] = (venueMap[v] || 0) + 1;
  });
  const venues = Object.entries(venueMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
  const filteredVenues = venues.filter(
    (v) => !ui.venueSearch || v.name.toLowerCase().includes(ui.venueSearch.toLowerCase()),
  );

  // Filter events. "For You" draws from recommendations; other tabs from events.
  const week = getWeekRange();
  const baseEvents = ui.tab === 'forYou' ? recommendations : events;
  const filtered = baseEvents.filter((e: Event) => {
    const q = ui.search.toLowerCase();
    const matchesSearch =
      !q ||
      e.title?.toLowerCase().includes(q) ||
      e.venue?.toLowerCase().includes(q) ||
      e.location?.toLowerCase().includes(q) ||
      e.description?.toLowerCase().includes(q);

    if (ui.tab === 'thisWeek') {
      // Hide priority 3 events (aggregator/library) in This Week — matches web app
      if ((e.source_priority ?? 3) >= 3) return false;
      if (e.start_time) {
        const d = new Date(e.start_time);
        if (d < week.start || d > week.end) return false;
      }
    }
    if (ui.tab === 'byVenue' && ui.venue) {
      if (e.venue !== ui.venue && e.location !== ui.venue) return false;
    }

    const matchesCategory =
      ui.category === 'all' ||
      e.categories?.some((c: string) => c.toLowerCase().includes(ui.category));

    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-[#0f172a]">
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center bg-[#0f172a] px-6">
        <Text className="text-red-400 text-center">{error}</Text>
      </View>
    );
  }

  const showVenuePicker = ui.tab === 'byVenue' && !ui.venue;
  const TABS = [
    { id: 'forYou', label: 'For You' },
    { id: 'thisWeek', label: 'This Week' },
    { id: 'allEvents', label: 'All Events' },
    { id: 'byVenue', label: 'By Venue' },
  ];
  const selectedVenueMeta =
    ui.tab === 'byVenue' && ui.venue ? venueMeta[ui.venue.toLowerCase()] : undefined;

  return (
    <View className="flex-1 bg-[#0f172a]">
      <View className="px-4 pt-12 pb-2">
        {/* Logo + Title */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <Image
            source={LOGO}
            style={{ width: 40, height: 40, borderRadius: 8, marginRight: 10 }}
            resizeMode="cover"
          />
          <Text className="text-2xl font-bold text-white">
            Discover <Text className="text-[#D4AF37]">Tulsa</Text>
          </Text>
        </View>

        {/* Search */}
        {!showVenuePicker && (
          <TextInput
            style={{
              backgroundColor: '#1e293b',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.1)',
              borderRadius: 12,
              paddingHorizontal: 14,
              paddingVertical: 10,
              fontSize: 14,
              color: 'white',
              marginBottom: 10,
            }}
            placeholder="Search events, venues..."
            placeholderTextColor="#475569"
            value={ui.search}
            onChangeText={(t) => setUi((p) => ({ ...p, search: t }))}
            returnKeyType="search"
          />
        )}

        {/* Primary tabs */}
        <View style={{ flexDirection: 'row', marginBottom: 10, borderRadius: 10, backgroundColor: '#1e293b', overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
          {TABS.map((t) => (
            <TouchableOpacity
              key={t.id}
              onPress={() => setUi((p) => ({ ...p, tab: t.id as any, venue: null, venueSearch: '' }))}
              style={{
                flex: 1,
                paddingVertical: 10,
                alignItems: 'center',
                backgroundColor: ui.tab === t.id ? '#D4AF37' : 'transparent',
              }}>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '700',
                  color: ui.tab === t.id ? '#000' : '#94a3b8',
                }}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Category chips */}
        {!showVenuePicker && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
            {CATEGORIES.map((f) => (
              <TouchableOpacity
                key={f.id}
                onPress={() => setUi((p) => ({ ...p, category: f.id }))}
                style={{
                  backgroundColor: ui.category === f.id ? 'rgba(212,175,55,0.2)' : 'transparent',
                  borderWidth: 1,
                  borderColor: ui.category === f.id ? 'rgba(212,175,55,0.4)' : 'rgba(255,255,255,0.08)',
                  borderRadius: 20,
                  paddingHorizontal: 12,
                  paddingVertical: 5,
                  marginRight: 8,
                }}>
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '600',
                    color: ui.category === f.id ? '#D4AF37' : '#64748b',
                  }}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Venue back button */}
        {ui.tab === 'byVenue' && ui.venue && (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
            <TouchableOpacity
              onPress={() => setUi((p) => ({ ...p, venue: null }))}
              style={{
                backgroundColor: '#1e293b',
                borderRadius: 8,
                paddingHorizontal: 10,
                paddingVertical: 6,
                marginRight: 10,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.1)',
              }}>
              <Text style={{ color: '#94a3b8', fontSize: 13, fontWeight: '600' }}>← Back</Text>
            </TouchableOpacity>
            <Text style={{ color: '#D4AF37', fontSize: 14, fontWeight: '600', flex: 1 }} numberOfLines={1}>
              {ui.venue}
            </Text>
          </View>
        )}

        {/* Count */}
        <Text style={{ fontSize: 11, color: '#64748b', marginTop: 6, marginBottom: 2 }}>
          {showVenuePicker
            ? `${filteredVenues.length} venue${filteredVenues.length !== 1 ? 's' : ''}`
            : `${filtered.length} event${filtered.length !== 1 ? 's' : ''}${ui.search || ui.category !== 'all' || ui.tab !== 'allEvents' ? ' found' : ''}`}
        </Text>
      </View>

      {/* Venue picker */}
      {showVenuePicker ? (
        <View style={{ flex: 1, paddingHorizontal: 16 }}>
          <TextInput
            style={{
              backgroundColor: '#1e293b',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.1)',
              borderRadius: 12,
              paddingHorizontal: 14,
              paddingVertical: 10,
              fontSize: 14,
              color: 'white',
              marginBottom: 10,
            }}
            placeholder="Search venues..."
            placeholderTextColor="#475569"
            value={ui.venueSearch}
            onChangeText={(t) => setUi((p) => ({ ...p, venueSearch: t }))}
          />
          <FlatList
            data={filteredVenues}
            keyExtractor={(item) => item.name}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setUi((p) => ({ ...p, venue: item.name }))}
                style={{
                  backgroundColor: '#1e293b',
                  borderRadius: 12,
                  padding: 14,
                  marginBottom: 10,
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.1)',
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                <Text style={{ fontSize: 15, fontWeight: '600', color: 'white', flex: 1, marginRight: 12 }} numberOfLines={1}>
                  {item.name}
                </Text>
                <View style={{ backgroundColor: 'rgba(212,175,55,0.15)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#D4AF37' }}>{item.count}</Text>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={{ alignItems: 'center', paddingTop: 40 }}>
                <Text style={{ color: '#64748b', fontSize: 14 }}>No venues match</Text>
              </View>
            }
          />
        </View>
      ) : (
        <FlatList
          data={filtered}
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
          ListHeaderComponent={
            selectedVenueMeta ? (
              <View style={{ backgroundColor: '#1e293b', borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(212,175,55,0.2)' }}>
                {selectedVenueMeta.address && (
                  <Text style={{ fontSize: 13, color: '#94a3b8', marginBottom: 6 }}>{selectedVenueMeta.address}</Text>
                )}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                  {selectedVenueMeta.venue_type && (
                    <Text style={{ fontSize: 11, color: '#D4AF37', marginRight: 12, textTransform: 'capitalize' }}>{selectedVenueMeta.venue_type}</Text>
                  )}
                  {selectedVenueMeta.capacity != null && (
                    <Text style={{ fontSize: 11, color: '#64748b', marginRight: 12 }}>Cap. {selectedVenueMeta.capacity}</Text>
                  )}
                </View>
                {selectedVenueMeta.website && (
                  <TouchableOpacity onPress={() => Linking.openURL(selectedVenueMeta.website as string)} style={{ marginTop: 8 }}>
                    <Text style={{ fontSize: 12, color: '#D4AF37', fontWeight: '600' }}>Visit venue website →</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <EventCard
              event={item}
              onPress={() => navigation.navigate('EventDetail', { event: item })}
            />
          )}
          ListEmptyComponent={
            ui.tab === 'forYou' && recsLoading ? (
              <View style={{ alignItems: 'center', paddingTop: 40 }}>
                <ActivityIndicator size="large" color="#D4AF37" />
              </View>
            ) : ui.tab === 'forYou' ? (
              <View style={{ alignItems: 'center', paddingTop: 40, paddingHorizontal: 24 }}>
                <Text style={{ color: '#94a3b8', fontSize: 15, fontWeight: '600', marginBottom: 4 }}>No recommendations yet</Text>
                <Text style={{ color: '#64748b', fontSize: 13, textAlign: 'center' }}>
                  Browse and save events so Tully can learn what you like.
                </Text>
              </View>
            ) : (
              <View style={{ alignItems: 'center', paddingTop: 40 }}>
                <Text style={{ color: '#64748b', fontSize: 14 }}>No events match your search</Text>
              </View>
            )
          }
        />
      )}
    </View>
  );
}