# CLAUDE.md — locate918 mobile

React Native 0.84 + TypeScript app (the `android/`/`ios/` folders are RN build hosts, not native clients). Tulsa events discovery: browse/search events, map, saved events, AI chat ("Tully"), personalized recommendations.

- **Lint/typecheck:** `npm run lint`, `npx tsc --noEmit -p tsconfig.json` (requires `npm install` — there may be no local `node_modules`).
- **Run:** `npm run android` / `npm run ios` / `npm start`.
- **Styling:** NativeWind (`className`) + inline styles. Brand gold `#D4AF37` on navy `#0f172a`.

## Architecture

- **Rust API** — `https://capstone-production-7587.up.railway.app` (`src/services/api.ts`). Events, venues, users, saved events, recommendations, preferences, analytics.
- **Python LLM service** — `https://motivated-vibrancy-production-4664.up.railway.app`. Chat / smart search ("Tully").
- **Supabase Auth** — `src/services/supabaseClient.ts`. JWT; `Authorization: Bearer <access_token>` attached by the `request()` helper. Public endpoints work anonymously.

## API contract (source of truth: `docs/android-parity-brief.md`, snapshot 2026-05-30)

If the live API conflicts with this, trust the live API and flag the discrepancy.

### Rust API endpoints
| Method | Path | Auth |
|---|---|---|
| GET | `/api/events` · `/api/events/search?q=&category=` · `/api/events/:id` | no |
| GET | `/api/venues` · `/api/venues/:id` | no |
| GET | `/api/users/me` · `/me/profile` · `/me/preferences` | yes |
| POST | `/api/users/me/preferences` (category weights) · `/me/interactions` | yes |
| GET | `/api/users/me/saved-events` | yes |
| POST/DELETE | `/api/users/me/saved-events/:eventId` | yes |
| GET | `/api/users/me/recommendations` | yes |
| POST | `/api/analytics/click` | no |
| GET | `/api/analytics/venues/traffic?days=30` | yes |

Chat: `POST /api/chat` on the **LLM** host.

### Event shape (live)
`id` (uuid), `title`, `description`, `start_time`, `end_time`, `venue`, `venue_id` (**int**), `location`, `venue_address`, `venue_website`, `venue_latitude`, `venue_longitude`, `venue_priority`, `source_priority`, `categories[]`, `image_url`, `source_url`, `canonical_url`, `source_name`, `price_min`, `price_max`, `outdoor`, `family_friendly`. Optional/not-served-yet: `ticket_provider`.

### Gotchas (verified live)
- `ticket_provider` is **not served yet** — classify analytics `provider` from the destination URL (`src/services/analytics.ts`).
- `Event.venue_id` is an **int**, but `Venue.id` is a **uuid** — different identifiers, do not join on them. "By Venue" grouping is name-based.
- Both `source_priority` and `venue_priority` exist. "This Week" filter uses `source_priority` (correct).
- `GET /api/users/me/saved-events` → bare `Event[]` (verified). `recommendations` kept with tolerant array parsing.
- **Preferences are read-only in the app.** `/api/users/me` embeds `preferences: [{ category, weight, ... }]` where `weight` is a **signed ML affinity score** (e.g. -2.46), seeded at onboarding + tuned by the recommender — do NOT write them from the client. Category names are a Title-Case taxonomy distinct from the lowercase event-filter ids.

## Analytics beacon (`src/services/analytics.ts`)
Fire-and-forget `POST /api/analytics/click` for ALL users; never blocks navigation. `anon_id` persisted once in AsyncStorage; `click_uid` per click. Fires `event_detail` (on EventDetail open), `outbound_ticket` (source link), `outbound_venue` (venue website). See brief §4 for the payload.

## Layout
- `src/screens/tabs/` — Events, Map, Tully (chat), Saved, Profile. `src/screens/` — EventDetail, Preferences.
- `src/services/` — `api.ts`, `analytics.ts`, `consent.ts`, `supabaseClient.ts`.
- `src/context/` — `AuthContext`, `SavedEventsContext`.
- `src/components/` — `EventCard`, `AnalyticsConsentBanner`. `src/types/` — models. `src/constants/` — categories.

## Conventions
- All network calls go through `api`/`analytics`; don't `fetch` directly in screens.
- Analytics and consent persistence are fire-and-forget — swallow failures, never block UI.
- Affiliate link rewriting is **dormant** — `ticket_provider`/`provider`/`click_uid` flow through analytics for future use, but do NOT add live affiliate rewriting.
