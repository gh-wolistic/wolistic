# High Priority Refactor TODO

Status: Open
Priority: P0
Scope: Frontend + Backend + Runtime architecture
Goal: Complete performance-focused refactor with safe rollout and measurable gains.

## Success targets (must hit)
- Public homepage p95 TTFB: <= 350ms
- Public profile page p95 TTFB: <= 500ms
- API `GET /api/v1/professionals/{username}` p95: <= 300ms
- LCP (mobile, public pages): <= 2.5s
- JS shipped on key public pages reduced by >= 30%
- Error rate during rollout: < 0.5%

## P0 - Week 1 (immediate)
- [ ] Remove forced dynamic rendering from public pages unless strictly required.
  - Files: `frontend/app/(public)/page.tsx`, `frontend/app/(public)/[username]/page.tsx`
  - Acceptance: Pages render with caching strategy, no functional regression.

- [ ] Replace `cache: "no-store"` for cacheable public reads with ISR/revalidate.
  - Files: `frontend/components/public/data/professionalsApi.ts`
  - Acceptance: Read requests are cached with controlled freshness.

- [ ] Eliminate duplicate profile fetches between `generateMetadata` and page render.
  - File: `frontend/app/(public)/[username]/page.tsx`
  - Acceptance: max 1 profile fetch path per request path (+ optional redirect lookup only).

- [ ] Disable development-style backend reload for perf environment.
  - File: `backend/docker-compose.yml`
  - Acceptance: backend runs without `--reload` in perf/prod compose profile.

- [ ] Add route and API latency instrumentation (p50/p95/p99) with request IDs.
  - Files: frontend app entry points + backend middleware/logging.
  - Acceptance: metrics visible per endpoint and per route.

## P0 - Week 2 (critical architecture)
- [ ] Refactor public layout to server-first shell; keep auth/session as client islands only where needed.
  - Files: `frontend/app/(public)/layout.tsx`, `frontend/components/public/PublicLayoutClient.tsx`
  - Acceptance: static public pages do not hydrate auth stack by default.

- [ ] Convert static/mostly-static public pages from full client pages to server components.
  - Files: `frontend/app/(public)/partners/page.tsx`, `frontend/app/(public)/contact/page.tsx`, others in `(public)`
  - Acceptance: reduced hydration cost and smaller route JS bundles.

- [ ] Introduce explicit fetch policy matrix.
  - Policy:
    - Public stable content: `force-cache` + revalidate (5m-1h)
    - Search/discovery data: bounded revalidate (30s-5m)
    - User-specific/authenticated data: `no-store`
  - Acceptance: all data clients mapped to one of these policy classes.

- [ ] Backend: split professional API contract into lightweight summary + full detail payload.
  - File: `backend/app/api/routes/professionals.py`
  - Acceptance: metadata/list calls use summary endpoint; detail endpoint used only where needed.

## P0 - Week 3 (database + API hardening)
- [ ] Audit and optimize SQL for professional detail and search endpoints.
  - File: `backend/app/api/routes/professionals.py`
  - Acceptance: no N+1 patterns; p95 query time reduced and documented.

- [ ] Add/verify indexes for high-read filters and sorting paths.
  - Scope: professionals, featured index, reviews.
  - Acceptance: explain plans captured before/after; query latency reduced.

- [ ] Add HTTP caching semantics (`ETag`, `Cache-Control`) for cacheable public endpoints.
  - Acceptance: repeated requests return 304 where appropriate.

- [ ] Introduce response shaping and payload size budgets.
  - Acceptance: profile payload size reduced without UX loss.

## P0 - Week 4 (runtime and rollout safety)
- [ ] Create dedicated prod-like compose/deploy profile (no dev watchers, proper worker split).
  - Files: `backend/docker-compose.yml` + production manifests
  - Acceptance: API and background worker independently scalable.

- [ ] Add canary rollout strategy with performance gates.
  - Acceptance: rollback trigger defined for latency/error regressions.

- [ ] Add synthetic performance checks in CI.
  - Acceptance: build fails when latency budgets regress beyond threshold.

## Cross-cutting cleanup
- [ ] Standardize API base env vars (single source of truth).
- [ ] Remove dead/unused dependencies and verify route bundle impact.
- [ ] Add architecture docs for fetch/caching/rendering decisions.
- [ ] Add regression tests for SEO metadata and profile redirects.

## Ownership template
- Frontend Lead: Rendering strategy, hydration reduction, fetch policies
- Backend Lead: API shaping, query optimization, caching headers
- DevOps Lead: Runtime profiles, observability, rollout controls
- QA Lead: Baseline capture, performance regression suite

## Definition of done
- All P0 tasks complete
- All success targets met for 7 consecutive days in production-like traffic
- No unresolved Sev-1/Sev-2 incidents linked to refactor
- Docs updated with final architecture and runbook
