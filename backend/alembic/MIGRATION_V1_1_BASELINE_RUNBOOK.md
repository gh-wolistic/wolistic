# Migration Reset Runbook (v1.1 Baseline)

Last updated: 2026-03-21

This runbook defines the safe way to squash historical Alembic migrations into one v1.1 baseline.

Use this only during a controlled release window.

## Goal

- Keep current schema exactly as-is.
- Stop replaying old seed-heavy migration history on fresh environments.
- Preserve safe rollout for existing databases through `alembic stamp`.

## Preconditions

- Code freeze for migration-related changes.
- Backups are available for every target database.
- All environments are already at the same head revision.

Current expected head for this repository: `f577acd2eef7`.

## High-Level Strategy

1. Create one new baseline migration for the current schema (v1.1).
2. Keep old migration files available in an archive path.
3. Stamp existing databases to v1.1 (do not replay baseline DDL there).
4. Use `alembic upgrade head` on fresh databases.

## Step-by-Step

### Fast Path (Disposable Data Only)

Use this path only if all current database data can be deleted.

1. Backup is optional but still recommended.
2. Reset database schema to empty state.
3. Generate v1.1 baseline from empty schema.
4. Validate app start and tests.
5. Archive legacy revisions and continue from v1.1 only.

This avoids creating a separate shadow branch/project.

### 1) Verify current migration state

```powershell
cd backend
docker compose run --rm backend alembic current
docker compose run --rm backend alembic heads
```

All target environments must report a consistent head before continuing.

If you are taking the disposable-data fast path, you may skip head parity checks across environments and focus only on your active environment.

### 2) Create v1.1 baseline revision

```powershell
cd backend
docker compose run --rm backend alembic revision --autogenerate -m "v1_1_baseline_schema"
```

Then manually edit the generated file:

- Keep schema objects only (tables, constraints, indexes, functions/triggers needed by runtime).
- Remove non-essential seed inserts.
- Keep idempotent guards only where required for safety.

Disposable-data fast path sequence:

1. Reset public schema to empty:

	- `DROP SCHEMA public CASCADE;`
	- `CREATE SCHEMA public;`
	- re-enable required extensions (for example `pgcrypto`) if needed.

2. Run autogenerate baseline from empty schema.
3. Review baseline for runtime-critical SQL objects not represented in ORM metadata (functions/triggers/policies/extensions) and add them manually.

Safety gate:

- If autogenerate output contains many `drop_*` operations for existing runtime tables/indexes, discard that file and do not proceed.
- Generate baseline from a shadow/fresh database path instead of diffing against a drifted live schema.

Recommended shadow DB method:

1. Provision an empty shadow database.
2. Point `DATABASE_URL` to shadow DB.
3. Temporarily use full historical chain to `upgrade head` into shadow.
4. Generate baseline candidate from model metadata and validate manually.
5. Switch back to primary environment before archive/stamp steps.

### 3) Archive legacy revisions

Create an archive folder and move pre-v1.1 files there in one commit.

Recommended folder name:

- `backend/alembic/versions_archive_pre_v1_1/`

Do not delete archive files immediately. Keep them for audit and rollback context.

Use provided script after baseline file is created:

```powershell
powershell -ExecutionPolicy Bypass -File backend/alembic/scripts/v1_1_archive_legacy_versions.ps1 -BaselineFileName <v1_1_baseline_file.py>
```

### 4) Stamp existing databases to v1.1

For databases that already contain the schema, run:

```powershell
cd backend
docker compose run --rm backend alembic stamp <v1_1_revision_id>
```

Do not run full upgrade-from-empty on existing production databases for this transition.

Helper script:

```powershell
powershell -ExecutionPolicy Bypass -File backend/alembic/scripts/v1_1_stamp_existing_db.ps1 -RevisionId <v1_1_revision_id>
```

### 5) Validate

Validate both paths:

- Existing DB path: app boot + tests + key API health checks after stamp.
- Fresh DB path: `alembic upgrade head` + app boot + tests.

### 6) Release tagging

After successful validation in all environments:

- Create git tag: `v1.1.0`
- Update architecture/status docs indicating migration baseline reset date.

## Risk Checklist

- Ensure custom SQL objects (functions/triggers/extensions/policies) are present in baseline.
- Ensure `alembic_version` is correct after stamping.
- Ensure seed data has moved to explicit scripts if still needed.
- Ensure no environment is left on a pre-v1.1 head.

## Rollback Approach

- Restore database from backup snapshot.
- Revert migration-chain commit if required.
- Re-run previous known-good release.

## Notes for This Repository

- Historical revisions include seed-heavy files and one-time data transitions.
- Keep schema migrations and seed operations separate after v1.1.
- New seed workflows should live under `backend/app/scripts` or dedicated SQL seed scripts.

## Repository Assets Added for This Rollout

- `backend/alembic/MIGRATION_V1_1_MANIFEST.md`
- `backend/alembic/BASELINE_MIGRATION_TEMPLATE.py`
- `backend/alembic/scripts/v1_1_archive_legacy_versions.ps1`
- `backend/alembic/scripts/v1_1_stamp_existing_db.ps1`
- `backend/alembic/scripts/v1_1_preflight_check.ps1`