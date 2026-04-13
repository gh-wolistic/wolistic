# Docs Index

Last updated: 2026-04-12

This folder contains architecture and execution documents for the Wolistic monorepo.

## Current Platform Notes

- Auth UX baseline:
	- Header Sign In/Get Started uses modal auth.
	- Non-header protected flows use sidebar auth.
- Holistic-team and booking flows preserve navigation context across auth.
- Active migration chain: 13 migrations after v1.1 baseline (`f577acd2eef7`).
- Dashboard v2 (Elite shell) is the active partner dashboard surface.
- Coins, subscriptions, activities, classes, and clients are all backend-live.

## Canonical Docs

- `AI_DONT_DELETE_ARCHITECTURE.md`: Current architecture and API boundary map
- `AI_DONT_DELETE_PROJECT_STATUS_VISION.md`: Current status, near-term direction, and vision
- `AI_DONT_DELETE_TODO_WORKLIST.md`: Single canonical active worklist
- `AI_DONT_DELETE_COMMANDS.md`: Development and operational command reference
- `AI_DONT_DELETE_OWNERSHIP_MATRIX.md`: Frontend/backend ownership split
- `high_priority_refactor_todo.md`: Dedicated performance refactor backlog

## Program and Strategy Docs

- `AI_DONT_DELETE_HOLISTIC_PLAN.md`
- `AI_DONT_DELETE_HOLISTIC_PLAN_MVP_V1.md`
- `AI_DONT_DELETE_PIVOT_TO_MIN_MVP.md`

## Feature Specifications and UX Reviews

- `reviews-ui-specification.md`: Reviews system spec for v2 dashboard
- `ux-review-messaging-2026-04-13.md`: UX audit of messaging real-time and layout issues

## Migration Runbooks

- `../backend/alembic/MIGRATION_V1_1_BASELINE_RUNBOOK.md`

## Migration Scripts

- `../backend/alembic/scripts/v1_1_archive_legacy_versions.ps1`
- `../backend/alembic/scripts/v1_1_stamp_existing_db.ps1`
- `../backend/alembic/scripts/v1_1_preflight_check.ps1`

## Conventions

- Do not create new ad-hoc todo files in this folder.
- Update `AI_DONT_DELETE_TODO_WORKLIST.md` for all new tasks.
- Keep architecture and status docs synchronized with code changes.
