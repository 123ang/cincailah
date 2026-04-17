# Login & Access

## Why you might see "Internal Server Error"

Visiting a group URL (e.g. `/group/d60d9b47-5323-488c-88ec-4671fa523313`) directly can cause an error if:

1. **You're not logged in** — No session cookie (e.g. new browser, cleared cookies, or expired session).
2. **You're not a member of that group** — Your account isn’t in that group’s members.
3. **Session secret is invalid** — `SESSION_SECRET` in `.env` is missing or shorter than 32 characters.

**What we changed:**

- **Group layout** now catches errors and redirects to the **login page** instead of showing 500.
- **Session** uses a safe fallback password in dev if `SESSION_SECRET` is missing or too short (so the app doesn’t crash).
- **Home (`/`)** sends you to **Login** if not logged in, or to **your group** if you are.

So if something goes wrong, you’re sent to `/login` instead of an error page.

---

## Login page (`/login`)

**URL:** `http://localhost:3000/login` (or your domain + `/login`)

### Two modes (tabs)

1. **Log in to my group**
   - Enter **Your name** and **Makan Code**.
   - Use the **same name** you used when you first joined/created the group so you’re recognised.
   - If a member with that name already exists in the group, you’re logged in as that user (no duplicate account).
   - If not, a new user is created and added to the group.

2. **Create new group**
   - Enter **Your name** only.
   - Creates a new group and a Makan Code.
   - You’re logged in and taken to the new group.

### Keeping track of your group

- **Same device:** Session cookie keeps you logged in; reopening the app takes you back to your group.
- **New device / new browser:** Open `/login`, choose **“Log in to my group”**, enter the **same name** and **Makan Code**. You’ll be taken to that group again.
- **Forgot Makan Code:** Get it from someone in the group (e.g. from **More → group settings**), or create a new group if you’re starting fresh.

### Redirect after login

- If you opened a group link while not logged in, you’re sent to:
  - `/login?redirect=/group/<groupId>`
- After a successful login, you’re sent to that `redirect` URL (e.g. the group page).
- If there’s no `redirect`, you go to the group you just joined or created.

### Error messages

- **Invalid Makan Code** — No group with that code. Check the code or create a new group.
- **You are not a member of that group** — You opened a group link for a group you’re not in. Log in with the name + Makan Code for **that** group.
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
- You’re sent to `/login` and can log in again with name + Makan Code to get back to your group.
