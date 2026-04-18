# Development Guide

> Practical handbook for working on this codebase. Read this first before
> opening a PR — most surprises are captured here.

---

## 1. Stack at a glance

| Layer              | Tech                                                                 |
| ------------------ | -------------------------------------------------------------------- |
| Web framework      | Next.js 15 (App Router), React 19, Server Components where it pays   |
| Styling            | Tailwind CSS with `dark:` variants everywhere                        |
| Database           | PostgreSQL via Prisma ORM 5.22                                       |
| Web auth           | `iron-session` (encrypted cookie)                                    |
| Mobile auth        | 30-day JWT issued at `POST /api/auth/token` (Bearer header)          |
| Image uploads      | Direct VPS filesystem (`/public/uploads/...`), `jimp` (pure JS) for resizing |
| Email              | Resend (falls back to `devMode` log if `RESEND_API_KEY` missing)     |
| Logging            | `pino` with a Sentry bridge via `lib/logger.ts`                      |
| Analytics          | `posthog-node` via `lib/analytics.ts`                                |
| Error monitoring   | Sentry on web (`@sentry/nextjs`) and mobile (`@sentry/react-native`) |
| Rate limiting      | In-process `Map` (`lib/ratelimit.ts`) — **single-instance only**     |
| Mobile             | Expo SDK 51, React Navigation, JavaScript (not TypeScript yet)       |

---

## 2. Repository layout

```
app/                 Next.js App Router routes (pages + /api route handlers)
components/          Client/server React components (PascalCase .tsx)
lib/                 Framework-free helpers (prisma, auth, session, logger, ...)
prisma/              schema.prisma + seed.ts
mobile/              Expo app (React Native, JS)
docs/                Longer-form docs (this file, deployment guides, ...)
public/uploads/      Gitignored; user-uploaded images land here at runtime
```

---

## 3. Running locally

```bash
# One-time
cp .env.example .env          # fill in DATABASE_URL, SESSION_SECRET, ...
npm install
npx prisma generate
npx prisma db push            # or: npx prisma migrate deploy in prod

# Day-to-day
npm run dev                   # web on http://localhost:3000
cd mobile && npm run start    # Expo on :8081
```

### Required environment variables

Minimum set for local dev:

```env
DATABASE_URL="postgresql://user:pass@localhost:5432/cincailah"
SESSION_SECRET="at-least-32-chars-of-random-bytes-here"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

Recommended additions: `JWT_SECRET` (separate from SESSION_SECRET),
`RESEND_API_KEY`, `SENTRY_DSN`,
`NEXT_PUBLIC_SENTRY_DSN`, `POSTHOG_API_KEY`.

Validation lives in `lib/env.ts` — add new variables there so misconfigurations
fail loudly on boot.

---

## 4. Authentication model

There are two authenticated clients that hit the same API surface:

1. **Web** — iron-session cookie set by `POST /api/auth/login`.
2. **Mobile** — signed JWT issued by `POST /api/auth/token` and sent as
   `Authorization: Bearer <token>` on every request.

### The single source of truth

Use `resolveUserId(request)` (or `resolveUserIdWithSession(request)` when you
need to mutate the iron-session) from `lib/session.ts`. It inspects the
Authorization header first and falls back to the cookie.

```ts
import { resolveUserId } from '@/lib/session';

export async function GET(request: NextRequest) {
  const userId = await resolveUserId(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // ... rest of handler
}
```

**Never** call `getSession()` for authorization in a route that mobile should
reach — you'll silently 401 every mobile request. `getSession()` is only for:

- web-only routes that mutate the session (`login`, `logout`, `groups/switch`)
- UI/SSR rendering where you already know you're on the web

### JWT secret

`lib/mobile-auth.ts` prefers `JWT_SECRET`, falls back to `SESSION_SECRET`, and
**throws on boot in production** if the chosen secret is `< 32` characters.
Do not weaken this check.

---

## 5. API route conventions

Every route handler should look roughly like this:

```ts
import { NextRequest, NextResponse } from 'next/server';
import { resolveUserId } from '@/lib/session';
import { reportError, logRequest } from '@/lib/logger';
import { SomeSchema, zodError } from '@/lib/schemas';

export async function POST(request: NextRequest) {
  logRequest(request, { endpoint: 'my/endpoint' }); // optional but nice
  try {
    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const parsed = SomeSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(zodError(parsed.error), { status: 400 });
    }

    // ...business logic...

    return NextResponse.json({ success: true });
  } catch (error) {
    reportError(error, { route: 'my/endpoint' });
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
```

Rules:

1. **Validate with Zod.** Every body, query, and route param. Schemas live in
   `lib/schemas.ts` (reuse rather than redefine).
2. **Authorize after authenticating.** Use the helpers in `lib/group-access.ts`
   (`requireGroupMembership`, `ensureRestaurantAccessible`,
   `getDecisionWithMembership`) — they return `false` / `null` instead of
   throwing so you can return the right HTTP status.
3. **Never log with `console.*`.** Use `logger.info/warn` or `reportError` so
   the line gets structured formatting and Sentry pickup.
4. **Rate limit sensitive endpoints.** `lib/ratelimit.ts` is IP-keyed or
   user-keyed. Current implementation is in-memory — fine for a single VPS,
   needs Redis before you scale to multiple boxes (see §11).

---

## 6. Prisma & database

- **Schema lives in** `prisma/schema.prisma`. Any change requires
  `npx prisma generate` so TypeScript types update.
- The project currently uses `prisma db push` (no `prisma/migrations/`
  directory). When moving to staging/production, create a baseline migration:
  ```bash
  npx prisma migrate dev --name init
  ```
- Foreign keys: always set `onDelete` explicitly. `Cascade` for owned children
  (GroupMember, Restaurant, DecisionOption, Comment), `SetNull` for optional
  references that should survive the parent being deleted
  (`LunchDecision.chosenRestaurant`). Leaving it unset falls back to
  `NoAction`, which manifests as hard-to-debug 500s.
- Indexes: watch the `@@index` declarations on high-traffic tables
  (`restaurants(groupId, isActive)`, `lunch_decisions(groupId, decisionDate)`).
  Add one when you introduce a new filter.
- Don't store structured data inside `LunchDecision.constraintsUsed` without a
  strong reason — it's a typeless JSON column we're trying to *not* grow (see
  §11).

---

## 7. File uploads

All uploads go through `POST /api/upload` (multipart form, fields `file` and
`type = 'restaurant' | 'avatar' | 'group_cover'`). The handler:

1. Authenticates via `resolveUserId` (web cookie or mobile JWT).
2. Rate limits at 20 uploads/min/IP.
3. Validates size (`MAX_FILE_SIZE` in `lib/upload-constants.ts`, used by `lib/upload.ts`; currently **50 MB**) and MIME.
4. Resizes + converts to JPEG via `jimp` (pure JavaScript, no native binaries).
5. Writes under `/public/uploads/<type>/<uuid>.webp`.
6. Returns `{ url: '/uploads/...', bytes, filename }`.

Clients **must** then call the owning resource route (`PATCH /api/user/avatar`,
etc.) with the returned URL. We only persist `/uploads/...` paths to the
database — never external URLs — to prevent SSRF tracking via user-controlled
images.

Nginx should serve `/uploads/` directly with long `Cache-Control` and bypass
Next.js. See `nginx.conf.example` at the repo root.

---

## 8. Mobile app specifics

- JS (not TS) — converted from the `jiak-hami` scaffold. Keep files consistent
  with neighbours until we do the TS conversion.
- Network layer: every request goes through `mobile/src/lib/api.ts`
  (`apiFetch`). It:
  - attaches the JWT from `expo-secure-store`
  - uses a 15s AbortController timeout
  - returns `{ ok, status, data, networkError }` instead of throwing
- Auth is gated on biometric unlock (`expo-local-authentication`) when the
  user has opted in — see `mobile/src/context/AuthContext.tsx`.
- Deep links: `jiakhami://join/<code>`, `https://cincailah.com/join/<code>`,
  and the Expo dev URL — see `linking` config in `mobile/App.js`.
- Screens live under `mobile/src/screens/`. Before creating a new one, check
  whether an existing screen already covers the navigation target; three
  orphaned screens (`GroupScreen.js`, `HomeScreen.js`, `FavoritesScreen.js`)
  were deleted in the cleanup pass — don't resurrect them by accident.

---

## 9. Observability

- **Structured logs.** `logger` in `lib/logger.ts` is a `pino` instance.
  Prefer `logger.info({ ctx }, 'message')` over string interpolation.
- **Errors.** `reportError(error, ctx)` logs at error level *and* forwards to
  Sentry with the provided context. Use it in every `catch` block of an API
  route.
- **Request logs.** `logRequest(request, { endpoint })` at the top of a handler
  emits one line per request with method, path, and IP.
- **Health check.** `GET /api/health` — for load balancers or manual checks.
  Anything that blocks this endpoint (DB outage, missing env vars) will 503.
  Keep it fast; don't add feature checks.

---

## 10. Testing and CI

- `npx tsc --noEmit` must be clean before every commit (add a pre-commit hook
  if you want — none is configured today).
- `npx next lint` (still functional in Next 15; `next lint` is deprecated but
  we have not migrated yet).
- Mobile: `cd mobile && npm run lint` runs `expo lint`.
- There are no GitHub Actions workflows in this repo (CI / preview / uptime
  monitoring were removed).

### There are no unit tests yet.

The decision engine (`lib/decision-service.ts`) in particular is a prime
candidate — weighted random selection, no-repeat window, favourites-only
filter. See §11 for the plan.

---

## 11. Known limitations / next work

The following are deliberate deferrals. Tackle them when the need arises, not
preemptively.

1. **Rate limit store.** `lib/ratelimit.ts` is an in-process `Map`, so the
   effective limit scales with your number of Next.js instances. Swap for
   Redis (`ioredis` + sliding-window Lua) before the first horizontal scale
   event.
2. **`constraintsUsed` JSON blob.** `LunchDecision.constraintsUsed` is a
   structural catch-all (`expiresAt`, `soloName`, filter snapshot, etc.).
   When you have a free afternoon, extract explicit columns:
   `expires_at TIMESTAMPTZ`, `solo_name TEXT`, `filters JSONB` (keep filters
   as JSON — that's the legitimate free-form bit).
3. **Decision engine tests.** Add Vitest, pin `lib/decision-service.ts`
   behaviour with seeded fixtures: budget tiers, walk time, halal toggle,
   favourites-only, `noRepeatDays` window, weighted rating boost.
4. **Vote auto-finalisation race.** When a vote window expires, the first
   client to poll after expiry finalises the decision. It's idempotent
   (upsert) but racy under load. Move this to a lightweight cron / Postgres
   `LISTEN/NOTIFY` when traffic warrants.
5. **Expo push sender.** We store Expo push tokens in `PushSubscription` with
   `platform='expo'`, but nothing actually sends to them yet. Add a thin
   wrapper around Expo's `/--/api/v2/push/send` next to the existing
   web-push logic in `lib/push.ts`.
6. **Offline solo history queue.** Mobile logs solo picks to the server via
   `POST /api/decisions`. If the phone is offline at that instant the entry
   is lost. A `@react-native-async-storage` retry queue + `NetInfo` listener
   would close this gap.
7. **Types for the mobile app.** The whole `mobile/` tree is JS. A gradual
   migration to TS would buy us a lot of safety around `apiFetch` payloads.
8. **JWT rotation.** Tokens are 30-day, non-revocable. Add a `tokenVersion`
   column on `User` and include it in the JWT claim so logout-everywhere can
   invalidate outstanding tokens.
9. **`NEXT_PUBLIC_APP_URL` fallback.** A few email templates fall back to
   `http://localhost:3000`. Make `lib/env.ts` require this one in production
   so we fail fast instead of sending localhost links.
10. **Documentation sprawl.** The repo root has grown many top-level `.md`
    files (`LOGIN_AND_ACCESS.md`, feature notes, etc.). Fold them into
    `docs/` subpages before they diverge from reality.

---

## 12. Commit & PR etiquette

- Imperative, scoped commits: `feat(vote): allow tie-break reroll`, not
  "updated vote logic".
- Prefix `fix:` / `feat:` / `chore:` / `docs:` — we don't run a conventional
  changelog bot but the prefixes make `git log` grepable.
- PR description should answer two questions: *why* and *how to test*. One
  screenshot or 5-second GIF for anything user-visible.
- Keep diffs surgical. If you find a tangential bug, open a separate PR —
  future you will thank present you when reverting.

---

## 13. Production notes

- **VPS layout.** Nginx in front, Next.js on `:3000`, PostgreSQL on the same
  box. `/public/uploads/` is persisted across deploys (don't `rm -rf` on
  release).
- **Secrets.** Managed in the shell's `.env` file read by the Next.js process
  manager (PM2 / systemd). Do not bake them into images.
- **Database backups.** Daily `pg_dump` + rotate. The upload directory should
  be rsynced to off-box storage on the same cadence.
- **Deployment.** `git pull && npm ci && npx prisma migrate deploy && npm run build && pm2 restart cincailah`
  is the current recipe. Consider adding a `scripts/deploy.sh` so people stop
  reinventing the rhythm.

---

## 14. Getting unstuck

- `npx prisma studio` — fastest way to poke at DB state during dev.
- `tail -f ~/.pm2/logs/cincailah-out.log` — Pino JSON stream is greppable with
  `jq`.
- If a route 500s and Sentry is silent, look at your `.env` — missing envs are
  the #1 cause of blind errors.

Happy hacking.
