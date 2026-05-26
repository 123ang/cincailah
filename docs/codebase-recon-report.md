# Codebase Recon Report

Generated on 2026-05-21.

## Repo Vitals

- Age: 2026-04-17 to 2026-05-18
- Commits: 29
- Branches: main, origin/main
- Analysis window: all time
- Contributors: 1 active contributor, Ang Jin Sheng

## Health Check

The web app and mobile app both pass the available verification checks:

- `npm run lint`
- `npx tsc --noEmit`
- `npm run build`
- `cd mobile && npm run lint`
- `cd mobile && npx tsc --noEmit`

No project test files were found outside dependencies, so the main gap is automated behavioral coverage for API validation, auth/access rules, and decision logic.

## Code Hotspots

Most-changed files in git history:

1. `package.json`
2. `package-lock.json`
3. `components/RouletteSpinner.tsx`
4. `docs/VPS_DEPLOY_BEGINNER.md`
5. `components/SettingsPage.tsx`
6. `app/api/decide/route.ts`
7. `lib/schemas.ts`
8. `components/DecidePage.tsx`
9. `components/AddRestaurantForm.tsx`
10. `prisma/schema.prisma`

## Bug Magnets

Files touched by commits matching `fix`, `bug`, or `broken`:

- `lib/session.ts`
- `lib/schemas.ts`
- `lib/group-role.ts`
- `lib/group-access.ts`
- `lib/decision-service.ts`
- `docs/README.md`
- `components/SettingsPage.tsx`
- `app/page.tsx`
- `app/group/[groupId]/page.tsx`
- `app/api/vote/start/route.ts`

## High-Risk Areas

Files that appear in both hotspots and bug magnets:

- `components/SettingsPage.tsx`
- `lib/schemas.ts`

Nearby risk areas from manual review:

- `app/api/vote/[decisionId]/route.ts` includes full `user: true` records in API output. Because `User` contains sensitive fields such as `passwordHash`, `resetToken`, and verification tokens, this should use an explicit `select`.
- `app/group/[groupId]/page.tsx` and `app/group/[groupId]/settings/page.tsx` also query members with `user: true`. These are server-rendered, but explicit `select` is still safer and clearer.
- `app/api/restaurants/route.ts` manually parses restaurant creation input even though `CreateRestaurantSchema` exists.
- `app/api/ratings/route.ts` checks restaurant access but does not verify that an optional `decisionId` belongs to an accessible decision in the same group.

## Momentum

- 2026-04: 23 commits
- 2026-05: 6 commits

The repo is young and compact, with most implementation work happening in April. No revert, hotfix, emergency, or rollback commits were found.

## Recommendations

1. Replace all `user: true` relation includes with explicit `select` fields.
2. Route restaurant create/update through Zod schemas instead of manual coercion.
3. Validate rating `decisionId` ownership and group consistency.
4. Add focused tests for auth/access rules, decision filtering, rerolls, voting, and restaurant validation.
5. Keep an eye on `components/RouletteSpinner.tsx`, `components/SettingsPage.tsx`, `app/api/decide/route.ts`, and `lib/schemas.ts` as the main complexity centers.
