# Ad Manager - In-House Promotional Banner System

Last updated: 2026-04-18

## Overview

**Purpose**: Centralized system for displaying targeted promotional banners (tier upgrades, feature announcements, special offers, partner collaborations) across expert dashboards with admin-controlled placement, targeting, scheduling, A/B testing, and analytics.

**Business Context**: Enable platform to promote:
- Tier upgrades with limited-time discounts (e.g., "50% off Pro tier - Limited time!")
- New platform features (e.g., "Get your first certification badge")
- Partner collaborations (e.g., "Exclusive workshop with Brand X")
- Seasonal campaigns (e.g., "New Year Wellness Challenge")

**Current State**: **Not yet implemented** - Scheduled for Phase 2 (P2)  
**Current Workaround**: Hardcoded "Go Premium" banner in `BodyExpertDashboardContent.tsx` (lines 1124-1155) shown only to Free tier users

**Success Metrics** (Phase 2 targets):
- CTR (Click-Through Rate): 5-15% for tier upgrade banners
- Conversion rate: 2-5% (banner click → subscription upgrade)
- Engagement: 80%+ of eligible users see at least 1 banner per session
- Admin efficiency: Create/publish banner in <5 minutes

---

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Admin Dashboard                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Ad Manager Page (/dashboard/banners)                 │   │
│  │ - Create/Edit Form (Content, Targeting, Placement)   │   │
│  │ - Banner List (status, analytics)                    │   │
│  │ - Analytics Dashboard (CTR, conversions)             │   │
│  └──────────────────────────────────────────────────────┘   │
│                          ↓ Admin API                         │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                    Backend Services                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ promotional_banner.py service                        │   │
│  │ - get_active_banners_for_user() [targeting engine]  │   │
│  │ - record_impression() / record_click()               │   │
│  │ - get_banner_analytics() [aggregation]               │   │
│  └──────────────────────────────────────────────────────┘   │
│                          ↓ Partner API                       │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                  Expert Dashboard (Frontend)                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ <PromotionalBanner> Component                        │   │
│  │ - Renders text or image format                       │   │
│  │ - Tracks impression on mount                         │   │
│  │ - Tracks click on CTA                                │   │
│  └──────────────────────────────────────────────────────┘   │
│  Placement Slots:                                            │
│  - dashboard_middle (after "Today's Activity")               │
│  - dashboard_footer (replaces "Go Premium")                  │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

**Banner Display Flow**:
1. Expert loads dashboard → Frontend fetches `GET /api/v1/partners/banners/active?location=dashboard_footer`
2. Backend calls `get_active_banners_for_user(user_id, location)`:
   - Filters by tier, expert type, profile completeness
   - Checks schedule (current time between scheduled_from/until)
   - Validates impression caps (daily/lifetime)
   - Orders by priority DESC
3. Backend returns eligible banners (max 3)
4. Frontend renders top banner → records impression on mount
5. User clicks CTA → records click → navigates to target URL

**Admin Creation Flow**:
1. Admin fills form → (Optional) Uploads image via media system (upload-intent → confirm)
2. Admin submits → `POST /api/v1/admin/banners` with payload
3. Backend validates targeting/schedule → Creates record → Returns banner
4. Admin activates → Banner becomes eligible for display

---

## Database Schema

### Migration: `m89n0o1p2q3r_add_promotional_banners`

**Table: `promotional_banners`**

```sql
CREATE TABLE promotional_banners (
  -- Identity
  id BIGSERIAL PRIMARY KEY,
  
  -- Content
  title VARCHAR(200) NOT NULL,                    -- "Upgrade to Pro - 50% Off!"
  description TEXT,                               -- "Get advanced analytics..."
  cta_text VARCHAR(100) NOT NULL,                 -- "Claim Offer"
  cta_link VARCHAR(500) NOT NULL,                 -- "/dashboard/subscription"
  
  -- Format
  content_format VARCHAR(32) NOT NULL             -- 'text' | 'image' | 'hybrid'
    CHECK (content_format IN ('text', 'image', 'hybrid')),
  icon_name VARCHAR(50),                          -- 'Crown', 'Sparkles', 'Gift' (for text format)
  image_url TEXT,                                 -- Supabase Storage URL (for image format)
  gradient_classes VARCHAR(255),                  -- 'from-amber-500/20 to-orange-500/15' (for text format)
  
  -- Metadata
  banner_type VARCHAR(32) NOT NULL                -- 'upgrade' | 'feature' | 'discount' | 'partner'
    CHECK (banner_type IN ('upgrade', 'feature', 'discount', 'partner')),
  
  -- Targeting (JSONB for flexibility)
  target_tiers JSONB,                             -- ["free", "pro"] (null = all tiers)
  target_expert_types JSONB,                      -- ["body_expert", "mind_expert"] (null = all)
  min_profile_completeness INTEGER                -- 0-100 (null = no minimum)
    CHECK (min_profile_completeness IS NULL OR (min_profile_completeness >= 0 AND min_profile_completeness <= 100)),
  max_profile_completeness INTEGER                -- 0-100 (null = no maximum)
    CHECK (max_profile_completeness IS NULL OR (max_profile_completeness >= 0 AND max_profile_completeness <= 100)),
  
  -- Placement
  display_location VARCHAR(50) NOT NULL           -- 'dashboard_middle' | 'dashboard_footer'
    CHECK (display_location IN ('dashboard_middle', 'dashboard_footer', 'profile_studio_sidebar', 'activity_manager_header', 'subscription_page_banner')),
  priority INTEGER DEFAULT 0 NOT NULL,            -- Higher = shown first (0-100)
  
  -- Frequency Capping
  max_impressions_per_user_daily INTEGER,         -- Daily cap (null = unlimited)
  max_impressions_per_user_lifetime INTEGER,      -- Lifetime cap (null = unlimited)
  
  -- Scheduling (all timestamps in UTC)
  scheduled_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  scheduled_until TIMESTAMP WITH TIME ZONE,       -- null = no end date
  timezone VARCHAR(50) DEFAULT 'UTC',             -- Admin display timezone
  
  -- A/B Testing (Phase 2)
  ab_test_id BIGINT,                              -- Foreign key to ab_tests table
  ab_test_variant VARCHAR(32),                    -- 'control' | 'variant_a' | 'variant_b'
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  
  -- Audit
  created_by UUID,                                -- Admin user ID
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX idx_promotional_banners_active_location ON promotional_banners(is_active, display_location, priority DESC);
CREATE INDEX idx_promotional_banners_schedule ON promotional_banners(scheduled_from, scheduled_until);
CREATE INDEX idx_promotional_banners_ab_test ON promotional_banners(ab_test_id, ab_test_variant);
```

**Table: `promotional_banner_impressions`**

```sql
CREATE TABLE promotional_banner_impressions (
  -- Identity
  id BIGSERIAL PRIMARY KEY,
  
  -- References
  banner_id BIGINT NOT NULL 
    REFERENCES promotional_banners(id) ON DELETE CASCADE,
  user_id UUID NOT NULL 
    REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID NOT NULL,                       -- Browser session UUID (for conversion tracking)
  
  -- Tracking
  shown_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  clicked_at TIMESTAMP WITH TIME ZONE,            -- null = not clicked
  display_location VARCHAR(50) NOT NULL,          -- Where banner was shown
  
  -- Context (for analytics)
  metadata JSONB                                  -- {user_tier, expert_type, profile_completeness, ab_variant}
);

-- Indexes
CREATE INDEX idx_banner_impressions_banner_user ON promotional_banner_impressions(banner_id, user_id, shown_at DESC);
CREATE INDEX idx_banner_impressions_clicks ON promotional_banner_impressions(banner_id, clicked_at) WHERE clicked_at IS NOT NULL;
CREATE INDEX idx_banner_impressions_user_daily ON promotional_banner_impressions(user_id, shown_at DESC);
CREATE INDEX idx_banner_impressions_session ON promotional_banner_impressions(session_id, shown_at);
```

**Table: `ab_tests` (Phase 2)**

```sql
CREATE TABLE ab_tests (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  
  -- Traffic split: {"control": 50, "variant_a": 25, "variant_b": 25}
  traffic_split JSONB NOT NULL,
  
  -- Test window
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ended_at TIMESTAMP WITH TIME ZONE,
  
  -- Results
  winner_variant VARCHAR(32),                     -- Declared winner
  
  -- Audit
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
```

**Table: `promotional_banner_conversions` (Phase 2)**

```sql
CREATE TABLE promotional_banner_conversions (
  id BIGSERIAL PRIMARY KEY,
  
  -- Links to impression that led to conversion
  impression_id BIGINT NOT NULL 
    REFERENCES promotional_banner_impressions(id) ON DELETE CASCADE,
  
  -- Conversion details
  conversion_type VARCHAR(50) NOT NULL,           -- 'subscription_upgrade', 'certification_purchase'
  conversion_value NUMERIC(10, 2),                -- Revenue attributed (₹)
  converted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  -- Metadata
  metadata JSONB                                  -- {from_tier, to_tier, plan_id}
);

CREATE INDEX idx_banner_conversions_impression ON promotional_banner_conversions(impression_id);
CREATE INDEX idx_banner_conversions_type_date ON promotional_banner_conversions(conversion_type, converted_at DESC);
```

---

## API Endpoints

### Admin Endpoints (`/api/v1/admin/banners`)

**1. Create Banner**
```http
POST /api/v1/admin/banners
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "title": "Upgrade to Pro - 50% Off!",
  "description": "Limited time offer: Get advanced analytics, AI routines, and priority support for just ₹499/month",
  "cta_text": "Claim Offer Now",
  "cta_link": "/dashboard/subscription?offer=PRO50",
  "content_format": "text",
  "icon_name": "Crown",
  "gradient_classes": "from-amber-500/20 via-orange-500/15 to-rose-500/10",
  "banner_type": "upgrade",
  "target_tiers": ["free"],
  "target_expert_types": ["body_expert", "mind_expert"],
  "min_profile_completeness": 60,
  "display_location": "dashboard_footer",
  "priority": 100,
  "max_impressions_per_user_daily": 3,
  "scheduled_from": "2026-04-20T00:00:00Z",
  "scheduled_until": "2026-05-20T23:59:59Z",
  "timezone": "Asia/Kolkata"
}

Response: 201 Created
{
  "id": 1,
  "title": "Upgrade to Pro - 50% Off!",
  "is_active": true,
  "created_at": "2026-04-18T10:30:00Z",
  ...all fields...
}
```

**2. List Banners**
```http
GET /api/v1/admin/banners?is_active=true&banner_type=upgrade&location=dashboard_footer
Authorization: Bearer <admin_token>

Response: 200 OK
{
  "items": [
    {
      "id": 1,
      "title": "Upgrade to Pro - 50% Off!",
      "banner_type": "upgrade",
      "display_location": "dashboard_footer",
      "is_active": true,
      "impressions_count": 1520,
      "clicks_count": 182,
      "ctr": 0.1197,
      "scheduled_from": "2026-04-20T00:00:00Z",
      "scheduled_until": "2026-05-20T23:59:59Z"
    }
  ],
  "total": 1
}
```

**3. Get Banner Details**
```http
GET /api/v1/admin/banners/{id}
Authorization: Bearer <admin_token>

Response: 200 OK
{
  "id": 1,
  ...all fields...,
  "analytics": {
    "impressions_count": 1520,
    "unique_users": 890,
    "clicks_count": 182,
    "ctr": 0.1197,
    "conversions_count": 34,
    "conversion_rate": 0.0224,
    "revenue_attributed": 16966.00
  }
}
```

**4. Update Banner**
```http
PATCH /api/v1/admin/banners/{id}
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "title": "Upgrade to Pro - 60% Off!",
  "priority": 120,
  "is_active": true
}

Response: 200 OK
{
  "id": 1,
  "title": "Upgrade to Pro - 60% Off!",
  ...updated fields...
}
```

**5. Delete Banner (Soft Delete)**
```http
DELETE /api/v1/admin/banners/{id}
Authorization: Bearer <admin_token>

Response: 204 No Content
```

**6. Get Banner Analytics**
```http
GET /api/v1/admin/banners/{id}/analytics?start_date=2026-04-20&end_date=2026-05-20
Authorization: Bearer <admin_token>

Response: 200 OK
{
  "banner_id": 1,
  "period": {
    "start": "2026-04-20T00:00:00Z",
    "end": "2026-05-20T23:59:59Z"
  },
  "overview": {
    "impressions_count": 1520,
    "unique_users": 890,
    "clicks_count": 182,
    "ctr": 0.1197,
    "conversions_count": 34,
    "conversion_rate": 0.0224,
    "revenue_attributed": 16966.00
  },
  "by_tier": {
    "free": {"impressions": 1520, "clicks": 182, "ctr": 0.1197}
  },
  "by_expert_type": {
    "body_expert": {"impressions": 920, "clicks": 115, "ctr": 0.125},
    "mind_expert": {"impressions": 600, "clicks": 67, "ctr": 0.1117}
  },
  "by_day": [
    {"date": "2026-04-20", "impressions": 45, "clicks": 6, "ctr": 0.1333},
    {"date": "2026-04-21", "impressions": 52, "clicks": 8, "ctr": 0.1538},
    ...
  ]
}
```

---

### Partner Endpoints (`/api/v1/partners/banners`)

**1. Get Active Banners**
```http
GET /api/v1/partners/banners/active?location=dashboard_footer
Authorization: Bearer <partner_token>

Response: 200 OK
{
  "banners": [
    {
      "id": 1,
      "title": "Upgrade to Pro - 50% Off!",
      "description": "Limited time offer...",
      "cta_text": "Claim Offer Now",
      "cta_link": "/dashboard/subscription?offer=PRO50",
      "content_format": "text",
      "icon_name": "Crown",
      "gradient_classes": "from-amber-500/20 via-orange-500/15 to-rose-500/10",
      "banner_type": "upgrade",
      "display_location": "dashboard_footer",
      "priority": 100
    }
  ]
}
```

**2. Record Impression**
```http
POST /api/v1/partners/banners/{id}/impression
Authorization: Bearer <partner_token>
Content-Type: application/json

{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "display_location": "dashboard_footer"
}

Response: 201 Created
{
  "impression_id": 12345,
  "shown_at": "2026-04-18T10:35:22Z"
}
```

**3. Record Click**
```http
POST /api/v1/partners/banners/{id}/click
Authorization: Bearer <partner_token>
Content-Type: application/json

{
  "impression_id": 12345,
  "session_id": "550e8400-e29b-41d4-a716-446655440000"
}

Response: 200 OK
{
  "impression_id": 12345,
  "clicked_at": "2026-04-18T10:36:05Z"
}
```

---

## Backend Service Layer

**File: `backend/app/services/promotional_banner.py`**

### Core Functions

**1. `get_active_banners_for_user()` - Targeting Engine**

```python
async def get_active_banners_for_user(
    db: AsyncSession,
    user_id: uuid.UUID,
    location: str,
    limit: int = 3,
) -> list[PromotionalBanner]:
    """
    Fetch eligible banners for user based on targeting criteria.
    
    Filters applied (in order):
    1. is_active = true
    2. display_location matches
    3. Schedule: NOW BETWEEN scheduled_from AND (scheduled_until OR infinity)
    4. Tier targeting: user's tier IN target_tiers (or target_tiers is null)
    5. Expert type targeting: user's type IN target_expert_types (or null)
    6. Profile completeness: user's % BETWEEN min/max (or null)
    7. Impression caps: daily/lifetime counts not exceeded
    8. Order by priority DESC
    9. Limit results
    
    Returns: List of eligible banners (max `limit`)
    """
    # 1. Fetch user profile (tier, expert_type, profile_completeness)
    user_profile = await get_user_profile(db, user_id)
    
    # 2. Build base query
    now = datetime.utcnow()
    query = (
        select(PromotionalBanner)
        .where(
            PromotionalBanner.is_active == True,
            PromotionalBanner.display_location == location,
            PromotionalBanner.scheduled_from <= now,
            or_(
                PromotionalBanner.scheduled_until.is_(None),
                PromotionalBanner.scheduled_until >= now
            )
        )
    )
    
    # 3. Apply targeting filters
    # Tier filter (null = all tiers)
    query = query.where(
        or_(
            PromotionalBanner.target_tiers.is_(None),
            PromotionalBanner.target_tiers.contains([user_profile.tier])
        )
    )
    
    # Expert type filter (null = all types)
    query = query.where(
        or_(
            PromotionalBanner.target_expert_types.is_(None),
            PromotionalBanner.target_expert_types.contains([user_profile.expert_type])
        )
    )
    
    # Profile completeness filter
    if user_profile.profile_completeness is not None:
        query = query.where(
            or_(
                PromotionalBanner.min_profile_completeness.is_(None),
                PromotionalBanner.min_profile_completeness <= user_profile.profile_completeness
            ),
            or_(
                PromotionalBanner.max_profile_completeness.is_(None),
                PromotionalBanner.max_profile_completeness >= user_profile.profile_completeness
            )
        )
    
    # 4. Fetch candidate banners
    query = query.order_by(PromotionalBanner.priority.desc())
    result = await db.execute(query)
    candidates = result.scalars().all()
    
    # 5. Filter by impression caps
    eligible = []
    for banner in candidates:
        if await _check_impression_caps(db, banner.id, user_id):
            eligible.append(banner)
            if len(eligible) >= limit:
                break
    
    return eligible


async def _check_impression_caps(
    db: AsyncSession,
    banner_id: int,
    user_id: uuid.UUID,
) -> bool:
    """Check if user has exceeded daily/lifetime impression caps."""
    banner = await db.get(PromotionalBanner, banner_id)
    
    # Daily cap check
    if banner.max_impressions_per_user_daily:
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        daily_count = await db.scalar(
            select(func.count())
            .select_from(PromotionalBannerImpression)
            .where(
                PromotionalBannerImpression.banner_id == banner_id,
                PromotionalBannerImpression.user_id == user_id,
                PromotionalBannerImpression.shown_at >= today_start
            )
        )
        if daily_count >= banner.max_impressions_per_user_daily:
            return False
    
    # Lifetime cap check
    if banner.max_impressions_per_user_lifetime:
        lifetime_count = await db.scalar(
            select(func.count())
            .select_from(PromotionalBannerImpression)
            .where(
                PromotionalBannerImpression.banner_id == banner_id,
                PromotionalBannerImpression.user_id == user_id
            )
        )
        if lifetime_count >= banner.max_impressions_per_user_lifetime:
            return False
    
    return True
```

**2. `record_impression()` - Track Banner View**

```python
async def record_impression(
    db: AsyncSession,
    banner_id: int,
    user_id: uuid.UUID,
    session_id: uuid.UUID,
    display_location: str,
) -> PromotionalBannerImpression:
    """Record banner impression with user context."""
    # Fetch user context for metadata
    user_profile = await get_user_profile(db, user_id)
    
    impression = PromotionalBannerImpression(
        banner_id=banner_id,
        user_id=user_id,
        session_id=session_id,
        display_location=display_location,
        shown_at=datetime.utcnow(),
        metadata={
            "user_tier": user_profile.tier,
            "expert_type": user_profile.expert_type,
            "profile_completeness": user_profile.profile_completeness
        }
    )
    db.add(impression)
    await db.commit()
    await db.refresh(impression)
    return impression
```

**3. `record_click()` - Track CTA Click**

```python
async def record_click(
    db: AsyncSession,
    banner_id: int,
    user_id: uuid.UUID,
    session_id: uuid.UUID,
) -> PromotionalBannerImpression:
    """Update impression with click timestamp."""
    # Find most recent impression for this session
    result = await db.execute(
        select(PromotionalBannerImpression)
        .where(
            PromotionalBannerImpression.banner_id == banner_id,
            PromotionalBannerImpression.user_id == user_id,
            PromotionalBannerImpression.session_id == session_id,
            PromotionalBannerImpression.clicked_at.is_(None)
        )
        .order_by(PromotionalBannerImpression.shown_at.desc())
        .limit(1)
    )
    impression = result.scalar_one_or_none()
    
    if impression:
        impression.clicked_at = datetime.utcnow()
        await db.commit()
        await db.refresh(impression)
    
    return impression
```

**4. `get_banner_analytics()` - Aggregate Stats**

```python
async def get_banner_analytics(
    db: AsyncSession,
    banner_id: int,
    start_date: datetime | None = None,
    end_date: datetime | None = None,
) -> dict:
    """Calculate banner performance metrics."""
    # Build date filter
    date_filter = []
    if start_date:
        date_filter.append(PromotionalBannerImpression.shown_at >= start_date)
    if end_date:
        date_filter.append(PromotionalBannerImpression.shown_at <= end_date)
    
    # Total impressions
    impressions_count = await db.scalar(
        select(func.count())
        .select_from(PromotionalBannerImpression)
        .where(
            PromotionalBannerImpression.banner_id == banner_id,
            *date_filter
        )
    )
    
    # Unique users
    unique_users = await db.scalar(
        select(func.count(func.distinct(PromotionalBannerImpression.user_id)))
        .select_from(PromotionalBannerImpression)
        .where(
            PromotionalBannerImpression.banner_id == banner_id,
            *date_filter
        )
    )
    
    # Total clicks
    clicks_count = await db.scalar(
        select(func.count())
        .select_from(PromotionalBannerImpression)
        .where(
            PromotionalBannerImpression.banner_id == banner_id,
            PromotionalBannerImpression.clicked_at.isnot(None),
            *date_filter
        )
    )
    
    # Calculate CTR
    ctr = clicks_count / impressions_count if impressions_count > 0 else 0
    
    # Breakdown by tier (from metadata JSONB)
    by_tier = await _breakdown_by_field(
        db, banner_id, "user_tier", date_filter
    )
    
    # Breakdown by expert type
    by_expert_type = await _breakdown_by_field(
        db, banner_id, "expert_type", date_filter
    )
    
    # Daily time series
    by_day = await _daily_time_series(
        db, banner_id, start_date or datetime(2020, 1, 1), end_date or datetime.utcnow()
    )
    
    return {
        "banner_id": banner_id,
        "overview": {
            "impressions_count": impressions_count,
            "unique_users": unique_users,
            "clicks_count": clicks_count,
            "ctr": round(ctr, 4)
        },
        "by_tier": by_tier,
        "by_expert_type": by_expert_type,
        "by_day": by_day
    }
```

---

## Frontend Components

### 1. Banner Display Component

**File: `frontend/components/dashboard/PromotionalBanner.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Crown, Sparkles, Gift, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { recordBannerImpression, recordBannerClick } from "@/lib/api-client";

type PromotionalBannerProps = {
  banner: {
    id: number;
    title: string;
    description: string | null;
    cta_text: string;
    cta_link: string;
    content_format: "text" | "image" | "hybrid";
    icon_name?: string;
    image_url?: string;
    gradient_classes?: string;
    display_location: string;
  };
  sessionId: string; // Browser session UUID
};

const ICON_MAP = {
  Crown,
  Sparkles,
  Gift,
  Star,
};

function GlassCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <Card className={`border-white/10 bg-white/5 backdrop-blur-sm ${className}`}>
      {children}
    </Card>
  );
}

export function PromotionalBanner({ banner, sessionId }: PromotionalBannerProps) {
  const router = useRouter();
  const [impressionRecorded, setImpressionRecorded] = useState(false);

  // Record impression on mount
  useEffect(() => {
    if (!impressionRecorded) {
      recordBannerImpression(banner.id, sessionId, banner.display_location)
        .then(() => setImpressionRecorded(true))
        .catch(console.error);
    }
  }, [banner.id, sessionId, banner.display_location, impressionRecorded]);

  const handleClick = async () => {
    // Record click
    try {
      await recordBannerClick(banner.id, sessionId);
    } catch (error) {
      console.error("Failed to record banner click:", error);
    }

    // Navigate to CTA link
    if (banner.cta_link.startsWith("http")) {
      window.open(banner.cta_link, "_blank");
    } else {
      router.push(banner.cta_link);
    }
  };

  // Render text format banner
  if (banner.content_format === "text") {
    const IconComponent = ICON_MAP[banner.icon_name as keyof typeof ICON_MAP] || Crown;

    return (
      <GlassCard className={`border-amber-400/30 bg-linear-to-r ${banner.gradient_classes || "from-amber-500/20 via-orange-500/15 to-rose-500/10"} p-6`}>
        <div className="flex flex-col items-center justify-between gap-6 lg:flex-row">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-amber-400/20 p-3">
              <IconComponent className="size-6 text-amber-400" />
            </div>
            <div>
              <h3 className="mb-2 text-xl font-semibold text-amber-400">{banner.title}</h3>
              {banner.description && (
                <p className="text-sm text-zinc-300">{banner.description}</p>
              )}
            </div>
          </div>
          <div className="text-center lg:text-right">
            <Button
              onClick={handleClick}
              className="bg-linear-to-r from-amber-500 to-orange-500 px-8 text-white shadow-lg hover:from-amber-600 hover:to-orange-600"
            >
              {banner.cta_text}
            </Button>
          </div>
        </div>
      </GlassCard>
    );
  }

  // Render image format banner
  if (banner.content_format === "image") {
    return (
      <GlassCard className="relative overflow-hidden p-0">
        <div className="relative h-[200px] lg:h-[250px]">
          <img
            src={banner.image_url}
            alt={banner.title}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-linear-to-r from-black/60 to-transparent" />
          <div className="relative flex h-full items-center justify-between px-8">
            <div className="max-w-md">
              <h3 className="mb-2 text-2xl font-bold text-white">{banner.title}</h3>
              {banner.description && (
                <p className="text-sm text-white/90">{banner.description}</p>
              )}
            </div>
            <Button
              onClick={handleClick}
              size="lg"
              className="bg-white text-black hover:bg-white/90"
            >
              {banner.cta_text}
            </Button>
          </div>
        </div>
      </GlassCard>
    );
  }

  // Hybrid format (text + small image)
  return (
    <GlassCard className={`border-amber-400/30 bg-linear-to-r ${banner.gradient_classes} p-6`}>
      <div className="flex flex-col items-center gap-6 lg:flex-row lg:justify-between">
        {banner.image_url && (
          <img
            src={banner.image_url}
            alt={banner.title}
            className="h-24 w-24 rounded-lg object-cover"
          />
        )}
        <div className="flex-1">
          <h3 className="mb-2 text-xl font-semibold text-amber-400">{banner.title}</h3>
          {banner.description && (
            <p className="text-sm text-zinc-300">{banner.description}</p>
          )}
        </div>
        <Button onClick={handleClick} className="bg-linear-to-r from-amber-500 to-orange-500">
          {banner.cta_text}
        </Button>
      </div>
    </GlassCard>
  );
}
```

---

## Implementation Phases

### **Phase 1: Core System** (Recommended for P2)

**Scope**: Essential banner management with basic targeting and analytics

**Timeline**: 2-3 weeks

**Deliverables**:
1. ✅ Database migration with `promotional_banners` and `promotional_banner_impressions` tables
2. ✅ Backend service layer with targeting engine and analytics
3. ✅ Admin CRUD endpoints (create, list, get, update, delete)
4. ✅ Partner endpoints (get active, record impression/click)
5. ✅ Admin dashboard page (banner list, create/edit form, analytics modal)
6. ✅ Frontend banner component (text + image formats)
7. ✅ Dashboard integration (2 placements: middle + footer)
8. ✅ Fallback "Go Premium" banner for Free tier
9. ✅ Comprehensive testing (10-step verification)

**Success Criteria**:
- Admin can create and publish banner in <5 minutes
- Banner displays correctly to targeted users within 1 minute
- Impressions/clicks tracked accurately (>99% accuracy)
- CTR for tier upgrade banners: 5-15%

---

### **Phase 2: Advanced Analytics & A/B Testing** (Future)

**Scope**: Enhanced analytics, A/B testing, conversion tracking

**Timeline**: 2 weeks

**Deliverables**:
1. ✅ A/B testing tables and variant assignment logic
2. ✅ Conversion tracking (link impression → subscription upgrade)
3. ✅ Enhanced analytics dashboard
4. ✅ Admin A/B test setup UI
5. ✅ Test results dashboard with statistical significance
6. ✅ Winner declaration workflow

---

### **Phase 3: Expansion & Optimization** (Future)

**Scope**: Multi-page placement, rich content, frequency capping

**Timeline**: 2 weeks

**Deliverables**:
1. ✅ Multi-page placements (Profile Studio, Activity Manager, Subscription page)
2. ✅ Rich content editor (WYSIWYG)
3. ✅ Banner templates
4. ✅ Enhanced frequency capping
5. ✅ Banner carousel support
6. ✅ Accessibility enhancements
7. ✅ Localization support

---

## Testing Strategy

### Verification Steps (Phase 1)

1. **Database Setup** - Run migration, verify tables/indexes exist
2. **Admin Banner Creation** - Create text-based banner with targeting (Free tier + Body experts)
3. **Image Banner** - Upload image, create image-based banner, verify preview
4. **Display Validation** - Free Body Expert sees banner, Pro/Elite don't, Mind Expert doesn't
5. **Targeting Rules** - Test profile completeness threshold (banner shows/hides at 80%)
6. **Tracking** - Verify impression logged on view, click timestamp on CTA click
7. **Scheduling** - Test scheduled_from (future), scheduled_until (past)
8. **Priority** - Create 3 banners (priority 10, 50, 100), verify highest shows first
9. **Multi-Location** - Test dashboard_middle vs dashboard_footer placement
10. **Fallback** - Deactivate all banners, verify "Go Premium" fallback shows for Free users

---

## Best Practices & Guidelines

### Content Guidelines

**Title**: 5-10 words, action verb, value proposition  
**Description**: 1-2 sentences (15-25 words), key benefits, urgency  
**CTA Text**: 2-4 words, action-oriented

### Targeting Strategy

- **Free tier**: Upgrade banners, feature discovery
- **Pro tier**: Elite upgrade, advanced features
- **Elite tier**: Partner collaborations, premium events

### Analytics Benchmarks

**CTR**: Excellent >15%, Good 10-15%, Average 5-10%, Poor <5%  
**Conversion Rate**: Excellent >5%, Good 2-5%, Average 1-2%, Poor <1%

---

## Security & Privacy

- PII: Metadata stores tier/type only (no name/email/phone)
- Access Control: Admin endpoints require admin role
- Rate Limiting: 60-120 requests/minute per endpoint
- GDPR: User deletion cascades to impressions, anonymized analytics retained
- Data Retention: Impressions 180 days, Conversions 365 days

---

## Migration Path

**Current**: Hardcoded "Go Premium" banner (lines 1124-1155)  
**Phase 1**: Deploy Ad Manager, create matching banner, parallel system  
**Phase 2**: Gradual rollout (10% → 50% → 100%)  
**Phase 3**: Remove hardcoded banner, dynamic becomes primary  
**Phase 4**: Expand to multi-location

---

## Relevant Files

**Database & Models**:
- `backend/alembic/versions/m89n0o1p2q3r_add_promotional_banners.py` - New migration
- `backend/app/models/promotional_banner.py` - New models
- `backend/app/models/offer.py` - Reference patterns

**Backend**:
- `backend/app/services/promotional_banner.py` - New service
- `backend/app/schemas/promotional_banner.py` - New schemas
- `backend/app/api/routes/admin.py` - Add admin endpoints
- `backend/app/api/routes/partners.py` - Add partner endpoints

**Admin Dashboard**:
- `wolistic-admin/components/layout/AdminSidebar.tsx` - Add navigation
- `wolistic-admin/app/dashboard/banners/page.tsx` - New page
- `wolistic-admin/lib/admin-api-client.ts` - Add methods

**Expert Dashboard**:
- `frontend/components/dashboard/PromotionalBanner.tsx` - New component
- `frontend/components/dashboard/elite/BodyExpertDashboardContent.tsx` - Modify
- `frontend/lib/api-client.ts` - Add methods

---

## Changelog

| Date | Author | Changes |
|------|--------|---------|
| 2026-04-18 | AI Planning Agent | Initial documentation for P2 implementation |

---

**Status**: 📋 **Documentation Complete - Ready for P2 Implementation**
