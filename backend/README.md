# backend (FastAPI + Supabase)

Production-oriented FastAPI service with Docker, Alembic migrations, and a single UUID-based `users` table.

## 📋 Quick Links

- **[QUICK_START_TRACING.md](QUICK_START_TRACING.md)** — Request tracing & logging (2026-04-14)
- **[REQUEST_TRACING.md](REQUEST_TRACING.md)** — Full observability documentation
- **[Migration Runbook](alembic/MIGRATION_V1_1_BASELINE_RUNBOOK.md)** — v1.1 baseline migration guide

---

## What is included

- FastAPI app with versioned routing (`/api/v1`)
- CORS middleware for Next.js frontend + Supabase URL
- Async SQLAlchemy with Supabase Postgres connection
- Alembic migration scaffold and initial `users` table migration
- Dockerfile and `docker-compose.yml` service named `backend`
- Health check route: `GET /api/v1/health`

## 1) Configure environment

```bash
cd backend
copy .env.example .env
```

Update at minimum:

- `DATABASE_URL` with your Supabase Postgres connection string
- `SUPABASE_ANON_KEY`
- `BACKEND_CORS_ORIGINS` for all frontend domains

Payment configuration:

- `PAYMENT_PROVIDER=mock` for local mock flow or `PAYMENT_PROVIDER=razorpay` for real Razorpay test/live mode
- `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` must be set in `backend/.env` for real order creation and signature verification
- `RAZORPAY_WEBHOOK_SECRET` is required when enabling the Razorpay webhook endpoint

Keep real Razorpay secrets only in `backend/.env`. Do not place them in tracked files or frontend env files.

Admin dashboard configuration:

- `ADMIN_API_KEY` must be set in `backend/.env`.
- Internal admin clients must send this value in `X-Admin-Key` for `/api/v1/admin/*` endpoints.

## 2) Run database migration

```bash
docker compose run --rm backend alembic upgrade head
```

This creates only one table:

- `users` (UUID primary key)

### Migration reset (v1.1 baseline)

If you need to squash historical migration history and keep only a new baseline, follow:

- `backend/alembic/MIGRATION_V1_1_BASELINE_RUNBOOK.md`
- `backend/alembic/MIGRATION_V1_1_MANIFEST.md`

Do not delete `backend/alembic/versions` directly on active environments.
Use a controlled `baseline + stamp` rollout.

## 3) Start API

```bash
docker compose up --build
```

Service:

- API: `http://localhost:8000`
- Liveness: `http://localhost:8000/api/v1/healthz`
- Readiness: `http://localhost:8000/api/v1/readyz`
- Razorpay webhook: `POST /api/v1/booking/payments/webhooks/razorpay`

### Featured index background refresh

Featured professionals index is refreshed by a background worker command (default every 15 minutes).

Configuration:

- `FEATURED_INDEX_REFRESH_SECONDS=900` in `.env`

Run once manually:

```bash
python -m app.scripts.refresh_featured_index --once
```

Run worker loop:

```bash
python -m app.scripts.refresh_featured_index
```

Using docker compose (includes API + worker):

```bash
docker compose up --build
```

## 4) Run tests

```bash
pip install -r requirements-dev.txt
pytest
```

The tests run against FastAPI routes and override DB dependencies, so they do not require a live database.

## Notes for scalability

- Uses SQLAlchemy connection pooling with `pool_pre_ping`
- Keeps app stateless and environment-driven
- Uses versioned API routing and migration-based schema management
- Ready to scale behind a reverse proxy / container orchestrator
