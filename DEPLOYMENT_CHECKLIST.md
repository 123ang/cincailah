# ✅ Cincailah — Deployment Checklist

Use this checklist to deploy Cincailah to your VPS.

---

## 📋 Pre-Deployment Checklist

### **Local Setup (Already Done ✅)**
- [x] Next.js project scaffolded
- [x] Prisma schema created
- [x] All pages & components built
- [x] API routes implemented
- [x] Production build tested
- [x] TypeScript errors fixed

---

## 🚀 VPS Deployment Steps

### **1. Prepare VPS Environment**

- [ ] SSH into your VPS
- [ ] Install Node.js 18+
  ```bash
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt install -y nodejs
  node --version  # Should be v18+
  ```
- [ ] Install PostgreSQL
  ```bash
  sudo apt update
  sudo apt install postgresql postgresql-contrib
  sudo systemctl start postgresql
  sudo systemctl enable postgresql
  ```
- [ ] Install Nginx
  ```bash
  sudo apt install nginx
  sudo systemctl start nginx
  sudo systemctl enable nginx
  ```
- [ ] Install PM2 globally
  ```bash
  sudo npm install -g pm2
  ```

---

### **2. Set Up PostgreSQL Database**

- [ ] Create PostgreSQL user
  ```bash
  sudo -u postgres createuser --interactive --pwprompt
  # Username: cincailah_user
  # Password: [choose strong password]
  ```
- [ ] Create database
  ```bash
  sudo -u postgres createdb cincailah --owner=cincailah_user
  ```
- [ ] Test connection
  ```bash
  psql -U cincailah_user -d cincailah -h localhost
  # If successful, type \q to quit
  ```
- [ ] Note down your DATABASE_URL:
  ```
  postgresql://cincailah_user:YOUR_PASSWORD@localhost:5432/cincailah?schema=public
  ```

---

### **3. Upload Project to VPS**

**Option A: Git (Recommended)**
- [ ] Initialize git repo locally
  ```bash
  git init
  git add .
  git commit -m "Initial commit"
  ```
- [ ] Push to GitHub (make sure .env is in .gitignore!)
- [ ] Clone on VPS
  ```bash
  cd /var/www
  git clone https://github.com/yourusername/cincailah.git
  cd cincailah
  ```

**Option B: SCP/SFTP**
- [ ] Compress project (exclude node_modules, .next)
  ```bash
  tar -czf cincailah.tar.gz . --exclude=node_modules --exclude=.next
  ```
- [ ] Upload to VPS
  ```bash
  scp cincailah.tar.gz user@your-vps-ip:/var/www/
  ssh user@your-vps-ip
  cd /var/www
  tar -xzf cincailah.tar.gz
  ```

---

### **4. Configure Environment Variables**

- [ ] Create `.env` file on VPS
  ```bash
  cd /var/www/cincailah
  nano .env
  ```
- [ ] Add configuration:
  ```env
  DATABASE_URL="postgresql://cincailah_user:YOUR_PASSWORD@localhost:5432/cincailah?schema=public"
  SESSION_SECRET="$(openssl rand -hex 32)"
  NODE_ENV="production"
  ```
- [ ] Save and exit (Ctrl+O, Ctrl+X)
- [ ] Verify file exists:
  ```bash
  cat .env
  ```

---

### **5. Install Dependencies & Build**

- [ ] Install npm packages
  ```bash
  npm install
  ```
- [ ] Generate Prisma client
  ```bash
  npx prisma generate
  ```
- [ ] Push database schema
  ```bash
  npx prisma db push
  ```
- [ ] Build production
  ```bash
  npm run build
  ```
- [ ] Verify build succeeded (look for "Compiled successfully")

---

### **6. Start Application with PM2**

- [ ] Start with PM2
  ```bash
  pm2 start npm --name "cincailah" -- start
  ```
- [ ] Check status
  ```bash
  pm2 status
  pm2 logs cincailah
  ```
- [ ] Save PM2 config
  ```bash
  pm2 save
  ```
- [ ] Enable startup on boot
  ```bash
  pm2 startup
  # Copy and run the command it outputs
  ```
- [ ] Test locally on VPS
  ```bash
  curl http://localhost:3000
  # Should return HTML
  ```

---

### **7. Configure Nginx Reverse Proxy**

- [ ] Create Nginx config
  ```bash
  sudo nano /etc/nginx/sites-available/cincailah
  ```
- [ ] Add configuration:
  ```nginx
  server {
      listen 80;
      server_name yourdomain.com www.yourdomain.com;

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
      }
  }
  ```
- [ ] Save and exit
- [ ] Enable site
  ```bash
  sudo ln -s /etc/nginx/sites-available/cincailah /etc/nginx/sites-enabled/
  ```
- [ ] Test Nginx config
  ```bash
  sudo nginx -t
  ```
- [ ] Reload Nginx
  ```bash
  sudo systemctl reload nginx
  ```
- [ ] Test domain
  ```bash
  curl http://yourdomain.com
  # Should return HTML
  ```

---

### **8. Set Up SSL with Let's Encrypt**

- [ ] Install Certbot
  ```bash
  sudo apt install certbot python3-certbot-nginx
  ```
- [ ] Obtain SSL certificate
  ```bash
  sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
  ```
- [ ] Follow prompts (enter email, agree to terms)
- [ ] Test auto-renewal
  ```bash
  sudo certbot renew --dry-run
  ```
- [ ] Verify HTTPS works
  ```bash
  curl https://yourdomain.com
  ```

---

### **9. Configure Firewall**

- [ ] Allow SSH
  ```bash
  sudo ufw allow OpenSSH
  ```
- [ ] Allow HTTP & HTTPS
  ```bash
  sudo ufw allow 'Nginx Full'
  ```
- [ ] Enable firewall
  ```bash
  sudo ufw enable
  ```
- [ ] Check status
  ```bash
  sudo ufw status
  ```

---

### **10. Final Testing**

- [ ] Visit https://yourdomain.com in browser
- [ ] Create a test group
- [ ] Add 3-5 restaurants
- [ ] Test decision engine (spin the wheel!)
- [ ] Check history page
- [ ] Test settings page
- [ ] Verify all navigation works
- [ ] Test on mobile browser
- [ ] Check PM2 logs for errors
  ```bash
  pm2 logs cincailah --lines 50
  ```

---

## 🔧 Maintenance Commands

### **View Logs**
```bash
pm2 logs cincailah
pm2 logs cincailah --lines 100
```

### **Restart App**
```bash
pm2 restart cincailah
```

### **Stop App**
```bash
pm2 stop cincailah
```

### **Delete App**
```bash
pm2 delete cincailah
```

### **Update Code**
```bash
cd /var/www/cincailah
git pull origin main
npm install
npx prisma generate
npx prisma migrate deploy  # or db push
npm run build
pm2 restart cincailah
```

### **Database Backup**
```bash
pg_dump -U cincailah_user cincailah > backup_$(date +%Y%m%d).sql
```

### **Database Restore**
```bash
psql -U cincailah_user cincailah < backup_20260315.sql
```

---

## 🐛 Troubleshooting

**App won't start:**
- Check logs: `pm2 logs cincailah`
- Check .env file exists
- Verify DATABASE_URL is correct
- Test database connection: `psql -U cincailah_user -d cincailah`

**502 Bad Gateway:**
- Check app is running: `pm2 status`
- Check Nginx config: `sudo nginx -t`
- Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`

**Database errors:**
- Verify PostgreSQL is running: `sudo systemctl status postgresql`
- Check database exists: `psql -U cincailah_user -l`
- Re-push schema: `npx prisma db push`

**SSL errors:**
- Check certificate status: `sudo certbot certificates`
- Renew manually: `sudo certbot renew`

---

## ✅ Deployment Complete!

Once all checkboxes are ticked, your Cincailah app is live! 🎉

**Next Steps:**
1. Share the URL with your team
2. Create your first group
3. Add restaurants
4. Start deciding lunch in under 30 seconds!

---

Need help? Check:
- `README.md` — Full documentation
- `BUILD_SUMMARY.md` — Build overview
- `QUICKSTART.md` — Quick start guide
