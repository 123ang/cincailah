# Cincailah — project brief

Snapshot: **2026-10-24 MYT**, written by Codex from a full repo read, reviewed by Claude. Dated orientation, not a live dashboard: recheck Git and runtime before status claims. History lives in [CHANGELOG.md](CHANGELOG.md).

## What it is

Cincailah (“Makan Mana?”) is a Malaysian food-choice app for deciding where to eat alone or with a group. Members manage restaurant spots, filter options, spin a solo or group pick, and vote on group choices. The repo contains a Next.js website and an Expo mobile app. The source does not state a client or separate project owner. ([README.md](README.md), [mobile/app.json](mobile/app.json))

## Where things are

- Local checkout: `/Users/123ang/Desktop/Websites/cincailah`; branch `main`, current commit `5b59e7a` (`git branch`; facts 2026-10-24).
- GitHub: [`123ang/cincailah`](https://github.com/123ang/cincailah), public, default branch `main` (facts 2026-10-24).
- Runtime copy: `~/server-runtime/projects/cincailah`, commit `19001c5` on `main`; Docker container `server-restore-cincailah-1` was reported running (facts 2026-10-24). Commit `5b59e7a` adds only agent documentation, so the runtime commit includes the current application source (git `show 5b59e7a`; facts 2026-10-24).
- Public URL: [https://cincailah.suntzutechnologies.com](https://cincailah.suntzutechnologies.com) returned HTTPS 200 when checked on 2026-10-24; this only confirms a response (facts 2026-10-24).

## Technology

| Layer | Technology | Version | Source |
|---|---|---|---|
| Web framework | Next.js App Router | `^15.5.27` | [package.json](package.json) |
| Web UI | React, React DOM | `^19.0.0` | [package.json](package.json) |
| Language | TypeScript | `^5.7.3` | [package.json](package.json) |
| Styling | Tailwind CSS, PostCSS | `^3.4.17`, `^8.5.29` | [package.json](package.json) |
| Database and ORM | PostgreSQL, Prisma | PostgreSQL version not pinned; Prisma `^5.22.0` | [prisma/schema.prisma](prisma/schema.prisma), [package.json](package.json) |
| Web auth | iron-session; mobile JWT | `^8.0.3`; jsonwebtoken `^9.0.3` | [package.json](package.json), [lib/session.ts](lib/session.ts), [lib/mobile-auth.ts](lib/mobile-auth.ts) |
| Mobile | Expo, React Native, React Navigation | Expo `~54.0.34`; React Native `0.81.5`; Navigation `^7.1.8` | [mobile/package.json](mobile/package.json) |
| Email | SMTP via Nodemailer or Resend | Nodemailer `^10.1.0`; Resend `^6.12.0` | [package.json](package.json), [lib/email.ts](lib/email.ts) |
| Monitoring and analytics | Sentry, PostHog | Sentry Next.js `^10.49.0`; PostHog Node `^5.29.2` | [package.json](package.json), [instrumentation.ts](instrumentation.ts), [lib/analytics.ts](lib/analytics.ts) |
| Image processing | Jimp | `^1.6.1` | [package.json](package.json), [lib/upload.ts](lib/upload.ts) |
| Payments | No payment integration found | — | [package.json](package.json), `app/api/` |
| Runtime / deploy | Docker runtime observed; PM2 VPS script documented | Runtime image/version unknown | facts 2026-10-24; [deploy.sh](deploy.sh), [docs/VPS_DEPLOY_BEGINNER.md](docs/VPS_DEPLOY_BEGINNER.md) |

## Architecture

- `app/` holds Next.js pages, layouts, and API route handlers for authentication, groups, restaurants, decisions, voting, comments, ratings, uploads, and reminders.
- `components/` contains the web interface, including solo and group decision flows, restaurant management, voting, account forms, and navigation.
- `lib/` contains shared business logic, access checks, web sessions and mobile JWTs, Zod schemas, Prisma access, logging, email, localization, rate limiting, and upload helpers.
- `prisma/schema.prisma` defines PostgreSQL models for users, groups, spots, decisions, votes, favorites, comments, ratings, push subscriptions, and rate-limit buckets.
- `mobile/App.js` wires React Navigation and deep links. `mobile/src/screens/` contains guest, account, group, restaurant, decision, and vote screens. The mobile API client sends bearer JWTs to the web API.
- Mobile guest favorites, history, and reminders use `AsyncStorage`; the app can offer to migrate favorites and solo history after sign-in (`mobile/src/lib/guestStorage.js`, `mobile/src/lib/guestMigration.ts`).
- `public/` contains brand assets, food images, web-app metadata, a service worker, and the runtime upload location. Uploaded files are stored on the server filesystem by `lib/upload.ts`.
- Email delivery uses configured SMTP or Resend; Sentry and PostHog are optional integrations (`lib/email.ts`, `lib/analytics.ts`, `instrumentation.ts`).

## Run, test, deploy

Commands below are documented in [package.json](package.json), [README.md](README.md), [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md), and [docs/VPS_DEPLOY_BEGINNER.md](docs/VPS_DEPLOY_BEGINNER.md); they were not run for this documentation update.

- Web setup: `npm install`; configure `.env` using [`.env.example`](.env.example); run `npx prisma generate` and `npx prisma db push`.
- Web development: `npm run dev` (binds `127.0.0.1:3001`).
- Automated tests: `npm test` (`node --test tests/*.test.js`). Test files are present; no tests were run for this documentation update.
- Web lint and build: `npm run lint` and `npm run build`. These commands are documented, not verified here; `npm run lint` maps to `next lint`.
- Local health helper: `scripts/check-local-health.sh` checks required environment variables, Prisma/database access, and `/api/health`; documented, not run.
- VPS deploy script: `./deploy.sh` pulls, installs, generates Prisma, pushes the schema by default, builds, restarts PM2, then checks health. It has `--no-git`, `--no-db`, and `--no-install` options. Documented, not verified as the active deployment path; review the database and restart effects before use.
- Mobile development: `cd mobile && npm install && npm run start`; mobile lint is `cd mobile && npm run lint`.
- Mobile release commands are in `mobile/package.json` and [mobile/eas.json](mobile/eas.json), including `npm run build:ios`, `npm run testflight`, and `npm run build:apk:prod`; documented, not run or verified here.

## Status

### Live (verified)

- A Docker container named `server-restore-cincailah-1` was reported running on this Mac on 2026-10-24. The public site returned HTTPS 200 on that date (facts 2026-10-24).
- Runtime source is at `19001c5`; local `main` is `5b59e7a`. The only commit between them changes `AGENTS.md`, `CLAUDE.md`, and `PROJECT_BRIEF.md`, not application source (`git show 5b59e7a`; facts 2026-10-24).
- The supplied facts do not record a current `/api/health` result, a business-flow check, or the deployment date. The HTTP 200 is not proof that those flows work.

### Built, not verified live

- Web source implements account registration/login, email verification and reset, solo decisions, groups, restaurant management, favorites, history, group voting, activity/comments/ratings, reminders, and account deletion (`app/`, `components/`, `lib/`; [prisma/schema.prisma](prisma/schema.prisma)).
- Group decision source applies budget, cuisine, vibe, halal/vegetarian and favorites filters, plus an anti-repeat window (`lib/decision-service.ts`). Vote resolution and early finalization are server-side (`lib/vote-finalize.ts`, `app/api/vote/[decisionId]/finalize/route.ts`).
- Source includes web English, Bahasa Malaysia, and Chinese translations (`lib/i18n.ts`, `lib/locales/`).
- Mobile source includes guest and authenticated navigation, groups, solo picks, favorites, local reminders, history, voting, profile/restaurant editing, and deep links (`mobile/App.js`, `mobile/src/`). The repository does not prove a currently distributed store build.

### In progress

Nothing in progress. The only listed remote feature branch, `origin/codex-redesign-fast-decide-and-fixes`, is fully contained in `main`; no open pull requests were listed (facts 2026-10-24; `git branch -avv`).

### Planned / backlog

- [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) §11 records deferred work: extracting structured fields from `constraintsUsed`, mobile offline solo-history retry, Expo push sending, and a gradual mobile TypeScript migration. These are documentation-listed proposals, not active work.
- [docs/MOBILE_QA_CHECKLIST.md](docs/MOBILE_QA_CHECKLIST.md) is an unchecked device and production checklist. [docs/MOBILE_ROADMAP.md](docs/MOBILE_ROADMAP.md) marks its April 2026 mobile parity tasks and real-device QA complete; the supplied facts do not include newer device evidence.
- [JIAK_HAMI_GAP_TODO.md](JIAK_HAMI_GAP_TODO.md) marks the flowchart-alignment items complete. Its checked typecheck/build entries are historical documentation, not a current run.

### Known issues and unknowns

- Runtime deployment date, exact container image, current API health, database health today, email delivery, mobile distribution status, and end-to-end user journeys were not confirmed by the supplied facts.
- [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) has stale statements: production rate limiting uses PostgreSQL by default (`lib/ratelimit.ts`), `tokenVersion` validation/invalidation is implemented (`lib/mobile-auth.ts`, `lib/session.ts`, `app/api/auth/logout-all/route.ts`), and test files exist under `tests/` despite the doc saying there are no unit tests.
- `docs/README.md` points to historical root documents that are absent from this checkout, including `BUILD_SUMMARY.md`, `ROADMAP.md`, and `V2_PLAN.md`. `mobile/README.md` describes the generic Expo Router starter, but the app uses React Navigation in `mobile/App.js`.
- No application tests, builds, installs, servers, browsers, or network requests were run for this documentation task.

## Decisions and rules

- The group flow follows [jiak_hami_flowchart_documentation.md](jiak_hami_flowchart_documentation.md): You Pick is owner-only; cuisine and vibe use OR within each filter group and AND across groups; rerolls cap at three; each member has one vote; ties are decided server-side. The flowchart TODO marks these alignments complete ([JIAK_HAMI_GAP_TODO.md](JIAK_HAMI_GAP_TODO.md); implementation at `19001c5`).
- The mobile roadmap records these user choices: production API origin is `https://cincailah.suntzutechnologies.com`; ask before uploading guest data; guest mode and reminders remain local; activity, comments, and ratings stay web-only ([docs/MOBILE_ROADMAP.md](docs/MOBILE_ROADMAP.md)).
- Follow [AGENTS.md](AGENTS.md): keep live, implemented, planned, and unverified separate; add a dated changelog entry with authorized work; this documentation request does not authorize deployment or scope changes.
- [README.md](README.md), [QUICKSTART.md](QUICKSTART.md), [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md), and [LOGIN_AND_ACCESS.md](LOGIN_AND_ACCESS.md) are named as primary user docs by [docs/README.md](docs/README.md). The flowchart and mobile roadmap are the product/workflow references; deployment instructions do not prove the current runtime path.

## Read next

- [README.md](README.md)
- [docs/README.md](docs/README.md)
- [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)
- [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)
- [LOGIN_AND_ACCESS.md](LOGIN_AND_ACCESS.md)
- [jiak_hami_flowchart_documentation.md](jiak_hami_flowchart_documentation.md)
- [JIAK_HAMI_GAP_TODO.md](JIAK_HAMI_GAP_TODO.md)
- [docs/MOBILE_ROADMAP.md](docs/MOBILE_ROADMAP.md)
- [docs/MOBILE_QA_CHECKLIST.md](docs/MOBILE_QA_CHECKLIST.md)

## Keeping this brief current

Before answering, compare this snapshot with current Git, source and runtime. If they disagree, say so; don't repeat a stale note as fact. After authorized work: add a CHANGELOG.md entry in the same commit, and update the affected facts here with the date and the evidence or checks actually run. Don't keep a competing status summary in any assistant's personal memory.
