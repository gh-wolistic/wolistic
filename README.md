# Wolistic Platform

Wolistic is a production-oriented wellness platform built as a modern full-stack monorepo.
It combines a Next.js frontend, a FastAPI backend, and Supabase Postgres with UUID-first data modeling.

## Highlights

- Monorepo architecture with clear frontend and backend boundaries
- FastAPI API with versioned routing at `/api/v1`
- Supabase Auth integration with backend-side token verification
- Alembic migration workflow for safe, repeatable schema evolution
- Professional discovery + booking flow modules
- Expert-review intake and holistic-team recommendation flow
- Separate internal admin application for operational controls
- Automated CI tests for backend and frontend

## Tech Stack

### Frontend

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Vitest

### Backend

- FastAPI
- SQLAlchemy 2 (async)
- Alembic
- asyncpg
- PyJWT

### Infrastructure and Data

- Supabase Postgres
- Docker and Docker Compose
- GitHub Actions

## Repository Structure

```text
wolistic.com/
|-- frontend/        # Next.js app (public pages, dashboard, booking UX)
|-- backend/         # FastAPI app (routes, auth, services, migrations)
|-- wolistic-admin/  # Internal admin dashboard
|-- docs/            # Architecture and project planning docs
`-- .github/         # CI workflows
```

## Quick Start

### 1) Backend setup

```powershell
cd backend
copy .env.example .env
```

Set required values in `backend/.env`:

- `DATABASE_URL`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `BACKEND_CORS_ORIGINS`

Run migrations:

```powershell
cd backend
docker compose run --rm backend alembic upgrade head
```

Start API:

```powershell
cd backend
docker compose up -d --build
```

Backend endpoints:

- API base: `http://localhost:8000`
- Liveness: `http://localhost:8000/api/v1/healthz`
- Readiness: `http://localhost:8000/api/v1/readyz`

### 2) Frontend setup

```powershell
cd frontend
copy .env.example .env.local
npm install
npm run dev
```

Frontend:

- App: `http://localhost:3000`

### 3) Admin app setup

```powershell
cd wolistic-admin
copy .env.example .env.local
npm install
npm run dev
```

Admin app:

- App: `http://localhost:3001` (or next available port)

## Testing

### Backend tests

```powershell
cd backend
python -m pip install -r requirements-dev.txt
pytest
```

### Frontend tests

```powershell
cd frontend
npm run test
```

CI also runs both suites in [`.github/workflows/tests.yml`](.github/workflows/tests.yml).

## Migrations

Run latest migrations:

```powershell
cd backend
docker compose run --rm backend alembic upgrade head
```

Create migration:

```powershell
cd backend
docker compose run --rm backend alembic revision --autogenerate -m "describe_change"
```

Check migration state:

```powershell
cd backend
docker compose run --rm backend alembic current
```

## API and Product Areas

Current platform capabilities include:

- Auth profile endpoint (`/api/v1/auth/me`)
- Professional profile retrieval, featured, and search APIs
- Booking intake question flow
- Payment order and verification endpoints
- Booking history retrieval for authenticated users
- Expert-review intake (`/api/v1/intake/expert-review`)
- Holistic-team preparation and listing (`/api/v1/holistic-teams/*`)
- Admin moderation/status endpoints (`/api/v1/admin/*`)

## Security and Configuration Notes

- Keep all secrets in local environment files, never in tracked source files
- Restrict `BACKEND_CORS_ORIGINS` to trusted frontend domains in production
- Prefer migration-driven schema changes over manual SQL edits
- Use backend-validated identity for protected actions

## Additional Documentation

- [Backend README](backend/README.md)
- [Frontend README](frontend/README.md)
- [Admin README](wolistic-admin/README.md)
- [Architecture Overview](docs/AI_DONT_DELETE_ARCHITECTURE.md)
- [Commands Reference](docs/AI_DONT_DELETE_COMMANDS.md)
- [Project Status](docs/AI_DONT_DELETE_PROJECT_STATUS_VISION.md)
- [Canonical Worklist](docs/AI_DONT_DELETE_TODO_WORKLIST.md)
- [Docs Index](docs/README.md)

## Contributing

1. Create a feature branch.
2. Keep changes scoped and migration-safe.
3. Run backend and frontend tests.
4. Open a pull request with a clear summary and testing notes.

## License

Proprietary. All rights reserved unless explicitly stated otherwise.
