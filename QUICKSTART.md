# Quick Start Guide

## 🚀 Get Started in 3 Minutes

### 1. Set up the project

```bash
chmod +x setup.sh
./setup.sh
```

Or manually:

```bash
npm install
npx prisma generate
```

### 2. Configure your database

Edit `.env` and update the `DATABASE_URL`:

```env
DATABASE_URL="postgresql://YOUR_USER:YOUR_PASSWORD@YOUR_HOST:5432/cincailah?schema=public"
```

### 3. Create database tables

```bash
npx prisma db push
```

### 4. Start the server

```bash
npm run dev
```

Visit **http://localhost:3000** 🎉

---

## 🎯 What to Try First

1. **Create your first group** — Enter your name and click "Start a Makan Group"
2. **Add restaurants** — Navigate to "Spots" and add 3-5 local restaurants
3. **Set filters** — Choose budget, cuisine, walk time on the main page
4. **Click "Cincai lah!"** — Watch the roulette wheel spin! 🎰

---

## 🐛 Troubleshooting

**"Can't connect to database"**
- Make sure PostgreSQL is running
- Check DATABASE_URL in `.env`
- Verify database exists: `createdb cincailah`

**"Prisma generate failed"**
- Delete `node_modules` and run `npm install` again

**"Session error"**
- Make sure SESSION_SECRET is set in `.env`

---

## 📖 Full Documentation

See [README.md](./README.md) for complete setup instructions, deployment guide, and architecture details.

## 🔗 Quick Links

- **Prisma Studio** (Database GUI): `npm run db:studio`
- **Check migrations**: `npx prisma migrate status`
- **Reset database**: `npx prisma migrate reset` (⚠️ deletes all data)

---

Built with ❤️ and hunger 🍛
