import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { api } from '../services/api';

/**
 * Read-only "Your interests" view.
 *
 * Category preferences are stored as one row per (category, weight). The
 * `weight` is a SIGNED ML affinity score (e.g. -2.46), seeded at onboarding and
 * tuned by the recommender from user activity — NOT a user-set level. So this
 * screen DISPLAYS affinities (it does not let the user write weights, which
 * would corrupt the model). Shape verified against /api/users/me on 2026-05-30:
 * `preferences: [{ category, weight, id, user_id, created_at, updated_at }]`.
 */
interface CategoryPreference {
  category: string;
  weight: number;
}

function parsePreferences(data: any): CategoryPreference[] {
  const arr = Array.isArray(data?.preferences)
    ? data.preferences
    : Array.isArray(data)
    ? data
    : [];
  return arr
    .filter((p: any) => p && typeof p.category === 'string')
    .map((p: any) => ({
      category: p.category,
      weight: typeof p.weight === 'number' ? p.weight : 0,
    }));
}

function affinity(weight: number): { label: string; color: string } {
  if (weight >= 1) return { label: 'Loved', color: '#D4AF37' };
  if (weight > 0) return { label: 'Liked', color: '#22c55e' };
  if (weight === 0) return { label: 'Neutral', color: '#64748b' };
  if (weight > -1) return { label: 'Cooler', color: '#94a3b8' };
  return { label: 'Muted', color: '#ef4444' };
}

export default function PreferencesScreen({ navigation }: any) {
  const [prefs, setPrefs] = useState<CategoryPreference[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    // `preferences` is embedded on the user object; read it from there.
    api
      .getMe()
      .then(user => {
        if (mounted) {
          const parsed = parsePreferences(user).sort(
            (a, b) => b.weight - a.weight,
          );
          setPrefs(parsed);
        }
      })
      .catch(() => {
        // leave empty on failure
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#0f172a' }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 48, paddingBottom: 12, paddingHorizontal: 16 }}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 18, width: 36, height: 36, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
          <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>←</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 22, fontWeight: 'bold', color: 'white' }}>
          Your Interests
        </Text>
      </View>

      <Text style={{ color: '#94a3b8', fontSize: 13, paddingHorizontal: 16, marginBottom: 12 }}>
        Tully learns these from your activity — browse and save events to refine
        your "For You" recommendations.
      </Text>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#D4AF37" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}>
          {prefs.length === 0 ? (
            <View style={{ alignItems: 'center', paddingTop: 40, paddingHorizontal: 24 }}>
              <Text style={{ color: '#94a3b8', fontSize: 15, fontWeight: '600', marginBottom: 4 }}>
                No interests yet
              </Text>
              <Text style={{ color: '#64748b', fontSize: 13, textAlign: 'center' }}>
                Your category affinities will appear here as you use the app.
              </Text>
            </View>
          ) : (
            prefs.map(p => {
              const a = affinity(p.weight);
              return (
                <View
                  key={p.category}
                  style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#1e293b', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}>
                  <Text style={{ color: 'white', fontSize: 15, fontWeight: '600', flex: 1 }}>
                    {p.category}
                  </Text>
                  <View style={{ backgroundColor: a.color + '22', borderColor: a.color + '55', borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 4 }}>
                    <Text style={{ color: a.color, fontSize: 12, fontWeight: '700' }}>
                      {a.label}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
}
