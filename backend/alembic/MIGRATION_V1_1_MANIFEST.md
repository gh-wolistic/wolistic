# Migration v1.1 Manifest

Last updated: 2026-03-21

This manifest defines how the current Alembic history is treated during the v1.1 baseline reset.

## Current Head

- Current chain head before reset: `20260321_0024`

## Legacy Revisions to Archive (Pre-v1.1)

- `20260305_0001_create_users_table.py`
- `20260306_0002_add_auth_trigger_for_users.py`
- `20260307_0003_seed_professional_tables.py`
- `20260312_0004_create_booking_flow_tables.py`
- `20260313_0005_add_payment_provider_tracking.py`
- `20260313_0006_add_user_onboarding_columns.py`
- `20260313_0007_create_user_favourites_table.py`
- `20260313_0008_add_structured_offer_fields_to_professional_services.py`
- `20260313_0009_create_wolistic_content_tables.py`
- `20260314_0010_seed_extended_professionals.py`
- `20260314_0011_add_external_links_to_wolistic_content.py`
- `20260314_0012_add_image_url_to_wellness_services.py`
- `20260315_0013_create_expert_review_requests_table.py`
- `20260316_0014_add_user_status_column.py`
- `20260317_0015_bootstrap_professionals_on_user_insert.py`
- `20260320_0016_add_professional_geo_columns.py`
- `20260320_0017_create_professional_service_areas_table.py`
- `20260320_0018_create_professional_boost_impressions_table.py`
- `20260320_0019_create_professional_featured_index_table.py`
- `20260320_0020_create_holistic_team_tables.py`
- `20260321_0021_default_initial_consultation_service.py`
- `20260321_0022_reactivate_engine_generated_teams.py`
- `20260321_0023_add_profile_completeness_and_perf_indexes.py`
- `20260321_0024_guard_professionals_user_id_constraints.py`

## New Active Revisions After Reset

Expected structure after reset:

- `versions/<v1_1_baseline_revision>.py`
- Future post-v1.1 revisions only

## Seed/Data Policy After Reset

- Historical seed inserts must not be replayed through schema baseline migrations.
- Seed and bootstrap data should move to explicit scripts under `backend/app/scripts` or dedicated SQL seed files.
- If any bootstrap trigger/function is runtime-critical, include it in baseline schema migration.

## Required Validation Gates

1. Existing DB path:
- `alembic stamp <v1_1_revision_id>`
- app boot + smoke checks

2. Fresh DB path:
- `alembic upgrade head`
- app boot + tests

3. Release:
- tag `v1.1.0`
- update docs and worklist status
