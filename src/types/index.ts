/**
 * Shared API data models for the Locate918 mobile client.
 *
 * Field set verified against the live Rust API on 2026-05-30
 * (https://capstone-production-7587.up.railway.app). See
 * docs/android-parity-brief.md for the full contract and known discrepancies.
 */

/**
 * Ticket provider classification for an event.
 *
 * NOTE: as of 2026-05-30 the live API does NOT serialize `ticket_provider` on
 * events (0/1494). It is modelled here as optional for forward-compatibility;
 * analytics provider classification is derived from the destination URL, not
 * from this field. See classifyProvider() (Phase 1).
 */
export type TicketProvider =
  | 'ticketmaster'
  | 'stubhub'
  | 'eventbrite'
  | 'venue_direct'
  | 'aggregator'
  | null;

/**
 * An event as returned by GET /api/events, /api/events/search, /api/events/:id.
 *
 * Nullability reflects the live API: most descriptive fields can be null, and a
 * handful of events have a null `venue_id`/`venue_priority`.
 */
export interface Event {
  id: string; // uuid
  title: string;
  description: string | null;

  start_time: string | null; // ISO 8601
  end_time: string | null; // ISO 8601

  // Venue (denormalized onto the event)
  venue: string | null; // venue name
  venue_id: number | null; // int FK (NOT the UUID of the /api/venues resource)
  location: string | null; // free-text location; venue-name fallback in the UI
  venue_address: string | null;
  venue_website: string | null;
  venue_latitude: number | null;
  venue_longitude: number | null;
  venue_priority: number | null;

  // Source / priority
  source_url: string | null;
  canonical_url: string | null;
  source_name: string | null;
  source_priority: number | null; // used by the "This Week" filter

  categories: string[];
  image_url: string | null;

  price_min: number | null;
  price_max: number | null;
  outdoor: boolean;
  family_friendly: boolean;

  /** Not served by the live API yet (2026-05-30); optional for forward-compat. */
  ticket_provider?: TicketProvider;

  // Backend metadata (present in live responses; rarely needed by the UI)
  content_hash?: string;
  time_estimated?: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * A venue as returned by GET /api/venues and /api/venues/:id.
 *
 * IMPORTANT: `Venue.id` is a UUID string, whereas `Event.venue_id` is an int.
 * These are different identifiers — do not equate them. (Flagged in the brief.)
 */
export interface Venue {
  id: string; // uuid
  name: string;
  address: string | null;
  city: string | null;
  capacity: number | null;
  venue_type: string | null;
  noise_level: string | null;
  parking_info: string | null;
  accessibility_info: string | null;
  website: string | null;
  latitude: number | null;
  longitude: number | null;
  venue_priority: number | null;
  created_at?: string;
}
