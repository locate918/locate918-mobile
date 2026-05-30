# Android Parity Brief — Locate918 Mobile

**Snapshot date:** 2026-05-30
**Repo:** `~/StudioProjects/locate918-mobile` (React Native 0.84 + TypeScript; the `android/` folder is the RN build host, not a native Kotlin/Java client)

This file is the bridge to the web/backend repo, which this codebase's tooling cannot access. The contract below is the **source of truth as of the snapshot date**. If the live API conflicts with this document, trust the live API and flag the discrepancy.

---

## 1. Architecture

- **Rust API (Axum)** — base URL `https://capstone-production-7587.up.railway.app` (hardcoded in `src/services/api.ts`). Prod target is the `locate918.com` host family. Primary REST API for events, venues, users, analytics.
- **Python LLM service** — `https://motivated-vibrancy-production-4664.up.railway.app` (hardcoded). Handles smart search and chat ("Tully").
- **Supabase Auth** — `https://kpihjwzqtwqlschmtekx.supabase.co` (URL + anon key hardcoded in `src/services/supabaseClient.ts`). JWT; send `Authorization: Bearer <access_token>` on authenticated calls. Anonymous calls allowed on public endpoints.

**Token attachment:** `src/services/api.ts` `getToken()` reads `supabase.auth.getSession().access_token`; the shared `request()` helper injects `Authorization: Bearer <token>` on every call (omitted when no session). Auto-refresh handled by the Supabase client (`autoRefreshToken: true`, AsyncStorage-persisted).

---

## 2. Rust API endpoints (contract)

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/events` | no | list events |
| GET | `/api/events/search?q=&category=` | no | search |
| GET | `/api/events/:id` | no | single event |
| GET | `/api/venues` | no | list venues |
| GET | `/api/venues/:id` | no | single venue |
| GET | `/api/users/me` | yes | current user |
| GET | `/api/users/me/profile` | yes | full profile |
| GET | `/api/users/me/saved-events` | yes | saved/bookmarked events |
| POST | `/api/users/me/saved-events/:eventId` | yes | save (also logs a saved interaction) |
| DELETE | `/api/users/me/saved-events/:eventId` | yes | unsave |
| GET | `/api/users/me/recommendations` | yes | personalized feed |
| POST | `/api/users/me/interactions` | yes | ML interaction log |
| POST | `/api/users/me/preferences` | yes | category preference weights |
| POST | `/api/analytics/click` | no | click analytics (all users) |
| GET | `/api/analytics/venues/traffic?days=30` | yes | venue traffic leaderboard |

Smart search / chat are served by the **LLM service** (`POST /api/chat`), not the Rust API.

---

## 3. Event object shape (contract)

`id` (uuid), `title`, `description`, `start_time`, `end_time`, `venue` (name), `venue_id` (int FK),
`venue_address`, `venue_website`, `venue_latitude`, `venue_longitude`, `venue_priority`,
`categories` (string[]), `image_url`, `source_url`, `canonical_url`, `source_name`,
`price_min`, `price_max`, `outdoor`, `family_friendly`,
`ticket_provider` (`ticketmaster | stubhub | eventbrite | venue_direct | aggregator | null`).

There is **no separate Venue model in the client** today; venue data is denormalized onto each event.

---

## 4. Click analytics payload (contract)

Fire-and-forget `POST /api/analytics/click`, sent for **all** users (anonymous + logged-in), separate from ML interaction logging. Returns `204`; **must never block navigation — swallow failures**.

```json
{
  "anon_id": "<persisted device UUID>",
  "click_uid": "<per-click UUID>",
  "click_type": "outbound_ticket | outbound_venue | event_detail",
  "provider": "ticketmaster | stubhub | eventbrite | venue_direct | aggregator | unknown",
  "event_id": "<uuid|null>",
  "venue_id": "<int|null>",
  "destination_url": "<string|null>",
  "referrer": "<string|null>"
}
```

- `anon_id`: UUID persisted on-device (AsyncStorage — Android equivalent of web's localStorage id). Created once, reused for the life of the install.
- Send `Authorization: Bearer <token>` when logged in (attaches `user_id`); otherwise anonymous.
- Fire on: opening event detail → `event_detail`; tapping ticket / original-listing link → `outbound_ticket`; tapping venue-website link → `outbound_venue`.
- `provider` classification from destination URL: `ticketmaster.com`/`livenation.com`/`ticketweb.com` → `ticketmaster`; `stubhub.com` → `stubhub`; `eventbrite.*`/`evbuc.com` → `eventbrite`; known aggregators → `aggregator`; otherwise `venue_direct`. Venue-website taps can hardcode `venue_direct`.

---

## 5. Recent web changes to mirror (most recent first)

1. **Click analytics (NEW)** — see §4.
2. **Cookie / analytics disclosure** — one-time dismissible banner disclosing anonymous aggregate analytics (no PII, no cross-site tracking, no data selling). Android: first-launch notice persisted as acknowledged so it shows once.
3. **Removed "Open Beta" disclaimer modal** — web removed it entirely. *(Android note: this app has no beta modal — nothing to remove.)*
4. **Affiliate-readiness (dormant — do not build live yet)** — `ticket_provider` is on every event and `provider`/`click_uid` flow through analytics, so future affiliate link-rewriting needs no schema change. **No live affiliate rewriting yet — do not add it.**

---

## 6. Gap analysis (Android vs. contract, 2026-05-30)

### Endpoint coverage
- **Wired + used:** `GET /api/events` (`getEvents`, `?limit=2000`); LLM `POST /api/chat` (`chatWithTully`).
- **Wired but never called:** `getEvent`, `searchEvents` (filtering is client-side), `getMe`, `getMyProfile`, `addInteraction`.
- **Missing:** `/api/venues`, `/api/venues/:id`, `/api/users/me/saved-events` (GET/POST/DELETE), `/api/users/me/recommendations`, `/api/analytics/click`, `/api/analytics/venues/traffic`.
- **Method mismatch:** `updatePreferences` uses **PUT**; contract says **POST** `/api/users/me/preferences`.
- **Not in contract:** app has `getMyPreferences` (`GET /api/users/me/preferences`) — verify against live API.

### Event field gaps (not consumed anywhere)
- `venue_id` — **needed for analytics `venue_id`.** Confirmed present in live API.
- `ticket_provider` — **needed to classify analytics `provider`.** ⚠️ **NOT served by the live API yet** (0/1494 events; see §6.1). Classify `provider` from the destination URL instead.
- `venue_priority` — present in live API (both `source_priority` and `venue_priority` exist).
- `canonical_url`, `source_name` — present in live API, unused by client.

### Live API verification (2026-05-30)
Verified against `https://capstone-production-7587.up.railway.app`:
- **`source_priority` is real and populated** (1:741, 2:566, 3:187 across 1494 events). The This Week filter at `EventsScreen.tsx:199` works correctly — **no bug** (earlier brief draft wrongly flagged a `source_priority` → `venue_priority` mismatch; retracted).
- **`venue_priority` also exists** (1:632, 2:704, 3:150, 8 null).
- **`location` IS returned** by the live API — the app's `e.location` venue fallback is valid (contract omitted it).
- **`ticket_provider` is absent from every event** (`/api/events` and `/api/events/:id`). Contract says it's new-on-every-event; backend isn't serializing it yet. Treat as optional/future; do not depend on it for provider classification.
- **`/api/users/me/preferences` route exists** (401 unauth vs 404 for bogus paths) — `getMyPreferences` is valid.
- Live event keys: `canonical_url, categories, content_hash, created_at, description, end_time, family_friendly, id, image_url, location, outdoor, price_max, price_min, source_name, source_priority, source_url, start_time, time_estimated, title, updated_at, venue, venue_address, venue_id, venue_latitude, venue_longitude, venue_priority, venue_website`. (Extra over contract: `content_hash`, `created_at`, `updated_at`, `time_estimated`, `location`, `source_priority`.)

### Screen / feature gaps
1. Click analytics beacon — entirely missing (no `anon_id`, no POST, no provider classifier, no firing points).
2. Consent / analytics disclosure surface — missing.
3. Beta modal removal — N/A (no beta modal exists).
4. Saved/bookmarked events — missing.
5. Recommendations feed — missing.
6. Venues list/detail — missing (By Venue tab is client-side string grouping over events).
7. Preferences UI — missing (Profile shows only email + user id).
8. `EventDetail` never calls `getEvent` (uses passed-in object); no distinct ticket-vs-venue link semantics.

### Already correct
Auth token attachment, Supabase JWT + auto-refresh, anonymous-safe public calls, Rust/LLM base-URL split. Gaps are coverage, not architecture.

---

## 7. Implementation status (all phases complete — 2026-05-30)

**Phase 0 — Foundations & types ✅**
- `src/types/index.ts`: `Event`, `Venue`, `TicketProvider` (modeled from live API; `ticket_provider` optional, not served yet).
- `src/services/api.ts`: typed returns; added `getVenues`/`getVenue`; **`updatePreferences` PUT → POST**; screens typed (`any` → `Event`).
- No `source_priority` fix (verified working live); `getMyPreferences` route confirmed.

**Phase 1 — Click analytics beacon ✅**
- `src/services/analytics.ts`: persisted `anon_id` (AsyncStorage), per-click `click_uid`, `classifyProvider(url)`, fire-and-forget `trackClick()` (swallows failures, Bearer when logged in).
- Firing points in `EventDetailScreen`: `event_detail` on open, `outbound_ticket` (source link), `outbound_venue` (venue website).
- Endpoint verified: 405 GET / 422 missing `anon_id` / 404 control.

**Phase 2 — Consent / analytics disclosure ✅**
- `src/services/consent.ts` + `src/components/AnalyticsConsentBanner.tsx`: one-time dismissible banner, ack persisted in AsyncStorage. Mounted globally in `App.tsx`.
- Beta-modal removal: N/A (no beta modal exists in this app).

**Phase 3 — Saved events ✅**
- `api.ts`: `getSavedEvents`/`saveEvent`/`unsaveEvent`; `request()` hardened for 204/empty bodies.
- `src/context/SavedEventsContext.tsx` (optimistic toggle + rollback); shared `src/components/EventCard.tsx` with ★/☆ toggle; `src/screens/tabs/SavedScreen.tsx`; **Saved tab** added. Save toggle also on EventDetail.

**Phase 4 — Recommendations & venues ✅ (with deviation)**
- `api.ts`: `getRecommendations()`. **"For You" tab** in EventsScreen (lazy-loaded, own loading/empty states).
- Real venue metadata from `/api/venues` surfaced in the selected-venue header (address/type/capacity/website).
- **Deviation:** venue grouping kept **name-based**, NOT id-joined — because `Event.venue_id` (int) ≠ `Venue.id` (uuid) (§6). Enriched by name match instead of replacing the picker. Revisit if backend exposes a shared key.
- **Deferred:** venue traffic leaderboard (`/api/analytics/venues/traffic`, verified 401/exists) — optional per plan.

**Phase 5 — Preferences → read-only "Your Interests" ✅ (redesigned after verification)**
- `src/screens/PreferencesScreen.tsx` now **displays** category affinities (read-only); linked from Profile ("Your Interests"), registered in AppStack.
- Reason: `preferences` are **signed ML affinity weights** seeded at onboarding and tuned by the recommender (NOT user-set levels), and the web app exposes no manual preference-editor POST. A weight editor would corrupt the model, so it was dropped in favor of a read-only view.

**Deferred / out of scope:** live affiliate link rewriting (dormant per contract §5.4); venue traffic leaderboard; manual preference editing.

### Response shapes — VERIFIED against a logged-in session (2026-05-30)
Confirmed live (user `/api/users/me` + `/saved-events`):
- **`analytics_clicks` table columns exactly match our beacon payload** (`anon_id, click_uid, click_type, provider, event_id, venue_id, destination_url, referrer` + server-set `user_id`/`user_agent`/`occurred_at`). Phase 1 payload correct. ✅
- **`GET /api/users/me/saved-events` → bare `Event[]`.** `SavedEventsContext` adapter correct. ✅
- **`preferences`** (embedded on `/api/users/me` as `preferences: [...]`) → array of `{ id, user_id, category, weight, created_at, updated_at }`. `weight` is a **signed float** (e.g. `-2.46`). Categories are a **Title-Case taxonomy** (`Film, Music, Nightlife, Comedy, Educational, Food & Drink, Sports & Fitness, Family, Art & Theater, Festival, Nature & Outdoors, Community`) — distinct from the app's lowercase event-filter ids. (Minor data-quality note: both `Art & Theater` and `Arts & Theater` exist.)
- `GET /api/users/me/recommendations` → not exercised by the web app in captured traffic; "For You" tab kept with tolerant array parsing (bare `Event[]` or `{events|recommendations|data: [...]}`).

The Supabase `user_preferences` table is normalized (one row per category/weight); the secret key used to inspect schema should be rotated.

---

## 8. Notes
- This is a point-in-time snapshot. Trust the live API on any conflict and flag it.
- The repo `CLAUDE.md` now carries a condensed "API contract" section so this need not be re-pasted each session; this file remains the full reference.
