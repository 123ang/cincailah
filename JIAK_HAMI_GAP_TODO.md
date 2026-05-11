# Jiak Hami / CincaiLah Flowchart Alignment To-do

This file now tracks only items that appear in `jiak_hami_flowchart_documentation.md`. Extra production/mobile/Sentry polish has been removed from this flowchart gap list.

## Completed Alignment

- [x] **Cuisine + vibe filter logic**
  - Cuisine tags use OR inside the cuisine group.
  - Vibe tags use OR inside the vibe group.
  - If both groups are selected, restaurants must match at least one cuisine **and** at least one vibe.

- [x] **You Pick permission**
  - Backend enforces You Pick for the group owner only.
  - Frontend disables You Pick for non-owners and defaults them to We Fight.

- [x] **Reroll max 3**
  - You Pick now returns a fixed max reroll of 3.
  - Group schema default changed from 2 to 3.
  - Group settings validation no longer accepts values other than 3.

- [x] **Same spot can win again**
  - Existing toggle is retained because it maps to the flowchart decision node.

- [x] **We Fight: each person votes once only**
  - Backend now removes any previous vote by the same user in the same decision before saving the new vote.
  - Frontend copy now says users vote once for one pick.

- [x] **Tie handling**
  - Server now randomly chooses one winner from tied top-vote options.

- [x] **Add spot required tags**
  - Frontend requires at least one cuisine tag and one vibe tag.
  - Backend create/update endpoints reject empty cuisine/vibe tag lists.

- [x] **Starter pack after group creation**
  - Existing group creation flow already asks whether to add the starter pack or skip.

## Removed From This Flowchart To-do

These were extra implementation/product polish items, not flowchart requirements:

- Mobile TypeScript cleanup.
- Mobile repo hygiene.
- Sentry production polish.
- Email fan-out documentation.
- Vote window documentation.
- Nearby / distance filter follow-up.
- Walk-time filter follow-up.
- Generic production monitoring tasks.

## Verification

- [x] Run web typecheck (`npx tsc --noEmit`).
- [x] Run web build (`npm run build`).
- [x] Commit final aligned state.
