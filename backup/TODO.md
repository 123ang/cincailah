# Cincailah — Build TODO

**Stack:** Next.js 14 (App Router) + TailwindCSS + TypeScript + PostgreSQL (VPS)
**Auth:** Nickname + Makan Code (DB-backed, no local storage)
**Deploy Target:** VPS (self-hosted)

---

## Phase 1: Project Setup & Infrastructure

- [ ] **1.1** Scaffold Next.js project (App Router, TypeScript, TailwindCSS, ESLint)
- [ ] **1.2** Configure Tailwind with Cincailah design tokens (Sambal, Mamak, Pandan, etc.)
- [ ] **1.3** Set up PostgreSQL connection (use `pg` or Prisma as ORM)
- [ ] **1.4** Create database migration / SQL schema:
  - `users` — id, display_name, created_at
  - `groups` — id, name, makan_code, created_by, no_repeat_days, max_reroll, decision_mode_default, created_at
  - `group_members` — id, group_id, user_id, role (admin/member), joined_at
  - `restaurants` — id, group_id, name, cuisine_tags, vibe_tags, price_min, price_max, halal, veg_options, walk_minutes, maps_url, is_active, created_by, created_at
  - `lunch_decisions` — id, group_id, decision_date, mode_used, chosen_restaurant_id, constraints_used, created_by, created_at
  - `decision_options` — id, decision_id, restaurant_id
  - `votes` — id, decision_option_id, user_id, vote (yes/no), created_at
  - Indexes on: restaurants(group_id, is_active), lunch_decisions(group_id, decision_date)
- [ ] **1.5** Set up `.env` for DATABASE_URL and any secrets
- [ ] **1.6** Create shared layout (root layout, fonts, metadata)

---

## Phase 2: Auth & Group System (Nickname + Makan Code)

- [ ] **2.1** Onboarding page (`/`) — Enter display name
- [ ] **2.2** Create Group flow — name input → generate unique Makan Code → save to DB → redirect to group dashboard
- [ ] **2.3** Join Group flow — enter Makan Code → validate → add user as member → redirect
- [ ] **2.4** Session management — store user ID + active group in cookie/session (no password, nickname-only)
- [ ] **2.5** Middleware to protect group routes (must be logged in + in a group)

---

## Phase 3: Restaurant Management

- [ ] **3.1** Restaurant list page (`/group/[id]/restaurants`)
  - Search bar
  - Cards with name, cuisine tags, vibe tags, price range, walk time, halal/veg badges
  - Active/inactive toggle
- [ ] **3.2** Add Restaurant form (full fields from spec)
  - Name, cuisine tags (multi-select), vibe tags (multi-select)
  - Price min/max, halal checkbox, veg options checkbox
  - Walk time, Google Maps URL
- [ ] **3.3** Edit Restaurant
- [ ] **3.4** Deactivate/reactivate restaurant (soft delete)
- [ ] **3.5** API routes: `GET /api/restaurants`, `POST /api/restaurants`, `PATCH /api/restaurants/[id]`

---

## Phase 4: Decision Engine — "You Pick" (Smart Random)

- [ ] **4.1** Filter UI on home page:
  - Dompet Status (budget tiers: <RM10, RM10-20, RM20+)
  - Cuisine/vibe tag filters
  - Walk time slider
  - Halal / Veg toggles
- [ ] **4.2** API route: `POST /api/decide`
  - Accept filters as body
  - Fetch active restaurants for group
  - Apply filters (budget, tags, halal, veg, walk time)
  - Anti-Repeat: exclude restaurants picked within `no_repeat_days`
  - Random select from candidates
  - Return winner (or error if no candidates)
- [ ] **4.3** Roulette Wheel animation (interactive spinner)
  - Canvas or CSS-based wheel with restaurant names
  - 2-3 second spin with deceleration easing
  - Lands on the pre-determined winner from API
  - Sound/haptic feedback (optional)
- [ ] **4.4** Result Card display
  - Restaurant name, tags, price, walk time, last-ate info
  - "Let's Go!" button (saves decision to DB + opens Maps link)
  - "Don't want, again." button (reroll, respects max_reroll)
  - Reroll counter display
- [ ] **4.5** Save decision to `lunch_decisions` table on confirm

---

## Phase 5: Decision Engine — "We Fight" (Vote Mode)

- [ ] **5.1** Start Vote flow:
  - API picks 3-5 random candidates (same filter + anti-repeat logic)
  - Creates `lunch_decisions` record with mode="we_fight"
  - Creates `decision_options` for each candidate
- [ ] **5.2** Vote page (`/vote/[decision-id]`)
  - Show candidate cards
  - Yes/No vote per option per user
  - Real-time vote count display
  - Shareable link with Makan Code
- [ ] **5.3** Vote tally & winner selection
  - Auto-close after timer or all members voted
  - Majority wins → save to DB
- [ ] **5.4** Share voting link (copy to clipboard)

---

## Phase 6: History & Analytics

- [ ] **6.1** History page (`/group/[id]/history`)
  - Weekly timeline view
  - Stats cards: total picks, unique restaurants, avg decision time
  - "Most Picked" leaderboard
- [ ] **6.2** API route: `GET /api/history` with date range filter
- [ ] **6.3** "Recently Makan" mini-list on home page (last 3-5 decisions)

---

## Phase 7: Group Settings

- [ ] **7.1** Group settings page (`/group/[id]/settings`)
  - Display Makan Code (copy button)
  - Member list with roles + online status
  - Edit group rules: no_repeat_days, max_reroll, decision_mode_default
- [ ] **7.2** API routes: `PATCH /api/groups/[id]`, `GET /api/groups/[id]/members`

---

## Phase 8: Polish & UX

- [ ] **8.1** Loading states with cycling Malaysian micro-copy
- [ ] **8.2** Empty states (no restaurants, no history, no group)
- [ ] **8.3** Error handling & toast notifications
- [ ] **8.4** Responsive design (desktop-first, mobile-friendly)
- [ ] **8.5** Bottom navigation bar (Decide, Vote, Spots, History, More)
- [ ] **8.6** Page transitions / animations

---

## Phase 9: Deployment (VPS)

- [ ] **9.1** Build & export Next.js for production
- [ ] **9.2** Configure PM2 or systemd for process management
- [ ] **9.3** Set up reverse proxy (Nginx/Caddy)
- [ ] **9.4** SSL certificate (Let's Encrypt)
- [ ] **9.5** Environment variables on VPS

---

## Build Order (Recommended)

> Build sequentially — each phase unlocks the next.

1. **Phase 1** → Project scaffolding + DB schema
2. **Phase 2** → Auth so we have users & groups
3. **Phase 3** → Restaurants so we have data to pick from
4. **Phase 4** → "You Pick" — the core feature + roulette wheel
5. **Phase 5** → "We Fight" — voting mode
6. **Phase 6** → History & analytics
7. **Phase 7** → Group settings
8. **Phase 8** → Polish everything
9. **Phase 9** → Deploy to VPS

---

## Technical Decisions

| Decision | Choice | Rationale |
|---|---|---|
| ORM | Prisma | Type-safe, migration support, PostgreSQL native |
| Auth | Cookie-based session (iron-session) | Lightweight, no external auth provider needed |
| Spinner | CSS/JS roulette wheel | Restaurant names on wheel, 2-3s spin, easing deceleration |
| State | React hooks + Server Components | No Redux needed — simple enough for hooks |
| API | Next.js Route Handlers (App Router) | Co-located with frontend, no separate backend |
| Styling | TailwindCSS | Already in spec, matches design system |
| Deploy | VPS + PM2 + Nginx | User's existing infrastructure |
