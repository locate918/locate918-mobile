/**
 * Analytics disclosure acknowledgment.
 *
 * The app discloses anonymous, aggregate analytics once on first launch (the
 * Android equivalent of the web cookie/analytics banner). Acknowledgment is
 * persisted so the notice shows a single time per install.
 *
 * See docs/android-parity-brief.md §5.2.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const ANALYTICS_NOTICE_KEY = 'locate918.analytics_notice_ack';

/**
 * Whether the analytics notice has already been acknowledged. On a storage read
 * failure we fail closed (treat as acknowledged) so the user is never nagged.
 */
export async function hasAcknowledgedAnalyticsNotice(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(ANALYTICS_NOTICE_KEY)) === 'true';
  } catch {
    return true;
  }
}

export async function acknowledgeAnalyticsNotice(): Promise<void> {
  try {
    await AsyncStorage.setItem(ANALYTICS_NOTICE_KEY, 'true');
  } catch {
    // ignore write failure; worst case the notice reappears on next launch
  }
}
