# Project Status & Vision

## Current Status (March 5, 2026)

### ✅ Completed
- [x] FastAPI backend skeleton with Docker
- [x] Alembic migration system (async mode)
- [x] Initial `users` table migration (UUID-based)
- [x] Supabase Postgres connection (transaction pooler, port 6543)
- [x] CORS configuration for Next.js + Supabase
- [x] Health check endpoint with DB validation (`/api/v1/health`)
- [x] Next.js frontend with backend API integration demo
- [x] PgBouncer compatibility fix (statement cache disabled)
- [x] Docker Compose service named `backend`
- [x] Environment-based configuration (Pydantic Settings)

### 🔧 Working State
- Backend API running on `http://localhost:8000`
- Frontend dev server ready on `http://localhost:3000`
- Database schema: single `users` table only (as requested)
- Migration applied successfully to Supabase
- No other tables created (constraint met)

### 🚧 Known Issues
None blocking MVP.

## Vision

## Product Summary
Wolistic is a wellness marketplace and recommendation platform with a public discovery app, an admin app, and a FastAPI backend.

Primary goals:
- Help users discover and evaluate professionals quickly.
- Support guided wellness discovery flows and onboarding.

## Doc Ownership
This file is the single project guide source of truth.
See:
- ARCHITECTURE.md for technical architecture and DB relationships.
- WORK_TODO_STATUS.md for consolidated completed + pending work tracking.
