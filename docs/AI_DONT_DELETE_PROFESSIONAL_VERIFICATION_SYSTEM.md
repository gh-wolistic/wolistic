# Professional Verification System

**Status**: Phase 1 Implementation Ready  
**Date**: April 18, 2026  
**Version**: 1.0

---

## Table of Contents

1. [Overview](#overview)
2. [The Trust Gap](#the-trust-gap)
3. [Credential Type Taxonomy](#credential-type-taxonomy)
4. [Tier-Based Verification Requirements](#tier-based-verification-requirements)
5. [Data Model](#data-model)
6. [Business Rules](#business-rules)
7. [License Expiry & Auto-Enforcement](#license-expiry--auto-enforcement)
8. [Admin Verification Workflow](#admin-verification-workflow)
9. [Professional Dashboard UX](#professional-dashboard-ux)
10. [Search Visibility Enforcement](#search-visibility-enforcement)
11. [Automated Verification (Phase 2)](#automated-verification-phase-2)
12. [User-Facing Trust Signals](#user-facing-trust-signals)
13. [Implementation Phases](#implementation-phases)
14. [API Specifications](#api-specifications)
15. [Task Breakdown](#task-breakdown)
16. [Success Metrics](#success-metrics)
17. [Legal Compliance](#legal-compliance)
18. [Edge Cases & Resolutions](#edge-cases--resolutions)
19. [Technical Debt & Future Considerations](#technical-debt--future-considerations)
20. [Glossary](#glossary)

---

## Overview

Wolistic's core USP is **"Verified Professionals Only"** — a promise that users booking consultations or sessions are connecting with credible, qualified wellness practitioners. Currently, this claim is unfulfilled: the platform has no active credential verification system.

**This document defines the complete professional verification system** that restores trust, ensures legal compliance, and creates a tiered verification model that drives tier upgrades (Free → Pro → Elite → Celeb).

### What We're Building

A **three-tier credential verification system**:

1. **Identity Verification** (mandatory for all tiers) — Government ID (Aadhaar/PAN/Passport)
2. **Credential Verification** (tier-gated) — Education + Certifications + Licenses
3. **License Compliance Enforcement** (mandatory for regulated professions) — Auto-hide professionals with expired licenses

**Key Differentiator**: We distinguish between **education** (academic degrees), **certificates** (professional training), and **licenses** (legal permits with expiry dates). This is critical for legal compliance and trust.

---

## The Trust Gap

### Current State

| What We Claim | Reality | Risk |
|---------------|---------|------|
| "Verified professionals only" | No credential verification system | **Critical trust breach** |
| Profile completeness = verified | `user_status="verified"` only checks if profile >75% complete | Users expect credential validation |
| Regulated professions (doctors, dietitians) | No license verification or expiry tracking | **Legal liability** |

### Impact

- **Users**: Booking professionals without knowing if credentials are real
- **Platform**: Potential legal exposure (unlicensed practitioners offering regulated services)
- **Competitive**: Falling behind Urban Company (background checks), Practo (license verification)

---

## Credential Type Taxonomy

### Three Distinct Credential Types

| Type | Purpose | Expiry | Legal Requirement | Verification Method | Example |
|------|---------|--------|-------------------|---------------------|---------|
| **Education** | Academic foundation | **No expiry** | Optional | Document upload | BSc Nutrition (University of Mumbai, 2018) |
| **Certificate** | Professional training | **Optional expiry** | Optional (industry-specific) | Document upload OR registry link | Yoga Teacher Training 200hr (Yoga Alliance, 2022) |
| **License** | Legal right to practice | **YES - mandatory renewal** | **Mandatory for regulated professions** | Document upload + registry verification | Medical Council license (MCI-12345678, expires Dec 2026) |

### Why This Matters

**Education** = foundation (degree earned, never expires)  
**Certificate** = skill training (may or may not expire, varies by issuer)  
**License** = legal permit (MUST renew, MUST track expiry, MUST hide if expired)

**Example**: A dietitian needs:
- **Education**: BSc Nutrition (no expiry)
- **Certificate**: Advanced Sports Nutrition (optional, no expiry)
- **License**: Indian Dietetic Association license #12345 (expires annually, MUST be current)

If the license expires → **immediate delisting from search** (legal compliance).

---

## Tier-Based Verification Requirements

### Verification Depth by Tier

| Tier | Identity | Credentials Required | License Compliance | Badge | Search Visibility |
|------|----------|---------------------|-------------------|-------|-------------------|
| **Free** | ✅ Government ID | None | If profession requires license, MUST verify | ✅ Verified | Visible after ID verified |
| **Pro** | ✅ Government ID | 1+ certificate OR education | If profession requires license, MUST verify | ✅ Pro Verified | Priority ranking |
| **Elite** | ✅ Government ID | 3+ certificates + 1 education | If profession requires license, MUST verify | 👑 Elite Verified | Top placement |
| **Celeb** | ✅ Government ID + Video call | All Elite requirements + brand audit | If profession requires license, MUST verify | ⭐ Celeb Verified | Featured slots |

### License Compliance = Non-Negotiable

**Regardless of tier, if a professional's role requires a license (doctor, dietitian, physiotherapist, psychologist), they MUST:**
1. Upload license with expiry date
2. Get admin approval
3. Renew before expiry
4. **Platform auto-hides them from search if license expires**

**This is a legal requirement, not a tier feature.**

---

## Data Model

### Schema Overview

```
professionals
  │
  ├─── professional_identity_verification (1:1)
  │      └─── Government ID verification with grace period
  │
  ├─── credential_verifications (1:many)
  │      └─── Education / Certificates / Licenses
  │
  └─── profession_license_requirements (lookup)
         └─── Defines which professions require licenses
```

### Core Tables

#### 1. Identity Verification (1:1 with professional)

```sql
CREATE TABLE professional_identity_verification (
    user_id UUID PRIMARY KEY REFERENCES professionals(user_id) ON DELETE CASCADE,
    
    -- Document upload
    document_type VARCHAR(32) NOT NULL CHECK (document_type IN ('aadhaar', 'passport', 'drivers_license', 'pan_card')),
    document_url TEXT NOT NULL,  -- Supabase Storage path (auto-deleted 30 days after approval)
    
    -- Verification state
    verification_status VARCHAR(16) NOT NULL DEFAULT 'pending' 
        CHECK (verification_status IN ('pending', 'approved', 'rejected')),
    verified_at TIMESTAMPTZ,
    verified_by_user_id UUID REFERENCES users(id),
    rejection_reason TEXT,
    
    -- Grace period (7 days from professional creation to upload ID)
    grace_period_expires_at TIMESTAMPTZ,
    
    -- Auto-delete tracking (compliance)
    document_deleted_at TIMESTAMPTZ,  -- Set 30 days after approval
    
    -- Audit
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX ix_identity_verification_status 
    ON professional_identity_verification(verification_status);
    
CREATE INDEX ix_identity_verification_grace_period 
    ON professional_identity_verification(grace_period_expires_at) 
    WHERE verification_status = 'pending';
```

#### 2. Credential Verifications (1:many with professional)

```sql
-- Credential type enum
CREATE TYPE credential_type AS ENUM ('education', 'certificate', 'license');

-- Credential subtype for specific categorization
CREATE TYPE credential_subtype AS ENUM (
    -- Education subtypes
    'bachelors', 'masters', 'phd', 'diploma',
    
    -- Certificate subtypes
    'yoga_certification', 'fitness_certification', 'nutrition_certification',
    'pilates_certification', 'meditation_certification',
    
    -- License subtypes (regulated professions)
    'medical_council_license', 'dietitian_license', 'physiotherapy_license',
    'psychologist_license', 'nursing_license'
);

CREATE TABLE credential_verifications (
    id BIGSERIAL PRIMARY KEY,
    professional_id UUID NOT NULL REFERENCES professionals(user_id) ON DELETE CASCADE,
    
    -- Credential classification
    credential_type credential_type NOT NULL,
    credential_subtype credential_subtype,
    
    -- Credential details
    credential_name VARCHAR(255) NOT NULL,  -- e.g., "BSc Nutrition & Dietetics"
    issuing_organization VARCHAR(255) NOT NULL,  -- e.g., "University of Mumbai"
    
    -- Dates
    issued_date DATE,
    expiry_date DATE,  -- MANDATORY for licenses, optional for certificates, NULL for education
    
    -- License-specific fields
    license_number VARCHAR(100),  -- e.g., "MCI-12345678" for medical council
    registry_link TEXT,  -- External verification URL (state medical council, Yoga Alliance, etc.)
    
    -- Verification evidence
    document_url TEXT,  -- Supabase Storage URL for uploaded certificate/degree
    
    -- Verification state
    verification_status VARCHAR(16) NOT NULL DEFAULT 'pending' 
        CHECK (verification_status IN ('pending', 'approved', 'rejected', 'expired', 'auto_verified')),
    verification_method VARCHAR(64)
        CHECK (verification_method IN ('manual', 'api_medical_council', 'api_dietitian_board', 
                                        'api_rci', 'api_yoga_alliance', 'api_digilocker')),
    
    verified_at TIMESTAMPTZ,
    verified_by_user_id UUID REFERENCES users(id),
    rejection_reason TEXT,
    
    -- License expiry tracking (critical for compliance)
    expiry_warning_sent_at TIMESTAMPTZ,  -- When we warned professional about upcoming expiry
    auto_expired_at TIMESTAMPTZ,  -- Auto-populated when expiry_date passes (cron job)
    
    -- Audit
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Prevent duplicate verification records
    UNIQUE(professional_id, credential_type, credential_name, issuing_organization)
);

-- Indexes
CREATE INDEX ix_credential_verifications_professional 
    ON credential_verifications(professional_id);
    
CREATE INDEX ix_credential_verifications_status 
    ON credential_verifications(verification_status);
    
CREATE INDEX ix_credential_verifications_type 
    ON credential_verifications(credential_type);
    
-- Critical: Fast lookup for license expiry checks
CREATE INDEX ix_credential_verifications_license_expiry 
    ON credential_verifications(expiry_date) 
    WHERE credential_type = 'license' AND expiry_date IS NOT NULL;
```

#### 3. Profession License Requirements (Lookup Table)

```sql
CREATE TABLE profession_license_requirements (
    id SERIAL PRIMARY KEY,
    profession VARCHAR(64) NOT NULL,  -- e.g., 'doctor', 'dietitian', 'yoga_instructor'
    credential_subtype credential_subtype NOT NULL,  -- Required license type
    issuing_authority VARCHAR(255) NOT NULL,  -- e.g., 'Medical Council of India'
    is_mandatory BOOLEAN NOT NULL DEFAULT true,  -- If false, it's recommended but not required
    registry_api_available BOOLEAN DEFAULT false,  -- Can we auto-verify via API?
    registry_api_endpoint TEXT,  -- API URL for automated verification
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed data for Indian regulatory bodies
INSERT INTO profession_license_requirements (profession, credential_subtype, issuing_authority, is_mandatory, registry_api_available) VALUES
    ('doctor', 'medical_council_license', 'Medical Council of India', true, true),
    ('dietitian', 'dietitian_license', 'Indian Dietetic Association', true, false),
    ('physiotherapist', 'physiotherapy_license', 'Indian Association of Physiotherapists', true, false),
    ('psychologist', 'psychologist_license', 'Rehabilitation Council of India', true, true),
    ('nurse', 'nursing_license', 'State Nursing Council', true, false),
    ('yoga_instructor', 'yoga_certification', 'Yoga Alliance', false, true);  -- Recommended, not legally required
```

#### 4. Professional Profession Type (for license enforcement)

```sql
-- Add profession type to professionals table
ALTER TABLE professionals 
ADD COLUMN profession_type VARCHAR(64);

-- Backfill existing professionals (Phase 2)
-- For now, professionals must select profession type during onboarding
```

---

## Business Rules

### Identity Verification Rules

| Action | Conditions | Result |
|--------|-----------|--------|
| **New professional signup** | Account created | `grace_period_expires_at = created_at + 7 days` |
| **Upload identity document** | Within grace period | `verification_status = 'pending'`, admin review required |
| **Admin approves** | Document valid | `verification_status = 'approved'`, `users.user_status = 'verified'`, schedule document deletion in 30 days |
| **Admin rejects** | Document invalid | `verification_status = 'rejected'`, professional can re-upload |
| **Grace period expires** | 7 days passed, no upload | Professional hidden from search (still has dashboard access) |
| **Re-upload after rejection** | Unlimited attempts | Creates new verification record, resets to `pending` |

### Credential Verification Rules

#### Education (No Expiry)

| Action | Validation | Result |
|--------|-----------|--------|
| **Upload education credential** | Document must be degree certificate (BSc, MSc, PhD, Diploma) | `credential_type = 'education'`, `expiry_date = NULL` |
| **Admin approves** | Verified via document review | `verification_status = 'approved'`, never expires |
| **Edit after approval** | Not allowed | Must delete and re-upload (prevents credential fraud) |

#### Certificate (Optional Expiry)

| Action | Validation | Result |
|--------|-----------|--------|
| **Upload certificate** | Can provide document OR registry link (e.g., Yoga Alliance) | `credential_type = 'certificate'`, `expiry_date` optional |
| **Admin approves** | Document valid OR registry link verified | `verification_status = 'approved'` |
| **Certificate has expiry** | e.g., CPR certification expires in 2 years | Admin sets `expiry_date`, platform sends renewal reminder 30 days before |
| **Certificate expires** | Expiry date passes | Status remains `approved` but badge shows "expired" (not delisted, just flagged) |

#### License (Mandatory Expiry + Auto-Enforcement)

| Action | Validation | Result |
|--------|-----------|--------|
| **Upload license** | MUST include `license_number` + `expiry_date` | `credential_type = 'license'`, required for regulated professions |
| **Admin approves** | License number verified via registry OR document | `verification_status = 'approved'`, professional visible in search |
| **30 days before expiry** | Cron job checks `expiry_date` | Email warning sent to professional, `expiry_warning_sent_at` updated |
| **7 days before expiry** | Second warning | Urgent email: "Upload renewed license or you'll be delisted" |
| **Expiry date passes** | Cron job runs daily | `verification_status = 'expired'`, **professional HIDDEN from search** |
| **Professional uploads renewed license** | New license with extended expiry date | Creates new verification record, admin approves, professional visible again |

### Tier Upgrade Requirements

| Tier Upgrade | Verification Gate | Enforcement |
|--------------|------------------|-------------|
| **Free → Pro** | Must have identity verified + 1 approved credential | Payment blocked until requirements met |
| **Pro → Elite** | Must have identity verified + 3 approved credentials + 1 education | Payment blocked until requirements met |
| **Elite → Celeb** | All Elite requirements + video verification call | Manual admin approval required |

---

## License Expiry & Auto-Enforcement

### License Lifecycle

```
License Created (expiry_date set)
     ↓
[PENDING] → Admin reviews → [APPROVED]
     ↓                            ↓
Professional practices       License actively valid
     ↓                            ↓
30 days before expiry       [WARNING SENT]
     ↓                            ↓
7 days before expiry        [URGENT WARNING]
     ↓                            ↓
Expiry date passes          [EXPIRED] ← Auto-marked by cron job
     ↓                            ↓
Professional HIDDEN         Dashboard shows urgent renewal prompt
from search                      ↓
     ↓                       Professional uploads renewed license
     ↓                            ↓
     └────────────────→      [PENDING] → Admin approves → [APPROVED]
                                                              ↓
                                                    Visible in search again
```

### Auto-Enforcement Rules

| License State | Search Visibility | Dashboard Access | Booking Allowed | Professional Notification |
|---------------|-------------------|------------------|-----------------|--------------------------|
| **Approved (>30 days until expiry)** | ✅ Visible | Full access | ✅ Yes | None |
| **Approved (7-30 days until expiry)** | ⚠️ Visible with warning badge | Full access | ✅ Yes | Email: "Renew soon to avoid delisting" |
| **Approved (0-7 days until expiry)** | ⚠️ Visible (grace period) | Full access | ✅ Yes | Urgent email: "Renew now or be delisted" |
| **Expired (0-7 days ago)** | ⚠️ Grace period - still visible | Full access + renewal banner | ✅ Yes | Dashboard banner: "Upload renewed license NOW" |
| **Expired (>7 days ago)** | ❌ **HIDDEN from search** | Read-only (cannot create services/sessions) | ❌ No | Email: "Delisted - upload renewed license to restore visibility" |
| **Renewal submitted (under review)** | ✅ Visible (old license during review) | Full access | ✅ Yes | None |
| **Renewal approved** | ✅ Visible | Full access | ✅ Yes | Email: "License renewed successfully" |

### Daily Cron Job: License Expiry Check

```python
# backend/app/tasks/license_expiry.py

async def check_license_expiry():
    """Run daily at 9 AM IST"""
    today = date.today()
    
    # 1. Mark expired licenses
    expired_licenses = await db.execute(
        update(CredentialVerification)
        .where(
            CredentialVerification.credential_type == 'license',
            CredentialVerification.expiry_date < today,
            CredentialVerification.verification_status == 'approved'
        )
        .values(
            verification_status='expired',
            auto_expired_at=datetime.now(UTC)
        )
    )
    
    logger.info(f"Marked {expired_licenses.rowcount} licenses as expired")
    
    # 2. Send 30-day expiry warnings (first warning)
    thirty_days_from_now = today + timedelta(days=30)
    licenses_expiring_in_30 = await db.execute(
        select(CredentialVerification)
        .where(
            CredentialVerification.credential_type == 'license',
            CredentialVerification.expiry_date == thirty_days_from_now,
            CredentialVerification.verification_status == 'approved',
            CredentialVerification.expiry_warning_sent_at.is_(None)
        )
    )
    
    for license_record in licenses_expiring_in_30.scalars():
        await send_license_expiry_warning(
            license_record, 
            days_remaining=30,
            urgency='normal'
        )
        license_record.expiry_warning_sent_at = datetime.now(UTC)
    
    # 3. Send 7-day urgent warnings
    seven_days_from_now = today + timedelta(days=7)
    licenses_expiring_in_7 = await db.execute(
        select(CredentialVerification)
        .where(
            CredentialVerification.credential_type == 'license',
            CredentialVerification.expiry_date == seven_days_from_now,
            CredentialVerification.verification_status == 'approved'
        )
    )
    
    for license_record in licenses_expiring_in_7.scalars():
        await send_license_expiry_warning(
            license_record,
            days_remaining=7,
            urgency='urgent'
        )
    
    await db.commit()
```

---

## Admin Verification Workflow

### Admin Dashboard: Verification Queue

**New Page**: `/admin/verifications`

**Tabs**:
1. **Identity Verification** — Government ID uploads (highest priority)
2. **Education** — Academic degrees (no expiry)
3. **Certificates** — Professional training (optional expiry)
4. **Licenses** — Legal permits (mandatory expiry, highest risk)
5. **Expiring Licenses** — Proactive monitoring (30-day warning list)

### Tab 1: Identity Verification Queue

```
┌──────────────────────────────────────────────────────────────┐
│ Identity Verification Queue (12 pending)                      │
├──────────────────────────────────────────────────────────────┤
│ Professional  | Tier | Submitted     | Document | Actions    │
├──────────────────────────────────────────────────────────────┤
│ Arjun Mehta   | Pro  | 2 hours ago  | [View]   | [✅ ❌]    │
│ Priya Sharma  | Free | 5 hours ago  | [View]   | [✅ ❌]    │
│ Raj Kumar     | Elite| 1 day ago    | [View]   | [✅ ❌]    │
└──────────────────────────────────────────────────────────────┘

[Click "View" opens modal with document preview + approve/reject actions]
```

**Review Modal:**
```
┌──────────────────────────────────────────────────────┐
│ Professional: Arjun Mehta (Pro)                      │
│ Document Type: Aadhaar Card                          │
├──────────────────────────────────────────────────────┤
│ [Document Preview - Full-screen image/PDF viewer]    │
│                                                      │
│ Submitted: 2 hours ago                               │
│ Grace Period Expires: 5 days remaining               │
├──────────────────────────────────────────────────────┤
│ Admin Actions:                                       │
│ [✅ Approve] [❌ Reject with Reason]                 │
│                                                      │
│ Rejection Reasons (dropdown):                        │
│ • Document is unclear or unreadable                  │
│ • Document appears altered or fraudulent             │
│ • Name does not match professional profile           │
│ • Document expired (if passport/license)             │
│ • Other: [custom reason field]                       │
└──────────────────────────────────────────────────────┘
```

### Tab 4: License Verification Queue

```
┌──────────────────────────────────────────────────────────────────────┐
│ License Verification Queue (8 pending)                                │
├──────────────────────────────────────────────────────────────────────┤
│ Professional | Profession  | License Type    | Expires | Actions     │
├──────────────────────────────────────────────────────────────────────┤
│ Dr. Arjun    | Doctor      | MCI License     | Dec 2026| [Review]    │
│ Priya S.     | Dietitian   | IDA License     | Nov 2026| [Review]    │
│ Raj K.       | Psychologist| RCI License     | Jan 2027| [Review]    │
└──────────────────────────────────────────────────────────────────────┘
```

**License Review Modal:**
```
┌──────────────────────────────────────────────────────┐
│ Professional: Dr. Arjun Mehta (Doctor)               │
│ License: Medical Council of India Registration       │
├──────────────────────────────────────────────────────┤
│ Submitted Details:                                   │
│ • License Number: MCI-12345678                       │
│ • Issuing Authority: Medical Council of India        │
│ • Issued: Jan 15, 2020                               │
│ • **Expires: Dec 31, 2026** (257 days remaining)     │
│ • Registry Link: https://mciindia.org/verify/...     │
│   [✅ Auto-verified via MCI API]                     │
│ • Uploaded Document: license.pdf [View]              │
├──────────────────────────────────────────────────────┤
│ Auto-Verification Status:                            │
│ ✅ Verified via MCI API (license number confirmed)   │
│ ✅ License status: Active                            │
│ ⚠️ Expiry date approaching (renewal required by Dec) │
├──────────────────────────────────────────────────────┤
│ Admin Actions:                                       │
│ [✅ Approve with Expiry Tracking]                    │
│ [❌ Reject (Reason: _______)]                        │
│                                                      │
│ Notes:                                               │
│ • Expiry warning will be sent 30 days before Dec 31  │
│ • Professional will be delisted if not renewed       │
└──────────────────────────────────────────────────────┘
```

### Tab 5: Expiring Licenses (Proactive Monitoring)

```
┌──────────────────────────────────────────────────────────────────────┐
│ ⚠️ Licenses Expiring Soon (30-day window)                            │
├──────────────────────────────────────────────────────────────────────┤
│ Professional | License Type    | Expires     | Warning Sent | Action │
├──────────────────────────────────────────────────────────────────────┤
│ Dr. Arjun    | MCI License     | Dec 31 (257d)| ✅ 30-day   | —      │
│ Priya S.     | IDA License     | Nov 15 (210d)| ❌ Not yet  | [Send] │
│ Meera J.     | RCI License     | Nov 1 (196d) | ❌ Not yet  | [Send] │
└──────────────────────────────────────────────────────────────────────┘

[Admin can manually send renewal reminder if automated job missed it]
```

---

## Professional Dashboard UX

### Profile Studio: Practice Tab Enhancements

**Section 1: Identity Verification (New)**
```
┌─────────────────────────────────────────────────────┐
│ 🪪 Identity Verification                            │
├─────────────────────────────────────────────────────┤
│ ⚠️ Required to appear in search results             │
│                                                     │
│ Status: ✅ Verified (Approved on April 10, 2026)    │
│ Document: Aadhaar Card (deleted for security)      │
│                                                     │
│ [No action needed - verified]                       │
└─────────────────────────────────────────────────────┘
```

**Section 2: Education (Enhanced)**
```
┌─────────────────────────────────────────────────────┐
│ 🎓 Education (Academic Degrees)                     │
├─────────────────────────────────────────────────────┤
│ BSc Nutrition & Dietetics                           │
│ University of Mumbai • 2018                         │
│ Status: ✅ Verified (April 15, 2026)                │
│ [View Certificate] [Remove]                         │
│                                                     │
│ ─────────────────────────────────────────────────── │
│                                                     │
│ MSc Clinical Nutrition                              │
│ University of Delhi • 2020                          │
│ Status: 📋 Pending Verification (submitted today)   │
│ [View Uploaded Document]                            │
│                                                     │
│ ─────────────────────────────────────────────────── │
│                                                     │
│ [➕ Add Education]                                  │
└─────────────────────────────────────────────────────┘
```

**Section 3: Certificates (Enhanced)**
```
┌─────────────────────────────────────────────────────┐
│ 📜 Professional Certificates                        │
├─────────────────────────────────────────────────────┤
│ Yoga Teacher Training (200hr)                       │
│ Yoga Alliance • 2022                                │
│ Registry: https://yogaalliance.org/verify/ABC123    │
│ Status: ✅ Auto-Verified via Yoga Alliance API      │
│ [View on Yoga Alliance] [Remove]                    │
│                                                     │
│ ─────────────────────────────────────────────────── │
│                                                     │
│ Certified Personal Trainer                          │
│ NASM • 2020 • Expires: Dec 2025                     │
│ Status: ⚠️ Expired (renewal required)               │
│ [Upload Renewed Certificate]                        │
│                                                     │
│ ─────────────────────────────────────────────────── │
│                                                     │
│ Advanced Sports Nutrition                           │
│ ISSN • 2021                                         │
│ Status: ❌ Rejected (Document unclear)              │
│ Reason: "Please upload a higher-resolution scan"    │
│ [Re-upload Certificate]                             │
│                                                     │
│ ─────────────────────────────────────────────────── │
│                                                     │
│ [➕ Add Certificate]                                │
└─────────────────────────────────────────────────────┘
```

**Section 4: Licenses (New - Critical for Regulated Professions)**
```
┌─────────────────────────────────────────────────────┐
│ 🪪 Professional Licenses ⚠️ REQUIRED                │
├─────────────────────────────────────────────────────┤
│ ⚠️ Your profession (Dietitian) requires an active   │
│    license to appear in search results.             │
│                                                     │
│ Indian Dietetic Association License                 │
│ License #: 12345 • Issued: Jan 2020                 │
│ **Expires: Dec 31, 2026** (257 days remaining)      │
│ Status: ✅ Verified & Active                        │
│                                                     │
│ [Upload Renewed License] [View Current License]     │
│                                                     │
│ ─────────────────────────────────────────────────── │
│                                                     │
│ 💡 Renewal Reminder:                                │
│ We'll email you 30 days before expiry. Renew your   │
│ license before Dec 31 to avoid being delisted.      │
│                                                     │
│ ─────────────────────────────────────────────────── │
│                                                     │
│ [➕ Add License]                                    │
└─────────────────────────────────────────────────────┘
```

### Dashboard Banners: License Expiry Warnings

**30 Days Before Expiry:**
```
┌──────────────────────────────────────────────────────┐
│ ⚠️ Your Dietitian License expires in 30 days        │
│ Renew before Dec 31 to avoid being delisted.        │
│ [Upload Renewed License] [Dismiss]                  │
└──────────────────────────────────────────────────────┘
```

**7 Days Before Expiry:**
```
┌──────────────────────────────────────────────────────┐
│ 🔴 URGENT: Your license expires in 7 days           │
│ Upload renewed license now to stay visible.         │
│ [Upload Now] [Contact Support]                      │
└──────────────────────────────────────────────────────┘
```

**After Expiry (Delisted State):**
```
┌──────────────────────────────────────────────────────┐
│ ❌ Your license expired. You are hidden from search. │
│ Upload renewed license to restore visibility.       │
│ [Upload Renewed License] [Contact Support]          │
└──────────────────────────────────────────────────────┘
```

---

## Search Visibility Enforcement

### Updated Discovery Filters

```python
# backend/app/services/professionals.py

def _discovery_filters() -> tuple:
    """
    Filters for which professionals appear in search results.
    
    Returns tuple of SQLAlchemy WHERE clauses.
    """
    return (
        # Existing filters
        User.user_status == "verified",
        Professional.profile_completeness >= _DISCOVERY_MIN_PROFILE_COMPLETENESS,
        
        # NEW: Identity verification requirement
        or_(
            # Identity verified
            exists(
                select(1)
                .select_from(ProfessionalIdentityVerification)
                .where(
                    ProfessionalIdentityVerification.user_id == Professional.user_id,
                    ProfessionalIdentityVerification.verification_status == "approved"
                )
            ),
            # OR still in grace period (and not rejected)
            and_(
                exists(
                    select(1)
                    .select_from(ProfessionalIdentityVerification)
                    .where(
                        ProfessionalIdentityVerification.user_id == Professional.user_id,
                        ProfessionalIdentityVerification.grace_period_expires_at > func.now(),
                        ProfessionalIdentityVerification.verification_status != "rejected"
                    )
                )
            )
        ),
        
        # NEW: License compliance check (critical for regulated professions)
        or_(
            # No license required for this profession
            not_(
                exists(
                    select(1)
                    .select_from(ProfessionLicenseRequirement)
                    .where(
                        ProfessionLicenseRequirement.profession == Professional.profession_type,
                        ProfessionLicenseRequirement.is_mandatory == true
                    )
                )
            ),
            
            # License required AND professional has valid (non-expired) license
            and_(
                exists(
                    select(1)
                    .select_from(ProfessionLicenseRequirement)
                    .where(
                        ProfessionLicenseRequirement.profession == Professional.profession_type,
                        ProfessionLicenseRequirement.is_mandatory == true
                    )
                ),
                exists(
                    select(1)
                    .select_from(CredentialVerification)
                    .where(
                        CredentialVerification.professional_id == Professional.user_id,
                        CredentialVerification.credential_type == 'license',
                        CredentialVerification.verification_status == 'approved',
                        or_(
                            CredentialVerification.expiry_date.is_(None),  # No expiry (edge case)
                            CredentialVerification.expiry_date >= func.current_date()  # Not expired
                        )
                    )
                )
            )
        )
    )
```

### What This Means

**For search visibility, a professional must:**
1. Have `user_status = "verified"` (profile completeness >75%)
2. Have identity verified (OR still in 7-day grace period)
3. **IF their profession requires a license → MUST have valid, non-expired license**

**Example Scenarios:**

| Professional | Profession | Identity Verified | License Status | Visible in Search? |
|--------------|-----------|-------------------|----------------|--------------------|
| Yoga instructor | yoga_instructor | ✅ Yes | N/A (license not required) | ✅ Yes |
| Doctor | doctor | ✅ Yes | Approved, expires in 6 months | ✅ Yes |
| Doctor | doctor | ✅ Yes | Expired 8 days ago | ❌ **NO** |
| Dietitian | dietitian | ❌ No (grace period active) | Approved, valid | ⚠️ Yes (grace period) |
| Dietitian | dietitian | ✅ Yes | Pending admin approval | ❌ **NO** (license not approved yet) |

---

## Automated Verification (Phase 2)

### API Integrations Roadmap

| Provider | Credential Type | Status | Integration Complexity |
|----------|----------------|--------|------------------------|
| **Digilocker (Aadhaar eKYC)** | Identity | Phase 2 | Medium (govt API, requires partnership) |
| **Medical Council of India** | License (doctor) | Phase 2 | High (state-level councils, no unified API yet) |
| **Rehabilitation Council of India** | License (psychologist) | Phase 2 | Medium (central registry available) |
| **Yoga Alliance** | Certificate (yoga) | Phase 2 | Low (public API available) |
| **NASM / ACE** | Certificate (fitness) | Phase 3 | Medium (requires partnership) |

### Auto-Verification Flow

```python
# backend/app/services/verification/orchestrator.py

async def attempt_auto_verification(
    db: AsyncSession,
    verification_id: int
):
    """
    Attempt automated verification via external API.
    Falls back to manual review if API unavailable or fails.
    """
    verification = await db.get(CredentialVerification, verification_id)
    
    # 1. Determine if auto-verification is available
    provider = _get_provider_for_credential(verification)
    if provider is None:
        # No automation available, stay in manual queue
        logger.info(f"No auto-verification provider for {verification.credential_subtype}")
        return
    
    try:
        # 2. Call external API
        result = await provider.verify_credential(
            license_number=verification.license_number,
            registry_link=verification.registry_link,
            issued_date=verification.issued_date
        )
        
        # 3. Process result
        if result.status == "verified" and result.confidence_score > 0.9:
            verification.verification_status = "auto_verified"
            verification.verification_method = provider.name
            verification.verified_at = datetime.now(UTC)
            await db.commit()
            
            logger.info(f"Auto-verified credential {verification_id} via {provider.name}")
            
        elif result.status == "not_found" or result.confidence_score < 0.5:
            # High confidence failure → auto-reject
            verification.verification_status = "rejected"
            verification.rejection_reason = f"Auto-verification failed: {result.reason}"
            await db.commit()
            
        # else: Low confidence → leave in manual queue for human review
        
    except ProviderAPIError as exc:
        # Transient error → retry later
        logger.error(f"Auto-verification API error for {verification_id}: {exc}")
        # Leave in pending state for manual review
```

---

## User-Facing Trust Signals

### Verification Badges

**Displayed on professional profile pages + search results**

| Tier | Badge | Description | Visual |
|------|-------|-------------|--------|
| **Free** | ✅ Verified | "Identity verified by Wolistic" | Green checkmark next to name |
| **Pro** | ✅ Pro Verified | "Credentials verified by Wolistic" | Gold shield with checkmark |
| **Elite** | 👑 Elite Verified | "Premium credentials verified" | Crown + shield icon |
| **Celeb** | ⭐ Celeb Verified | "Exclusive partnership verified" | Animated star badge |

### Credential Display (Professional Profile Sidebar)

```
┌─────────────────────────────────────┐
│ 🏆 Verified Credentials             │
├─────────────────────────────────────┤
│ ✅ Medical Council License          │
│    MCI-12345678 • Valid until Dec 26│
│    [Verified by Wolistic]           │
│                                     │
│ ✅ BSc Nutrition & Dietetics        │
│    University of Mumbai • 2018      │
│    [Verified by Wolistic]           │
│                                     │
│ ✅ Yoga Teacher Training (200hr)    │
│    Yoga Alliance • 2022             │
│    [Auto-verified via Yoga Alliance]│
│                                     │
│ 📋 Advanced Sports Nutrition        │
│    ISSN • 2021                      │
│    [Pending Verification]           │
│                                     │
│ ⚠️ CPR Certification                │
│    Red Cross • Expired Nov 2025     │
│    [Renewal Required]               │
└─────────────────────────────────────┘

Legend:
✅ Verified   📋 Pending   ⚠️ Expired   ❌ Rejected (only visible to professional)
```

### Trust Signal on Search Cards

```
┌───────────────────────────────────────┐
│ Dr. Arjun Mehta ✅ Pro Verified       │
│ Nutritionist & Wellness Coach         │
│ ⭐ 4.9 (120 reviews)                  │
│ 📋 5 credentials verified             │
│ 🪪 Licensed Dietitian (IDA)           │
│ 📍 Koramangala, Bangalore             │
│ [Book Consultation]                   │
└───────────────────────────────────────┘
```

---

## Implementation Phases

### Phase 1: Foundation (Must Ship — 2 Weeks)

**Goal**: Restore trust claim with manual verification system.

**Scope**:
- ✅ Database migrations (identity + credential verification tables)
- ✅ Supabase Storage buckets (identity-documents, credential-documents)
- ✅ Backend API endpoints (upload intent, confirm upload, admin approve/reject)
- ✅ Professional dashboard upload UI (Profile Studio enhancements)
- ✅ Admin dashboard verification queue (identity + credentials tabs)
- ✅ Search enforcement (identity verification required)
- ✅ Backfill existing professionals with 7-day grace period
- ✅ Documentation (API reference, admin workflow guide)

**What Ships**:
- Identity verification (government ID) for all professionals
- Education, certificate, license upload with manual admin review
- Search visibility gating on identity verification
- Rejection reasons + re-upload flow
- 30-day auto-delete for identity documents (compliance)

**What's Deferred**:
- Automated API verification (Phase 2)
- License expiry email notifications (Phase 2)
- Tier upgrade enforcement (Phase 1.5)

**Timeline**: 2 weeks (10 working days)

**Success Metric**: 70% of Pro+ professionals have ≥1 verified credential within 30 days

---

### Phase 1.5: License Compliance (3 Weeks Post-Launch)

**Goal**: Full license expiry tracking + auto-enforcement.

**Scope**:
- ✅ Daily cron job for license expiry check
- ✅ Email notifications (30-day, 7-day, expired)
- ✅ Search enforcement for expired licenses
- ✅ "Expiring Licenses" admin queue tab
- ✅ Professional dashboard expiry warnings
- ✅ Grace period enforcement (7-day delisting delay)

**Timeline**: 1 week of development + 2 weeks of monitoring

**Success Metric**: 95% of professionals with regulated professions have valid licenses

---

### Phase 2: Automation & Scale (4-6 Weeks Post-Phase 1)

**Goal**: Reduce admin burden with automated API verification.

**Scope**:
- Digilocker integration (Aadhaar eKYC for identity)
- Yoga Alliance API integration (certificate auto-verification)
- RCI API integration (psychologist license verification)
- Auto-approve logic with confidence scoring
- Fallback to manual review for edge cases
- Credential expiry tracking for time-limited certificates
- Usage analytics dashboard (verification funnel, rejection rates)

**Timeline**: 4-6 weeks

**Success Metric**: 40% of verifications auto-approved via API, <12hr avg admin review time for manual queue

---

### Phase 3: Premium Features (3+ Months)

**Goal**: Monetize verification as tier differentiator.

**Scope**:
- Verification API for third-party platforms (corporate wellness portals can query verification status)
- Professional verification portfolio PDF export ("Verified by Wolistic" certificate)
- User-facing verification history timeline
- Multi-language support for international credentials
- Background check integration (criminal records for regulated professions)

**Timeline**: TBD after Phase 2 validation

---

## API Specifications

### Professional Endpoints

#### 1. Upload Identity Document (Intent Pattern)

```http
POST /api/v1/partners/me/verification/identity/upload-intent
Authorization: Bearer {professional_token}
```

**Request**:
```json
{
  "document_type": "aadhaar",
  "file_name": "aadhaar_card.pdf",
  "file_size": 2048576
}
```

**Response**:
```json
{
  "upload_url": "https://supabase.co/storage/v1/object/identity-documents/...",
  "verification_id": "uuid-...",
  "expires_at": "2026-04-18T12:00:00Z"
}
```

**Validations**:
- ✅ User authenticated as professional
- ✅ File size <10MB
- ✅ File type: PDF, JPG, PNG
- ❌ 409 if identity already verified (approved state)

---

#### 2. Confirm Identity Upload

```http
POST /api/v1/partners/me/verification/identity/confirm
Authorization: Bearer {professional_token}
```

**Request**:
```json
{
  "verification_id": "uuid-...",
  "document_url": "identity-documents/partner/{user_id}/aadhaar_123.pdf"
}
```

**Response**:
```json
{
  "verification_id": "uuid-...",
  "status": "pending",
  "submitted_at": "2026-04-18T10:30:00Z",
  "grace_period_expires_at": "2026-04-25T10:30:00Z"
}
```

---

#### 3. Upload Credential (Education/Certificate/License)

```http
POST /api/v1/partners/me/verification/credentials/upload-intent
Authorization: Bearer {professional_token}
```

**Request**:
```json
{
  "credential_type": "license",
  "credential_subtype": "dietitian_license",
  "credential_name": "Indian Dietetic Association License",
  "issuing_organization": "Indian Dietetic Association",
  "issued_date": "2020-01-15",
  "expiry_date": "2026-12-31",
  "license_number": "12345",
  "registry_link": "https://ida.org.in/verify/12345",
  "file_name": "ida_license.pdf",
  "file_size": 1048576
}
```

**Response**:
```json
{
  "upload_url": "https://supabase.co/storage/v1/object/credential-documents/...",
  "credential_id": 123,
  "expires_at": "2026-04-18T12:00:00Z"
}
```

**Validations**:
- ✅ Tier limits (Pro: max 10 credentials, Elite: unlimited)
- ✅ If `credential_type = 'license'`, `expiry_date` is mandatory
- ✅ File size <5MB

---

#### 4. Get Verification Status

```http
GET /api/v1/partners/me/verification/status
Authorization: Bearer {professional_token}
```

**Response**:
```json
{
  "identity_verification": {
    "status": "approved",
    "verified_at": "2026-04-10T09:00:00Z",
    "grace_period_expires_at": null
  },
  "credentials": {
    "total": 5,
    "approved": 3,
    "pending": 1,
    "rejected": 1,
    "expired": 0
  },
  "licenses": [
    {
      "id": 101,
      "credential_name": "IDA License",
      "license_number": "12345",
      "status": "approved",
      "expiry_date": "2026-12-31",
      "days_until_expiry": 257,
      "warning_level": "normal"
    }
  ],
  "tier_requirements": {
    "current_tier": "pro",
    "requirements_met": true,
    "next_tier": "elite",
    "requirements_for_next_tier": {
      "credentials_required": 3,
      "credentials_current": 3,
      "education_required": 1,
      "education_current": 0
    }
  }
}
```

---

### Admin Endpoints

#### 1. List Pending Verifications

```http
GET /api/v1/admin/verifications/pending
?type=identity&limit=50&offset=0
Authorization: X-Admin-Key: {admin_api_key}
```

**Query Params**:
- `type`: `identity` | `credential` | `all` (default: `all`)
- `limit`: int (default: 50, max: 100)
- `offset`: int (default: 0)

**Response**:
```json
{
  "total": 120,
  "results": [
    {
      "verification_type": "identity",
      "verification_id": "uuid-...",
      "professional": {
        "user_id": "uuid-...",
        "name": "Arjun Mehta",
        "email": "arjun@example.com",
        "tier": "pro"
      },
      "document_url": "https://supabase.co/storage/signed-url/...",  // 1hr signed URL
      "document_type": "aadhaar",
      "submitted_at": "2026-04-18T08:00:00Z"
    },
    {
      "verification_type": "credential",
      "credential_id": 123,
      "professional": { ... },
      "credential_details": {
        "type": "license",
        "subtype": "dietitian_license",
        "name": "IDA License",
        "license_number": "12345",
        "expiry_date": "2026-12-31"
      },
      "document_url": "...",
      "registry_link": "https://ida.org.in/verify/12345",
      "submitted_at": "2026-04-18T09:00:00Z"
    }
  ]
}
```

---

#### 2. Approve Identity Verification

```http
POST /api/v1/admin/verifications/identity/{verification_id}/approve
Authorization: X-Admin-Key: {admin_api_key}
```

**Request**:
```json
{
  "notes": "Aadhaar verified. Name matches profile."
}
```

**Response**:
```json
{
  "verification_id": "uuid-...",
  "status": "approved",
  "verified_at": "2026-04-18T10:30:00Z",
  "verified_by": "admin_user_id",
  "document_auto_delete_at": "2026-05-18T10:30:00Z"  // 30 days from now
}
```

**Side Effects**:
- `users.user_status = 'verified'` (if not already)
- `document_deleted_at` scheduled 30 days from now
- Professional visible in search (if not in grace period already)

---

#### 3. Reject Verification

```http
POST /api/v1/admin/verifications/{verification_id}/reject
Authorization: X-Admin-Key: {admin_api_key}
```

**Request**:
```json
{
  "verification_type": "credential",
  "rejection_reason": "Document is unclear. Please upload a higher-resolution scan."
}
```

**Response**:
```json
{
  "verification_id": "uuid-...",
  "status": "rejected",
  "rejection_reason": "...",
  "rejected_at": "2026-04-18T10:30:00Z",
  "rejected_by": "admin_user_id"
}
```

**Side Effects**:
- Professional receives email notification with rejection reason
- Professional can re-upload unlimited times

---

#### 4. List Expiring Licenses

```http
GET /api/v1/admin/verifications/licenses/expiring
?days=30
Authorization: X-Admin-Key: {admin_api_key}
```

**Query Params**:
- `days`: int (default: 30) — licenses expiring within X days

**Response**:
```json
{
  "total": 25,
  "licenses": [
    {
      "credential_id": 123,
      "professional": {
        "user_id": "uuid-...",
        "name": "Dr. Arjun Mehta",
        "profession": "doctor"
      },
      "credential_name": "MCI License",
      "license_number": "MCI-12345678",
      "expiry_date": "2026-12-31",
      "days_until_expiry": 257,
      "warning_sent_at": "2026-03-15T09:00:00Z",  // 30-day warning already sent
      "status": "approved"
    }
  ]
}
```

---

## Task Breakdown

### Phase 1: Foundation (2-Week Sprint)

#### Week 1: Backend Foundation (Days 1-5)

| # | Task | Owner | Depends On | Done Criteria |
|---|------|-------|------------|---------------|
| **1.1** | Create migration: `professional_identity_verification` table | Backend | — | Table created with all columns, indexes, constraints as per schema |
| **1.2** | Create migration: `credential_verifications` table | Backend | — | Table created with credential_type enum, all columns, indexes |
| **1.3** | Create migration: `profession_license_requirements` table | Backend | 1.2 | Table created with seed data for doctor, dietitian, physiotherapist, psychologist, yoga_instructor |
| **1.4** | Add Supabase Storage buckets via SQL | Backend | — | `identity-documents` and `credential-documents` buckets created with RLS policies |
| **1.5** | Backfill migration: Grace period for existing professionals | Backend | 1.1 | All existing professionals get `grace_period_expires_at = NOW() + 7 days` |
| **1.6** | Create Pydantic schemas for verification endpoints | Backend | — | Schemas in `app/schemas/verification.py` for all request/response models |
| **1.7** | Professional API: Identity upload intent endpoint | Backend | 1.1, 1.6 | `POST /partners/me/verification/identity/upload-intent` returns signed URL |
| **1.8** | Professional API: Identity upload confirm endpoint | Backend | 1.1, 1.7 | `POST /partners/me/verification/identity/confirm` creates pending record |
| **1.9** | Professional API: Credential upload intent endpoint | Backend | 1.2, 1.6 | `POST /partners/me/verification/credentials/upload-intent` returns signed URL |
| **1.10** | Professional API: Credential upload confirm endpoint | Backend | 1.2, 1.9 | `POST /partners/me/verification/credentials/confirm` creates pending record |
| **1.11** | Professional API: Get verification status endpoint | Backend | 1.1, 1.2 | `GET /partners/me/verification/status` returns identity + credentials summary |
| **1.12** | Admin API: List pending verifications endpoint | Backend | 1.1, 1.2 | `GET /admin/verifications/pending` with filters, pagination, signed URLs |
| **1.13** | Admin API: Approve identity verification endpoint | Backend | 1.1 | `POST /admin/verifications/identity/{id}/approve` updates status, schedules deletion |
| **1.14** | Admin API: Approve credential verification endpoint | Backend | 1.2 | `POST /admin/verifications/credentials/{id}/approve` updates status |
| **1.15** | Admin API: Reject verification endpoint | Backend | 1.1, 1.2 | `POST /admin/verifications/{id}/reject` with reason, sends notification |
| **1.16** | Update `_discovery_filters()` with identity + license checks | Backend | 1.1, 1.2, 1.3 | Search filters enforce identity verification + license compliance |

#### Week 2: Frontend + Admin UI (Days 6-10)

| # | Task | Owner | Depends On | Done Criteria |
|---|------|-------|------------|---------------|
| **2.1** | Design: Rejection reason templates | Design | — | 5 templates per document type (identity, education, certificate, license) |
| **2.2** | Design: Verification badge SVGs | Design | — | 4 badge designs (Verified, Pro Verified, Elite Verified, Celeb Verified) |
| **2.3** | Design: Pending/approved/rejected state UI patterns | Design | — | UI mockups for all credential states in Profile Studio |
| **2.4** | Professional Dashboard: Identity verification upload UI | Frontend | 1.7, 1.8 | New section in Profile Studio with drag-drop upload, status display |
| **2.5** | Professional Dashboard: Credential upload UI (education, certificates, licenses) | Frontend | 1.9, 1.10 | Multi-credential upload form with type selection, expiry date for licenses |
| **2.6** | Professional Dashboard: Verification status card | Frontend | 1.11, 2.2 | Status card showing identity + credential counts, badge display, tier progress |
| **2.7** | Professional Dashboard: Rejection handling UI | Frontend | 1.15, 2.1 | Rejection notification card with reason, re-upload CTA |
| **2.8** | Admin Dashboard: Verification queue page scaffold | Admin Dashboard | — | New page `/admin/verifications` with 5 tabs (Identity, Education, Certificates, Licenses, Expiring) |
| **2.9** | Admin Dashboard: Identity verification queue UI | Admin Dashboard | 1.12, 1.13, 1.15, 2.8 | Table + review modal with document preview, approve/reject actions |
| **2.10** | Admin Dashboard: Credential verification queues (3 tabs) | Admin Dashboard | 1.12, 1.14, 1.15, 2.8 | Separate tabs for education, certificates, licenses with type-specific columns |
| **2.11** | Admin Dashboard: Expiring licenses queue | Admin Dashboard | 1.12, 2.8 | Proactive monitoring tab showing licenses expiring in 30 days |
| **2.12** | API Client: Verification endpoints (frontend) | Frontend | 1.7-1.11 | TypeScript API client in `lib/verification-api.ts` |
| **2.13** | API Client: Admin verification endpoints | Admin Dashboard | 1.12-1.15 | TypeScript API client in `wolistic-admin/lib/admin-verification-api.ts` |
| **2.14** | Documentation: API reference | Backend | 1.7-1.15 | New `VERIFICATION_API.md` with all endpoints documented |
| **2.15** | Documentation: Admin workflow guide | Admin Dashboard | 2.9-2.11 | `ADMIN_VERIFICATION_WORKFLOW.md` with screenshots, decision trees |

#### Week 2: QA & Testing (Days 8-10, parallel)

| # | Task | Owner | Depends On | Done Criteria |
|---|------|-------|------------|---------------|
| **2.16** | Backend: Unit tests for verification endpoints | QA | 1.7-1.15 | Test coverage ≥80% for all verification services |
| **2.17** | Backend: Integration tests for admin approval/rejection | QA | 1.13-1.15 | E2E tests for approve/reject flows, verify status updates |
| **2.18** | Frontend: UI tests for upload workflow | QA | 2.4-2.7 | Test upload intent → confirm flow, error handling |
| **2.19** | Admin: UI tests for verification queue | QA | 2.9-2.11 | Test queue pagination, approve/reject actions, filters |
| **2.20** | End-to-End: Full verification journey | QA | All Phase 1 | New professional → upload ID → admin approves → search visible |

---

### Phase 1.5: License Compliance (1-Week Development + 2-Week Monitoring)

| # | Task | Owner | Depends On | Done Criteria |
|---|------|-------|------------|---------------|
| **3.1** | Backend: Daily license expiry cron job | Backend | Phase 1 complete | Scheduled task marks expired licenses, sends warnings |
| **3.2** | Email: License expiry warning templates (30-day, 7-day, expired) | Backend | 3.1 | Three email templates sent automatically via SendGrid/SES |
| **3.3** | Professional Dashboard: License expiry warning banners | Frontend | 3.1 | Dashboard banners for 30-day, 7-day, expired states |
| **3.4** | Admin Dashboard: Expiring licenses proactive queue | Admin Dashboard | 3.1 | "Send Reminder" action for manual intervention |
| **3.5** | Backend: Auto-delete expired identity documents cron job | Backend | 1.1 | Daily job deletes documents 30 days after approval |
| **3.6** | Monitoring: License expiry alerts | Backend | 3.1 | Slack alerts if >5 professionals delisted in 1 day |

---

### Phase 2: Automation (4-6 Weeks)

| # | Task | Owner | Depends On | Done Criteria |
|---|------|-------|------------|---------------|
| **4.1** | Research: India credential verification APIs | Backend | Phase 1.5 complete | Evaluation report for Digilocker, MCI, RCI, Yoga Alliance APIs |
| **4.2** | Backend: Auto-verification orchestrator service | Backend | 4.1 | Service attempts API verification, falls back to manual queue |
| **4.3** | Backend: Digilocker integration (Aadhaar eKYC) | Backend | 4.1, 4.2 | Identity auto-verification via Digilocker API |
| **4.4** | Backend: Yoga Alliance API integration | Backend | 4.1, 4.2 | Certificate auto-verification via registry lookup |
| **4.5** | Backend: RCI API integration (psychologist licenses) | Backend | 4.1, 4.2 | License auto-verification via RCI registry |
| **4.6** | Analytics: Verification funnel dashboard | Backend | Phase 1.5 complete | Admin dashboard showing upload → approval conversion rates |
| **4.7** | Email: Verification approved/rejected notifications | Backend | Phase 1.5 complete | Transactional emails for all verification state changes |

---

## Success Metrics

### Phase 1 Launch Targets (30 Days Post-Launch)

| Metric | Target | Measurement |
|--------|--------|-------------|
| **% of Professionals Verified** | 80% of Free, 95% of Pro+, 100% of Elite/Celeb | `SELECT COUNT(*) WHERE identity verified / COUNT(*)` |
| **Avg Time to Verify (Admin)** | <24 hours | Median `verified_at - submitted_at` |
| **Credential Verification Rate** | 70% of Pro+ have ≥1 verified credential | Count distinct professionals with approved credentials |
| **Re-submission Rate** | <20% | Count rejected → re-uploaded / total rejected |
| **License Compliance Rate** | 100% of regulated professionals have valid license | Count professionals with `profession_type` requiring license AND approved license |

### Phase 1.5 Targets (60 Days Post-Launch)

| Metric | Target | Measurement |
|--------|--------|-------------|
| **License Renewal Rate** | >95% renew within 30 days of expiry warning | Count renewals / count warnings sent |
| **Delisted Professionals (Expired License)** | 0 | Count professionals hidden from search due to expired license |
| **Auto-Enforcement Accuracy** | 100% (no false positives) | Manual audit of delisted professionals |

### Phase 2 Targets (90 Days Post-Launch)

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Auto-Verification Rate** | >60% of medical/RCI licenses verified via API | Count auto_verified / total approved |
| **Admin Review Time** | <12 hours for manual queue | p50 time from submission to approval |
| **Verification Completion Rate** | 95% of professionals fully verified | All required credentials approved per tier |

---

## Legal Compliance

### Regulated Professions in India

**Mandatory License Requirements:**

| Profession | Regulatory Body | License Requirement | Expiry Tracking |
|------------|-----------------|---------------------|-----------------|
| **Doctors** | Medical Council of India (MCI) | MCI registration number, state medical council | Annual renewal |
| **Dietitians** | Indian Dietetic Association (IDA) | IDA license number | Annual renewal |
| **Physiotherapists** | Indian Association of Physiotherapists (IAP) | IAP license | Annual renewal |
| **Psychologists/Counselors** | Rehabilitation Council of India (RCI) | RCI registration number | 5-year renewal |
| **Nurses** | State Nursing Council | Nursing license (state-specific) | Annual renewal |

**Unregulated (Certificate-Based):**
- Yoga instructors (Yoga Alliance certification recommended but not legally required)
- Fitness trainers (ACE, NASM certifications)
- Meditation instructors
- Life coaches

### Platform Liability

**Wolistic must verify licenses for regulated professions to avoid:**
1. Legal exposure (facilitating unlicensed practice of medicine/healthcare)
2. User harm (unqualified practitioners offering regulated services)
3. Regulatory penalties (MCI, state health departments can audit platforms)

**If a professional's license expires → immediate delisting from search is legally required.**

---

## Edge Cases & Resolutions

### Edge Case 1: Professional Uploads Fake License

**Scenario**: Professional uploads Photoshopped license document.

**Resolution**:
- Admin rejects with reason: "License appears altered. Please contact support."
- If registry link provided → admin verifies via external website
- Phase 2: Auto-verification via API eliminates this risk

---

### Edge Case 2: License Expires Mid-Session Booking

**Scenario**: Professional's license expires Dec 31. Client books session for Jan 5.

**Resolution**:
- Booking allowed if license valid at booking time
- If license expires before session date → professional must renew or cancel session
- Refund policy applies if professional delisted before session

---

### Edge Case 3: Professional Has Multiple Licenses (Different States)

**Scenario**: Doctor has MCI license + Karnataka state medical council license.

**Resolution**:
- Professional can upload multiple licenses (no unique constraint violation)
- Both tracked separately with individual expiry dates
- Search visibility requires at least ONE valid license

---

### Edge Case 4: Admin Accidentally Rejects Valid Document

**Scenario**: Admin clicks "Reject" on valid Aadhaar card.

**Resolution**:
- Professional re-uploads same document
- Admin sees rejection history in review modal: "Previously rejected on [date] by [admin]"
- Second admin can approve after reviewing rejection reason

---

### Edge Case 5: Professional Downgrades Tier, Loses Credential Requirement

**Scenario**: Elite professional downgrades to Free. Had 5 verified credentials.

**Resolution**:
- Credentials remain verified (no deletion)
- Badge downgrades to "Verified" (not "Elite Verified")
- Credentials still visible on profile (trust signal remains)

---

### Edge Case 6: License Expiry During Grace Period

**Scenario**: Professional's license expires on Day 3 of 7-day grace period.

**Resolution**:
- Grace period voided immediately
- Professional delisted from search
- Dashboard shows: "License expired. Upload renewed license to restore visibility."

---

### Edge Case 7: Professional Uploads Registry Link, Admin Can't Access

**Scenario**: Professional provides Yoga Alliance link, but admin gets 404 error.

**Resolution**:
- Admin rejects with reason: "Registry link is broken or inaccessible. Please provide a valid link or upload a document instead."
- Professional can choose to upload document instead of registry link

---

### Edge Case 8: Credential Verification Pending for 30+ Days

**Scenario**: Admin hasn't reviewed credential for 1 month.

**Resolution**:
- Phase 1: Professional can contact support
- Phase 1.5: Automated Slack alert to admin team if queue >50 pending items for >7 days
- Phase 2: Auto-escalation to senior admin after 14 days

---

## Technical Debt & Future Considerations

### Known Limitations (Phase 1)

1. **No automated API verification**: All verifications are manual (high admin burden at scale)
2. **No email notifications**: Professionals don't get notified when approved/rejected (Phase 1.5)
3. **No credential expiry for certificates**: Only licenses have expiry tracking (Phase 2)
4. **No professional verification portfolio export**: Cannot generate "Verified by Wolistic" PDF (Phase 3)
5. **No background checks**: No criminal record screening (out of scope for wellness, but required for medical)
6. **Single admin review**: No peer review or senior admin escalation (Phase 2)

### Scalability Considerations

- **Upload intent pattern**: Handles 10,000 concurrent uploads without backend bottleneck
- **Admin queue performance**: Indexed queries <50ms at 10K pending verifications
- **License expiry cron job**: O(n) daily scan, needs optimization if >100K professionals with licenses
- **Signed URL generation**: Rate-limited to prevent abuse (10 requests/min per professional)

### Security Considerations

- **Document fraud detection**: Manual review only (Phase 1), no automated Photoshop detection
- **Identity theft**: Aadhaar number not stored (only hash), document auto-deleted after 30 days
- **Admin access logging**: All approve/reject actions logged in `admin_audit_log` table
- **RLS enforcement**: Professionals can only access their own documents, admins require service role

---

## Glossary

| Term | Definition |
|------|------------|
| **Identity Verification** | Government ID verification (Aadhaar/PAN/Passport) required for all tiers |
| **Credential Verification** | Verification of education, certificates, or licenses |
| **Education** | Academic degree with no expiry (BSc, MSc, PhD) |
| **Certificate** | Professional training with optional expiry (Yoga Teacher Training, CPR) |
| **License** | Legal permit with mandatory expiry and renewal requirement (MCI, IDA, RCI) |
| **Grace Period** | 7-day window after signup before identity verification is enforced |
| **Auto-Delete** | Automatic removal of identity documents 30 days after approval (compliance) |
| **Auto-Verified** | Credential verified via external API without admin review |
| **Expiry Warning** | Automated email sent 30 days before license expiry |
| **Delisting** | Removal from search results (professional still has dashboard access) |
| **Registry Link** | External URL for credential verification (Yoga Alliance, Medical Council) |
| **Rejection Reason Template** | Pre-defined reasons for admin rejections (improves clarity) |
| **Verification Status** | `pending`, `approved`, `rejected`, `expired`, `auto_verified` |

---

## Document History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-04-18 | Initial comprehensive documentation with education/certificate/license taxonomy | System |

---

## Related Documentation

- [Client Manager & AI Routines](.github/instructions/client-manager-ai-routines.instructions.md)
- [Booking Systems: Consultation vs Sessions](AI_DONT_DELETE_BOOKING_CONSULTATION_VS_SESSIONS.md)
- [Subscription Tier Enforcement](../backend/tests/SUBSCRIPTION_TIER_QA_REPORT.md)
- [Payment Module](../memories/repo/payment-module.md)
- [Elite Dashboard](../memories/repo/dashboard-elite.md)

---

**END OF DOCUMENT**
