# Jiak Hami / CincaiLah Gap & To-do List

This document summarizes the current gaps between `jiak_hami_flowchart_documentation.md` and the implemented CincaiLah/Jiak Hami web + mobile codebase.

## Current Health

- [x] Web app build passes.
- [ ] Mobile typecheck passes.
  - Current issue: `mobile/src/lib/guestMigration.ts` has TypeScript errors caused by JS helper type inference.
- [ ] Mobile repo is clean/committed.
  - Current issue: `mobile/` has many uncommitted changes and deleted starter files.
- [x] Flowchart mostly matches current app behavior.
- [ ] All flowchart business rules are enforced in code.

## Gaps vs Flowchart

### 1. You Pick Permission

**Flowchart rule:**

- “You Pick” is for the group owner only.

**Current app behavior:**

- `/api/decide` checks group membership only.
- Any group member can trigger You Pick if they call the endpoint.

**Gap:**

- Backend does not enforce owner-only or admin-only You Pick.

---

### 2. Add Spot Required Tags

**Flowchart rule:**

- Cuisine tag: at least 1 required.
- Vibe tag: at least 1 required.

**Current app behavior:**

- Backend schema currently allows empty arrays:

```ts
cuisineTags: z.array(z.string()).default([])
vibeTags: z.array(z.string()).default([])
```

**Gap:**

- Restaurant validation is too loose.

---

### 3. Reroll Rule Clarity

**Flowchart rule:**

- Reroll max is 3 times.

**Current app behavior:**

- App uses `group.maxReroll`.
- Group settings allow configurable rerolls, currently up to 10.

**Gap:**

- Need decide whether reroll should be fixed at 3 or configurable with default 3.

---

### 4. Same Spot Can Win Again

**Flowchart rule:**

- User decides whether the same spot can win again.

**Current app behavior:**

- Backend supports this through `allowRepeatPicks`.
- Frontend has a repeat toggle.

**Gap:**

- UI wording may be unclear and should better match the flowchart language.

---

### 5. We Fight Voting Rule

**Flowchart rule:**

- Each person can vote once only.

**Current app behavior:**

- Database has unique constraint on `[decisionOptionId, userId]`.
- This guarantees one vote per option per user.
- Need confirm if users can vote on more than one option in the same decision.

**Gap:**

- If “vote once only” means one total vote per decision, current enforcement may be too loose.

---

### 6. Tie Handling

**Flowchart rule:**

- If there is a tie, randomly pick one winner from the tied spots.

**Current app behavior:**

- Needs verification in vote result/final decision logic.

**Gap:**

- Tie-break behavior may be missing or undocumented.

---

### 7. Mobile TypeScript

**Current issue:**

- `mobile/src/lib/guestMigration.ts` fails typecheck.
- Cause: `getJson(..., [])` is inferred badly because `guestStorage.js` is JavaScript.

**Gap:**

- Mobile cannot pass TypeScript verification yet.

---

### 8. Mobile Repo Hygiene

**Current issue:**

- `mobile/` has many uncommitted changes, deleted starter files, and new app files.

**Gap:**

- Need stabilize, verify, and commit the mobile project state before more major changes.

---

### 9. Sentry Production Polish

**Current issue:**

- Web build passes but warns that Sentry setup is incomplete:
  - Missing global error handler.
  - Missing/incomplete instrumentation file.

**Gap:**

- Production monitoring setup is incomplete.

---

### 10. Flowchart Documentation Drift

**Current issue:**

- Documentation says:
  - You Pick owner only.
  - Max reroll 3.
- App currently has:
  - Admin/member roles.
  - Configurable reroll count.

**Gap:**

- Need either update documentation to match app behavior or change app behavior to match documentation.

## Recommended To-do

### Phase 1 — Rule Enforcement

- [ ] Decide You Pick permission:
  - [ ] Owner only.
  - [ ] Owner + admin.
- [ ] Enforce You Pick permission in `/api/decide`.
- [ ] Hide/disable You Pick in frontend for non-authorized members.
- [ ] Require at least 1 cuisine tag in backend schema.
- [ ] Require at least 1 vibe tag in backend schema.
- [ ] Add frontend validation message for missing cuisine/vibe tags.
- [ ] Decide reroll policy:
  - [ ] Fixed max 3.
  - [ ] Group configurable with default 3.
- [ ] Make “same spot can win again” wording clearer.

### Phase 2 — Voting Correctness

- [ ] Inspect vote API/result logic.
- [ ] Confirm if “one vote only” means:
  - [ ] One vote per option.
  - [ ] One vote per whole decision.
- [ ] If needed, enforce one total vote per decision.
- [ ] Confirm tie behavior.
- [ ] Add random tie-break if missing.

### Phase 3 — Mobile Stability

- [ ] Fix `mobile/src/lib/guestMigration.ts` TypeScript error.
- [ ] Run `npx tsc --noEmit` in `mobile/`.
- [ ] Run Expo lint if available.
- [ ] Check login/guest flow assumptions.
- [ ] Commit stable mobile changes.

### Phase 4 — Production Polish

- [ ] Add Sentry `instrumentation.ts`.
- [ ] Add global error handler.
- [ ] Re-run web build.
- [ ] Update `jiak_hami_flowchart_documentation.md` to match final behavior.
- [ ] Commit final state.

## Recommendation

- Use **owner + admin** for You Pick instead of owner only. This is more practical for real groups.
- Keep reroll configurable, but default it to **3**.
- Enforce **one total vote per decision** if the intended rule is “each person can vote once only.”
- Update `jiak_hami_flowchart_documentation.md` after implementation so the documentation matches the real product.
