# Reviews System - UI Specifications (V2 Dashboard)

## Overview
Reviews system for Wolistic v2 dashboard with dual verification levels: "Verified Wolistic Client" (completed booking) vs "Wolistic User" (expert-added client, registered account).

---

## 1. Review Display Section (Public Expert Profile)

### Location
- Expert profile page, below services/bio section
- Desktop: Full width card
- Mobile: Stacked, full width

### Header
```
┌─────────────────────────────────────────────────────┐
│ ⭐ Reviews                                          │
│ 4.8 average · 24 reviews                           │
│                                                     │
│ [All (24)] [Verified Clients (18)] [Wolistic Users (6)] │
└─────────────────────────────────────────────────────┘
```

**Elements:**
- Title: "Reviews" with star icon
- Aggregate: "4.8 average · 24 reviews" (muted text)
- Filter tabs: All / Verified Clients / Wolistic Users
- Default: "All" selected

### Individual Review Card

**Verified Wolistic Client (Green Badge):**
```
┌─────────────────────────────────────────────────────┐
│ [Avatar] Priya Sharma                               │
│          ✓ Verified Wolistic Client                 │  ← Green checkmark + text
│          ⭐⭐⭐⭐⭐ 5.0                                │
│          12-Week Fat Loss Program · Mar 2026        │  ← Service context
│                                                     │
│ "Sarah's program transformed my approach to        │
│  fitness. Lost 15kg in 12 weeks with sustainable   │
│  habits. Highly recommend!"                         │
│                                                     │
│ 2 days ago                            [⋮ More]     │  ← Flag/report in menu
│                                                     │
│ ┌─ Expert Response ─────────────────────────────────┐│
│ │ [Sarah's Avatar] Sarah Chen                      ││
│ │ "Thank you, Priya! So proud of your dedication." ││
│ │ 1 day ago                                        ││
│ └───────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────┘
```

**Wolistic User (Blue Badge):**
```
┌─────────────────────────────────────────────────────┐
│ [Avatar] Amit Kumar                                 │
│          👤 Wolistic User                           │  ← Blue user icon + text
│          ⭐⭐⭐⭐⭐ 5.0                                │
│          Weight Training Program · Jan 2024         │  ← Service context (from client list notes)
│                                                     │
│ "Been training with Sarah since 2024. Incredible   │
│  results and personalized approach."                │
│                                                     │
│ 1 week ago                            [⋮ More]     │
└─────────────────────────────────────────────────────┘
```

### Empty State
```
┌─────────────────────────────────────────────────────┐
│                                                     │
│              No reviews yet.                        │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Design Tokens:**
- Verified badge: `text-emerald-600`, `ShieldCheck` icon, 14px
- Wolistic User badge: `text-sky-600`, `User` icon, 14px
- Service context: `text-zinc-500`, 12px
- Review text: `text-zinc-300`, 14px, leading-relaxed
- Date: `text-zinc-500`, 12px
- Expert response: indent 16px, `bg-white/5`, rounded corner

---

## 2. Review Submission Form (Client Side)

### Location
- Modal/Sheet overlay from expert profile
- OR dedicated page `/reviews/submit?expert={id}`

### Form Layout
```
┌─────────────────────────────────────────────────────┐
│ ✕                                    Review Sarah Chen │
├─────────────────────────────────────────────────────┤
│                                                     │
│ [Sarah's Avatar + Name]                             │
│ 12-Week Fat Loss Program                            │  ← Auto-filled if booking
│                                                     │
│ How would you rate your experience?                │
│ ⭐ ⭐ ⭐ ⭐ ⭐                                        │ ← Interactive stars
│                                                     │
│ Share your experience (optional)                    │
│ ┌───────────────────────────────────────────────┐  │
│ │ What was most helpful about your experience   │  │ ← Placeholder
│ │ with Sarah?                                    │  │
│ │                                                │  │
│ └───────────────────────────────────────────────┘  │
│ 0 / 1000 characters                                │
│                                                     │
│ [Cancel]                        [Submit Review]    │
└─────────────────────────────────────────────────────┘
```

**Validation:**
- Star rating: Required (1-5)
- Review text: Optional, max 1000 chars
- Must be logged in
- Must be in expert's client list OR have completed booking

**Success State:**
```
┌─────────────────────────────────────────────────────┐
│ ✓ Thank you for your review!                        │
│                                                     │
│ Your feedback helps Sarah grow and guides others.  │
│                                                     │
│ [View Sarah's Profile]          [Close]            │
└─────────────────────────────────────────────────────┘
```

---

## 3. Client List Management (Expert Dashboard)

### Location
- Expert dashboard: `/dashboard/clients` OR `/dashboard/reviews/manage-clients`
- Tab: "Client List" alongside "Reviews" tab

### Layout
```
┌─────────────────────────────────────────────────────┐
│ Client List                       [+ Add Client]    │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Manage clients who can review you, even if they    │
│ haven't booked through Wolistic yet.                │
│                                                     │
│ ┌─────────────────────────────────────────────────┐│
│ │ Name             Email              Status       ││
│ ├─────────────────────────────────────────────────┤│
│ │ Priya Sharma     priya@...    ✓ Registered      ││
│ │                               📝 Reviewed        ││
│ │                                         [Remove] ││
│ ├─────────────────────────────────────────────────┤│
│ │ Amit Kumar       amit@...     ⏳ Invited        ││
│ │                               📧 Pending signup  ││
│ │                                   [Resend] [⋮]  ││
│ └─────────────────────────────────────────────────┘│
│                                                     │
│ 18 total clients                                    │
└─────────────────────────────────────────────────────┘
```

### Add Client Modal
```
┌─────────────────────────────────────────────────────┐
│ ✕                                       Add Client   │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Client Name                                         │
│ ┌───────────────────────────────────────────────┐  │
│ │ Priya Sharma                                   │  │
│ └───────────────────────────────────────────────┘  │
│                                                     │
│ Email Address                                       │
│ ┌───────────────────────────────────────────────┐  │
│ │ priya.sharma@example.com                       │  │
│ └───────────────────────────────────────────────┘  │
│                                                     │
│ Service/Program (optional)                          │
│ ┌───────────────────────────────────────────────┐  │
│ │ 12-Week Fat Loss Program                       │  │
│ └───────────────────────────────────────────────┘  │
│                                                     │
│ Notes (optional)                                    │
│ ┌───────────────────────────────────────────────┐  │
│ │ Client since Jan 2024, weight training         │  │
│ └───────────────────────────────────────────────┘  │
│                                                     │
│ [Cancel]                            [Add Client]   │
└─────────────────────────────────────────────────────┘
```

**Post-Add State:**
- If email exists in Wolistic: Immediately added, user can review
- If email NOT in Wolistic: Status "Invited", copy invite link shown
- Expert can manually send link via WhatsApp/email

**Invite Link Copy UI:**
```
┌─────────────────────────────────────────────────────┐
│ ✓ Client Added                                      │
│                                                     │
│ priya.sharma@example.com is already registered     │
│ on Wolistic. They can now review you!              │
│                                                     │
│ ─── OR ───                                          │
│                                                     │
│ This email is not registered yet. Share this link: │
│                                                     │
│ ┌───────────────────────────────────────────────┐  │
│ │ https://wolistic.com/register?ref=expert123... │📋│
│ └───────────────────────────────────────────────┘  │
│                                                     │
│ When they sign up, they can leave a review.        │
│                                                     │
│ [Done]                                             │
└─────────────────────────────────────────────────────┘
```

---

## 4. Expert Response UI (Pro+ Tier Only)

### Location
- Inline below each review (on expert's own profile view when logged in)
- OR dashboard view: `/dashboard/reviews` with "Respond" buttons

### Response Form (Inline)
```
┌─────────────────────────────────────────────────────┐
│ [Priya's Review Card]                               │
│                                                     │
│ [Respond Button]  ← Appears only for Pro+ experts  │
└─────────────────────────────────────────────────────┘

↓ Click "Respond" ↓

┌─────────────────────────────────────────────────────┐
│ [Priya's Review Card]                               │
│                                                     │
│ ┌─ Your Response ─────────────────────────────────┐│
│ │ ┌──────────────────────────────────────────────┐││
│ │ │ Thank Priya for their feedback...            │││ ← Placeholder
│ │ │                                              │││
│ │ └──────────────────────────────────────────────┘││
│ │ 0 / 500 characters                             ││
│ │                                                 ││
│ │ [Cancel]                      [Post Response]  ││
│ └─────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────┘
```

**After Posting:**
- Response appears inline below review (as shown in Review Card spec)
- "Edit" button available to expert

**Free Tier Alert:**
```
┌─────────────────────────────────────────────────────┐
│ 🔒 Upgrade to Pro to Respond                        │
│                                                     │
│ Respond to reviews and build trust with clients.   │
│                                                     │
│ [View Plans]                           [Maybe Later]│
└─────────────────────────────────────────────────────┘
```

---

## 5. Reviews Dashboard Page (Expert View)

### Location
- `/dashboard/reviews`
- Accessible from main nav "Reviews" item

### Layout
```
┌─────────────────────────────────────────────────────┐
│ Reviews                                             │
├─────────────────────────────────────────────────────┤
│                                                     │
│ ┌─ Overview ──────────────────────────────────────┐│
│ │ 4.8          24 Reviews      92%                ││
│ │ Average      Total           Response Rate      ││
│ └─────────────────────────────────────────────────┘│
│                                                     │
│ [Recent Reviews] [Client List] [Settings]          │  ← Tabs
│                                                     │
│ ┌─ Recent Reviews ─────────────────────────────────┐│
│ │                                                  ││
│ │ [Review Card 1 with Respond button]             ││
│ │ [Review Card 2 with Respond button]             ││
│ │ [Review Card 3]                                  ││
│ │                                                  ││
│ └──────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────┘
```

**Tabs:**
1. **Recent Reviews:** All reviews with respond capability
2. **Client List:** Manage client list (see Section 3)
3. **Settings:** Review notification preferences (Phase 2)

---

## 6. Mobile Responsive Behavior

### Review Cards (Mobile)
- Stack vertically, full width
- Avatar: 40px → 36px
- Font sizes: Reduce by 1-2px
- Expert response: No indent, just subtle bg color

### Review Submission Form (Mobile)
- Full screen modal (not sheet)
- Star rating: Larger touch targets (48px)
- Bottom action bar: Sticky

### Client List (Mobile)
- Table → Card layout
- Each client = Card with Name, Email, Status, Action button

---

## 7. Accessibility Requirements

### Semantic HTML
- Review cards: `<article>` with `aria-label="Review by [Name]"`
- Star rating: `<div role="img" aria-label="Rated 5 out of 5 stars">`
- Badges: Text visible, not icon-only

### Keyboard Navigation
- All buttons focusable
- Modal traps focus
- Tab order: Name → Rating → Text → Actions

### Color Contrast
- Verified badge: `emerald-600` on white/light bg, `emerald-400` on dark bg
- Wolistic User badge: `sky-600` on white, `sky-400` on dark
- Ensure 4.5:1 contrast minimum

### Screen Reader
- Badge announces: "Verified Wolistic Client" or "Wolistic User"
- Star rating announces: "Rated X out of 5 stars"
- Response announces: "Response from [Expert Name]"

---

## 8. Design System Tokens

### Colors
```typescript
const reviewBadges = {
  verified: {
    bg: 'bg-emerald-50 dark:bg-emerald-500/10',
    text: 'text-emerald-700 dark:text-emerald-400',
    border: 'border-emerald-200 dark:border-emerald-500/20',
    icon: ShieldCheck
  },
  wolistic: {
    bg: 'bg-sky-50 dark:bg-sky-500/10',
    text: 'text-sky-700 dark:text-sky-400',
    border: 'border-sky-200 dark:border-sky-500/20',
    icon: User
  }
};
```

### Spacing
- Review card padding: `p-6` (desktop), `p-4` (mobile)
- Gap between reviews: `space-y-4`
- Expert response indent: `ml-4` (desktop), `ml-0` (mobile)

### Typography
- Review text: `text-sm md:text-base leading-relaxed`
- Service context: `text-xs text-muted-foreground`
- Date: `text-xs text-muted-foreground`

---

## 9. Error States

### Review Submission Failed
```
┌─────────────────────────────────────────────────────┐
│ ⚠️ Failed to submit review                          │
│                                                     │
│ You must be registered and in this expert's        │
│ client list to leave a review.                     │
│                                                     │
│ [Try Again]                            [Contact Us]│
└─────────────────────────────────────────────────────┘
```

### Not Authorized to Review
```
┌─────────────────────────────────────────────────────┐
│ 🔒 Not Authorized                                   │
│                                                     │
│ Only verified clients can review this expert.      │
│ Book a session to leave a review.                  │
│                                                     │
│ [Browse Services]                          [Close] │
└─────────────────────────────────────────────────────┘
```

---

## 10. Component Hierarchy

```
<ReviewsSection>
  ├─ <ReviewsSummary>           // 4.8 average, 24 reviews
  ├─ <ReviewsFilterTabs>        // All / Verified / Wolistic Users
  ├─ <ReviewsList>
  │   └─ <ReviewCard>
  │       ├─ <ReviewerInfo>     // Name, badge, rating
  │       ├─ <ReviewContent>    // Text, date
  │       └─ <ExpertResponse?>  // Conditional, if exists
  └─ <EmptyState?>              // If no reviews

<ReviewSubmitForm>
  ├─ <ExpertPreview>            // Name, photo, service
  ├─ <StarRatingInput>
  ├─ <ReviewTextarea>
  └─ <SubmitActions>

<ClientListManager>
  ├─ <ClientListHeader>
  ├─ <AddClientButton>
  ├─ <ClientListTable>
  │   └─ <ClientRow>
  └─ <AddClientModal>

<ExpertResponseForm>
  ├─ <ResponseTextarea>
  └─ <ResponseActions>
```

---

## 11. API Integration Points

### Review Display
- GET `/api/v1/professionals/{id}/reviews?filter={all|verified|wolistic}`
- Returns: `{ reviews: ReviewOut[], summary: { avg_rating, total, verified_count, wolistic_user_count } }`

### Review Submission
- POST `/api/v1/reviews`
- Body: `{ professional_id, rating, review_text }`
- Auth: Required (Supabase JWT)
- Returns: `ReviewOut` with badge type auto-determined

### Client List
- GET `/api/v1/professionals/me/clients`
- POST `/api/v1/professionals/me/clients` - Add client
- DELETE `/api/v1/professionals/me/clients/{id}` - Remove client

### Expert Response
- POST `/api/v1/reviews/{review_id}/respond`
- Body: `{ response_text }`
- Auth: Required + Pro tier check

---

## Implementation Priority

**Phase 1 (This Sprint):**
1. Review display with dual badges ✅
2. Review submission form ✅
3. Client list management ✅
4. Expert response (Pro+) ✅

**Phase 2 (Next Sprint):**
5. Email integration (SendGrid)
6. Invite link auto-send
7. Review analytics dashboard

**Phase 3 (Future):**
8. AI response suggestions (Elite tier)
9. Sentiment analysis
10. Review highlighting

---

End of Specifications.
