# Mobile roadmap — web parity + guest (solo) mode

Production API origin (confirmed): **https://cincailah.suntzutechnologies.com**

Health check (2026-04-18): `GET /api/health` → `200 {"status":"ok","db":"ok"}`.
`POST /api/auth/token` with a bad credential → `401 {"error":"Invalid email or password"}`, so the
endpoints the mobile app needs are live.

Decisions locked in with the user:

1. Production origin = `https://cincailah.suntzutechnologies.com`.
2. Ask the user before uploading local data to their new account.
3. Guest mode persists across app restarts.
4. Local-only reminders are included in guest mode.
5. Build **all** missing mobile screens for web parity this round.
6. Wire a proper Android release keystore and update the build script.
7. Activity feed / comments / ratings stay **web-only** for now.

---

## To-do

### Fix-now — unblocks login on device

- [x] **m1** Rebuild release APK so the device uses `https://cincailah.suntzutechnologies.com`.
  Lock the fallback to that host in:
  - `mobile/app.json` → `expo.extra.apiUrl`
  - `mobile/src/lib/api.ts` → fallback `BASE_URL`
  - `mobile/src/screens/RestaurantsScreen.js` → fallback `apiUrl`
  - `mobile/App.js` → `linking.prefixes` (suntzu first, `cincailah.com` second)
- [x] **m2** Remove plaintext password logging from `LoginScreen` and `AuthContext`.
  Keep only non-sensitive metadata (`ok`, `status`, `networkError`, `hasToken`).

### Guest / solo-offline mode

- [x] **m3** `AuthContext`: add `mode: 'guest' | 'authed' | null`, `continueAsGuest()`, and persist
  `cincailah_guest=true` in `AsyncStorage` so guest mode survives cold starts.
- [x] **m4** `App.js` navigator routes:
  - `mode === 'authed'` → `AuthedStack` (current Main + group screens)
  - `mode === 'guest'` → `GuestStack` (Solo, Favourites, History, Profile, Reminders)
  - otherwise → `AuthStack` (Landing / Login / Register / ForgotPassword)
- [x] **m5** `LandingScreen`: add `Use solo (no account) →` button with copy
  "Favourites, history and reminders will stay on this device".
- [x] **m6** New `FavoritesScreen`: add / edit / delete favourites with optional note.
  Local-first via `AsyncStorage` key `favorite_spots`. When a token exists,
  mirror changes to `/api/favorites` (create, list, delete).
- [x] **m7** Local-only reminders for guests: use `expo-notifications`
  `scheduleNotificationAsync`. Skip `/api/reminders` when `mode === 'guest'`.
- [x] **m8** Migration-on-signin: after the first successful login / register from
  guest mode, show a confirm sheet:
  > "Upload your saved favourites and spin history to your account?"
  On confirm: `POST /api/favorites` per item, `POST /api/decisions` per entry
  (mode `solo`). On success clear local copies. On skip or failure, keep local
  data intact.
- [x] **m13** Gate server-only screens (`Groups`, `CreateGroup`, `JoinGroup`,
  `Vote`, `Decide`, `AddRestaurant`, `GroupSettings`) behind the authed check.
  Redirect guests to a small "Sign in to continue" screen.

### Web-parity screens

- [x] **m9** `ResetPasswordScreen` + deep-link handler for
  `https://cincailah.suntzutechnologies.com/reset-password?token=…` →
  `POST /api/auth/reset-password`. Route back to `Login` on success.
- [x] **m10** `VerifyEmailScreen` + deep-link handler for
  `https://cincailah.suntzutechnologies.com/verify/:token` →
  `POST /api/auth/verify-email`. Show success / error state, route to `Login`.
- [x] **m11** `EditRestaurantScreen` (parity with
  `/group/[id]/restaurants/[rid]/edit`): load existing restaurant via
  `GET /api/restaurants/[id]`, save via `PATCH /api/restaurants/[id]`.
  Hook up from the `RestaurantsScreen` row long-press / edit icon.
- [x] **m12** `EditProfileScreen` (parity with `/settings/profile`):
  change display name, avatar picker via `expo-image-picker`, upload through
  `POST /api/upload` then `POST /api/user/avatar`. Wire the preferences
  toggles via `PATCH /api/user/preferences`.

### Release hardening

- [x] **m14** Generate a real Android release keystore (keep the file out of git,
  store password + alias as EAS secrets and local `~/.gradle/gradle.properties`
  entries). Wire `android/app/build.gradle` `signingConfigs.release`, and
  update `scripts/build-apk-local.sh` to abort if the keystore is missing.

### Deferred (web only)

- [x] **m15** Group activity feed, comments, ratings — **not** building mobile
  screens for these in this round. The APIs (`/api/comments`, `/api/ratings`)
  remain available, but the mobile app intentionally ignores them.

### Verification

- [x] **m16** QA pass on a real device after rebuild:
  - login works against production
  - guest flow end-to-end (Landing → Solo → Favourites → History → Reminders)
  - deep links resolve: `/join/:code`, `/reset-password?token=…`, `/verify/:token`
  - local → server migration runs once and only once after the first sign-in

---

## File-level impact (quick reference)

| Area | Files touched |
|------|--------------|
| API host lock (m1) | `mobile/app.json`, `mobile/src/lib/api.ts`, `mobile/src/screens/RestaurantsScreen.js`, `mobile/App.js` |
| Remove password log (m2) | `mobile/src/screens/auth/LoginScreen.js`, `mobile/src/context/AuthContext.tsx` |
| Guest mode (m3–m5, m13) | `mobile/src/context/AuthContext.tsx`, `mobile/App.js`, `mobile/src/screens/auth/LandingScreen.js`, new `mobile/src/screens/AuthRequiredScreen.js` |
| Favourites (m6) | new `mobile/src/screens/FavoritesScreen.js` |
| Reminders (m7) | new `mobile/src/screens/RemindersScreen.js`, `mobile/src/lib/notifications.js` |
| Migration (m8) | `mobile/src/context/AuthContext.tsx`, new `mobile/src/lib/guestMigration.ts` |
| Reset / verify (m9, m10) | new `mobile/src/screens/auth/ResetPasswordScreen.js`, `mobile/src/screens/auth/VerifyEmailScreen.js`, `mobile/App.js` linking config |
| Edit restaurant (m11) | new `mobile/src/screens/EditRestaurantScreen.js`, `mobile/src/screens/RestaurantsScreen.js` |
| Edit profile (m12) | new `mobile/src/screens/EditProfileScreen.js`, `mobile/src/screens/ProfileScreen.js` |
| Keystore (m14) | `mobile/android/app/build.gradle`, `mobile/scripts/build-apk-local.sh`, `~/.gradle/gradle.properties` (local) |
