---
target: Transaction row menu popover + delete action (TransactionRowMenu.tsx)
total_score: 26
max_score: 36
na_heuristics: 10
p0_count: 0
p1_count: 2
timestamp: 2026-09-01T13-32-12Z
slug: s-moneytracker-transactions-transactionrowmenu-tsx
---
Method: dual-agent (A: menu-assessment-a · B: menu-assessment-b)

## Design Health Score
| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | No isOpen/pressed style on the trigger itself |
| 2 | Match System / Real World | 3 | Hamburger glyph reads as "nav," not "row actions" |
| 3 | User Control and Freedom | 3 | Escape/click-outside/Cancel all work; no undo once confirmed |
| 4 | Consistency and Standards | 2 | Menu-shaped affordance with none of the semantics a menu implies |
| 5 | Error Prevention | 2 | Confirm doesn't name the transaction; height-guess can mis-position |
| 6 | Recognition Rather Than Recall | 3 | Everything visible once open |
| 7 | Flexibility and Efficiency | 3 | Shared single-open state correct and efficient |
| 8 | Aesthetic and Minimalist Design | 4 | Tight, quiet, dense, on-brand |
| 9 | Error Recovery | 3 | role=alert inline, popover stays open on failure |
| 10 | Help and Documentation | n/a | Not applicable |
| Total | | 26/36 | Acceptable |

## Design Specificity Verdict
Genuinely this product's system in skin (tokens, no box-shadow, color-mix hover matching .row:hover exactly, delete-confirm explicitly modeled on LogoutControl's weight, documented 3-tier destructive-action ladder), bespoke-but-competent in shell mechanics (portal/fixed-position/flip-logic - the one place novelty necessarily enters, since nothing else needed to escape a scroll container before). detect.mjs: [] exit 0. B independently verified portal has no leak, click-outside has no double-fire, position math has no off-by-error (traced with concrete numbers).

## What's Working
1. Token/pattern fidelity - flat, shadow-free, one-accent, dense; reads as designed-for-this-app.
2. Three-tier confirm-weight ladder (logout/delete/close) is a real, coherent, documented design decision.
3. Portal + dual-ref click-outside handling shows the DOM-descendancy edge case was understood and solved, not stumbled into.

## Priority Issues
[P1] Keyboard focus never enters the popover - no focus-in on open, no focus-return on any of the 3 close paths. Regresses the createButtonRef pattern already established this session for the create-account modal. Minimum fix: focus first menu item on open, return focus to trigger on close - a full role=menu/arrow-key widget is overkill for 2-3 plain buttons, but plain buttons only work if reachable.
[P1] Hardcoded 160px height estimate can mis-position the popover - the transfer Details sub-panel renders unbounded content inside the same popover, but position is computed once on open (not on showDetails toggle), with no max-height/scroll fallback - a wrong guess can push the delete confirm off-screen with no way to reach it.
[P2] Single-click confirm is one notch too light for ledger deletion - soft-delete/still-visible nature genuinely lowers stakes (legitimate argument for the light pattern), but it still alters shared financial history - heavier than logout, not close to account-close. Fix: name the actual transaction (amount/date/description) in the confirm prompt so a misaimed click on the wrong row is caught before committing.
[P2] Menu-shaped affordance with none of the semantics - looks like a menu, exposes no role/grouping, screen reader announces 3 ungrouped buttons. Cheap fix already precedented: LogoutControl already uses role=group aria-label="Confirm logout" for exactly this situation.
[P3] Hamburger glyph is a weak affordance for row actions specifically - reads as "navigation," not "actions for this item." Vertical ellipsis is the conventional signal; a chevron would collide with AccountRow's existing inline-expand affordance elsewhere in the app.
[P3] Position doesn't recalculate on scroll/resize - fixed positioning computed once means the popover can visually detach from its trigger if the page scrolls or resizes while open.

## Persona Red Flags
- Sam: opens fine (well-labeled trigger), orients poorly once inside - no grouping ties the buttons back to their row.
- Keyboard-only user: can open/dismiss but focus never reaches the items - close to a hard block on actual use, since the portal appends at the end of document.body's tab order.
- Jordan: genuinely new interaction contract for this app (justified by density), but the hamburger glyph gives no head start on predicting what it does.

## Questions to Consider
- Two other row-menu components (recurring-transaction, recurring-transfer) share the same isOpen/onOpenChange/onEdit prop shape - will they converge on this floating pattern too, or diverge into two competing "row actions" models in a system whose thesis is restraint?
- Given deleted transactions are soft-deleted and stay visible/struck-through/filterable, does the confirm step even earn its keep - or would an undo-toast after a single click be both lighter AND safer than a confirm on an unnamed transaction?
