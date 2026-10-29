---
target: Account detail Recurring operations tab (RecurringOperationsPanel.tsx + RecurringRowMenu.tsx extraction + 4 forms)
total_score: 33
max_score: 36
na_heuristics: 
p0_count: 0
p1_count: 2
timestamp: 2026-10-10T17-34-49Z
slug: oneytracker-recurring-recurringoperationspanel-tsx
---
Method: dual-agent (A: recurring-assessment-a · B: recurring-assessment-b)
Scope: Recurring operations tab (RecurringOperationsPanel.tsx, both sections, RecurringRowMenu.tsx extraction, 4 forms, ScheduleFields.tsx). Locked design decisions (one tab not sub-tabs; portaled-popover row menu upgrade) were not re-litigated, only execution quality.

## Design Health Score
| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | System fidelity | 9/10 | Correctly reuses .transactionsTable/.field/.formFadeIn/.rowMenuPopover systems wholesale rather than inventing parallel ones |
| 2 | Layout/spatial | 8/10 | 2-column grid with independent column heights (align-items: start) correctly judged a non-issue for two genuinely different-shaped lists on a cardless, shadowless canvas — an empty cell reads as nothing, not a visual hole |
| 3 | Construction consistency | 8/10 (was 6/10, fixed) | Transactions section's single status filter sat in a bare `.field` while transfers' two filters shared `.recurringFilterRow`, giving the two side-by-side sections different filter-row heights/shapes for no real reason. Fixed: both now wrap in `.recurringFilterRow` |
| 4 | Interaction correctness | 9/10 (was 7/10, fixed) | A successful cancel left the popover's `isOpen` prop still true from the parent's perspective — the row either disappears from a refetch or flips to a terminal state that stops rendering a menu, so the popover was torn down by its row unmounting rather than through its own controlled close path, skipping focus-return. Fixed at the root: `handleMutated` now also clears `openMenuSid`, so cancel success closes the menu through the normal `isOpen` flip, same path Escape/click-outside already use correctly |
| 5 | State model coherence | 9/10 | Single-open-form-across-both-sections rule correctly kept even after the stacked→side-by-side layout change — side-by-side makes the auto-close *visible* (its one real weakness when stacked) rather than exposing a new need for independent dual-open forms |
| 6 | State legibility (status) | 4/5 (was 2/5, fixed) | All 4 recurring statuses (ACTIVE/PAUSED/COMPLETED/CANCELED) rendered as an identical plain badge — no way to spot at a glance which items are actually running vs. not, the single most useful read of this list. Fixed via a border/text tint on ACTIVE only (`.badgeActive`), not a new badge-color system — same tint-not-color reasoning as the category breakdown table's parent-row treatment |
| 7 | Accessibility | 4/5 (was 2/5, fixed) | Cancel confirmation flow had no `aria-live`, so a screen reader user got total silence on a destructive, irreversible action's outcome — worse than the expand/collapse interaction that already got `aria-live="polite"` earlier this session. Fixed: added to the popover container. Terminal rows' now-empty action cell also got a screen-reader label (not just a visual dash) |
| 8 | Token discipline | 5/5 | All new/changed CSS token-based; no hardcodes |
| 9 | Responsive robustness | 4/5 | 64rem grid-collapse breakpoint verified as the sole width-based media query in the stylesheet — no competing convention to conform to, correctly left as a well-commented one-off rather than abstracted into a token prematurely |
| 10 | Form layout | 5/5 | All 4 forms correctly adopt `.field`/`fieldset.field`/`.formFadeIn`/`.formActions`; first checkbox field in the app (`.checkboxLabel`) verified to render its error span on its own line, not squeezed into the checkbox's flex row |
| **Total** | | **~65/70 (scaled: ~33/36)** after fixes | Strong — both agents converged independently on the status-badge and accessibility gaps as the real issues, not structural ones |

## Design-Specificity Verdict
Product-native, not generic. Deliberate choices throughout: single-open-form rule explicitly re-evaluated (not just carried over) against the new side-by-side layout and correctly kept; terminal rows suppress their action menu entirely by design, not an oversight (though the resulting silent cell needed a label); status badge restraint was real but needed one targeted exception, not a wholesale redesign. The row-menu extraction (`RecurringRowMenu`) is a faithful, complete port of `TransactionRowMenu`'s portal/positioning/focus/dismissal machinery — verified point by point, not just assumed.

## What's Working
1. `RecurringRowMenu` extraction correctly preserves every behavior of the established `TransactionRowMenu` pattern (portal, viewport positioning with openUpward flip, click-outside checking both container and popover refs, Escape, focus-on-mount) — verified line by line, not just visually similar.
2. Single-open-form rule was actively re-examined against the layout change (stacked → side-by-side) rather than carried over unexamined, and correctly kept with real reasoning.
3. Status badge fix used the session's own established tint-not-color precedent (category breakdown's parent rows) rather than introducing a new colored-badge system that would have clashed with financial polarity's color reservation.

## Priority Issues (all fixed this round)
[P1] All 4 recurring statuses rendered as an identical badge, with no way to distinguish active-vs-not-running at a glance — fixed via a restrained border/text tint on ACTIVE only.
[P1] Cancel confirmation flow was completely silent to screen readers on success/failure — added `aria-live="polite"` to the popover.
[P2] Status filter wrapped in two different containers across the two side-by-side sections (bare `.field` vs `.recurringFilterRow`), causing visible height/shape mismatch at the gutter — unified under `.recurringFilterRow` in both.
[P2] Terminal (COMPLETED/CANCELED) rows rendered a completely empty actions cell with no indication why — added a muted dash with a screen-reader-only "No actions available" label.
[P2] Successful cancel left the popover's controlled `isOpen` prop stale, causing it to be torn down by its row disappearing/changing rather than through its own close path, skipping focus-return — fixed at the root by having the mutation handler also clear the open-menu state.

## Deferred / Explicitly Not Applied
- Claimed focus-steal bug via "position going transiently falsy during scroll recalculation": traced the actual code — `recalculate()` always sets a full object, never null, and React only calls a callback ref with `null` on real unmount, not on object identity changes while mounted. This specific mechanism does not exist; rejected after verification.
- Mismatched column heights in the 2-column grid: confirmed as correct, expected behavior for two genuinely different-shaped lists, not a layout bug.
- `fieldError`'s missing `role="alert"`/`aria-describedby`: verified this is a pre-existing, app-wide pattern present identically in 13 already-shipped files (including already-critiqued surfaces) — a real cross-cutting gap, but not specific to this round's work; fixing it only here would be inconsistent with everything already shipped.
- Hoisting the 64rem breakpoint to a named token: verified it's the only width-based media query in the stylesheet — no competing convention exists to reconcile against, so a token would be premature abstraction for a single, well-commented value.

## Persona Red Flags
- Sam: cancel-flow screen-reader silence — closed.
- Jordan: focus-loss after a successful destructive action — closed at the root cause (stale controlled state), not patched locally.

## Questions to Consider
None outstanding — findings were concrete and resolved; the one claimed bug that didn't hold up was verified and explicitly rejected rather than silently fixed on faith.
