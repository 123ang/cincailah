# Changelog — Cincailah

What changed in this project, newest first. Claude Code, Codex and OpenClaw all read this file and add to it.

**Adding an entry:** in the same commit as the change, under today's `## YYYY-MM-DD` heading (create it at the top if missing).
One line per change: - **Type:** what changed and why it matters (<short hash>; <branch if not default>; <who: user / Claude / Codex / OpenClaw>).
Types: Added, Changed, Fixed, Removed, Security, Deployed, Decision, Docs.
`Deployed` names the target and the evidence. `Decision` attributes it to the user. Don't record tests as passing unless they were run; write "checks: <what ran>".

## In progress (not on `main`)

Nothing in progress.

## 2026-10-24
- **Docs:** added the shared project changelog and rewrote the brief from repository, Git, and supplied runtime evidence (uncommitted; `main`; who: Codex).

## 2026-10-12
- **Changed:** aligned group decision and voting flows with the flowchart; added localization, sound mute, filters, server tie resolution, and early vote finalization (`19001c5`; who: Claude).
- **Security:** updated Next.js, Nodemailer, and PostCSS dependency versions to address advisories (`660c3b0`).

## 2026-07 (summary)
- **Fixed:** adjusted vote-page behavior and added active vote-session reuse (`8b61811`, `b6c5e3a`).
- **Changed:** simplified web/mobile session and registration flows (`1deaed0`).

## 2026-06 (summary)
- **Security:** added vote resolution, request validation and rate-limit safeguards across auth and API routes; added token-version checks for mobile sessions (`2f38bd1`).

## 2026-05 (summary)
- **Changed:** refreshed restaurant, decision, landing, and mobile winner experiences (`899d1a4`, `ad7d9c1`).
- **Added:** user account deletion and related privacy controls (`f5e0b45`).
- **Changed:** aligned group decision and vote rules with the flowchart (`2ee5867`).
- **Fixed:** hardened deploy health checks and mobile QA/release configuration (`e58d7e6`, `d3ead23`).
- **Docs:** added mobile roadmap and App Store/TestFlight guidance; the roadmap records guest mode, web parity, release hardening, and device QA as complete (`d4ba849`, `dfee540`).

## 2026-04 (summary)
- **Added:** initial web app, authentication, restaurants, group and solo decision flows, voting, and database schema (`725b7df`, `0ce46d3`, `bb857bc`).
- **Changed:** standardized the VPS Next.js port and added a deploy script (`85a0fbc`, `367fa17`).
- **Security:** added build-phase environment handling and runtime safeguards (`33e1680`).
- **Removed:** GitHub Actions, preview deployment, and uptime monitoring workflows (`7e25c22`).
