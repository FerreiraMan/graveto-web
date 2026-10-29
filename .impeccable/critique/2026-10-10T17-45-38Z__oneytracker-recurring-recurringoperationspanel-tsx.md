---
target: Account detail Recurring operations tab rework (sub-tabs + modal creates)
total_score: 35
max_score: 36
na_heuristics: 
p0_count: 1
p1_count: 1
timestamp: 2026-10-10T17-45-38Z
slug: oneytracker-recurring-recurringoperationspanel-tsx
---
Method: dual-agent (A: recurring-rework-a · B: recurring-rework-b)
Scope: follow-up round on RecurringOperationsPanel.tsx after user-requested rework — side-by-side grid replaced with sub-tabs (TabBar/TabPanel, matching Overview's pattern), inline create forms replaced with modals (matching CreateAccountModal/CreateTransactionModal's shell). Baseline: prior round scored 33/36.

## Design Health Score
| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visual hierarchy | 4/4 | Sub-tabs correctly subordinate to account-level tabs via extended `.recurringSubTabs .accountTab` selector |
| 2 | Consistency & pattern reuse | 4/4 | Create-modal/Update-inline split verified against real precedent — the main Transactions tab has the exact same split (CreateTransactionModal is a modal, UpdateTransactionForm is inline), so this is consistency, not a new inconsistency |
| 3 | Interaction & state integrity | 2/4 (was failing, fixed) | `TabPanel`'s unmount-on-inactive contract (already used by Overview's read-only sub-tabs) silently discards an in-progress create/edit form when the user switches sub-tabs — a real, previously-latent flaw this rework newly exposed by putting form-bearing content behind the same unmount contract. Fixed: each section reports whether it has an open form; the OTHER tab is disabled (not clickable) while true, so the destructive switch is never offered rather than allowed-then-silently-applied |
| 4 | Modal robustness | 3/4 (was failing, fixed — P0) | `.modal` had no `max-height`/`overflow-y`, and `.overlay` centers with no scroll fallback. The recurring Create forms are the densest in the app (8-9 fields vs `CreateAccountModal`'s 3) — on a realistic short viewport, the modal would clip top AND bottom with the submit button unreachable and no way to scroll to it, while the focus trap keeps the user cycling through off-screen fields. Fixed at the shared `.modal` class (benefits every modal in the app, not just this one), with `max-height: calc(100vh - 3rem); overflow-y: auto` — a no-op for forms that already fit |
| 5 | Code cleanliness | 4/4 | Refactor verified clean — no orphaned `OpenForm` references, no dead imports; one stale code comment referencing the deleted `CreateRecurringTransactionForm` fixed; one dead `justify-content: space-between` with a single child simplified |
| 6 | Consistency (cont.) | 4/4 | `!isSubmitting` close guards on overlay-click/Escape verified byte-for-byte identical to `CreateAccountModal`/`CreateTransactionModal` across both new modals |
| 7 | Accessibility/keyboard | 3/4 (was failing, fixed) | The modal-overflow bug (#4) made the focus trap a keyboard dead-end on short viewports — fixed as part of the same root-cause fix. `autoFocus` landing on Description instead of Type in the transaction modal was an undocumented deviation from the established "focus the first field" convention — fixed to match (Type now gets autoFocus, consistent with `CreateAccountModal`) |
| 8 | Robustness/edge cases | 3/4 (was failing, fixed) | Same overflow root cause as #4/#7 |
| 9 | IA/layout fit | 4/4 | Sub-tab rationale re-verified under new information (Create no longer growing the section inline) — correctly still holds: the two tables' width (halved space, 45rem min-width tables) and column-count mismatch (7 vs 6) are untouched by the Create→modal move and remain load-bearing on their own; side-by-side is not a closer call than the rationale states |
| 10 | Token discipline | 4/4 | New `disabledTabs` CSS (`.accountTab[aria-disabled='true']`) uses existing tokens only |
| **Total** | | **~35/36** after fixes (up from a would-be regression if shipped unfixed) | The rework's structural call (sub-tabs, modal creates) was correct and well-justified; the execution introduced one severe (P0-class) and one real (P1-class) issue, both now fixed |

## Design-Specificity Verdict
Both the sub-tab decision and the Create-modal decision are specific, precedent-grounded choices — verified against the app's own actual prior art (Overview's sub-tabs, the Transactions tab's Create-modal/Update-inline split), not generic defaults. The genuine risk this round carried was reusing two existing shared contracts (`TabPanel`'s unmount, `.modal`'s unconstrained height) in a new context — form-bearing panels, and the densest form yet — without re-validating those contracts against the new context's actual demands. Both gaps are now closed at the root (the shared `.modal` class and the shared `TabBar` component), which also retroactively hardens every other modal/sub-tab in the app, not just this surface.

## Net Verdict vs. prior round's 33/36
Net improvement, not lateral. The rework eliminated both real defects the prior critique found (filter-row width mismatch, column-height mismatch — both structurally impossible once the grid was removed) and is more consistent with established precedent (sub-tabs matching Overview, Create-modal matching Transactions) than the side-by-side grid was. It introduced one new P0-class and one new P1-class issue of its own, but both are now fixed, and the P0 fix (modal max-height) is a genuine app-wide hardening that benefits every existing modal, not just this round's additions — a strict improvement, not a tradeoff.

## Priority Issues (all fixed this round)
[P0] Dense recurring Create modals (8-9 fields) could overflow a short viewport with no scroll affordance on `.modal`/`.overlay`, making the submit button unreachable while the focus trap kept the user cycling through off-screen fields — fixed by adding `max-height: calc(100vh - 3rem); overflow-y: auto` to the shared `.modal` class.
[P1] Switching Recurring's sub-tabs while a create/edit form was open silently discarded it (TabPanel fully unmounts inactive content) — fixed by having each section report its open-form state up and disabling the other tab's trigger while true, rather than allowing the switch and confirming after the fact with a native dialog this app doesn't otherwise use.
[P3] `autoFocus` landed on Description instead of Type in the transaction create modal, an undocumented deviation from the established "focus the first field" convention — fixed to match.
[P3] Stale code comment referencing the deleted `CreateRecurringTransactionForm.tsx` — updated to reference the new modal file.
[P3] `.recurringSectionHeader`'s `justify-content: space-between` was a no-op with its one remaining child (title moved to sr-only) — simplified.

## Deferred / Explicitly Not Applied
- A native `window.confirm()` dialog for the tab-switch guard: considered and rejected — this app has consistently built its own in-app confirmation UI (`AccountRow`'s type-to-confirm, the row menu's Yes/Back pattern) and never uses native browser dialogs; disabling the destructive action outright is more consistent and arguably better UX than confirm-after-the-fact.
- Lifting cross-section form-open state further (e.g. back into a shared discriminated union like the pre-rework `OpenForm`): unnecessary — a single boolean reported per-section via one callback is sufficient to drive the tab-disable guard, no need to resurrect the heavier coordination structure the sub-tab move intentionally removed.

## Persona Red Flags
- Sam: modal keyboard dead-end on short viewports — closed at the shared-component root cause, hardens the whole app.
- Jordan: silent data loss switching tabs mid-form — closed by preventing the action rather than confirming it after the fact.

## Questions to Consider
None outstanding — both agents independently found the same P0, and the one issue only Assessment A raised (tab-switch data loss) held up under verification and is now fixed.
