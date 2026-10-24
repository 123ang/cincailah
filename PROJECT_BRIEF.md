# Cincailah — shared project brief

Verified source snapshot: **2026-10-23 21:16 MYT**. This is a dated orientation, not a live health dashboard or full code audit.

## Purpose and project location

Food-choice product with solo/group restaurant selection, voting and history, built with Next.js and Prisma/PostgreSQL.

Source checkout on this Mac: `/Users/123ang/Desktop/Websites/cincailah`. Active branch at inspection: `main`; HEAD: `19001c52392b`. Recheck Git and the actual worktree before answering current-status questions.

## Read next

- [README.md](README.md)
- [docs/README.md](docs/README.md)
- [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)
- [JIAK_HAMI_GAP_TODO.md](JIAK_HAMI_GAP_TODO.md)
- [jiak_hami_flowchart_documentation.md](jiak_hami_flowchart_documentation.md)

Existing AGENTS.md/CLAUDE.md rules and canonical design/monetization documents remain authoritative for policy. This brief does not grant deployment, migration, deletion or messaging permission.

## Implemented source evidence

- [app/api](app/api): Auth, restaurants, groups, decisions, votes and related API routes.
- [lib/decision-service.ts](lib/decision-service.ts): Decision logic.
- [lib/vote-finalize.ts](lib/vote-finalize.ts): Vote finalization implementation.
- [mobile](mobile): Related mobile client source.

These paths were inspected for source presence/structure. No application tests were rerun for this documentation setup; do not describe them as passing now.

## Observed runtime and verification limits

Observed `server-restore-cincailah-1` running with a source mount at `/Users/123ang/server-runtime/projects/cincailah`. README VPS/PM2 instructions are not proof of the currently active deployment path. Public and group-voting flows were not tested.

## Planned work, uncertainties and decisions

Use current source to reconcile flowchart and gap-list claims. Mobile QA, deployment and product validation require their own checks; do not present checklist items as delivered.

## Keeping this brief current

Before a project answer, compare this snapshot with current Git, relevant source and actual runtime evidence. If they disagree, state the discrepancy; do not repeat a stale note as fact. After authorized project work, update only the affected implemented/planned/runtime facts here, with the date, file/command evidence and checks actually run. Preserve unknowns and mark proposals as proposals. Personal chat memories are historical context, not a substitute for current shared evidence. For status answers, cover implemented source, verified deployment, remaining/planned work and unverified items; give a separate opinion only after those facts.
