import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import {
  hasAcknowledgedAnalyticsNotice,
  acknowledgeAnalyticsNotice,
} from '../services/consent';

/**
 * One-time, dismissible disclosure of anonymous aggregate analytics. Renders
 * nothing once acknowledged (persisted in AsyncStorage). Mounted globally so it
 * appears over whichever screen is first shown on a fresh install.
 */
export default function AnalyticsConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let mounted = true;
    hasAcknowledgedAnalyticsNotice().then(ack => {
      if (mounted && !ack) {
        setVisible(true);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  if (!visible) {
    return null;
  }

  function dismiss() {
    setVisible(false);
    // fire-and-forget persist; UI already hidden
    acknowledgeAnalyticsNotice();
  }

  return (
    <View
      style={{
        position: 'absolute',
        left: 12,
        right: 12,
        bottom: 88,
        backgroundColor: '#1e293b',
        borderRadius: 14,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(212,175,55,0.3)',
        shadowColor: '#000',
        shadowOpacity: 0.4,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 8,
      }}>
      <Text
        style={{
          color: '#D4AF37',
          fontWeight: '700',
          fontSize: 13,
          marginBottom: 6,
        }}>
        Anonymous analytics
      </Text>
      <Text
        style={{
          color: '#cbd5e1',
          fontSize: 12,
          lineHeight: 18,
          marginBottom: 12,
        }}>
        We collect anonymous, aggregate usage analytics to improve locate918 — no
        personal information, no cross-site tracking, and we never sell your data.
      </Text>
      <TouchableOpacity
        onPress={dismiss}
        style={{
          backgroundColor: '#D4AF37',
          borderRadius: 10,
          paddingVertical: 10,
          alignItems: 'center',
        }}>
        <Text style={{ color: '#000', fontWeight: '700', fontSize: 13 }}>
          Got it
        </Text>
      </TouchableOpacity>
    </View>
  );
}
