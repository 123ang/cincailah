# Cincailah v2 — Auth + Landing Page + Multi-Group

## Overview

Major overhaul: replace nickname-only auth with real email + password registration, add a marketing landing page, and let users belong to multiple makan groups with sticky session (auto-return to last active group).

---

## What Changes

| Area | Before (v1) | After (v2) |
|------|-------------|------------|
| Auth | Nickname + Makan Code only | Email + password registration & login |
| Forgot password | None | Email-based reset token flow |
| Landing page | None (straight to onboarding) | Full marketing page (Malaysian style) |
| Groups per user | 1 (tied to session) | Multiple — user picks from a list |
| Group selection | N/A | "My Groups" page after login |
| Session behaviour | Basic | Remembers last active group; auto-redirect |
| Switch group | N/A | "Switch Group" button in nav/settings |
| Database | `users` has `display_name` only | Add `email`, `password_hash`, `reset_token`, `reset_token_expires` |
| Old data | Keep | **Wipe** — fresh start |

---

## Database Changes

### `users` table — updated

```
id              UUID PK
email           TEXT UNIQUE (new)
password_hash   TEXT (new)
display_name    TEXT
reset_token     TEXT? (new — for forgot password)
reset_token_exp TIMESTAMP? (new — token expiry)
created_at      TIMESTAMP
```

All other tables stay the same (`groups`, `group_members`, `restaurants`, `lunch_decisions`, `decision_options`, `votes`).

### Migration plan

1. Drop all existing data (`prisma migrate reset` or `prisma db push --force-reset`).
2. Add new columns to `users`.
3. Re-push schema.

---

## Session Changes

```typescript
interface SessionData {
  userId?: string;
  email?: string;
  displayName?: string;
  activeGroupId?: string;  // last group user was in — auto-redirect here
  isLoggedIn: boolean;
}
```

### Auto-redirect logic

```
Visit /
  → Not logged in          → Show landing page
  → Logged in + activeGroupId set   → Redirect to /group/<activeGroupId>
  → Logged in + no activeGroupId    → Redirect to /groups (group selector)

Visit /group/<id>
  → Not logged in          → Redirect to /login?redirect=/group/<id>
  → Logged in + not member → Show error, link to /groups
  → Logged in + member     → Show group, set activeGroupId in session
```

---

## New Routes & Pages

### Public pages (no auth)

| Route | Page | Purpose |
|-------|------|---------|
| `/` | Landing page | Marketing page with CTA → register/login |
| `/register` | Register | Email + password + display name |
| `/login` | Login | Email + password |
| `/forgot-password` | Forgot password | Enter email → send reset link |
| `/reset-password` | Reset password | Enter new password (with token from email) |

### Authenticated pages

| Route | Page | Purpose |
|-------|------|---------|
| `/groups` | My Groups | List of user's groups + create/join buttons |
| `/groups/create` | Create Group | Name input → generates Makan Code |
| `/groups/join` | Join Group | Makan Code input → join existing group |
| `/group/[groupId]` | Decide (home) | Same as now |
| `/group/[groupId]/...` | All sub-pages | Same as now (restaurants, history, settings, vote, decide) |

### API routes

| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/auth/register` | Create account (email + password + name) |
| POST | `/api/auth/login` | Login (email + password) |
| POST | `/api/auth/logout` | Destroy session |
| POST | `/api/auth/forgot-password` | Generate reset token, (log it for now — email later) |
| POST | `/api/auth/reset-password` | Validate token + set new password |
| GET | `/api/auth/session` | Check current session |
| GET | `/api/groups/mine` | List user's groups |
| POST | `/api/groups/create` | Create group |
| POST | `/api/groups/join` | Join group via Makan Code |
| POST | `/api/groups/switch` | Set activeGroupId in session |

**Remove:** `/api/auth/create-group`, `/api/auth/join-group` (old combined auth+group routes)

---

## Landing Page Design

### Style: Malaysian casual, warm, fun

**Sections:**

1. **Hero**
   - Headline: "Makan mana?" with sub "Decide lunch in under 30 seconds."
   - Big CTA button: "Get Started — It's Free" → `/register`
   - Secondary: "Already have an account? Log in" → `/login`
   - Background: Warm gradient (sambal red → mamak yellow) or pattern
   - 🍛 emoji or illustration

2. **Problem**
   - "Sound familiar?" cards:
     - "I don't know, you choose."
     - "Not nasi lemak again..."
     - "My budget only RM8 today."
     - "Is that place halal?"
   - Light, fun illustrations or emojis

3. **How It Works**
   - 3 steps with icons:
     1. 📝 "Create a Makan Group" — Get a code, invite your team
     2. 🍜 "Add your favourite spots" — Restaurants, tags, budget, halal
     3. 🎲 "Press Cincai lah!" — Spin the wheel or vote with your group

4. **Features**
   - Anti-Repeat Protection 🔁
   - Budget Filters (Dompet Status) 💰
   - Roulette Wheel Spinner 🎰
   - Group Voting (We Fight Mode) ⚔️
   - Halal / Veg Friendly 🥗
   - History & Stats 📊

5. **Testimonials / Fun quotes** (fake for now)
   - "Finally no more 20-minute lunch debates." — Ahmad
   - "The roulette wheel is so satisfying." — Siti

6. **CTA Footer**
   - "Stop arguing. Start eating."
   - Button: "Create Your Group Now" → `/register`

7. **Footer**
   - Links: About, How It Works, Login, Register
   - "Made with ❤️ and hunger in Malaysia 🇲🇾"

---

## Register Page

### Fields
- Display Name (text)
- Email (email)
- Password (min 8 chars)
- Confirm Password

### Validation
- Email format check
- Password min 8 characters
- Passwords match
- Email uniqueness (server-side)

### Flow
```
Fill form → POST /api/auth/register → Create user (hash password) → Set session → Redirect to /groups
```

---

## Login Page

### Fields
- Email
- Password

### Links
- "Forgot password?" → `/forgot-password`
- "Don't have an account?" → `/register`

### Flow
```
Fill form → POST /api/auth/login → Verify password → Set session → Redirect:
  - If activeGroupId exists → /group/<id>
  - Else → /groups
```

---

## Forgot Password Flow

### Step 1: `/forgot-password`
- User enters email.
- `POST /api/auth/forgot-password`
- Server: generate random token, save to `users.reset_token` + `reset_token_exp` (1 hour).
- **For now:** Log the reset link to console (no email service yet).
  - Format: `/reset-password?token=<token>&email=<email>`
- Show: "If that email exists, we've sent a reset link."

### Step 2: `/reset-password?token=...&email=...`
- User enters new password + confirm.
- `POST /api/auth/reset-password`
- Server: validate token + not expired → hash new password → clear token.
- Redirect to `/login` with success message.

### Future: Wire up real email (Resend, Nodemailer, etc.)

---

## My Groups Page (`/groups`)

### Layout
- Heading: "My Makan Groups 🍛"
- Two action buttons: **"Create Group"** / **"Join Group"**
- List of groups user belongs to:

```
┌─────────────────────────────────────────────┐
│  🍛  Team Backend                           │
│  MAKAN-7X2K · 5 members · Admin            │
│  Last active: Today                          │
│                                [Enter →]     │
├─────────────────────────────────────────────┤
│  🍜  Friday Lunch Gang                      │
│  MAKAN-9P3M · 3 members · Member           │
│  Last active: 2 days ago                     │
│                                [Enter →]     │
└─────────────────────────────────────────────┘
```

- Click a group → sets `activeGroupId` → redirect to `/group/<id>`
- If user has 0 groups → show empty state with create/join buttons

### Create Group (`/groups/create`)
- Input: Group Name
- Submit → generates Makan Code → show code → redirect to group

### Join Group (`/groups/join`)
- Input: Makan Code
- Submit → verify code → add as member → redirect to group

---

## Navigation Changes

### Top Nav (inside group)
Add a "← My Groups" or group-switcher button.

```
[← Groups]   🍛 cincailah         [Team Backend · MAKAN-7X2K]
```

### Settings Page
- Add **"Switch Group"** button → goes to `/groups`
- Show user email (read-only)
- Keep group rules, member list, Makan Code, logout

### Bottom Nav
Same as now (Decide, Vote, Spots, History, More).

---

## Build Order

| Step | Task | Files |
|------|------|-------|
| 1 | Update Prisma schema (add email, password_hash, reset_token) | `schema.prisma` |
| 2 | Wipe DB + re-push schema | CLI |
| 3 | Update session type | `lib/session.ts` |
| 4 | Create password hashing utility | `lib/auth.ts` |
| 5 | Build register API + page | `/api/auth/register`, `/register` |
| 6 | Build login API + page | `/api/auth/login`, `/login` (replace old) |
| 7 | Build forgot password API + page | `/api/auth/forgot-password`, `/forgot-password` |
| 8 | Build reset password API + page | `/api/auth/reset-password`, `/reset-password` |
| 9 | Build "My Groups" page | `/groups` |
| 10 | Build "Create Group" page | `/groups/create`, `/api/groups/create` |
| 11 | Build "Join Group" page | `/groups/join`, `/api/groups/join` |
| 12 | Build switch group API | `/api/groups/switch` |
| 13 | Update home `/` → landing page | `/page.tsx` |
| 14 | Update group layout → redirect to `/login` | `layout.tsx` |
| 15 | Update top nav → add "← My Groups" | `TopNav.tsx` |
| 16 | Update settings → switch group, show email | `SettingsPage.tsx` |
| 17 | Remove old auth routes | Clean up |
| 18 | Test full flow | Manual |

---

## Security Notes

- Passwords hashed with **bcryptjs** (already installed)
- Session cookie: httpOnly, sameSite=lax, secure in production
- Reset token: random 64-char hex, expires in 1 hour
- Email stored lowercase and trimmed
- No password stored in session — only userId + email + displayName
- Rate limiting: not implemented yet (future enhancement)

---

## .env additions

```env
# Existing
DATABASE_URL="postgresql://..."
SESSION_SECRET="..."

# Future (when adding real email for forgot password)
# SMTP_HOST="smtp.example.com"
# SMTP_PORT="587"
# SMTP_USER="noreply@cincailah.com"
# SMTP_PASS="..."
# APP_URL="https://cincailah.com"
```

For now, forgot password reset links are **logged to the server console** so you can copy-paste the URL.

---

## Summary

```
Landing Page (/)
  ├── [Get Started] → /register
  └── [Log In] → /login

Register (/register)
  └── Create account → /groups

Login (/login)
  └── Verify credentials → /groups or /group/<lastActive>

Forgot Password (/forgot-password)
  └── Enter email → token logged → /reset-password?token=...

Reset Password (/reset-password)
  └── New password → /login

My Groups (/groups)
  ├── [Create Group] → /groups/create → /group/<new>
  ├── [Join Group] → /groups/join → /group/<joined>
  └── [Enter group] → sets activeGroupId → /group/<id>

Group (/group/[id])
  ├── Decide (home)
  ├── Restaurants
  ├── History
  ├── Vote
  └── Settings (switch group, logout)
```

**Total new pages:** 7 (landing, register, login, forgot password, reset password, my groups, create/join group)

**Total new API routes:** 6 (register, login, forgot-password, reset-password, groups/create, groups/join, groups/switch)

**Estimated implementation:** ~18 steps, single context window.

---

Ready to build when you say go. 🚀
