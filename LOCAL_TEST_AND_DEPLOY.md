# Cincailah — Test Locally & Deploy to VPS

This guide covers **how to test the app on your machine** and **how to deploy it on a VPS**.

---

# Part 1: Test Locally

## Prerequisites

- **Node.js 18+** — [Download](https://nodejs.org/) or check: `node --version`
- **PostgreSQL** — Required for the app to work (create group, add restaurants, spin wheel)

---

## Step 1: Install PostgreSQL (if you don’t have it)

### Option A — Windows (installer)

1. Download: https://www.postgresql.org/download/windows/
2. Run the installer, set a password for the `postgres` user.
3. Keep default port **5432**.
4. Add PostgreSQL **bin** to your PATH (installer can do this).

### Option B — Windows (Chocolatey)

```powershell
choco install postgresql
```

### Option C — Docker (any OS)

```bash
docker run -d --name cincailah-db -e POSTGRES_USER=cincailah -e POSTGRES_PASSWORD=localdev -e POSTGRES_DB=cincailah -p 5432:5432 postgres:16
```

Then use in `.env`:

```env
DATABASE_URL="postgresql://cincailah:localdev@localhost:5432/cincailah?schema=public"
```

---

## Step 2: Create the database

**If you installed PostgreSQL normally:**

```powershell
# Open psql (Windows: use "SQL Shell (psql)" from Start Menu, or)
psql -U postgres

# In psql:
CREATE USER cincailah_user WITH PASSWORD 'your_password';
CREATE DATABASE cincailah OWNER cincailah_user;
\q
```

**If you used Docker:** the database and user are already created.

---

## Step 3: Configure environment

1. Open `.env` in the project root.
2. Set **DATABASE_URL** to your real credentials:

```env
# Use your actual user, password, and host/port
DATABASE_URL="postgresql://cincailah_user:your_password@localhost:5432/cincailah?schema=public"

# Session secret — use a long random string (e.g. from https://generate-secret.vercel.app/32)
SESSION_SECRET="your-secure-random-string-at-least-32-characters-long"
```

3. **SESSION_SECRET**: generate one (32+ chars). Example in PowerShell:

```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }) -as [byte[]])
```

---

## Step 4: Install dependencies and set up the database

In the project folder:

```powershell
cd c:\Users\User\Desktop\Website\cincailah

npm install
npx prisma generate
npx prisma db push
```

- **`prisma generate`** — generates the Prisma client.
- **`prisma db push`** — creates/updates tables in your database.

If you see **“Database is now in sync”** (or similar), the DB is ready.

---

## Step 5: Start the app

```powershell
npm run dev
```

You should see:

```
▲ Next.js 15.x.x
- Local:   http://localhost:3000
✓ Ready in ...
```

Open a browser and go to: **http://localhost:3000**

---

## Step 6: Manual test checklist

Use this to confirm everything works locally.

| # | What to do | Expected result |
|---|------------|-----------------|
| 1 | Open http://localhost:3000 | Onboarding page with “Cincai lah!” and name/code fields |
| 2 | Enter a name and click **“Start a Makan Group”** | Redirect to group home; you see “Makan mana hari ni?” and your group badge |
| 3 | Click **Spots** (bottom nav) → **+ Add** | Add Restaurant form with name, tags, price, halal, walk time |
| 4 | Add at least 3 restaurants and save | Each appears in the list; you can search |
| 5 | Go back to **Decide** (home) | Filters (Dompet, tags, walk) and “Cincai lah!” button are visible |
| 6 | (Optional) Set budget/tags, then click **“Cincai lah!”** | Loading text, then roulette wheel spins ~2–3 sec, then result card with one restaurant |
| 7 | On result: click **“Let’s Go!”** or **“Don’t want”** | Either opens map (if URL set) or goes back; no crash |
| 8 | Open **History** tab | You see the decision you just made (and count/stats if any) |
| 9 | Open **More** (Settings) | Makan Code, member list, group rules are shown |
| 10 | Copy Makan Code, open new incognito window, paste code and **Join** with another name | You join the same group; you see same restaurants |

If all of the above work, **local testing is successful**.

---

## Troubleshooting (local)

**“Authentication failed” / “database does not exist”**

- Check PostgreSQL is running (e.g. Services on Windows, or `docker ps` for Docker).
- Check **DATABASE_URL** in `.env`: user, password, host, port, database name.
- Ensure the database and user exist (Step 2).

**“Module not found” or build errors**

```powershell
Remove-Item -Recurse -Force node_modules
npm install
npx prisma generate
```

**Port 3000 already in use**

```powershell
$env:PORT=3001; npm run dev
```

Then open http://localhost:3001.

**Inspect data (optional)**

```powershell
npx prisma studio
```

Opens a UI at http://localhost:5555 to view/edit tables.

---

# Part 2: Deploy to VPS

## Prerequisites on VPS

- Ubuntu 20.04/22.04 (or similar Linux)
- SSH access
- A domain pointing to the VPS (optional but recommended for SSL)

---

## 1. Prepare the server

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y nodejs npm postgresql nginx
```

If Node is old, use NodeSource:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node --version   # should be v18+
```

Install PM2 globally:

```bash
sudo npm install -g pm2
```

---

## 2. Set up PostgreSQL on VPS

```bash
sudo -u postgres createuser --interactive --pwprompt
# Name: cincailah_user
# Password: (choose a strong password)

sudo -u postgres createdb cincailah --owner=cincailah_user
```

Allow local connections (if needed):

```bash
sudo nano /etc/postgresql/*/main/pg_hba.conf
# Ensure you have: local   all   cincailah_user   md5

sudo systemctl restart postgresql
```

---

## 3. Upload the project

**Option A — Git**

On your PC (if not already):

```bash
cd c:\Users\User\Desktop\Website\cincailah
git init
git add .
git commit -m "Cincailah app"
git remote add origin https://github.com/YOUR_USERNAME/cincailah.git
git push -u origin main
```

On VPS:

```bash
cd /var/www
sudo git clone https://github.com/YOUR_USERNAME/cincailah.git
sudo chown -R $USER:$USER cincailah
cd cincailah
```

**Option B — SCP from Windows**

From PowerShell (project folder):

```powershell
scp -r . user@YOUR_VPS_IP:/var/www/cincailah
# Exclude node_modules and .next when copying if needed
```

Then on VPS:

```bash
cd /var/www/cincailah
npm install
```

---

## 4. Environment variables on VPS

```bash
cd /var/www/cincailah
nano .env
```

Add (replace with your real values):

```env
DATABASE_URL="postgresql://cincailah_user:YOUR_PASSWORD@localhost:5432/cincailah?schema=public"
SESSION_SECRET="GENERATE_A_LONG_RANDOM_STRING_AT_LEAST_32_CHARS"
NODE_ENV="production"
```

Save (Ctrl+O, Enter, Ctrl+X).

Generate a secret:

```bash
openssl rand -hex 32
```

Paste the output as `SESSION_SECRET`.

---

## 5. Build and run with PM2

```bash
cd /var/www/cincailah
npx prisma generate
npx prisma db push
npm run build
pm2 start npm --name "cincailah" -- start
pm2 save
pm2 startup
# Run the command it prints so PM2 starts on reboot
```

Check:

```bash
pm2 status
pm2 logs cincailah
curl http://localhost:3000
```

You should get HTML back.

---

## 6. Nginx reverse proxy

```bash
sudo nano /etc/nginx/sites-available/cincailah
```

Paste (replace `yourdomain.com`):

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Allow up to 6 MB uploads (app limit is 5 MB; leave headroom for multipart overhead)
    client_max_body_size 6M;

    # Long-cache user uploads (restaurant photos, avatars, group covers)
    # These are written by the app into /var/www/cincailah/public/uploads/
    location /uploads/ {
        alias /var/www/cincailah/public/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
        access_log off;
        try_files $uri =404;
    }

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Forward large request bodies (uploads) without buffering to disk
        proxy_request_buffering off;
    }
}
```

> **Note on the `/uploads/` block:** it's optional but **highly recommended**. It lets Nginx serve user-uploaded images directly from disk (bypassing Node.js), which is ~10–50× faster and frees Node to handle API calls. Update `alias` to wherever your app lives on the VPS (e.g. `/home/deploy/cincailah/public/uploads/`).

Enable and test:

```bash
sudo ln -s /etc/nginx/sites-available/cincailah /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

Open **http://yourdomain.com** (or http://YOUR_VPS_IP) in a browser.

---

## 7. SSL with Let’s Encrypt (recommended)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Follow prompts. After that, use **https://yourdomain.com**.

---

## 8. Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

---

## 9. User uploads (restaurant photos, avatars, group covers)

The app writes uploaded images to `public/uploads/` on the VPS filesystem:

```
public/uploads/
├── restaurants/     # restaurant photos (1200px WebP)
├── avatars/         # user profile pictures (400×400 WebP)
└── group-covers/    # group cover images (1600px WebP)
```

All uploads are auto-resized with `sharp` to WebP for tiny file sizes (~50–200 KB per image).
Max upload size is **5 MB** (enforced in the app + Nginx `client_max_body_size 6M`).

### Make sure Node can write to the uploads folder

```bash
cd /var/www/cincailah       # or wherever your app lives
mkdir -p public/uploads/restaurants public/uploads/avatars public/uploads/group-covers
sudo chown -R deploy:deploy public/uploads    # change 'deploy' to your app's user
sudo chmod -R 755 public/uploads
```

### Backing up uploads

Uploads aren't in Postgres — back them up separately:

```bash
# Add to your nightly cron:
tar -czf /backups/uploads_$(date +%Y%m%d).tar.gz /var/www/cincailah/public/uploads/
find /backups -name 'uploads_*.tar.gz' -mtime +30 -delete
```

### Surviving deploys (important)

If you `git pull` or re-upload the project, **don't wipe `public/uploads/`**. Options:

- **Simplest:** Just `git pull` — uploads are `.gitignore`'d, so they stay put.
- **Rsync:** Use `rsync --exclude='public/uploads'` when syncing new code.
- **Symlink:** Move `public/uploads` to `/var/data/cincailah-uploads` and symlink it back — uploads survive complete redeploys.

---

## Quick reference after deploy

| Task | Command |
|------|--------|
| View logs | `pm2 logs cincailah` |
| Restart app | `pm2 restart cincailah` |
| Stop app | `pm2 stop cincailah` |
| Update app (after git pull) | `npm install && npx prisma generate && npx prisma db push && npm run build && pm2 restart cincailah` |
| DB backup | `pg_dump -U cincailah_user cincailah > backup_$(date +%Y%m%d).sql` |
| Uploads backup | `tar -czf uploads_$(date +%Y%m%d).tar.gz public/uploads/` |

---

## Summary

- **Local:** Install Node + PostgreSQL → create DB/user → set `.env` → `npm install` → `prisma generate` → `prisma db push` → `npm run dev` → test with the checklist.
- **VPS:** Install Node, PostgreSQL, Nginx, PM2 → create DB/user → upload project → set `.env` → build → PM2 start → Nginx proxy → (optional) SSL and firewall.

For more detail, see **README.md** and **DEPLOYMENT_CHECKLIST.md** in the project.
