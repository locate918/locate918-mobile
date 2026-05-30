import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { api } from '../services/api';
import { EVENT_CATEGORIES } from '../constants/categories';

/**
 * Category preference weights, keyed by category id (0 = not set, up to 1.0).
 *
 * NOTE: the exact preferences request/response shape could NOT be verified — the
 * endpoint is auth-gated, so it can't be introspected anonymously. We assume
 * `{ categories: { <id>: <weight> } }` and parse defensively. Confirm against a
 * logged-in session; if the backend differs, only the two adapters below change.
 */
type CategoryWeights = Record<string, number>;

const LEVELS: { label: string; weight: number }[] = [
  { label: 'Skip', weight: 0 },
  { label: 'Like', weight: 0.5 },
  { label: 'Love', weight: 1 },
];

function parsePreferences(data: any): CategoryWeights {
  if (!data || typeof data !== 'object') {
    return {};
  }
  const src =
    data.categories && typeof data.categories === 'object'
      ? data.categories
      : data;
  const out: CategoryWeights = {};
  for (const [k, v] of Object.entries(src)) {
    if (typeof v === 'number') {
      out[k] = v;
    }
  }
  return out;
}

function toPreferencesPayload(weights: CategoryWeights) {
  return { categories: weights };
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

export default function PreferencesScreen({ navigation }: any) {
  const [weights, setWeights] = useState<CategoryWeights>({});
  const [loading, setLoading] = useState(true);
  const [save, setSave] = useState<SaveState>('idle');

  useEffect(() => {
    let mounted = true;
    api
      .getMyPreferences()
      .then(data => {
        if (mounted) {
          setWeights(parsePreferences(data));
        }
      })
      .catch(() => {
        // start from empty if none set / load fails
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

  async function setWeight(categoryId: string, weight: number) {
    const next = { ...weights, [categoryId]: weight };
    setWeights(next);
    setSave('saving');
    try {
      await api.updatePreferences(toPreferencesPayload(next));
      setSave('saved');
    } catch {
      setSave('error');
    }
  }

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0f172a' }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 48, paddingBottom: 12, paddingHorizontal: 16 }}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 18, width: 36, height: 36, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
          <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>←</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 22, fontWeight: 'bold', color: 'white', flex: 1 }}>
          Preferences
        </Text>
        {save === 'saving' && <ActivityIndicator size="small" color="#D4AF37" />}
        {save === 'saved' && <Text style={{ color: '#22c55e', fontSize: 12 }}>Saved</Text>}
        {save === 'error' && <Text style={{ color: '#ef4444', fontSize: 12 }}>Failed</Text>}
      </View>

      <Text style={{ color: '#94a3b8', fontSize: 13, paddingHorizontal: 16, marginBottom: 12 }}>
        Tell Tully what you're into. This tunes your "For You" recommendations.
      </Text>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}>
        {EVENT_CATEGORIES.map(cat => {
          const current = weights[cat.id] ?? 0;
          return (
            <View
              key={cat.id}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#1e293b', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}>
              <Text style={{ color: 'white', fontSize: 15, fontWeight: '600', flex: 1 }}>
                {cat.label}
              </Text>
              <View style={{ flexDirection: 'row' }}>
                {LEVELS.map(level => {
                  const active = current === level.weight;
                  return (
                    <TouchableOpacity
                      key={level.label}
                      onPress={() => setWeight(cat.id, level.weight)}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 16,
                        marginLeft: 6,
                        backgroundColor: active ? 'rgba(212,175,55,0.2)' : 'transparent',
                        borderWidth: 1,
                        borderColor: active ? 'rgba(212,175,55,0.5)' : 'rgba(255,255,255,0.1)',
                      }}>
                      <Text style={{ fontSize: 12, fontWeight: '600', color: active ? '#D4AF37' : '#64748b' }}>
                        {level.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}
