# Todo & Work List

## Immediate (Before First Feature)
- [ ] Remove duplicate `SUPABASE_DB_PASSWORD` from `backend/.env` (already in `DATABASE_URL`)
- [ ] Create `backend/.env.local` copy and add to `.gitignore`
- [ ] Create `frontend/.env.local` copy and add to `.gitignore`
- [ ] Rotate Supabase anon key and DB password (exposed in chat logs)
- [ ] Add `.gitignore` for both frontend and backend
- [x] Add basic `pytest` setup for backend

## MVP Phase
- [x] Add Supabase JWT authentication middleware
- [ ] Add user CRUD endpoints (`POST /api/v1/users`, `GET /api/v1/users/me`)
- [ ] Add request ID middleware and structured logging
- [ ] Add frontend auth UI (Supabase Auth UI or custom)
- [ ] Add basic error handling and validation schemas
- [ ] Add environment split (`.env.development`, `.env.production`)
- [ ] Add CI/CD pipeline (GitHub Actions)

## Pre-AI Features
- [ ] Add Redis for caching
- [ ] Add background job queue (Arq or Celery)
- [ ] Add rate limiting middleware
- [ ] Add API versioning strategy docs
- [ ] Add monitoring (Sentry for errors, Prometheus for metrics)
- [ ] Add database connection retry logic
- [ ] Add migration rollback testing
- [ ] Add integration tests with test database

## AI/Recommendation Architecture
- [ ] Design recommendation schema (user preferences, item features)
- [ ] Add vector embeddings table (pgvector extension in Supabase)
- [ ] Add async job for embedding generation
- [ ] Add recommendation endpoint with caching strategy
- [ ] Add feature store for ML model inputs
- [ ] Add A/B testing framework for recommendation variants
- [ ] Add model versioning and rollback strategy
- [ ] Add batch inference pipeline
- [ ] Add real-time event tracking for user interactions

## Scalability & Ops
- [ ] Add Docker multi-stage builds (reduce image size)
- [ ] Add connection pool monitoring
- [ ] Add database index strategy review
- [ ] Add query performance monitoring (pg_stat_statements)
- [ ] Add backup and restore testing
- [ ] Add disaster recovery plan
- [ ] Add horizontal scaling strategy (load balancer config)
- [ ] Add CDN for frontend static assets

## Security Hardening
- [ ] Add Supabase service role key for admin operations (never expose to frontend)
- [ ] Add input sanitization and SQL injection prevention review
- [ ] Add secrets manager integration (AWS Secrets Manager / Vault)
- [ ] Add network security group rules
- [ ] Add HTTPS enforcement
- [ ] Add security headers middleware
- [ ] Add dependency vulnerability scanning
- [ ] Add rate limiting per user/IP

## Documentation
- [ ] Add API documentation (OpenAPI/Swagger auto-generation)
- [ ] Add deployment runbook
- [ ] Add troubleshooting guide
- [ ] Add database schema diagram
- [ ] Add contribution guidelines
- [ ] Add architecture decision records (ADRs)
