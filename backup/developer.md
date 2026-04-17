# Cincailah — Full Product & Engineering Documentation

**Project Name:** Cincailah (formerly LunchDecider)
**Version:** MVP → v1
**Platform:** Web (Desktop-first, mobile responsive later)
**Timezone:** Asia/Kuala_Lumpur (+08)
**Primary Stack:** Next.js + TailwindCSS + TypeScript + PostgreSQL

## 0. Purpose
Cincailah solves the ultimate, daily, soul-crushing office question:
*“Makan mana?”* (Where to eat?)

**Common issues it solves:**
* The endless “I don't know, you choose” debate.
* Repeating the same restaurants (Food Fatigue).
* Budget disagreements (*Dompet Status*).
* Dietary restrictions being ignored.
* Decision fatigue.

**Core Objectives:**
* Decide lunch in under 30 seconds.
* Avoid recent repeats automatically ("Anti-Repeat" Protection).
* Respect dietary and budget constraints.
* Reduce friction and social pressure with a fun, punchy, "whatever" attitude.

---

## 1. System Architecture

### 1.1 Recommended Stack
* **Frontend & Backend:** Next.js (App Router), TailwindCSS, TypeScript
* **Database:** PostgreSQL (Supabase or Neon recommended)
* **Authentication:** * MVP: Nickname-only + Makan Code (local storage)
    * v1: Supabase Auth (magic link email)
* **Hosting:** Vercel (Application + API routes), Supabase (Database + optional Auth)

---

## 2. Core Functional Modules

### 2.1 Group System
* **Create group:** "Start a Makan Group"
* **Join group:** via "Makan Code" (instead of generic join code)
* **Group Rules:**
    * `noRepeatDays` (default: 7) — "Anti-Repeat" logic
    * `maxReroll` (default: 2) — Prevents infinite indecision.
    * `decisionModeDefault` ("you_pick" | "we_fight")

### 2.2 Restaurant Management
All restaurants are group-scoped.
* **Fields:**
    * `name`
    * `cuisine_tags` (JSON array)
    * `vibe_tags` (JSON array - e.g., "Aircond", "Cheap", "Atas")
    * `price_min` / `price_max`
    * `halal` (boolean)
    * `veg_options` (boolean)
    * `walk_minutes` (integer)
    * `maps_url` (string)
    * `is_active` (boolean)

### 2.3 Decision Engine
**Decision Modes:**
1.  **"You Pick" (Smart Random):** Filtered random selection with repeat protection.
2.  **"We Fight" (Vote Mode):** 3–5 randomly selected options → majority wins.

### 2.4 History System
Tracks: `decision_date`, `constraints_used`, `chosen_restaurant`, `mode_used`.
Used for: Anti-Repeat logic, Analytics, Future fairness scoring.

---

## 3. Database Design (PostgreSQL)

### 3.1 `users`
* `id` UUID PRIMARY KEY
* `display_name` TEXT
* `created_at` TIMESTAMP

### 3.2 `groups`
* `id` UUID PRIMARY KEY
* `name` TEXT
* `makan_code` TEXT UNIQUE
* `created_by` UUID
* `no_repeat_days` INT DEFAULT 7
* `max_reroll` INT DEFAULT 2
* `decision_mode_default` TEXT
* `created_at` TIMESTAMP

### 3.3 `restaurants`
* `id` UUID PRIMARY KEY
* `group_id` UUID
* `name` TEXT
* `cuisine_tags` JSONB
* `vibe_tags` JSONB
* `price_min` INT
* `price_max` INT
* `halal` BOOLEAN
* `veg_options` BOOLEAN
* `walk_minutes` INT
* `maps_url` TEXT
* `is_active` BOOLEAN DEFAULT true
* `created_by` UUID
* `created_at` TIMESTAMP
* *(Indexes: group_id, is_active, walk_minutes)*

### 3.4 `lunch_decisions`
* `id` UUID PRIMARY KEY
* `group_id` UUID
* `decision_date` DATE
* `mode_used` TEXT
* `chosen_restaurant_id` UUID
* `constraints_used` JSONB
* `created_by` UUID
* `created_at` TIMESTAMP

*(Note: `group_members`, `decision_options`, and `votes` tables remain standard mapping tables as per original spec).*

---

## 4. "Anti-Repeat" Algorithm (Smart Random)

1.  Retrieve active restaurants by group.
2.  Apply filters: *Dompet Status* (Budget), Tags, Halal/Veg, Walk time.
3.  **Anti-Repeat Protection:** Exclude restaurants selected within `today - no_repeat_days`.
4.  Execute: `SELECT * FROM candidates ORDER BY RANDOM() LIMIT 1;`
5.  If no candidates remain: Prompt user to relax constraints (e.g., *"Wah, so picky. Lower your standards or reset filters."*)

---

## 5. UI / UX Design Specification

### 5.1 Design Principles & Micro-copy
* **Speed-first:** Punchy interactions.
* **Tone:** Casual, Malaysian/Singlish, slightly cheeky but highly functional.
    * *Decide Button:* `Cincai lah!`
    * *Reroll:* `Don't want, again.`
    * *No Repeats:* `Ate Already (7 days)`
    * *Loading States:* "Asking the boss...", "Checking wallet...", "Consulting grandma..."

### 5.2 Design System (Color Palette)
Shifted from corporate cool tones to warm, appetizing colors.

| Purpose | Color | Hex Code |
| :--- | :--- | :--- |
| **Primary (Sambal)** | Red | `#DC2626` |
| **Accent (Mamak)** | Yellow | `#FACC15` |
| **Success (Pandan)** | Green | `#10B981` |
| **Background** | Off-White | `#F8FAFC` |
| **Text** | Dark Slate | `#0F172A` |

---

## 6. Information Architecture & User Flows

### Home (Decide)
├── Quick Filters (Dompet, Type, Walk)
├── Main Action: "Cincai lah!" Button
├── Loading Animation (Cycling text)
├── Decision Result Card (Map pin, Tags, "Let's Go" & "Don't want" buttons)
└── Recently Makan (Mini history)

### First-Time Flow
Visit App → Enter Name & Create Group → Get "Makan Code" → Add 3+ Restaurants → Press "Cincai lah!" → Lunch Selected.

### "We Fight" Flow (Vote Mode)
Start Vote → Generate 3–5 Options → Share Link to Group → Members Vote (Yes/No) → Tally Results → Winner Selected.

---

## 7. Data Strategy & Extensions
* **Phase 1 — Crowdsourced:** Admin manually adds local spots.
* **Phase 2 — Hybrid:** "Import Nearby" via Google Places API (deduplicate by name/distance).
* **Future Extensions:** Slack/Telegram Bot integration (e.g., typing `/cincai` in group chat), Fairness rotation scoring, "Vibe" filtering.

## 8. Success Metrics
* Decision time < 30 seconds.
* Re-roll rate < 40%.
* Reduced repeat rate (Zero "I'm bored of this" complaints).
* Weekly active users > 60%.