# Username Page Critical TODO

Scope: Public professional profile page at /[username], including booking flow up to payment.
Date: 2026-03-13

## P0 - Conversion and Trust Blockers

1. Wire or remove dead CTAs
- Components impacted:
  - components/public/expertdetails/sections/BookingPanel.tsx
  - components/public/expertdetails/sections/HeroSection.tsx
  - components/public/expertdetails/sections/GalleryProductsSection.tsx
- Issues:
  - Send Message button has no action.
  - Heart and Share icons have no action.
  - Featured product View Details has no action.
  - Gallery cards look clickable but do not open anything.
- Acceptance criteria:
  - Every visible CTA triggers a real flow, or is explicitly marked disabled/coming soon.
  - No clickable styling remains on non-functional elements.

2. Add booking step back-navigation
- Component impacted:
  - components/public/expertdetails/sections/ServicesBookingSection.tsx
- Issue:
  - Users cannot move backward to edit schedule/questions after progressing.
- Acceptance criteria:
  - Back control is available on all steps after Schedule.
  - User can revise schedule/service before payment without losing unrelated form data.

3. Fix embedded onboarding layout inside booking card
- Components impacted:
  - components/onboarding/UserOnboardingFlow.tsx
  - components/public/expertdetails/sections/ServicesBookingSection.tsx
- Issue:
  - Full-page onboarding visual treatment and min-height make embedded step too tall on mobile.
- Acceptance criteria:
  - Embedded onboarding uses compact mode without viewport-height forcing.
  - Visual style remains consistent with booking card on mobile and desktop.

4. Replace hardcoded Quick Facts with profile-driven data
- Component impacted:
  - components/public/expertdetails/sections/SidebarSection.tsx
- Issue:
  - Response time, duration, cancellation policy are static and can be wrong.
- Acceptance criteria:
  - Quick Facts are sourced from API/profile fields.
  - If missing, section degrades gracefully with fallback text or hidden rows.

## P1 - Mobile and Flow Clarity

5. Add active state to mobile section nav
- Component impacted:
  - components/public/expertdetails/sections/MobileSectionNav.tsx
- Issue:
  - Mobile pills do not indicate current section while scrolling.
- Acceptance criteria:
  - Active pill updates on scroll and anchor jump.
  - Contrast and focus states meet accessibility expectations.

6. Normalize services anchor offset on mobile
- Component impacted:
  - components/public/expertdetails/sections/ServicesBookingSection.tsx
- Issue:
  - #services uses a larger fixed scroll offset than other sections.
- Acceptance criteria:
  - Services section aligns consistently under sticky nav on mobile and desktop.

7. Add forgot-password path in auth step
- Component impacted:
  - components/public/expertdetails/sections/booking-steps/AuthStep.tsx
- Issue:
  - Returning users who forgot password are blocked in booking context.
- Acceptance criteria:
  - Forgot-password action is visible and functional.
  - User can return to booking flow after password reset/login.

8. Improve step orientation for logged-in users
- Component impacted:
  - components/public/expertdetails/sections/ServicesBookingSection.tsx
- Issue:
  - Silent skip from Questions to Payment can feel abrupt.
- Acceptance criteria:
  - Show clear state, for example Booking as <name>, when auth is skipped.

## P2 - Quality and Accessibility Polish

9. Handle empty Gallery and Products states
- Component impacted:
  - components/public/expertdetails/sections/GalleryProductsSection.tsx
- Issue:
  - Section can render with headers and no content.
- Acceptance criteria:
  - Show meaningful empty states or conditionally hide empty subsections.

10. Improve review avatar and rating accessibility
- Component impacted:
  - components/public/expertdetails/sections/ReviewsSection.tsx
- Issues:
  - Generic avatar circles with no identity cue.
  - Star ratings are visual only.
- Acceptance criteria:
  - Avatar includes initials fallback.
  - Rating includes screen-reader text, for example 4 out of 5 stars.

11. Improve mobile booking progress density
- Component impacted:
  - components/public/expertdetails/sections/ServicesBookingSection.tsx
- Issue:
  - 5-step blocks consume too much vertical space on small screens.
- Acceptance criteria:
  - Mobile variant is compact and readable at 320px width.

12. Add loading skeletons for async sections
- Components impacted:
  - components/public/expertdetails/sections/ReviewsSection.tsx
  - components/onboarding/booking/BookingOnboardingStep.tsx
- Issue:
  - Loading text only, no visual structure placeholder.
- Acceptance criteria:
  - Skeletons preserve layout stability and reduce perceived wait time.

## Suggested Execution Order

1. P0 items 1-3 (highest impact on trust and conversion)
2. P0 item 4 plus P1 items 5-6 (mobile reliability and correctness)
3. P1 items 7-8 (auth and flow clarity)
4. P2 items 9-12 (polish and accessibility)

## Definition of Done for this document

- All P0 completed and validated on mobile and desktop.
- Booking can proceed smoothly from service selection to payment.
- No dead CTAs remain on the page.
- Core accessibility signals present on nav, ratings, and key controls.
