# backend (FastAPI + Supabase)

Production-oriented FastAPI service with Docker, Alembic migrations, and a single UUID-based `users` table.

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

## 2) Run database migration

```bash
docker compose run --rm backend alembic upgrade head
```

This creates only one table:

- `users` (UUID primary key)

## 3) Start API

```bash
docker compose up --build
```

Service:

- API: `http://localhost:8000`
- Health: `http://localhost:8000/api/v1/health`

## Notes for scalability

- Uses SQLAlchemy connection pooling with `pool_pre_ping`
- Keeps app stateless and environment-driven
- Uses versioned API routing and migration-based schema management
- Ready to scale behind a reverse proxy / container orchestrator
