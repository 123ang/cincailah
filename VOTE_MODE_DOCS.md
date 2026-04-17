# "We Fight" Vote Mode — Feature Documentation

## Overview

The "We Fight" vote mode allows groups to vote on restaurant choices democratically. Instead of a single random pick, the system:

1. Generates 3-5 restaurant options based on filters
2. Creates a 15-minute voting window
3. Group members vote for their favorites
4. The option with the most votes wins
5. Results are shown automatically when voting ends

---

## How It Works

### 1. Start a Vote

**From the main decide page:**
1. Toggle to **"We Fight"** mode (instead of "You Pick")
2. Set your filters (budget, tags, walk time, etc.)
3. Click **"Cincai lah!"**
4. System picks 3-5 random restaurants matching your filters + anti-repeat rules

**Vote session created with:**
- **Decision ID** — unique identifier
- **Expiration time** — 15 minutes from creation
- **Candidate options** — 3-5 restaurants

---

### 2. Voting Interface

**Features:**
- ✅ **Live vote counts** — Updates every 3 seconds automatically
- ⏱️ **Countdown timer** — Shows minutes:seconds remaining
- 📊 **Vote bars** — Visual progress bars showing vote percentage
- 👑 **Leading indicator** — Border highlights the current leader
- ✓ **Your votes** — Green checkmark on options you voted for
- 📤 **Shareable link** — Copy link to share with group members

**How to vote:**
- Click **+** button to vote for a restaurant
- Click **✓** button to remove your vote
- You can vote for multiple options
- Votes can be changed until timer expires

---

### 3. Vote Expiration

**After 15 minutes:**
- Voting automatically closes
- System calculates winner (most votes)
- Winner is saved to database
- Results page is shown

**If it's a tie:**
- First option with max votes wins (by order added)

---

### 4. Results Page

**Shows:**
- 👑 **Winner badge** — Green gradient banner
- Restaurant details (name, tags, price, walk time)
- **"Let's Go!"** button — Opens Google Maps if URL available
- Decision is saved to history

---

## Technical Implementation

### Database Schema

**Existing tables used:**
- `lunch_decisions` — Stores the vote session
  - `mode_used = 'we_fight'`
  - `constraintsUsed` JSON includes `expiresAt` timestamp
- `decision_options` — 3-5 restaurant candidates
- `votes` — Individual user votes (yes/no per option)

**Vote record structure:**
```typescript
{
  id: string,
  decisionOptionId: string,
  userId: string,
  vote: 'yes' | 'no',
  createdAt: Date
}
```

---

### API Endpoints

#### `POST /api/vote/start`
**Start a new vote session**

Request:
```json
{
  "groupId": "uuid",
  "filters": {
    "budgetFilter": "kering",
    "selectedTags": ["Halal", "Aircond"],
    "walkTimeMax": 10,
    "halal": true,
    "vegOptions": false
  }
}
```

Response:
```json
{
  "success": true,
  "decisionId": "uuid",
  "expiresAt": "2026-03-15T12:30:00Z"
}
```

Errors:
- `400` — Not enough restaurants (need at least 3)
- `401` — Not authenticated

---

#### `GET /api/vote/[decisionId]`
**Get vote status and results**

Response:
```json
{
  "decision": {
    "id": "uuid",
    "decisionOptions": [
      {
        "id": "uuid",
        "restaurant": { /* restaurant data */ },
        "votes": [
          { "user": { "displayName": "Ahmad" }, "vote": "yes" }
        ]
      }
    ]
  },
  "expiresAt": "2026-03-15T12:30:00Z",
  "isExpired": false,
  "winner": null
}
```

---

#### `POST /api/vote/[decisionId]`
**Cast or update a vote**

Request:
```json
{
  "optionId": "uuid",
  "vote": "yes"
}
```

Response:
```json
{
  "success": true
}
```

Errors:
- `400` — Voting has ended
- `401` — Not authenticated

---

## User Flow

### Complete Voting Flow

```
[Main Page] 
    ↓ Toggle "We Fight" mode + set filters
    ↓ Click "Cincai lah!"
    ↓
[Vote Start Screen]
    ↓ Click "Start Voting"
    ↓ API creates decision + options
    ↓
[Voting Page]
    ↓ Shows 3-5 restaurant cards
    ↓ Live timer counting down
    ↓ Users click + to vote
    ↓ Vote counts update every 3s
    ↓ [15 minutes pass]
    ↓
[Results Page]
    ↓ Shows winner with crown
    ↓ "Let's Go!" button
    ↓ Saved to history
```

---

## Features

### Real-Time Updates
- **Polling interval:** 3 seconds
- Updates vote counts while voting is active
- Shows when new members vote
- Automatically transitions to results when expired

### Timer Logic
- **Duration:** 15 minutes (900 seconds)
- **Format:** `MM:SS` (e.g., `14:32`)
- **When expired:** Shows "Ended"
- **Client-side countdown:** Updates every second

### Anti-Repeat Protection
- Same logic as "You Pick" mode
- Restaurants picked within `noRepeatDays` are excluded
- Ensures variety in vote options

### Vote Persistence
- Votes are upserted (update if exists, create if not)
- User can change vote multiple times before expiration
- One vote per user per option

---

## Usage Examples

### Example 1: Quick Vote
```
1. User sets budget to "Kering" (<RM10)
2. Enables "Halal" filter
3. Switches to "We Fight" mode
4. Clicks "Cincai lah!"
5. System picks 3 restaurants: Mamak Corner, Warung Pak Ali, Restoran Mahbub
6. 4 group members vote
7. Mamak Corner gets 3 votes, wins
8. Results shown after 15 minutes (or when all voted)
```

### Example 2: Tie Scenario
```
Options:
  - Sushi Mentai: 2 votes
  - Domino's Pizza: 2 votes
  - Nasi Kandar Pelita: 1 vote

Winner: Sushi Mentai (first option with max votes)
```

---

## Configuration

### Vote Duration
**Default:** 15 minutes

To change, edit in `/api/vote/start/route.ts`:
```typescript
const expiresAt = new Date();
expiresAt.setMinutes(expiresAt.getMinutes() + 15); // Change this value
```

### Number of Options
**Default:** 3-5 restaurants (dynamically picks based on available candidates)

To change, edit in `/api/vote/start/route.ts`:
```typescript
const numOptions = Math.min(
  candidates.length, 
  Math.max(3, Math.min(5, candidates.length))
);
// Change min (3) and max (5) here
```

### Polling Frequency
**Default:** 3 seconds

To change, edit in `VotePageClient.tsx`:
```typescript
const interval = setInterval(() => {
  fetchVoteData();
}, 3000); // Change this value (milliseconds)
```

---

## Testing Checklist

- [ ] Start vote with filters
- [ ] Verify 3-5 options are shown
- [ ] Countdown timer works
- [ ] Vote for an option (+ button)
- [ ] Remove vote (✓ button)
- [ ] Vote counts update in real-time
- [ ] Leading option has green border
- [ ] Copy share link works
- [ ] Timer expires after 15 minutes
- [ ] Winner is calculated correctly
- [ ] Results page shows winner
- [ ] Decision saved to history
- [ ] Multiple users can vote simultaneously
- [ ] Votes persist after page refresh

---

## Future Enhancements

**Potential improvements:**
1. **Push notifications** — Alert when voting ends
2. **Early close** — End vote when all members voted
3. **Vote weight** — Admin votes count double
4. **Ranked voting** — Pick 1st, 2nd, 3rd choice
5. **Anonymous voting** — Hide who voted for what
6. **Custom duration** — Let admin set vote window
7. **Veto power** — Admin can remove options
8. **Automatic scheduling** — Daily vote at 11:30 AM

---

## Troubleshooting

**"Not enough restaurants to start voting"**
- Need at least 3 active restaurants
- Check filters aren't too restrictive
- Add more restaurants to the group

**Vote counts not updating**
- Check network connection
- Verify polling is active (3s interval)
- Check browser console for errors

**Timer shows incorrect time**
- Client time might be out of sync
- Server determines actual expiration
- Refresh page to resync

**Winner not showing after expiration**
- Wait for next poll (up to 3 seconds)
- Refresh page manually
- Check browser console for errors

---

## Code References

**Key files:**
- `/api/vote/start/route.ts` — Start vote session
- `/api/vote/[decisionId]/route.ts` — Get status + cast votes
- `/app/group/[groupId]/vote/page.tsx` — Vote page wrapper
- `/components/VotePageClient.tsx` — Main vote UI
- `/components/DecidePage.tsx` — Mode toggle + filters

---

Built with ❤️ for democratic lunch decisions! 🗳️🍛
