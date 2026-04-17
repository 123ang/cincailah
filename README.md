# Cincailah — Makan Mana? 🍛

The "I don't know, you choose" killer. Decide lunch in under 30 seconds.

## Tech Stack

- **Frontend & Backend:** Next.js 15 (App Router), React 19, TypeScript
- **Styling:** TailwindCSS with custom design tokens
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** Cookie-based sessions (iron-session)
- **Deployment:** VPS (self-hosted)

## Features

✅ **Onboarding** — Enter name, create or join group with Makan Code
✅ **Restaurant Management** — Add, view, search restaurants with tags & filters
✅ **"You Pick" Decision Engine** — Smart random with anti-repeat protection
✅ **Roulette Wheel Spinner** — Interactive 3-second animation with restaurant names
✅ **"We Fight" Vote Mode** — Group voting with 15-minute timer and live results
✅ **History & Analytics** — View past decisions, most-picked restaurants
✅ **Group Settings** — Manage members, rules, Makan Code

## Setup Instructions

### 1. Prerequisites

- Node.js 18+ installed
- PostgreSQL database (local or VPS)

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Database

Edit `.env` file and update your PostgreSQL connection string:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
SESSION_SECRET="your-secure-random-string-at-least-32-characters-long"
```

**Generate a secure session secret:**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Initialize Database

Run Prisma migrations to create tables:

```bash
npm run db:generate
npm run db:push
```

Or use migrations (recommended for production):

```bash
npx prisma migrate dev --name init
```

### 5. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Database Schema

- `users` — User accounts (nickname-only)
- `groups` — Makan groups with settings
- `group_members` — User-group relationships
- `restaurants` — Restaurant data (group-scoped)
- `lunch_decisions` — Decision history
- `decision_options` — Vote options (for "We Fight" mode)
- `votes` — User votes

## Key Algorithms

### Anti-Repeat Protection

```typescript
// Excludes restaurants picked within last N days (default: 7)
const cutoffDate = new Date();
cutoffDate.setDate(cutoffDate.getDate() - group.noRepeatDays);

const recentRestaurants = await prisma.lunchDecision.findMany({
  where: {
    groupId,
    decisionDate: { gte: cutoffDate },
  },
});

candidates = candidates.filter(
  (r) => !recentRestaurants.map((d) => d.chosenRestaurantId).includes(r.id)
);
```

### Budget Filters (Dompet Status)

- **Kering** (Broke): < RM10
- **OK lah** (Moderate): RM10-20
- **Belanja** (Treat): RM20+

## Deployment (VPS)

### 1. Build Production

```bash
npm run build
```

### 2. Set Up PM2

```bash
npm install -g pm2
pm2 start npm --name "cincailah" -- start
pm2 save
pm2 startup
```

### 3. Configure Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 4. SSL with Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## Environment Variables

```env
# Database
DATABASE_URL="postgresql://..."

# Session (generate with: openssl rand -hex 32)
SESSION_SECRET="..."

# Node Environment
NODE_ENV="production"
```

## Project Structure

```
cincailah/
├── app/
│   ├── api/           # API routes
│   │   ├── auth/      # Authentication endpoints
│   │   ├── restaurants/ # Restaurant CRUD
│   │   └── decide/    # Decision engine
│   ├── group/         # Group pages
│   │   └── [groupId]/
│   │       ├── page.tsx        # Main decide page
│   │       ├── decide/         # Roulette spinner
│   │       ├── restaurants/    # Restaurant list & add
│   │       ├── history/        # Decision history
│   │       ├── settings/       # Group settings
│   │       └── vote/           # Vote mode (coming soon)
│   ├── layout.tsx     # Root layout
│   ├── page.tsx       # Onboarding
│   └── globals.css    # Global styles
├── components/        # React components
├── lib/               # Utilities
│   ├── prisma.ts     # Prisma client
│   ├── session.ts    # Session management
│   └── utils.ts      # Helper functions
├── prisma/
│   └── schema.prisma # Database schema
├── public/           # Static assets
└── package.json
```

## Scripts

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to DB
npm run db:migrate   # Create migration
npm run db:studio    # Open Prisma Studio
```

## Design System

| Purpose | Color | Hex |
|---------|-------|-----|
| Primary (Sambal) | Red | `#DC2626` |
| Accent (Mamak) | Yellow | `#FACC15` |
| Success (Pandan) | Green | `#10B981` |
| Background | Off-White | `#F8FAFC` |
| Text | Dark Slate | `#0F172A` |

## License

MIT

## Support

For issues or questions, please open an issue on GitHub.

---

**Built with ❤️ and hunger in Malaysia 🇲🇾**
