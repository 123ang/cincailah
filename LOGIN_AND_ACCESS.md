# Login & Access

## Why you might see "Internal Server Error"

Visiting a group URL (e.g. `/group/d60d9b47-5323-488c-88ec-4671fa523313`) directly can cause an error if:

1. **You're not logged in** — No session cookie (e.g. new browser, cleared cookies, or expired session).
2. **You're not a member of that group** — Your account isn’t in that group’s members.
3. **Session secret is invalid** — `SESSION_SECRET` in `.env` is missing or shorter than 32 characters.

**What we changed:**

- Group pages now enforce both login and actual group membership.
- Session only uses a fallback secret in development. Production requires a real `SESSION_SECRET`.
- Home (`/`) sends you to login if not logged in, or to your group(s) if you are.

So if something goes wrong, you’re sent to `/login` instead of an error page.

---

## Login page (`/login`)

**URL:** `http://localhost:3000/login` (or your domain + `/login`)

### Two modes (tabs)

1. **Log in**
   - Enter your **email** and **password**.
   - If successful, you’re taken back to your active group or groups page.

2. **Register**
   - Create an account with **email, password, and display name**.
   - Then create a new group or join one with a Makan Code.

### Keeping track of your group

- **Same device:** Session cookie keeps you logged in; reopening the app takes you back to your group.
- **New device / new browser:** Open `/login`, sign in with your email and password, then switch to the right group if needed.
- **Forgot Makan Code:** Get it from someone in the group if you need to join a second account to that group.

### Redirect after login

- If you opened a group link while not logged in, you’re sent to:
  - `/login?redirect=/group/<groupId>`
- After a successful login, you’re sent to that `redirect` URL (e.g. the group page).
- If there’s no `redirect`, you go to the group you just joined or created.

### Error messages

- **Invalid Makan Code** — No group with that code. Check the code or create a new group.
- **You are not a member of that group** — You opened a group link for a group you’re not in. Log in to your account, then join that group with its Makan Code if appropriate.
- **Something went wrong. Please log in again.** — Session/backend issue; try logging in again.

---

## Flow summary

```
Visit /
  → Not logged in?  → Redirect to /login
  → Logged in?      → Redirect to /group/<your-active-group-id>

Visit /group/<id>
  → Not logged in?  → Redirect to /login?redirect=/group/<id>
  → Not a member?   → Redirect to /login?reason=not_member
  → OK?             → Show group (decide, spots, history, etc.)

Visit /login
  → Already logged in and have group? → Redirect to /group/<id>
  → Otherwise                        → Show login form (Log in / Create group)
```

---

## .env for session

In `.env`:

```env
# At least 32 characters (required by iron-session)
SESSION_SECRET="your-secure-random-string-at-least-32-characters-long"
```

If `SESSION_SECRET` is missing or too short, the app uses a dev fallback so it doesn’t crash; set a proper secret in production.

---

## Logout

- In the app: **More (Settings)** → **Logout**.
- You’re sent to `/login` and can log in again with your email and password.
