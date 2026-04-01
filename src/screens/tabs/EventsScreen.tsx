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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { api } from '../../services/api';

const LOGO = require('../../assets/logo.png');

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'music', label: 'Music' },
  { id: 'comedy', label: 'Comedy' },
  { id: 'art', label: 'Arts' },
  { id: 'food', label: 'Food' },
  { id: 'sports', label: 'Sports' },
  { id: 'family', label: 'Family' },
  { id: 'festival', label: 'Festival' },
  { id: 'community', label: 'Community' },
];

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

function EventCard({ event, onPress }: { event: any; onPress: () => void }) {
  const startDate = event.start_time ? new Date(event.start_time) : null;
  const formattedDate = startDate
    ? startDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    : 'Date TBA';
  const formattedTime = startDate
    ? startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    : '';
  const priceText =
    event.price_min != null || event.price_max != null
      ? event.price_min === 0 && (!event.price_max || event.price_max === 0)
        ? 'Free'
        : `$${event.price_min ?? 0}${event.price_max ? '–$' + event.price_max : ''}`
      : null;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      className="bg-[#1e293b] rounded-2xl mb-4 overflow-hidden border border-white/10">
      {event.image_url ? (
        <View className="h-44 relative">
          <Image source={{ uri: event.image_url }} className="w-full h-full" resizeMode="cover" />
          <View className="absolute inset-0 bg-black/40" />
          {(event.venue || event.location) && (
            <View className="absolute top-3 right-3 bg-black/60 rounded-lg px-2.5 py-1 border border-white/10">
              <Text className="text-[10px] text-[#D4AF37] font-bold uppercase tracking-wider">
                {event.venue ?? event.location}
              </Text>
            </View>
          )}
          <View className="absolute bottom-3 left-3 bg-black/60 rounded-full px-3 py-1.5 border border-white/10">
            <Text className="text-xs text-[#D4AF37] font-semibold">
              {formattedDate} · {formattedTime}
            </Text>
          </View>
        </View>
      ) : (
        <View className="h-24 bg-[#162b4a] justify-center items-center relative">
          <Text className="text-[#D4AF37] text-4xl font-bold opacity-20">918</Text>
          {(event.venue || event.location) && (
            <View className="absolute top-3 right-3 bg-black/40 rounded-lg px-2.5 py-1">
              <Text className="text-[10px] text-[#D4AF37] font-bold uppercase tracking-wider">
                {event.venue ?? event.location}
              </Text>
            </View>
          )}
          <View className="absolute bottom-3 left-3 bg-black/40 rounded-full px-3 py-1.5">
            <Text className="text-xs text-[#D4AF37] font-semibold">
              {formattedDate} · {formattedTime}
            </Text>
          </View>
        </View>
      )}
      <View className="px-4 py-4">
        <Text className="text-lg font-bold text-white mb-1" numberOfLines={2}>
          {event.title}
        </Text>
        {event.description ? (
          <Text className="text-sm text-slate-400 mb-3 leading-5" numberOfLines={2}>
            {event.description}
          </Text>
        ) : null}
        <View className="flex-row items-center justify-between">
          {!event.image_url && (event.venue || event.location) ? (
            <Text className="text-xs text-slate-500" numberOfLines={1}>
              {event.venue ?? event.location}
            </Text>
          ) : (
            <View />
          )}
          <View className="flex-row">
            {priceText && (
              <View className="bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-full px-2.5 py-0.5 mr-2">
                <Text className="text-[10px] font-semibold text-[#D4AF37]">{priceText}</Text>
              </View>
            )}
            {event.family_friendly && (
              <View className="bg-purple-500/10 border border-purple-500/20 rounded-full px-2.5 py-0.5">
                <Text className="text-[10px] font-semibold text-purple-300">Family</Text>
              </View>
            )}
          </View>
        </View>
        {event.categories?.length > 0 && (
          <View className="flex-row flex-wrap mt-3">
            {event.categories.slice(0, 3).map((cat: string, i: number) => (
              <View key={i} className="bg-white/5 border border-white/10 rounded px-2 py-0.5 mr-1.5 mb-1.5">
                <Text className="text-[10px] text-slate-300 capitalize">{cat}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function EventsScreen() {
  const navigation = useNavigation<any>();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [ui, setUi] = useState({
    search: '',
    tab: 'thisWeek' as 'thisWeek' | 'allEvents' | 'byVenue',
    category: 'all',
    venue: null as string | null,
    venueSearch: '',
  });

  async function loadEvents() {
    try {
      const data = await api.getEvents();
      setEvents(data);
      setError('');
    } catch (e: any) {
      setError(e.message || 'Failed to load events');
    }
  }

  useEffect(() => {
    loadEvents().finally(() => setLoading(false));
  }, []);

  async function onRefresh() {
    setRefreshing(true);
    await loadEvents();
    setRefreshing(false);
  }

  // Venue list
  const venueMap: Record<string, number> = {};
  events.forEach((e: any) => {
    const v = e.venue || e.location;
    if (v) venueMap[v] = (venueMap[v] || 0) + 1;
  });
  const venues = Object.entries(venueMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
  const filteredVenues = venues.filter(
    (v) => !ui.venueSearch || v.name.toLowerCase().includes(ui.venueSearch.toLowerCase()),
  );

  // Filter events
  const week = getWeekRange();
  const filtered = events.filter((e: any) => {
    const q = ui.search.toLowerCase();
    const matchesSearch =
      !q ||
      e.title?.toLowerCase().includes(q) ||
      e.venue?.toLowerCase().includes(q) ||
      e.location?.toLowerCase().includes(q) ||
      e.description?.toLowerCase().includes(q);

    if (ui.tab === 'thisWeek' && e.start_time) {
      const d = new Date(e.start_time);
      if (d < week.start || d > week.end) return false;
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
    { id: 'thisWeek', label: 'This Week' },
    { id: 'allEvents', label: 'All Events' },
    { id: 'byVenue', label: 'By Venue' },
  ];

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
          keyExtractor={(item: any) => item.id}
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
          renderItem={({ item }) => (
            <EventCard
              event={item}
              onPress={() => navigation.navigate('EventDetail', { event: item })}
            />
          )}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingTop: 40 }}>
              <Text style={{ color: '#64748b', fontSize: 14 }}>No events match your search</Text>
            </View>
          }
        />
      )}
    </View>
  );
}