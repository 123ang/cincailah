# Vote Mode Flow Diagram

## User Journey

```
┌─────────────────────────────────────────────────────────────────┐
│                         MAIN PAGE                               │
│  • Set filters (budget, tags, walk time)                       │
│  • Toggle to "We Fight" mode                                   │
│  • Click "Cincai lah!"                                         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    VOTE START SCREEN                            │
│  • Shows "Start Group Voting" button                           │
│  • Explains 15-minute timer                                    │
│  • Click "Start Voting 🚀"                                     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    [API: POST /api/vote/start]
                              ↓
                    Creates lunch_decision record
                    Creates 3-5 decision_options
                    Sets expiresAt = now + 15 min
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      VOTING PAGE                                │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Timer: 14:32                   Votes cast: 3             │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌──────────────────────────── Option 1 ────────────────────┐  │
│  │ 🍛 Nasi Kandar Pelita                              [+]   │  │
│  │ Mamak · RM8-15 · 5 min                                   │  │
│  │ ████████████░░░░░░░░  3 votes                            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────── Option 2 ────────────────────┐  │
│  │ 🍱 Sushi Mentai                                    [✓]   │  │
│  │ Japanese · RM15-25 · 8 min                               │  │
│  │ ████████░░░░░░░░░░░░  2 votes                            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────── Option 3 ────────────────────┐  │
│  │ 🥘 The Chicken Rice Shop                           [+]   │  │
│  │ Local · RM12-18 · 3 min                                  │  │
│  │ ████░░░░░░░░░░░░░░░░  1 vote                             │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  📤 Share link: [Copy]                                         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
            [Polling: GET /api/vote/[id] every 3 seconds]
                              ↓
         Updates vote counts + timer automatically
                              ↓
              [User clicks + or ✓ to vote]
                              ↓
                [API: POST /api/vote/[id]]
                Creates/updates vote record
                              ↓
            [Refresh data, show updated counts]
                              ↓
                [15 minutes pass...]
                              ↓
                  Timer reaches 00:00
                              ↓
                System calculates winner
              (option with most votes)
                              ↓
         Updates lunch_decision.chosenRestaurantId
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      RESULTS PAGE                               │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  🎉 The people have spoken!                              │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────── WINNER ─────────────────────────────┐ │
│  │                                                            │ │
│  │                       👑                                   │ │
│  │                                                            │ │
│  │               Nasi Kandar Pelita                           │ │
│  │               Mamak · Nasi Kandar                          │ │
│  │                                                            │ │
│  │   ✅ Halal    ❄️ Aircond    💨 Cheap                       │ │
│  │                                                            │ │
│  │   Budget: RM8-15        Walk: 5 min 🚶                    │ │
│  │                                                            │ │
│  │            [ Let's Go! 📍 ]                                │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                   Saved to history
                              ↓
                    User clicks "Let's Go!"
                              ↓
                   Opens Google Maps (if URL set)
```

---

## Technical Flow

```
CLIENT                          SERVER                      DATABASE
  │                               │                            │
  │ POST /api/vote/start          │                            │
  ├──────────────────────────────>│                            │
  │                               │ Get active restaurants     │
  │                               ├───────────────────────────>│
  │                               │<───────────────────────────┤
  │                               │                            │
  │                               │ Apply filters + anti-repeat│
  │                               │ Pick 3-5 random            │
  │                               │                            │
  │                               │ CREATE lunch_decision      │
  │                               ├───────────────────────────>│
  │                               │<───────────────────────────┤
  │                               │                            │
  │                               │ CREATE decision_options    │
  │                               ├───────────────────────────>│
  │                               │<───────────────────────────┤
  │                               │                            │
  │<──────────────────────────────┤                            │
  │ { decisionId, expiresAt }     │                            │
  │                               │                            │
  │                               │                            │
  │ GET /api/vote/[id] (poll)     │                            │
  ├──────────────────────────────>│                            │
  │                               │ GET decision + options     │
  │                               ├───────────────────────────>│
  │                               │<───────────────────────────┤
  │                               │ GET all votes              │
  │                               ├───────────────────────────>│
  │                               │<───────────────────────────┤
  │<──────────────────────────────┤                            │
  │ { decision, votes, isExpired }│                            │
  │                               │                            │
  │ [Every 3 seconds, repeat GET] │                            │
  │                               │                            │
  │                               │                            │
  │ POST /api/vote/[id]           │                            │
  │ { optionId, vote: "yes" }     │                            │
  ├──────────────────────────────>│                            │
  │                               │ UPSERT vote                │
  │                               ├───────────────────────────>│
  │                               │<───────────────────────────┤
  │<──────────────────────────────┤                            │
  │ { success: true }             │                            │
  │                               │                            │
  │                               │                            │
  │ [Timer expires]               │                            │
  │                               │                            │
  │ GET /api/vote/[id]            │                            │
  ├──────────────────────────────>│                            │
  │                               │ Check if expired           │
  │                               │ Calculate winner           │
  │                               │ UPDATE lunch_decision      │
  │                               │   SET chosenRestaurantId   │
  │                               ├───────────────────────────>│
  │                               │<───────────────────────────┤
  │<──────────────────────────────┤                            │
  │ { isExpired: true, winner }   │                            │
  │                               │                            │
```

---

## Database State Changes

### Initial State (Before Vote)
```
lunch_decisions: (empty)
decision_options: (empty)
votes: (empty)
```

### After POST /api/vote/start
```
lunch_decisions:
  id: abc-123
  groupId: group-1
  modeUsed: "we_fight"
  chosenRestaurantId: NULL
  constraintsUsed: { expiresAt: "2026-03-15T12:30:00Z" }
  createdBy: user-1
  
decision_options:
  id: opt-1, decisionId: abc-123, restaurantId: rest-1
  id: opt-2, decisionId: abc-123, restaurantId: rest-2
  id: opt-3, decisionId: abc-123, restaurantId: rest-3
  
votes: (empty)
```

### After Users Vote
```
votes:
  id: vote-1, decisionOptionId: opt-1, userId: user-1, vote: "yes"
  id: vote-2, decisionOptionId: opt-1, userId: user-2, vote: "yes"
  id: vote-3, decisionOptionId: opt-2, userId: user-3, vote: "yes"
  id: vote-4, decisionOptionId: opt-1, userId: user-4, vote: "yes"
```

### After Vote Expires (Winner Calculated)
```
lunch_decisions:
  id: abc-123
  chosenRestaurantId: rest-1  ← UPDATED (was NULL)
  
Vote count:
  opt-1 (rest-1): 3 votes ← WINNER
  opt-2 (rest-2): 1 vote
  opt-3 (rest-3): 0 votes
```

---

## Timer Logic

```javascript
// Client-side countdown
const now = new Date().getTime();
const expiry = new Date(expiresAt).getTime();
const diff = expiry - now;

if (diff <= 0) {
  setTimeLeft('Ended');
  setIsExpired(true);
  fetchResults(); // Get winner
} else {
  const minutes = Math.floor(diff / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
}

// Updates every 1 second
```

---

## Winner Calculation

```javascript
// On server when vote expires
const voteCounts = decision.decisionOptions.map((option) => ({
  optionId: option.id,
  restaurantId: option.restaurantId,
  count: option.votes.filter((v) => v.vote === 'yes').length,
}));

// Find max votes
const maxVotes = Math.max(...voteCounts.map((v) => v.count));

// Pick first option with max votes (handles ties)
const winningOption = voteCounts.find((v) => v.count === maxVotes);

// Update database
await prisma.lunchDecision.update({
  where: { id: decisionId },
  data: { chosenRestaurantId: winningOption.restaurantId },
});
```

---

## Real-Time Updates

```
User A's Browser              Server              User B's Browser
      │                         │                         │
      │ GET /api/vote/[id]      │                         │
      ├────────────────────────>│                         │
      │<────────────────────────┤                         │
      │ { votes: [] }           │                         │
      │                         │                         │
      │                         │      GET /api/vote/[id] │
      │                         │<────────────────────────┤
      │                         │────────────────────────>│
      │                         │      { votes: [] }      │
      │                         │                         │
      │ POST vote "yes"         │                         │
      ├────────────────────────>│                         │
      │ ✅                      │                         │
      │                         │                         │
      │                         │ [3 seconds later]       │
      │                         │      GET /api/vote/[id] │
      │                         │<────────────────────────┤
      │                         │────────────────────────>│
      │                         │ { votes: [User A: yes] }│
      │                         │                         │
      │                         │   User B sees update! ✅ │
      │                         │                         │
```

---

This diagram shows the complete flow from start to finish!
