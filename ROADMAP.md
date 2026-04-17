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

---

## 1 · Web — High Priority (next up)

### 1.1 Real email sending
- [ ] Integrate **Resend** (or SendGrid/AWS SES) for password-reset emails
- [ ] Wire `app/api/auth/forgot-password/route.ts` to actually deliver mail
- [ ] Add email verification flow on `/register` (token email + `/verify/[token]` route)
- [ ] Add welcome email on first signup

### 1.2 Rate limiting
- [ ] Install `@upstash/ratelimit` (or simple in-memory fallback)
- [ ] Cap `/api/auth/login`, `/api/auth/register`, `/api/auth/forgot-password` at 5/min/IP
- [ ] Cap `/api/groups/join` at 10/min/user

### 1.3 Group admin tools
- [ ] Delete group (admin only)
- [ ] Rename group (admin only)
- [ ] Leave group (member)
- [ ] Kick member (admin only)
- [ ] Transfer admin role
- [ ] API: `/api/groups/[id]` DELETE / PATCH, `/api/groups/[id]/members/[userId]` DELETE

### 1.4 Personal favorites (❤️ at user level)
- [ ] Prisma: new `UserFavorite { userId, restaurantId, createdAt }` table
- [ ] Heart icon on `RestaurantsPage` cards
- [ ] `/favorites` page listing cross-group favorites
- [ ] Filter option on `DecidePage`: "Spin only my favorites"
- [ ] API: `/api/favorites` GET/POST/DELETE

### 1.5 Restaurant photos
- [ ] Prisma: add `photoUrl` field to `Restaurant`
- [ ] Image upload in `AddRestaurantForm` (S3 / Cloudinary / UploadThing)
- [ ] Display photo in `RestaurantsPage`, `RouletteSpinner` result, `DecidePage` "Recently Makan"
- [ ] Fallback to emoji when no photo

### 1.6 Post-meal rating
- [ ] Prisma: new `Rating { userId, restaurantId, decisionId, thumbs, createdAt }`
- [ ] Modal prompt 2h after decision: "How was it? 👍 👎"
- [ ] Weight future anti-repeat picks: loved places slight boost, disliked slight penalty
- [ ] Stats on `HistoryPage`: "Your top 3 loved spots"

---

## 2 · Web — Medium Priority

### 2.1 Notifications for "We Fight" votes
- [ ] Browser push (Web Push API + service worker)
- [ ] Email fallback (reuse email service from 1.1)
- [ ] WhatsApp share button with pre-filled "Vote now! 🗳️ [link]" on `VotePageClient`
- [ ] In-app toast when a vote is pending

### 2.2 Lunch reminders (retention hook)
- [ ] Opt-in setting: "Remind me weekdays at 11:45am"
- [ ] Cron worker (Vercel Cron / separate Node process) to check + send
- [ ] Push + email delivery
- [ ] Per-user timezone handling

### 2.3 Dietary preferences at user level
- [ ] Prisma: new `UserPreferences { userId, halal, vegOptions, allergies[], defaultBudget }`
- [ ] `/settings/profile` page
- [ ] Apply defaults when opening `DecidePage`

### 2.4 Group chat / decision comments
- [ ] Prisma: new `Comment { decisionId, userId, body, createdAt }`
- [ ] Inline comment thread on each decision card in `HistoryPage`
- [ ] Realtime with polling (SSE in 3.x)

### 2.5 Activity feed
- [ ] `/group/[id]/activity` route
- [ ] Show recent: decisions, new restaurants, new members, votes started
- [ ] Pull from existing tables (no new schema)

### 2.6 Streaks & stats
- [ ] "X lunches decided with this group"
- [ ] "Top 3 picks this month"
- [ ] "You haven't eaten Japanese in 3 weeks"
- [ ] Upgrade `HistoryPage` with chart (recharts / chart.js)

### 2.7 Geolocation + distance
- [ ] `navigator.geolocation` prompt on `DecidePage`
- [ ] Prisma: add `latitude`, `longitude` to `Restaurant` (optional)
- [ ] Compute distance on server, show "0.4 km away" on result
- [ ] Filter "within 500m" option

### 2.8 Restaurant import from Google Places
- [ ] `AddRestaurantForm` → "Search Google Places" autocomplete
- [ ] Auto-fill name, address, photo, cuisine, coordinates
- [ ] Requires `GOOGLE_PLACES_API_KEY` env var

---

## 3 · Web — Nice to Have

### 3.1 Progressive Web App
- [ ] `manifest.json` with icons
- [ ] Service worker (Workbox) with offline cache
- [ ] "Add to Home Screen" prompt
- [ ] Splash screen

### 3.2 Tie-break UI for "We Fight"
- [ ] When votes tie, show dramatic coin-flip / spin animation
- [ ] Port mobile's "Let Fate Decide 🎲" button
- [ ] `VotePageClient` results phase

### 3.3 Confetti on winner reveal
- [ ] `canvas-confetti` npm
- [ ] Fire on both `RouletteSpinner` result and `SoloPage` winner
- [ ] Fire on `VotePageClient` winner reveal

### 3.4 Dark mode
- [ ] Tailwind dark: variants
- [ ] System preference + manual toggle
- [ ] Persist in session + localStorage

### 3.5 Accessibility pass
- [ ] Keyboard navigation on all modals & toggles
- [ ] ARIA labels on icon buttons
- [ ] Focus rings respecting theme
- [ ] Screen reader announcements on winner reveal

### 3.6 Internationalization
- [ ] `next-intl` or similar
- [ ] `en` (current) + `ms` (Malay) + `zh` (Chinese)
- [ ] Language switcher in TopNav

### 3.7 Analytics
- [ ] Plausible or PostHog
- [ ] Track: spin, reroll, vote start, vote cast, group create, group join, signup
- [ ] Funnel: landing → register → first spin

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
- [ ] `DELETE /api/groups/[id]` — delete group
- [ ] `PATCH /api/groups/[id]` — rename, update rules
- [ ] `DELETE /api/groups/[id]/members/[userId]` — kick / leave
- [ ] `POST /api/groups/[id]/transfer-admin`
- [ ] `GET/POST/DELETE /api/favorites` — user-level favorites
- [ ] `POST /api/ratings` — thumbs up/down post-meal
- [ ] `GET/PATCH /api/user/preferences` — dietary defaults
- [ ] `POST /api/decide/confirm` — explicit commit (cleaner than reroll-overwrite)
- [ ] `POST /api/comments` — decision comments
- [ ] `POST /api/push/subscribe` — Web Push registration
- [ ] `POST /api/reminders` — set lunch reminder
- [ ] `GET /api/places/search` — Google Places proxy

### 4.3 Backend hygiene
- [ ] Move from `prisma db push` to real migrations (`prisma migrate`)
- [ ] Zod schemas on every API body (centralised)
- [ ] Error logging → Sentry
- [ ] Request logging middleware
- [ ] Environment validation at boot (throw on missing SESSION_SECRET etc.)
- [ ] Healthcheck endpoint `/api/health`

---

## 5 · Mobile (Expo `jiak-hami`) — Parity with Web

**Current mobile state:** local-only, no accounts, no server. 5 tabs (Home / Own / Group / Favorites / History) + FinalDecision modal. Stores everything in AsyncStorage.

**Target:** full parity with web so a user can sign into the same account and see the same groups/restaurants/decisions.

### 5.1 Foundations
- [ ] Pick HTTP client (`fetch` or `axios`)
- [ ] Create `src/lib/api.ts` pointing at `EXPO_PUBLIC_API_URL`
- [ ] Session storage via `expo-secure-store` (don't use AsyncStorage for tokens)
- [ ] Swap iron-session cookies for **JWT** or token-based auth on the web backend (cookies are painful on RN)
  - Add `POST /api/auth/token` endpoint that issues a JWT for mobile
- [ ] Global auth context + protected route guard
- [ ] Network error + offline handling UX

### 5.2 Auth screens
- [ ] `LoginScreen` — email + password
- [ ] `RegisterScreen` — email + password + display name
- [ ] `ForgotPasswordScreen`
- [ ] `ResetPasswordScreen` (deep link from email)
- [ ] `LandingScreen` — mirrors web landing
- [ ] Auto-login on launch if valid token

### 5.3 Group flows (replace local-only)
- [ ] `MyGroupsScreen` — list from `/api/groups` (new GET endpoint needed)
- [ ] `CreateGroupScreen` — calls `/api/groups/create`
- [ ] `JoinGroupScreen` — calls `/api/groups/join`
- [ ] Deep-link handler for `cincailah://join/[code]` and `https://cincailah.com/join/[code]`
- [ ] QR scanner (`expo-camera` + barcode scanning) to join by scanning web-rendered QR
- [ ] Group switcher drawer

### 5.4 Group content screens
- [ ] `GroupHomeScreen` — mirrors web `DecidePage` (filters + big Cincai button)
- [ ] `RestaurantsScreen` — list, search, add — mirrors web
- [ ] `AddRestaurantScreen` — form with cuisine/vibe tags, maps URL, photo
- [ ] `HistoryScreen` — per-group history from `/api/decisions` (new endpoint)
- [ ] `SettingsScreen` — Makan Code, QR, member list, rules, admin actions

### 5.5 Decision modes
- [ ] **Cincailah ("You Pick") mode** — calls `/api/decide` with filters + excludeIds
- [ ] Roulette wheel animation (port canvas logic to `react-native-skia` or SVG)
- [ ] Winner reveal screen with sound (`expo-audio`, already installed) + haptics
- [ ] "Not this" reroll button with counter
- [ ] **We Fight mode** — calls `/api/vote/start`, polls `/api/vote/[id]` every 3s
- [ ] Voting UI with 15-min countdown
- [ ] Tie-break "Let Fate Decide" button (already exists in current mobile)
- [ ] Final decision screen (already exists, just wire server data)

### 5.6 Solo mode parity
- [x] Solo screen already exists on mobile (`OwnScreen`) with 3 modes + favorites + history
- [ ] Port food images to mobile as remote URLs from `/public/foods/*` (same assets on server)
- [ ] Or keep local bundled assets (current mobile approach)
- [ ] Sync solo favorites to server when logged in (`/api/favorites`)
- [ ] Sync solo history to server-side `LunchDecision` with `groupId: null` (schema change)

### 5.7 Cross-platform features
- [ ] Real push notifications (`expo-notifications` + backend `/api/push/subscribe`)
- [ ] Lunch reminder scheduling (respects user's timezone)
- [ ] Share invite via native share sheet (already possible with `Share.share`, needs the web invite URL)
- [ ] Google Maps navigation on "Let's Go" (`Linking.openURL('maps:...')`)
- [ ] Location permission + nearby filter

### 5.8 Mobile-specific polish
- [ ] Splash screen + proper app icon (`expo-splash-screen`)
- [ ] Dark mode (already has hooks via `expo-system-ui`)
- [ ] Offline mode: cache groups/restaurants, queue decisions, sync when online
- [ ] Biometric unlock (`expo-local-authentication`) for protected actions
- [ ] Over-the-air updates (`expo-updates`)
- [ ] EAS Build config → App Store + Play Store release

### 5.9 Mobile admin + chrome
- [ ] Bottom tab bar with: Home / Groups / Solo / History / Profile (replace current 5 tabs)
- [ ] Header with group switcher pill
- [ ] Pull-to-refresh on all list screens
- [ ] Skeleton loaders

---

## 6 · Dev / Infra

### 6.1 Already done
- [x] Prisma schema for users, groups, members, restaurants, decisions, votes
- [x] Iron-session cookies for web
- [x] Production deploy docs (`V2_MIGRATION_GUIDE.md`, `LOCAL_TEST_AND_DEPLOY.md`)

### 6.2 To do
- [ ] `git init` — this isn't a git repo yet (!)
- [ ] `.gitignore` additions: `.next/`, `node_modules/`, `.env`, `mobile/*/node_modules`
- [ ] Delete `.next/` and `backup/` from repo
- [ ] CI/CD: GitHub Actions running `tsc --noEmit` + `npm run build`
- [ ] Preview deploys on PR
- [ ] Sentry integration on both web + mobile
- [ ] Production logging (Pino / Winston)
- [ ] Backup strategy for Postgres
- [ ] Monitoring (uptime, response times)
- [ ] Documented env var matrix

---

## 7 · Content / Growth

### 7.1 Pre-seeded data
- [ ] 20-30 real KL/PJ restaurants as "starter pack" (offered when creating first group)
- [ ] "Popular in your area" suggestions using Places API

### 7.2 Marketing
- [ ] SEO metadata on landing + solo pages
- [ ] OG images (`cincailah.com/og.png`)
- [ ] Sitemap
- [ ] `/about`, `/privacy`, `/terms` pages (currently placeholder `#` links in footer)
- [ ] Twitter/Instagram card metadata

---

## Roadmap suggestion: what to pick up next

If you want the highest-impact stretch:

1. **1.1 Real emails** — unblocks password reset and enables 1.2 verification
2. **1.2 Rate limiting** — must-have before any public traffic
3. **1.4 Personal favorites** — #1 user-requested feature
4. **4.3 Git init + CI** — you can't ship safely without version control
5. **5.1–5.3 Mobile foundation** — once web is stable, port the 3-screen MVP to mobile

Start a new branch per section and ship in small PRs.
