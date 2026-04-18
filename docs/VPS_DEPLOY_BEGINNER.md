# VPS Deployment Guide (Beginner Friendly)

This guide shows how to deploy `cincailah` on a VPS from scratch.
It assumes:

- Ubuntu 22.04 VPS
- A domain name you control (example: `cincailah.suntzutechnologies.com`)
- You can SSH into the server as a sudo user

If you follow this step-by-step, you will have:

- Next.js app running with PM2
- Nginx reverse proxy
- HTTPS SSL (Let's Encrypt)
- PostgreSQL connected
- Uploads saved on your VPS disk

---

## 1) Prepare your domain

### Important: what a “domain name” actually is

A hostname **cannot** contain `http://` or `https://` inside it.

- **Wrong (not a real hostname):** `cincailah.http://suntzutechnologies.com/`
- **Right (hostname):** `cincailah.suntzutechnologies.com`
- **Right (full site URL):** `https://cincailah.suntzutechnologies.com`

This project is easiest to deploy as a **subdomain** like `cincailah.suntzutechnologies.com`.

If you instead want the app at a **path** like `https://suntzutechnologies.com/cincailah`, that is possible in Next.js but requires extra configuration (`basePath`, asset URLs, cookies, etc.). For beginners, use a subdomain.

### DNS records (recommended: subdomain)

In your domain provider DNS panel for `suntzutechnologies.com`, add:

- `A` record: `cincailah` -> your VPS public IP

That creates the hostname `cincailah.suntzutechnologies.com`.

Optional (only if you want the apex domain on the same server too):

- `A` record: `@` -> your VPS public IP
- `A` record: `www` -> your VPS public IP

Wait for DNS propagation (usually a few minutes, sometimes longer).

---

## 2) SSH into your VPS

From your local machine:

```bash
ssh your_user@your_vps_ip
```

Update server packages first:

```bash
sudo apt update && sudo apt upgrade -y
```

---

## 3) Install required software

Install Node.js 20, git, nginx, and certbot:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git nginx certbot python3-certbot-nginx
```

Cincailah resizes uploaded images with **`jimp`** (pure JavaScript), so no native
image library or build toolchain is required. Works on older VPS CPUs that
can't run `sharp`'s prebuilt linux-x64 binaries.

Verify:

```bash
node -v
npm -v
nginx -v
```

Install PM2 globally:

```bash
sudo npm install -g pm2
```

---

## 4) Install PostgreSQL (if DB is on same VPS)

If you already use managed PostgreSQL, skip this section.

Install PostgreSQL:

```bash
sudo apt install -y postgresql postgresql-contrib
```

Create DB user + database:

```bash
sudo -u postgres psql
```

Inside `psql`:

```sql
CREATE USER cincailah_user WITH PASSWORD '5792_Ang';
CREATE DATABASE cincailah_db OWNER cincailah_user;
\q
```

Your `DATABASE_URL` will look like:

```env
DATABASE_URL="postgresql://cincailah_user:CHANGE_THIS_STRONG_PASSWORD@localhost:5432/cincailah_db?schema=public"
```

---

## 5) Clone project and install dependencies

Pick an app directory. You said you want:

- `/root/projects/cincailah`

That is totally fine. Just make sure **every later command** that references the folder path matches what you chose.

```bash
sudo mkdir -p /root/projects
sudo chown -R "$USER":"$USER" /root/projects
cd /root/projects
git clone <YOUR_GIT_REPO_URL> cincailah
cd cincailah
npm install
```

**Beginner note (important):** deploying under `/root/...` is convenient, but `/root` is normally very locked down.
If you use the Nginx `alias` trick for `/uploads/` (recommended for performance), Nginx must be able to **traverse directories** down to `public/uploads/`.
If uploads fail with `403`, jump to section 9 and apply the permission fix there.

---

## 6) Create production `.env`

Create `.env`:

```bash
nano .env
```

Paste and fill:

```env
NODE_ENV="production"

# Next.js listens on this port for `npm start` / PM2.
# Nginx will proxy public traffic (80/443) -> this internal port.
PORT="3015"

DATABASE_URL="postgresql://cincailah_user:CHANGE_THIS_STRONG_PASSWORD@localhost:5432/cincailah_db?schema=public"

# At least 32 chars
SESSION_SECRET="REPLACE_WITH_LONG_RANDOM_SECRET"
JWT_SECRET="REPLACE_WITH_ANOTHER_LONG_RANDOM_SECRET"

NEXT_PUBLIC_APP_URL="https://cincailah.suntzutechnologies.com"

# --- Email (Zoho Mail SMTP) ---
# This app sends mail via SMTP when these 4 vars are all set:
#   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
#
# For your setup, you want outgoing mail from:
#   admin@suntzutechnologies.com
#
# Typical Zoho SMTP (SSL):
SMTP_HOST="smtp.zoho.com"
SMTP_PORT="465"
SMTP_SECURE="true"
SMTP_USER="admin@suntzutechnologies.com"
SMTP_PASS="PASTE_ZOHO_APP_SPECIFIC_PASSWORD_HERE"

# The visible From header — should match a mailbox Zoho lets you send as
EMAIL_FROM="Cincailah <admin@suntzutechnologies.com>"

# Optional (only used if SMTP is NOT fully configured)
RESEND_API_KEY=""

# Optional but recommended
POSTHOG_API_KEY=""
POSTHOG_HOST="https://app.posthog.com"
SENTRY_DSN=""
NEXT_PUBLIC_SENTRY_DSN=""
SENTRY_ORG=""
SENTRY_PROJECT=""
```

Generate secure secrets quickly:

```bash
openssl rand -hex 32
```

Use one output for `SESSION_SECRET`, then run again for `JWT_SECRET`.

---

## 6A) Zoho Mail setup (recommended for `admin@suntzutechnologies.com`)

Cincailah sends transactional email for things like **password reset** and **email verification**.
You already use **Zoho Mail** for `admin@suntzutechnologies.com`, so use **SMTP** on the VPS.

### A) Create the SMTP password in Zoho (most common issue)

1. Log in to Zoho Mail as `admin@suntzutechnologies.com`.
2. Go to **Security / App passwords** (wording varies slightly).
3. Generate an **App-specific password** (recommended), especially if you use **2FA**.

Put that value into `.env` as `SMTP_PASS=...` (not your normal web login password).

### B) Pick the correct SMTP host/port

Most Zoho accounts work with:

- **SSL:** `smtp.zoho.com:465` and `SMTP_SECURE="true"` (what the template above uses)

If 465 is blocked by your provider/firewall, use STARTTLS instead:

```env
SMTP_HOST="smtp.zoho.com"
SMTP_PORT="587"
SMTP_SECURE="false"
```

If your mailbox is on a **region-specific** Zoho cluster, Zoho may give you a different SMTP hostname in their docs/settings screen — use **exactly** what Zoho shows for your account.

### C) Make `EMAIL_FROM` match what Zoho allows

Rule of thumb:

- `SMTP_USER` should be the mailbox you authenticate as (`admin@suntzutechnologies.com`).
- `EMAIL_FROM` should be the same mailbox **unless** you have a verified alias/group sender in Zoho.

If `EMAIL_FROM` uses a different address than Zoho permits, Zoho may reject the message or recipients may never see it.

### D) DNS deliverability (strongly recommended)

For `suntzutechnologies.com`, make sure Zoho’s DNS records are correct:

- **SPF** includes Zoho (Zoho provides the exact TXT record)
- **DKIM** enabled in Zoho + the DNS CNAME/TXT records added
- **DMARC** (optional but good) once SPF/DKIM are stable

This reduces “email went to spam” problems.

### E) Quick sanity check after deploy

After you finish PM2 + Nginx + `.env`:

1. Register a **throwaway Gmail** account for testing.
2. Trigger **Forgot password** from the site.
3. Watch logs:

```bash
pm2 logs cincailah --lines 200
```

If SMTP auth fails, the log line will usually mention **authentication failed** / **invalid login** — that almost always means **`SMTP_PASS` is wrong** (use app password) or **`SMTP_USER` doesn’t match** the mailbox.

---

## 7) Prepare database schema

From project root:

```bash
npx prisma generate
npx prisma db push
```

If you already use migrations in your workflow:

```bash
npm run db:migrate:prod
```

---

## 8) Build and start app with PM2

Build:

```bash
npm run build
```

Start with PM2:

```bash
pm2 start npm --name "cincailah" -- start
pm2 save
pm2 startup
```

Check app:

```bash
pm2 status
pm2 logs cincailah --lines 100
```

At this point the app should answer on `http://127.0.0.1:3015` (because `PORT=3015` in `.env`).

---

## 9) Configure Nginx reverse proxy

Create Nginx site config:

```bash
sudo nano /etc/nginx/sites-available/cincailah
```

Paste this config (replace domain):

**If your project lives at `/root/projects/cincailah`, the `alias` path must match exactly.**

```nginx
server {
    listen 80;
    server_name cincailah.suntzutechnologies.com;

    # Allow larger image uploads
    client_max_body_size 50M;

    # Serve uploaded files directly from disk for speed
    location /uploads/ {
        alias /root/projects/cincailah/public/uploads/;
        access_log off;
        add_header Cache-Control "public, max-age=31536000, immutable";
        try_files $uri =404;
    }

    location / {
        proxy_pass http://127.0.0.1:3015;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### If `/uploads/` returns 403 (common when code is under `/root`)

Nginx runs as `www-data` on Ubuntu. For `alias` to work under `/root/projects/...`, `www-data` needs **execute** permission on each directory in the path (`/root`, `/root/projects`, etc.).

A common beginner-friendly fix (tradeoff: slightly looser `/root` permissions):

```bash
sudo chmod 711 /root
sudo chmod -R 755 /root/projects/cincailah/public/uploads
sudo systemctl restart nginx
```

If you do not want to loosen `/root` permissions, move the repo to something like `/srv/cincailah` or `/home/deploy/projects/cincailah` instead, or remove the `/uploads/` `location` block and let Next.js serve uploads (slower, but simplest).

Enable it:

```bash
sudo ln -s /etc/nginx/sites-available/cincailah /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 10) Enable HTTPS (SSL)

Run Certbot:

```bash
sudo certbot --nginx -d cincailah.suntzutechnologies.com
```

Choose auto-redirect to HTTPS when prompted.

Test renewal:

```bash
sudo certbot renew --dry-run
```

---

## 11) Open firewall ports

If UFW is enabled:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

---

## 12) First deployment checklist

Run these checks:

```bash
curl -I http://127.0.0.1:3015
curl -I https://cincailah.suntzutechnologies.com
curl -I https://cincailah.suntzutechnologies.com/api/health
```

Open browser:

- `https://cincailah.suntzutechnologies.com`
- Register/login
- Create group
- Add restaurant
- Upload image

If image works, `/uploads/...` serving is correct.

---

## 13) How to deploy updates (next time)

Every time you push new code:

```bash
cd /root/projects/cincailah
git pull
npm install
npx prisma generate
npx prisma db push
npm run build
pm2 restart cincailah
```

Check logs after restart:

```bash
pm2 logs cincailah --lines 80
```

---

## 14) Useful commands (copy/paste)

PM2:

```bash
pm2 status
pm2 logs cincailah
pm2 restart cincailah
pm2 stop cincailah
pm2 delete cincailah
```

Nginx:

```bash
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl status nginx
```

App health:

```bash
curl https://cincailah.suntzutechnologies.com/api/health
```

---

## 15) Common beginner issues

1. **502 Bad Gateway**
   - App is not running on port **3015** (or Nginx `proxy_pass` points to the wrong port).
   - Fix: `pm2 status`, confirm `.env` has `PORT=3015`, then `pm2 restart cincailah`.

2. **500 Internal Server Error on all pages**
   - Missing or wrong `.env` values (`DATABASE_URL`, `SESSION_SECRET`).
   - Fix `.env`, rebuild, restart PM2.

3. **Prisma errors after schema changes**
   - DB schema not updated.
   - Run `npx prisma db push` (or migration deploy).

4. **Image upload fails**
   - `client_max_body_size` too small (use **50M** to match app uploads) or `/uploads/` alias wrong.
   - Confirm Nginx config and restart Nginx.

5. **SSL not issuing**
   - Domain not pointed to VPS yet.
   - Check DNS records and wait a bit, then retry certbot.

6. **Image library errors on older CPUs**
   - Cincailah uses `jimp` (pure JavaScript) for resizing, so there are **no
     native CPU requirements** and no `sharp` / `libvips` setup needed.
   - If you see an error about `sharp` after a `git pull`, run `npm install`
     again — `sharp` is no longer a dependency and leftover binaries can be
     removed with `rm -rf node_modules && npm install`.

---

## 16) Recommended backup plan

Minimum backup:

- PostgreSQL dump daily
- `/root/projects/cincailah/public/uploads/` daily
- Keep at least 7 days of backups

If you want, I can also add a simple automated backup script (`backup.sh`) for your VPS next.
