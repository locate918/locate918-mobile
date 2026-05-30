/**
 * Click analytics beacon.
 *
 * Fire-and-forget POST /api/analytics/click for ALL users (anonymous + logged
 * in), separate from ML interaction logging. The endpoint returns 204 and MUST
 * never block navigation — every failure here is swallowed.
 *
 * See docs/android-parity-brief.md §4 for the payload contract.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabaseClient';
import type { Event } from '../types';

const BACKEND_URL = 'https://capstone-production-7587.up.railway.app';
const ANON_ID_KEY = 'locate918.anon_id';

export type ClickType = 'outbound_ticket' | 'outbound_venue' | 'event_detail';

export type ClickProvider =
  | 'ticketmaster'
  | 'stubhub'
  | 'eventbrite'
  | 'venue_direct'
  | 'aggregator'
  | 'unknown';

/** Hostsubstrings that identify a third-party aggregator (not the venue itself). */
const AGGREGATOR_HOSTS = [
  'eventbrite', // also matched by eventbrite branch; kept for clarity
  'allevents.in',
  'songkick.com',
  'bandsintown.com',
  'meetup.com',
  'do918.com',
  'visittulsa.com',
  'tulsalibrary.org',
];

/** RFC4122-ish v4 UUID. Not cryptographic — fine for analytics identifiers. */
/* eslint-disable no-bitwise */
function uuidv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
/* eslint-enable no-bitwise */

let cachedAnonId: string | null = null;

/**
 * Per-install anonymous device id, persisted once in AsyncStorage and reused for
 * the life of the install (Android equivalent of the web's localStorage id).
 */
async function getAnonId(): Promise<string> {
  if (cachedAnonId) {
    return cachedAnonId;
  }
  try {
    const existing = await AsyncStorage.getItem(ANON_ID_KEY);
    if (existing) {
      cachedAnonId = existing;
      return existing;
    }
  } catch {
    // ignore read failure; fall through to mint a fresh (in-memory) id
  }
  const id = uuidv4();
  cachedAnonId = id;
  try {
    await AsyncStorage.setItem(ANON_ID_KEY, id);
  } catch {
    // ignore write failure; cachedAnonId still keeps it stable for this session
  }
  return id;
}

async function getToken(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getSession();
    return data?.session?.access_token ?? null;
  } catch {
    return null;
  }
}

/**
 * Classify a destination URL into a provider bucket. Returns 'unknown' when no
 * URL is available, otherwise 'venue_direct' for anything unrecognized.
 */
export function classifyProvider(url?: string | null): ClickProvider {
  if (!url) {
    return 'unknown';
  }
  let host: string;
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    host = url.toLowerCase();
  }
  const has = (s: string) => host.includes(s);

  if (has('ticketmaster.') || has('livenation.') || has('ticketweb.')) {
    return 'ticketmaster';
  }
  if (has('stubhub.')) {
    return 'stubhub';
  }
  if (has('eventbrite.') || has('evbuc.com')) {
    return 'eventbrite';
  }
  if (AGGREGATOR_HOSTS.some(has)) {
    return 'aggregator';
  }
  return 'venue_direct';
}

interface TrackClickParams {
  clickType: ClickType;
  provider: ClickProvider;
  eventId?: string | null;
  venueId?: number | null;
  destinationUrl?: string | null;
  referrer?: string | null;
}

/**
 * Low-level beacon. Returns a promise but callers should NOT await it — it is
 * fire-and-forget and never throws.
 */
export async function trackClick(params: TrackClickParams): Promise<void> {
  try {
    const [anon_id, token] = await Promise.all([getAnonId(), getToken()]);
    await fetch(`${BACKEND_URL}/api/analytics/click`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        anon_id,
        click_uid: uuidv4(),
        click_type: params.clickType,
        provider: params.provider,
        event_id: params.eventId ?? null,
        venue_id: params.venueId ?? null,
        destination_url: params.destinationUrl ?? null,
        referrer: params.referrer ?? null,
      }),
    });
  } catch {
    // fire-and-forget: swallow all failures, never block navigation
  }
}

/** Provider for an event whose `ticket_provider` may or may not be served yet. */
function eventProvider(event: Event, fallbackUrl?: string | null): ClickProvider {
  return event.ticket_provider ?? classifyProvider(fallbackUrl);
}

/** Fired when an event detail screen opens. */
export function trackEventDetailView(event: Event): void {
  trackClick({
    clickType: 'event_detail',
    provider: eventProvider(event, event.source_url ?? event.canonical_url),
    eventId: event.id,
    venueId: event.venue_id,
  });
}

/** Fired when the ticket / original-listing link is tapped. */
export function trackOutboundTicket(event: Event, url: string): void {
  trackClick({
    clickType: 'outbound_ticket',
    provider: eventProvider(event, url),
    eventId: event.id,
    venueId: event.venue_id,
    destinationUrl: url,
  });
}

/** Fired when the venue-website link is tapped. Provider is always venue_direct. */
export function trackOutboundVenue(event: Event, url: string): void {
  trackClick({
    clickType: 'outbound_venue',
    provider: 'venue_direct',
    eventId: event.id,
    venueId: event.venue_id,
    destinationUrl: url,
  });
}
