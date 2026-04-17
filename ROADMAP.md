# Cincailah — Full Roadmap

Living document of what exists, what's next, and the parity target for mobile.

**Goal:** The mobile app (Expo/React Native) should match the web app feature-for-feature. Right now they're very different products.

Legend: `[x]` done · `[~]` partial · `[ ]` not started

---

## 0 · Recently Shipped (this session)

### Web
- [x] **Solo / guest mode** — `/solo` route, 3 modes (Spin / Favorites / Category), shuffle flicker, winner sound, vibration, "Not this" re-roll, localStorage history + favorites
- [x] **Join by direct link** — `/join/[code]` route, auto-joins logged-in users, shows invite page for guests
- [x] **Makan Code on landing + solo page** — guests can paste a code without signing up first
- [x] **Pending-code carry-through** — `?code=` on `/register` and `/login`, auto-joins after auth with a green "🤝 Joining group X" banner
- [x] **QR code invite** — `SettingsPage` renders a scannable QR for the invite URL, with SVG download
- [x] **Web Share API + copy-link** — native share sheet when available, clipboard fallback
- [x] **Re-spin on group "You Pick"** — "Not this 🙅" button with reroll counter (respects `group.maxReroll`), winner sound + vibration
- [x] **Reroll-safe anti-repeat** — `/api/decide` overwrites most recent decision within 10 minutes when rerolling, so rerolls don't pollute no-repeat history
- [x] **`excludeIds` support in `/api/decide`** — prevents the same restaurant appearing twice in a reroll session
- [x] **Food images + sound asset ported** — `public/foods/*`, `public/sounds/winner.mp3`
- [x] **TypeScript hygiene** — excluded `mobile/`, `backup/`, `.next/` from web tsconfig
- [x] **Real email via Resend** — password reset + welcome emails, graceful dev fallback, `.env.example` documented
- [x] **Personal favorites** — heart button on restaurant list, toggle via `/api/favorites`, "❤️ My Favorites Only" filter on decide screen, DB migration for `user_favorites` table

### API/Backend
- [x] **Email service** — `lib/email.ts` with Resend SDK, branded HTML templates (password reset, welcome, verification placeholder)
- [x] **`POST /api/favorites`** — toggle favorite (add/remove)
- [x] **`GET /api/favorites`** — fetch user's favorite restaurant IDs
- [x] **`favoritesOnly` filter in `/api/decide`** — respects user's favorites when enabled

### Dev/Infra
- [x] **Git repository initialized** — (user confirmed)

---

## 1 · Web — High Priority (next up)

### 1.1 Real email sending
- [x] Integrate **Resend** (or SendGrid/AWS SES) for password-reset emails
- [x] Wire `app/api/auth/forgot-password/route.ts` to actually deliver mail
- [x] Add email verification flow on `/register` (token email + `/verify/[token]` route)
- [x] Add welcome email on first signup

### 1.2 Rate limiting
- [x] Simple in-memory rate limiter (`lib/ratelimit.ts`)
- [x] Cap `/api/auth/login`, `/api/auth/register`, `/api/auth/forgot-password` at 5/min/IP
- [x] Cap `/api/groups/join` at 10/min/user

### 1.3 Group admin tools
- [x] Delete group (admin only)
- [x] Rename group (admin only)
- [x] Leave group (member)
- [x] Kick member (admin only)
- [x] Transfer admin role
- [x] API: `/api/groups/[id]` DELETE / PATCH, `/api/groups/[id]/members/[userId]` DELETE, `/api/groups/[id]/transfer-admin` POST

### 1.4 Personal favorites (❤️ at user level)
- [x] Prisma: new `UserFavorite { userId, restaurantId, createdAt }` table
- [x] Heart icon on `RestaurantsPage` cards
- [x] `/favorites` page listing cross-group favorites
- [x] Filter option on `DecidePage`: "Spin only my favorites"
- [x] API: `/api/favorites` GET/POST/DELETE

### 1.5 Restaurant photos
- [x] Prisma: add `photoUrl` field (+ `latitude`, `longitude`) to `Restaurant`
- [x] Image upload in `AddRestaurantForm` — direct VPS upload via `POST /api/upload` + `sharp` WebP optimization
- [x] Display photo thumbnail in `RestaurantsPage` cards
- [x] Fallback to emoji when no photo
- [x] Photo URL field + live preview in `AddRestaurantForm`

### 1.6 Post-meal rating
- [x] Prisma: new `Rating { userId, restaurantId, decisionId, thumbs, createdAt }`
- [x] API: `POST/GET /api/ratings`
- [x] Modal prompt 2h after decision: `RatingPrompt` component with localStorage scheduling + 1-min interval check
- [x] Weight future anti-repeat picks: `/api/decide` uses weighted random (thumbs up boost, thumbs down penalty)

---

## 2 · Web — Medium Priority

### 2.1 Notifications for "We Fight" votes
- [~] Browser push (Web Push API + service worker) — service worker + subscribe endpoint done; delivery worker pending VAPID send wiring
- [x] Email fallback (reuse email service from 1.1)
- [x] WhatsApp share button with pre-filled "Vote now! 🗳️ [link]" on `VotePageClient`
- [x] In-app toast when a vote is pending (`Toast` component + `useToast` hook wired into `VotePageClient`)

### 2.2 Lunch reminders (retention hook)
- [x] Opt-in setting: "Remind me weekdays at 11:45am"
- [x] Cron worker (Vercel Cron / separate Node process) to check + send (`GET /api/cron/reminders`)
- [~] Push + email delivery (email live; push send pending VAPID sender)
- [x] Per-user timezone handling

### 2.3 Dietary preferences at user level
- [x] Prisma: new `UserPreferences { userId, halal, vegOptions, defaultBudget }`
- [x] `/settings/profile` page with dietary defaults + email verification status
- [x] API: `GET/PATCH /api/user/preferences`
- [x] Apply defaults automatically when opening `DecidePage` (server fetches prefs, passes as initial state)

### 2.4 Group chat / decision comments
- [x] Prisma: new `Comment { decisionId, userId, body, createdAt }`
- [x] API: `GET/POST /api/comments`
- [x] Inline comment thread on each decision card in `HistoryPage`
- [x] Realtime with polling (5s polling while thread open)

### 2.5 Activity feed
- [x] `/group/[id]/activity` route
- [x] Show recent: decisions, new restaurants, new members
- [x] Pull from existing tables (no new schema)

### 2.6 Streaks & stats
- [x] Decision streak counter on `HistoryPage`
- [x] "Top 3 picks this month" (top picks section already existed, now upgraded)
- [x] Link to activity feed from HistoryPage
- [x] Chart: pure SVG bar chart (Picks by Day of Week) — no external library needed

### 2.7 Geolocation + distance
- [x] `navigator.geolocation` prompt on winner reveal (silent, non-blocking)
- [x] Prisma: `latitude`, `longitude` on `Restaurant` (already added in 1.5)
- [x] Haversine distance computed client-side, shown as "X.X km away" on winner card
- [x] Filter "within 500m" option (uses client geolocation + server-side distance filter)

### 2.8 Restaurant import from Google Places
- [x] `AddRestaurantForm` → "Search Google Places" autocomplete (text search list + apply)
- [~] Auto-fill name, address, photo, cuisine, coordinates (name/address/coordinates + maps URL done; photo/cuisine mapping pending)
- [x] Requires `GOOGLE_PLACES_API_KEY` env var

---

## 3 · Web — Nice to Have

### 3.1 Progressive Web App
- [x] `manifest.json` with icons, shortcuts, theme colours
- [x] PWA meta tags (apple-mobile-web-app, theme-color) in `layout.tsx`
- [x] Service worker with offline cache (`/public/sw.js`)
- [x] "Add to Home Screen" prompt (`beforeinstallprompt` UI)
- [x] App icons at `/public/icons/icon-192.png` + `icon-512.png` — generated from SVG via sharp
- [x] `icon.svg` for browsers that prefer SVG icons
- [x] `<link rel="apple-touch-icon">` added to layout

### 3.2 Tie-break UI for "We Fight"
- [x] When votes tie, show dramatic "It's a tie!" screen
- [x] "Let Fate Decide 🎲" button picks a random tied option
- [x] `VotePageClient` full results phase with fateWinner support

### 3.3 Confetti on winner reveal
- [x] `canvas-confetti` installed
- [x] `lib/confetti.ts` utility
- [x] Fires on `RouletteSpinner` result, `SoloPage` winner, `VotePageClient` winner reveal

### 3.4 Dark mode
- [x] Tailwind `darkMode: 'class'` enabled
- [x] `DarkModeToggle` component (☀️/🌙) respects system preference + persists in localStorage
- [x] No-FOUC script in `layout.tsx`
- [x] Toggle visible on landing page nav
- [x] `dark:` variants on group layout, TopNav, BottomNav, DecidePage, CreateGroupClient, RatingPrompt, globals.css base

### 3.5 Accessibility pass
- [x] ARIA labels on icon buttons (TopNav back link, BottomNav links, RatingPrompt dismiss)
- [x] Focus rings respecting theme (`:focus-visible` in `globals.css`, dark variant)
- [x] `aria-current="page"` on active BottomNav item
- [x] Screen reader announcements on winner reveal (`role="status" aria-live="assertive"` on RouletteSpinner result)
- [~] Full keyboard navigation on modals (RatingPrompt now supports auto-focus + Esc close; other modal-like flows remain)

### 3.6 Internationalization
- [x] Lightweight i18n system (`lib/i18n.ts`) — similar to `next-intl` for core shared labels
- [x] `en` (current) + `ms` (Malay) + `zh` (Chinese)
- [x] Language switcher in TopNav (`components/LanguageSwitcher.tsx`)

### 3.7 Analytics
- [x] PostHog (server-side) integration via `lib/analytics.ts` + `posthog-node`
- [x] Track: spin, reroll, vote start, vote cast, group create, group join, signup
- [x] Funnel baseline captured via event stream: signup → group_create/group_join → spin

---

## 4 · API / Backend

### 4.1 Existing endpoints
- [x] `POST /api/auth/register`
- [x] `POST /api/auth/login`
- [x] `POST /api/auth/logout`
- [x] `GET  /api/auth/session`
- [x] `POST /api/auth/forgot-password`
- [x] `POST /api/auth/reset-password`
- [x] `POST /api/groups/create`
- [x] `POST /api/groups/join`
- [x] `POST /api/groups/switch`
- [x] `GET/POST /api/restaurants`
- [x] `POST /api/decide` *(rerolls + excludeIds ✓)*
- [x] `POST /api/vote/start`
- [x] `POST /api/vote/[decisionId]`

### 4.2 Needed endpoints (tied to features above)
- [x] `DELETE /api/groups/[id]` — delete group
- [x] `PATCH /api/groups/[id]` — rename, update rules
- [x] `DELETE /api/groups/[id]/members/[userId]` — kick / leave
- [x] `POST /api/groups/[id]/transfer-admin`
- [x] `GET/POST /api/favorites` — user-level favorites
- [x] `GET/POST /api/ratings` — thumbs up/down post-meal
- [x] `GET/PATCH /api/user/preferences` — dietary defaults
- [x] `GET/POST /api/comments` — decision comments
- [x] `GET /api/groups/list` — list all user's groups (for mobile/API clients)
- [x] `POST /api/decide/confirm` — explicit commit, sets modeUsed to `you_pick_confirmed`
- [x] `POST /api/groups/seed-starter-pack` — seeds 25 KL/PJ restaurants for new groups
- [x] `POST /api/push/subscribe` — Web Push registration
- [x] `POST /api/reminders` — set lunch reminder
- [x] `GET /api/places/search` — Google Places proxy (when `GOOGLE_PLACES_API_KEY` is configured)

### 4.3 Backend hygiene
- [x] Move from `prisma db push` to real migrations — `db:migrate` (dev) + `db:migrate:prod` (deploy) scripts added
- [x] Zod schemas on every API body — centralised in `lib/schemas.ts`, wired into login + register + confirm endpoints
- [x] Error logging → Sentry (`@sentry/nextjs` + logger bridge `reportError()`)
- [x] Request logging middleware — `logRequest()` in `lib/logger.ts` (Pino in prod, pino-pretty in dev)
- [x] Environment validation at boot (`lib/env.ts` — throws in prod, warns in dev)
- [x] Healthcheck endpoint `/api/health`

---

## 5 · Mobile (Expo `jiak-hami`) — Parity with Web

**Current mobile state:** local-only, no accounts, no server. 5 tabs (Home / Own / Group / Favorites / History) + FinalDecision modal. Stores everything in AsyncStorage.

**Target:** full parity with web so a user can sign into the same account and see the same groups/restaurants/decisions.

### 5.1 Foundations
- [x] Pick HTTP client (`fetch` or `axios`)
- [x] Create `src/lib/api.ts` pointing at `EXPO_PUBLIC_API_URL`
- [x] Session storage via `expo-secure-store` (don't use AsyncStorage for tokens)
- [x] JWT auth for mobile: `POST /api/auth/token` endpoint issues 30-day JWT (`lib/schemas.ts` + `jsonwebtoken`)
- [x] Global auth context + protected route guard
- [x] Network error + offline handling UX (timeout, `networkError` flag, Toast component)

### 5.2 Auth screens
- [x] `LoginScreen` — email + password
- [x] `RegisterScreen` — email + password + display name
- [x] `ForgotPasswordScreen`
- [x] `ResetPasswordScreen` — handled via web browser deep-link (user taps reset email → opens in browser)
- [x] `LandingScreen` — mirrors web landing
- [x] Auto-login on launch if valid token

### 5.3 Group flows (replace local-only)
- [x] `MyGroupsScreen` — list from `/api/groups/list`
- [x] `CreateGroupScreen` — calls `/api/groups/create`
- [x] `JoinGroupScreen` — calls `/api/groups/join`
- [x] Deep-link handler for `jiakhami://join/:code` and `https://cincailah.com/join/:code` (via expo-linking config in App.js)
- [x] QR scanner (`expo-camera` + barcode scanning) to join by scanning web-rendered QR
- [x] Group switcher drawer (modal sheet in `DecideScreen`)

### 5.4 Group content screens
- [x] `GroupHomeScreen` — mirrors web `DecidePage` (filters + big Cincai button)
- [x] `RestaurantsScreen` — list, search, add — mirrors web
- [x] `AddRestaurantScreen` — form with cuisine/vibe tags, maps URL, photo
- [x] `HistoryScreen` — per-group history from `/api/decisions`
- [x] `SettingsScreen` — Makan Code, share invite, member rules, leave group

### 5.5 Decision modes
- [x] **Cincailah ("You Pick") mode** — calls `/api/decide` with filters + excludeIds
- [x] Winner reveal screen with bounce animation, sound (`expo-audio`) + haptics
- [x] "Not this" reroll button with counter (respects maxReroll)
- [x] **We Fight mode** — calls `/api/vote/start`, polls `/api/vote/[id]` every 3s
- [x] Voting UI with 15-min countdown timer
- [x] Tie-break "Let Fate Decide" button
- [x] Final decision screen (wired to server data)

### 5.6 Solo mode parity
- [x] Solo screen (`OwnScreen`) with 3 modes (Spin / Favourite / Category) + local history
- [x] Local bundled food images (kept — no extra dependency needed)
- [x] Sync solo favorites to server when logged in (`/api/favorites`) — falls back to AsyncStorage offline
- [x] Sync solo history to server-side `LunchDecision` with `groupId: null` (schema change + `/api/decisions`)

### 5.7 Cross-platform features
- [x] Real push notifications (`expo-notifications` + `POST /api/push/subscribe-expo`)
- [x] Lunch reminder scheduling — daily local notification at 11:45 AM (configurable in Profile)
- [x] Share invite via native share sheet (`Share.share` in GroupSettingsScreen)
- [x] Google Maps navigation on "Let's Go" (`Linking.openURL(mapsUrl)`)
- [x] Location permission + nearby 500m filter (expo-location in DecideScreen)

### 5.8 Mobile-specific polish
- [x] Splash screen + proper app icon (`expo-splash-screen` — hides once auth resolves)
- [x] Dark mode (`useColorScheme` in App.js wires navigation theme + tab bar colours)
- [x] Offline mode: `networkError` flag in `apiFetch` + Toast error UX; AsyncStorage fallback for favorites
- [x] Biometric unlock (`expo-local-authentication`) — toggle in Profile, gates app launch
- [x] Over-the-air updates (`expo-updates` plugin + runtimeVersion in app.json)
- [x] EAS Build config (`eas.json`) — development / preview / production profiles

### 5.9 Mobile admin + chrome
- [x] Bottom tab bar with: Solo / Groups / History / Profile
- [x] Header title updates dynamically per group (via `route.params.groupName`)
- [x] Pull-to-refresh on all list screens
- [x] Skeleton loaders (`Skeleton.js` — `CardSkeleton` + `ListSkeleton` used in Groups / Restaurants / History)

---

## 6 · Dev / Infra

### 6.1 Already done
- [x] Prisma schema for users, groups, members, restaurants, decisions, votes
- [x] Iron-session cookies for web
- [x] Production deploy docs (`V2_MIGRATION_GUIDE.md`, `LOCAL_TEST_AND_DEPLOY.md`)

### 6.2 To do
- [x] `git init` — (user completed)
- [x] `.gitignore` additions: `mobile/*/node_modules`, `mobile/.expo/`, `backup/`
- [x] `git rm -r --cached backup/` — removed from git history (was tracked, now properly ignored)
- [x] CI/CD: `.github/workflows/ci.yml` — GitHub Actions running `tsc --noEmit`, `lint`, `build`
- [x] Preview deploys on PR (`.github/workflows/preview-deploy.yml` with Vercel CLI + secrets)
- [x] Sentry integration on both web + mobile (`@sentry/nextjs` + `@sentry/react-native`)
- [x] Production logging — Pino (`lib/logger.ts`), pino-pretty in dev, JSON in prod
- [~] Backup strategy for Postgres (documented in deploy guide; automation to cloud/object storage still pending)
- [x] Monitoring (uptime + response time) via scheduled GitHub Action (`.github/workflows/monitor-health.yml`)
- [x] Documented env var matrix (`.env.example` updated with `JWT_SECRET` + `LOG_LEVEL`)

---

## 7 · Content / Growth

### 7.1 Pre-seeded data
- [x] `prisma/seed-starter-pack.ts` — 25 real KL/PJ restaurants, run with `npx ts-node prisma/seed-starter-pack.ts <groupId>`
- [x] UI prompt "Add starter pack?" — shown after group creation in `CreateGroupClient`, calls `POST /api/groups/seed-starter-pack`
- [x] "Popular in your area" suggestions using Places API (`/api/places/popular` + Add Restaurant UI)

### 7.2 Marketing
- [x] SEO metadata on landing + solo pages (OpenGraph, Twitter cards, keywords)
- [x] OG image (`/public/og.png`) — SVG-designed, rendered to 1200×630 PNG via sharp
- [x] Sitemap at `/sitemap.ts` (auto-served at `/sitemap.xml` by Next.js)
- [x] `/about`, `/privacy`, `/terms` pages (footer links now point to real routes)
- [x] Twitter/Instagram card metadata (in root `layout.tsx`)

---

## Roadmap suggestion: what to pick up next

If you want the highest-impact stretch:

1. **1.1 Real emails** — unblocks password reset and enables 1.2 verification
2. **1.2 Rate limiting** — must-have before any public traffic
3. **1.4 Personal favorites** — #1 user-requested feature
4. **4.3 Git init + CI** — you can't ship safely without version control
5. **5.1–5.3 Mobile foundation** — once web is stable, port the 3-screen MVP to mobile

Start a new branch per section and ship in small PRs.
