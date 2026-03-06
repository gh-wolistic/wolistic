# AI Ownership Matrix (Scalable Pattern)

## Context
Wolistic is a wellness platform listing certified experts and providing AI-assisted recommendations based on user queries, history, and preferences.

## Recommended Boundary
- Use **Supabase direct from frontend** for authentication and safe public reads.
- Use **FastAPI** for all business logic, AI decisioning, privileged writes, and moderation/admin controls.

This split gives high velocity without sacrificing long-term architecture quality.

## Responsibility Split

### Frontend -> Supabase (Direct)
- Auth flows (Google login/signup, session refresh, logout)
- Public expert list reads (only policy-safe fields)
- Public expert profile detail reads

Rules:
- Strict RLS policies on every client-facing table/view.
- No service role key in frontend.
- Keep client reads narrow and cacheable.

### Frontend -> FastAPI
- Personalized recommendations
- Featured experts management logic
- Chat orchestration and AI prompts
- Recommendation feedback, ranking, and scoring
- Sensitive writes and cross-user operations

Rules:
- Verify Supabase JWT on backend for identity/context.
- All AI and ranking logic server-side only.
- Audit logs for recommendation and moderation actions.

### FastAPI -> Supabase
- Query normalized data models
- Persist recommendation outputs and events
- Execute privileged operations with backend-only credentials

## Why This Is Best-In-Class
- Fast UX and low latency for public catalog pages.
- Strong security boundary for sensitive and AI-heavy logic.
- Independent scaling of API/worker layers without frontend coupling.
- Better observability and governance for AI decisions.

## Scaling Path for AI
1. Add Redis cache for recommendation responses and expert cards.
2. Add worker queue (Arq/Celery) for embeddings, reranking, and async jobs.
3. Add event pipeline for click/conversion feedback loops.
4. Add model/version registry and A/B testing hooks.
5. Add feature store and vector search once recommendation depth grows.

## Operational Guardrails
- Keep Supabase pooler mode in transaction with `statement_cache_size=0` for asyncpg.
- Add rate limiting and idempotency on FastAPI write endpoints.
- Add request IDs, traces, and metrics from day one.
- Separate public read models from private operational tables.

## Google OAuth Setup Note
Google client ID must be configured in Supabase Auth provider settings. Frontend only initiates OAuth via Supabase client SDK.
