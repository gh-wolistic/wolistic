# Results Page — UI / UX Review & TODO

> Last reviewed: 2026-03-14  
> Route: `/results?scope=professional`

---

## ✅ DONE — Sticky toolbar collapse on scroll

`ResultsStickyBar` (client component) auto-collapses the search toolbar after 120 px scroll using `grid-rows-[0fr]` animation. Only scope tabs + a circular search icon remain sticky. The icon re-expands the toolbar on click; scrolling further down auto-closes it again. Sticky chrome is now **~128 px when collapsed** (header 80 + tabs row 48) vs the old ~310 px.

---

## ✅ DONE — Summary text removed from sticky area

"Showing professionals for …" is now a standalone non-sticky `<section>` rendered above `<ResultsStickyBar>` in `ResultsPage.tsx`. It scrolls away naturally.

---

## ✅ DONE — Category badges wired as real filters

Badges are clickable `<button>` elements. `handleCategorySelect` builds a URL with `&category=…`. Server-side `filterProfessionalsByCategory` in `ResultsPage.tsx` does keyword matching against profile fields. Active badge toggles to `variant="default"`. "Clear" button resets both query and category.

---

## ✅ DONE — Filters button removed

The non-functional "Filters" button has been removed from `ResultsToolbar`. Only the Search / Clear toggle button remains.

---

## ✅ DONE — Pagination redesigned with numbered pills

Single centered `<nav>` row: `‹` chevron → numbered page pills → `›` chevron. Active page is a filled emerald→teal gradient circle; inactive pages are ghost buttons. Ellipsis (`···`) shown for large page counts via `buildPageItems()` helper. Disabled chevrons get `opacity-30`.

---

## ✅ DONE — Skeleton loading state

`loading.tsx` provides a results-specific skeleton: scope-tab pill placeholders + 6-card grid with `aspect-[4/3]` image area + text block placeholders, all with `animate-pulse`.

---

## 🟡 Medium — Toolbar density & spacing

- The toolbar still has `rounded-[1.75rem]`, `p-4`, `space-y-4` — generous padding.
- The search `Input` is `h-12` and the Search/Clear button is also `h-12` — tall for a sticky element.
- Category badges sit inside the same form card adding another row.
- **Suggestion:** Compact the toolbar — reduce input to `h-10`, trim padding to `p-2 sm:p-3`, reduce `space-y-4` to `space-y-2`.

---

## 🟡 Medium — Scope tabs & toolbar visual grouping

- Scope tabs and toolbar are now inside the same sticky container (`ResultsStickyBar`) with shared background and border.
- Collapse behaviour ties them together functionally.
- Minor gap: scope tabs row and toolbar card still feel like two stacked elements (tabs are plain buttons, toolbar is a rounded card).
- **Suggestion:** Consider giving the tabs row a subtle background strip or aligning the toolbar's rounded corners to the container edge for a more unified look.

---

## 🟢 Minor — Professional card density on mobile

- Cards are well-structured but heavy: image + name + specialization + rating + 3 badges + certifications + location + approach text + full-width "View Profile" button.
- On mobile (1-column), scrolling through 6 cards is quite long.
- **Suggestions:**
  - Consider a compact/list view toggle for mobile (horizontal card: small image left, details right).
  - Truncate the "Approach" text to 2 lines with `line-clamp-2`.
  - The "View Profile" button could be removed — the entire card is already a `<Link>`.

---

## 🟢 Minor — Mobile scroll-hint on scope tabs

- Scope tabs use `overflow-x-auto` which works, but there's no visual hint that more tabs exist off-screen.
- **Suggestion:** Add a subtle gradient mask on the right edge to hint at scrollability.

---

## Summary — Remaining work

| # | Task | Impact | Status |
|---|---|---|---|
| 1 | ~~Collapse toolbar on scroll~~ | ~~High~~ | ✅ Done |
| 2 | ~~Remove summary from sticky~~ | ~~Medium~~ | ✅ Done |
| 3 | Compact toolbar dimensions (h-10 inputs, less padding) | Medium | 🟡 Open |
| 4 | ~~Wire category badges as filters~~ | ~~Medium~~ | ✅ Done |
| 5 | ~~Hide/remove Filters button~~ | ~~Low~~ | ✅ Done |
| 6 | Compact/list view toggle for mobile cards | Low | 🟢 Open |
| 7 | ~~Pagination page number pills~~ | ~~Low~~ | ✅ Done |
| 8 | ~~Skeleton loading state~~ | ~~Low~~ | ✅ Done |
| 9 | Scroll-hint gradient on scope tabs | Low | 🟢 Open |
