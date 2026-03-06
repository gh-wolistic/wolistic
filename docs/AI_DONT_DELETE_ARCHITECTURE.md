# Architecture Overview

## Stack
- **Frontend**: Next.js 16 (React 19, TypeScript, Tailwind CSS 4)
- **Backend**: FastAPI (Python 3.12, async SQLAlchemy, Alembic)
- **Database**: Supabase Postgres (UUID-based schema)
- **Infrastructure**: Docker, Docker Compose
- **Connection Pooling**: Supabase PgBouncer (transaction mode, port 6543)

## Directory Structure
```
wolistic.com/
├── frontend/           # Next.js app
│   ├── app/
│   │   ├── page.tsx   # Homepage with backend health check
│   │   ├── layout.tsx
│   │   └── globals.css
│   └── package.json
├── backend/            # FastAPI service
│   ├── app/
│   │   ├── main.py                    # FastAPI app entry
│   │   ├── api/
│   │   │   ├── router.py             # API v1 router aggregation
│   │   │   └── routes/
│   │   │       └── health.py         # Health check endpoint
│   │   ├── core/
│   │   │   ├── config.py             # Pydantic settings
│   │   │   └── database.py           # Async DB engine
│   │   └── models/
│   │       ├── base.py               # SQLAlchemy Base
│   │       └── user.py               # User model (UUID PK)
│   ├── alembic/
│   │   ├── env.py                    # Async Alembic config
│   │   └── versions/
│   │       └── 20260305_0001_...py   # Initial users table
│   ├── Dockerfile
│   ├── docker-compose.yml
│   ├── requirements.txt
│   └── .env
└── docs/               # Project documentation
```

## Key Design Decisions

### Database
- **UUID primary keys** for users table (scalable, no sequential exposure)
- **Alembic async mode** for migrations (uses asyncpg directly)
- **Statement cache disabled** (`statement_cache_size=0`) for PgBouncer compatibility
- **Transaction pooler** for connection efficiency with Supabase

### FastAPI
- **Versioned API** routing (`/api/v1`)
- **CORS configured** for Next.js frontend + Supabase URL
- **Async-first** architecture (AsyncSession, async endpoints)
- **Pydantic Settings** with env validation
- **Health check** with DB ping (`SELECT 1`)

### Docker
- **Multi-stage ready** (currently single-stage with Python 3.12-slim)
- **Service name**: `backend`
- **Port**: 8000
- **Healthcheck**: HTTP probe to `/api/v1/health`

### Frontend
- **Server components** by default (Next.js App Router)
- **Backend health check** on homepage (demonstrates API integration)
- **Environment variables**: `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`

## Data Flow
1. Frontend (Next.js) → Backend (FastAPI) via HTTP/REST
2. Backend → Supabase Postgres via asyncpg + SQLAlchemy
3. Migrations run via Alembic (async mode)
4. CORS allows frontend + Supabase cross-origin requests

## Scalability Considerations
- Connection pooling via Supabase PgBouncer (transaction mode)
- Async I/O throughout stack
- Stateless FastAPI (12-factor app ready)
- Environment-driven config (no hardcoded secrets)
- Migration-based schema management (no manual DB changes)

## Future Architecture Additions
- Background job queue (Celery/Arq + Redis)
- Caching layer (Redis)
- Auth middleware (Supabase JWT verification)
- Observability (structured logging, tracing, metrics)
- API rate limiting
- Separate read replicas for analytics/AI workloads

## Ownership Matrix
See `docs/AI_DONT_DELETE_OWNERSHIP_MATRIX.md` for the recommended split between:
- Frontend -> Supabase (auth + safe public reads)
- Frontend -> FastAPI (AI logic + privileged operations)
