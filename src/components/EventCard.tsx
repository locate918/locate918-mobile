import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import type { Event } from '../types';
import { useSavedEvents } from '../context/SavedEventsContext';

export default function EventCard({
  event,
  onPress,
}: {
  event: Event;
  onPress: () => void;
}) {
  const { isSaved, toggleSave } = useSavedEvents();
  const saved = isSaved(event.id);

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

      {/* Save / bookmark toggle */}
      <TouchableOpacity
        onPress={() => toggleSave(event)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={{
          position: 'absolute',
          top: 10,
          left: 10,
          width: 34,
          height: 34,
          borderRadius: 17,
          backgroundColor: 'rgba(0,0,0,0.6)',
          borderWidth: 1,
          borderColor: saved ? '#D4AF37' : 'rgba(255,255,255,0.15)',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        <Text style={{ fontSize: 15, color: saved ? '#D4AF37' : '#fff' }}>
          {saved ? '★' : '☆'}
        </Text>
      </TouchableOpacity>

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
