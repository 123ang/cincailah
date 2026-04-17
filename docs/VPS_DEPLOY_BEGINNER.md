# VPS Deployment Guide (Beginner Friendly)

This guide shows how to deploy `cincailah` on a VPS from scratch.
It assumes:

- Ubuntu 22.04 VPS
- A domain name (example: `cincailah.com`)
- You can SSH into the server as a sudo user

If you follow this step-by-step, you will have:

- Next.js app running with PM2
- Nginx reverse proxy
- HTTPS SSL (Let's Encrypt)
- PostgreSQL connected
- Uploads saved on your VPS disk

---

## 1) Prepare your domain

In your domain provider DNS panel, add:

- `A` record: `@` -> your VPS public IP
- `A` record: `www` -> your VPS public IP (optional)

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

Install Node.js 20, git, nginx, certbot, and build tools:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git nginx certbot python3-certbot-nginx build-essential
```

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
CREATE USER cincailah_user WITH PASSWORD 'CHANGE_THIS_STRONG_PASSWORD';
CREATE DATABASE cincailah_db OWNER cincailah_user;
\q
```

Your `DATABASE_URL` will look like:

```env
DATABASE_URL="postgresql://cincailah_user:CHANGE_THIS_STRONG_PASSWORD@localhost:5432/cincailah_db?schema=public"
```

---

## 5) Clone project and install dependencies

Pick an app directory (example `/var/www/cincailah`):

```bash
sudo mkdir -p /var/www
sudo chown -R $USER:$USER /var/www
cd /var/www
git clone <YOUR_GIT_REPO_URL> cincailah
cd cincailah
npm install
```

---

## 6) Create production `.env`

Create `.env`:

```bash
nano .env
```

Paste and fill:

```env
NODE_ENV="production"

DATABASE_URL="postgresql://cincailah_user:CHANGE_THIS_STRONG_PASSWORD@localhost:5432/cincailah_db?schema=public"

# At least 32 chars
SESSION_SECRET="REPLACE_WITH_LONG_RANDOM_SECRET"
JWT_SECRET="REPLACE_WITH_ANOTHER_LONG_RANDOM_SECRET"

NEXT_PUBLIC_APP_URL="https://your-domain.com"

# Optional but recommended
RESEND_API_KEY=""
GOOGLE_PLACES_API_KEY=""
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

At this point app usually runs on `http://localhost:3000`.

---

## 9) Configure Nginx reverse proxy

Create Nginx site config:

```bash
sudo nano /etc/nginx/sites-available/cincailah
```

Paste this config (replace domain):

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Allow larger image uploads
    client_max_body_size 10M;

    # Serve uploaded files directly from disk for speed
    location /uploads/ {
        alias /var/www/cincailah/public/uploads/;
        access_log off;
        add_header Cache-Control "public, max-age=31536000, immutable";
        try_files $uri =404;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
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
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
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
curl -I http://127.0.0.1:3000
curl -I https://your-domain.com
curl -I https://your-domain.com/api/health
```

Open browser:

- `https://your-domain.com`
- Register/login
- Create group
- Add restaurant
- Upload image

If image works, `/uploads/...` serving is correct.

---

## 13) How to deploy updates (next time)

Every time you push new code:

```bash
cd /var/www/cincailah
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
curl https://your-domain.com/api/health
```

---

## 15) Common beginner issues

1. **502 Bad Gateway**
   - App is not running on port 3000.
   - Fix: `pm2 status`, then `pm2 restart cincailah`.

2. **500 Internal Server Error on all pages**
   - Missing or wrong `.env` values (`DATABASE_URL`, `SESSION_SECRET`).
   - Fix `.env`, rebuild, restart PM2.

3. **Prisma errors after schema changes**
   - DB schema not updated.
   - Run `npx prisma db push` (or migration deploy).

4. **Image upload fails**
   - `client_max_body_size` too small or `/uploads/` alias wrong.
   - Confirm Nginx config and restart Nginx.

5. **SSL not issuing**
   - Domain not pointed to VPS yet.
   - Check DNS records and wait a bit, then retry certbot.

---

## 16) Recommended backup plan

Minimum backup:

- PostgreSQL dump daily
- `/var/www/cincailah/public/uploads/` daily
- Keep at least 7 days of backups

If you want, I can also add a simple automated backup script (`backup.sh`) for your VPS next.
