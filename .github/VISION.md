# Wolistic — Platform Vision & USPs

**Last Updated**: April 13, 2026

This document defines the core vision, unique selling propositions (USPs), and key pillars of the Wolistic platform. All agents, engineers, and product decisions should align with this vision.

---

## Vision Statement

**Wolistic is a premium holistic wellness marketplace** that connects users with verified body, mind, and diet experts through AI-powered discovery, personalized routine management, and collaborative team-based wellness.

We combine:
- **Verified professional quality** (trust)
- **AI-assisted personalization** (intelligence)  
- **Collaborative wellness teams** (community)
- **Elite user experience** (premium feel)

---

## Core USPs (Unique Selling Propositions)

### 1. **Verified Professional Network**
- Every professional is identity + credential verified (India-first compliance)
- Verification badges differentiate us from unregulated wellness directories
- Multi-level credentials: identity-verified → credential-verified → fully-verified

### 2. **Wolistic Teams (Collaborative Wellness)**
- Users build multi-disciplinary wellness teams (trainer + dietitian + therapist)
- Experts collaborate on shared client routines and progress
- Cross-expert communication and coordination (Phase 2+)

### 3. **AI-Powered Routine & Plan Generation**
- Experts can generate personalized routines with AI assistance
- All AI output requires expert review and approval before client delivery
- Accelerates expert workflow without compromising safety or quality

### 4. **Holistic Client & Schedule Management**
- Unified CRM for experts: client lists, routine tracking, performance metrics
- Integrated scheduling: classes, sessions, bookings, conflict detection
- Follow-up workflows and client engagement tracking

### 5. **Premium Search & Discovery**
- Smart professional search with category ranking, location awareness, and featured strategy
- Transparent listings (products, wellness centers) — not curated or endorsed
- Professionals-first narrative: "Find Your Expert" positioning

### 6. **Elite Look, Feel, and Experience**
- Glass-morphism UI, Tailwind-based design system, premium aesthetics
- Four-tier positioning: Free (access) → Pro (tools) → Elite (prestige) → Celeb (exclusivity)
- Every interaction should feel calm, confident, and aspirational — not transactional

---

## Key Pillars (Technical & Product)

### Pillar 1: **Wolistic Teams**
**What**: Multi-expert collaboration on shared client wellness goals  
**Why**: No competitor offers true cross-disciplinary team management  
**Status**: Phase 2 roadmap (v2 dashboard planned)

### Pillar 2: **Client, Routine, and Schedule Management**
**What**: All-in-one CRM for wellness experts  
**Includes**:
- Client profiles and history
- AI-assisted routine generation with expert approval workflow
- Performance tracking and progress metrics
- Session/class scheduling with conflict detection
- Follow-up reminders and engagement tools

**Why**: Experts need tooling as good as their clients expect  
**Status**: Client Manager Phase 1 live; AI routines Phase 2 in design

### Pillar 3: **Search & Discovery**
**What**: Smart professional search with ranking, filters, and featured strategy  
**Why**: Discovery is the top-of-funnel for all platform value  
**Status**: Live with ongoing ranking optimization

### Pillar 4: **Elite Premium Experience**
**What**: Every surface — from onboarding to dashboard — should feel premium  
**How**:
- Visual: Glass-morphism, generous whitespace, calm colors, premium typography
- Interaction: Smooth transitions, loading states, optimistic UI
- Tone: Confident, supportive, aspirational (not clinical or salesy)

**Benchmark**: Calm (trust), Headspace (onboarding warmth), luxury wellness apps  
**Status**: V2 dashboard shell live; ongoing polish across all surfaces

---

## Architecture Overview

| Layer | Technology | Notes |
|-------|------------|-------|
| **Frontend** | Next.js 15 (App Router), TypeScript, Tailwind CSS | Server + client components, modular design system |
| **Admin** | Next.js (wolistic-admin) | Separate deployment, shared types |
| **Backend** | FastAPI, async SQLAlchemy, Alembic migrations | Modular services, vertical slicing |
| **Database** | Supabase Postgres | UUID-based users, append-only ledgers for coins/check-ins |
| **Auth** | Supabase Auth (JWT) | Backend validates tokens via service role |
| **Storage** | Supabase Storage | Media buckets (profile, gallery, feed) |
| **Deployment** | Docker (backend), Vercel (frontend + admin) | Environment-based config |
| **AI Integration** | LLM API + async job queue (Arq + Redis) | Phase 2: routine generation, never sync in request handler |

---

## Product Tiers & Positioning

| Tier | Pricing | Target Audience | Core Value |
|------|---------|-----------------|------------|
| **Free** | ₹0/mo | Casual practitioners, discovery phase | Platform access, basic visibility |
| **Pro** | ₹999/mo | Committed professionals | Analytics, credibility tools, priority listing |
| **Elite** | ₹2,499/mo | High-value practitioners | Premium badge, advanced CRM, elevated visibility |
| **Celeb** | ₹9,999/mo | Influencer-tier wellness leaders | Exclusivity, first-class tools, direct monetization |

**Tier Strategy**:
- Free/Pro = accessibility and volume
- Elite/Celeb = aspiration and premium positioning
- All tiers must feel celebrated, not shamed — upgrade is aspirational, not required

---

## Competitive Positioning

| Competitor | What They Do Well | Wolistic Advantage |
|------------|-------------------|-------------------|
| **Calm** | Trust, retention, premium feel | We add professional marketplace + team collaboration |
| **Headspace** | Onboarding warmth, habit loops | We add verified experts + personalized routines |
| **MyFitnessPal** | Goal tracking, transparency | We add holistic (not just diet/fitness) + collaborative teams |
| **Urban Company** | Booking reliability | We add verification, routines, and long-term client relationships |
| **Practo** | Doctor discovery | We focus on wellness (non-medical), premium UX, and team-based care |
| **Betterlyf** | Therapist/counselor marketplace (mind-focused) | We add holistic body + diet + mind, team collaboration, routine management |

**Where We Win**: Holistic team approach + verified professional quality + AI-assisted personalization + elite UX

---

## Success Metrics (North Star)

### Primary Metrics
- **Verified professionals on platform**: Quality over volume
- **Active Wolistic teams**: Multi-expert collaboration rate
- **Routine adherence rate**: Client engagement with expert-assigned routines
- **Booking completion rate**: Trust and transaction success
- **Elite/Celeb tier penetration**: Premium positioning success

### Guardrail Metrics
- Professional churn (should be <5% monthly)
- Client safety incidents (must be zero)
- AI routine acceptance rate (target >70% once live)

---

## Decision Principles

1. **Professionals First**: Every feature must serve expert workflows or client outcomes — not platform vanity metrics
2. **Quality Over Volume**: 100 verified Elite professionals > 1,000 unverified listings
3. **Phase Discipline**: Phase 1 must ship and teach. Phase 2 only if Phase 1 validates.
4. **Premium by Default**: Every UX decision should ask "Is this calm, confident, and aspirational?"
5. **Safety Non-Negotiable**: No AI output reaches clients without expert approval. No unverified claims. No credential shortcuts.

---

## References

- Architecture: `docs/AI_DONT_DELETE_ARCHITECTURE.md`
- Active Worklist: `docs/AI_DONT_DELETE_TODO_WORKLIST.md`
- Client Manager Instructions: `.github/instructions/client-manager-ai-routines.instructions.md`
