Refocus Wolistic landing-page narrative around verified professionals for Body, Mind, and Diet as the core offering, and reframe products, wellness centers, and similar non-core categories as transparent listings rather than curated or featured recommendations.

Objective
- Shift the homepage story so the primary value proposition is AI-assisted wellness guidance connected to verified professionals.
- Reduce implied endorsement risk by removing or renaming user-facing language such as "featured" and "curated" for products, wellness centers, and similar listing-style inventory.
- Keep professionals positioned as the trust-heavy, differentiated part of the platform.

Narrative Direction
- Core promise: trusted wellness guidance through verified professionals across Body, Mind, and Diet.
- Secondary promise: open discovery of relevant products, wellness centers, and services through listings.
- Trust boundary: Wolistic verifies professionals, but does not curate or endorse all listed non-professional inventory.

Recommended Messaging Changes
- Hero headline should move away from "all in one place" and toward a professionals-first framing.
- Hero supporting copy should distinguish between verified-professional guidance and non-curated listings.
- Products and wellness centers should no longer be labeled "Featured" in user-facing landing-page copy.
- Any "curated products/services" language should be replaced with transparent discovery language.
- A short disclosure should be visible near listing sections or trust copy: listings are informational and not curated or endorsed by Wolistic.

Proposed Hero Copy
Headline option
- Find Your Body, Mind, and Diet Expert.

Supporting copy option
- AI-assisted wellness guidance verified by certified professionals. Plus discover  products, wellness centers, and services.

Disclosure option
- Listings are provided for discovery and transparency, and are not curated or endorsed by Wolistic.

Section Strategy
- Keep professionals as a standalone premium section.
- Merge products, wellness centers, and similar inventory into one landing-page "Listings" block if feasible.
- If not merging immediately, rename sections individually:
  - Featured products -> Product Listings
  - Featured wellness centers -> Wellness Center Listings
  - Similar supporting categories -> Listings or Service Listings depending on scope

Trust Copy Direction
Replace language that implies platform-wide curation with copy that makes the trust model precise.

Example replacement
- Every professional on Wolistic is verified. Listings for products, centers, and services are provided for discovery and transparency.

Implementation Scope
- Update landing-page hero copy.
- Update user-facing titles for products and wellness centers on the landing page.
- Update benefits or trust-section copy that currently says products/services are curated.
- Add concise disclosure text to listing-oriented sections.
- Preserve existing backend variable names and data-loading names for now to avoid unnecessary refactor risk.

Files To Update
- frontend/components/public/landing/HeroSection.tsx
- frontend/components/public/landing/FeaturedProductsSection.tsx
- frontend/components/public/landing/FeaturedWellnessCentersSection.tsx
- frontend/components/public/landing/Benefits.tsx
- Possibly frontend/app/(public)/LandingPageClient.tsx if section composition changes to support a unified listings block

Pragmatic Rollout Recommendation
Phase 1
- Change narrative and labels only.
- Add disclosure.
- Keep existing data flows and component names internal.

Phase 2
- Consolidate products, centers, and service inventory into one shared Listings section on the homepage.
- Keep professionals visually and structurally above listings.

Constraints
- Maintain current UI quality and layout consistency unless a structural change is required for the new Listings block.
- Minimize code churn by keeping internal API function names and props unchanged unless needed.
- Favor user-facing clarity over marketing breadth.

Success Criteria
- The landing page clearly communicates that professionals are the core offer.
- Non-core inventory no longer appears curated by Wolistic.
- Users can still browse products, centers, and services, but expectations are set accurately.
- Trust messaging becomes more precise and legally safer without weakening the platform story.
