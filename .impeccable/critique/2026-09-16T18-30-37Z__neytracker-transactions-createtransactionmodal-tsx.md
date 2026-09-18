---
target: Create Transaction/Transfer modal (CreateTransactionModal.tsx + forms + CategoryPicker + DateTimeField)
total_score: 30
max_score: 36
na_heuristics: 10
p0_count: 0
p1_count: 2
timestamp: 2026-09-16T18-30-37Z
slug: neytracker-transactions-createtransactionmodal-tsx
---
Method: dual-agent (A: modal-assessment-a · B: modal-assessment-b)

## Design Health Score
| # | Heuristic | Score | Note |
|---|-----------|-------|------|
| 1 | Visibility of System Status | 3 | No loading state on category search or account-list fetch |
| 2 | Match System / Real World | 3 | Synthetic-parent rows have no explanatory affordance |
| 3 | User Control and Freedom | 2 | Type switch silently wipes fields including a deliberately-set date |
| 4 | Consistency and Standards | 3 | Shell matches CreateAccountModal; missing autoFocus is a small regression |
| 5 | Error Prevention | 3 | Submit correctly gated; no confirm before destructive type-switch reset |
| 6 | Recognition Rather Than Recall | 3 | Synthetic parent inert-vs-selectable distinction unexplained |
| 7 | Flexibility and Efficiency | 4 | Time-defaults-to-now, search, smooth-scroll all reduce friction |
| 8 | Aesthetic and Minimalist Design | 4 | Token-only, flat, dense, exemplary Night Ledger fidelity |
| 9 | Error Recovery | 3 | Field/API errors surface correctly with established fade convention |
| 10 | Help and Documentation | n/a | Not applicable |
| Total | | 30/36 | Good |

## Design Specificity Verdict
Genuinely product-native. Exact shell reuse from CreateAccountModal. Zero hardcoded hex/rgb/px in any new CSS rule (segmentedControl, categorySearch, categoryLabel, categoryLabelSynthetic, dateTimeRow, selectPlaceholder, fieldset.field) - all var(--color-*), independently verified. One-level-only synthetic-parent reconstruction is a deliberate, named-ceiling decision, not silent overreach.

## What's Working
1. Time-defaults-to-now removes a real interaction for the common case.
2. Race-safe debounced search - cancelled-flag scoping traced concretely, stale slow responses cannot overwrite newer ones.
3. Honest, bounded synthetic-parent reconstruction for the orphan-drop bug - one level only, clearly commented ceiling.

## Priority Issues
[P1] Synthetic parent rows are not understandable to a first-time user - muted non-radio row reads as loading/disabled, and the tree already overloads that same cue for max-depth disabling. Fix: distinct visual treatment or a small explanatory tag, not absence-of-radio alone.
[P1] Type switch silently discards a deliberately-set date - amount/description are cheap to redo, but occurredAt reverting to a fresh "now" on remount is an invisible loss specifically after backdating. Fix: preserve shared fields across the switch, only reset type-specific ones (category).
[P2] Corrected: box-sizing:border-box was NOT absent from the project (existed locally in AuthForm.module.css, HomePage.module.css) - what was added this session is a new GLOBAL universal reset, a broader change than initially described. Enumerated blast radius: 5 width:100% elements in MoneyTracker.module.css (.categorySearch intended, plus .row, .modal, .categoryLabel, one more) - none visually re-verified, no browser available this session. Highest actual-risk item since static analysis can't catch visual regression.
[P2] No loading state on category search or destination-account fetch - empty state can flash mid-request, reading as "no results" when still loading.
[P2] Lost autoFocus on modal open vs CreateAccountModal's precedent (closing focus-return correctly replicated at the call site, confirmed no regression there - only opening-focus is missing).
[P3] Split date/time labeling asymmetry - date relies on shared/implicit label, time has its own separate aria-label - inconsistency a screen-reader user would notice.
[P3] scrollIntoView smooth-scroll in CategoryPicker (select + expand) not gated by prefers-reduced-motion, unlike every CSS animation in the same surface which correctly has the override.

## Persona Red Flags
- Screen-reader user: synthetic rows unexplained, no aria-live on form-swap/empty-state, date/time label asymmetry.
- Keyboard-only user: well-served overall, no trap/return regressions found - only gap is the lost opening autoFocus.
- First-timer meeting category search: synthetic-parent confusion is the single highest-impact fix in this report.

## Questions to Consider
- Does the type switch need to wipe shared fields at all, or would "reclassify, keep what's reusable" serve users better than a full reset?
- Should the "now" time default become conditional on the date field being untouched, rather than always defaulting regardless of what's already been set?
- Given the global box-sizing change's blast radius was enumerated but not visually verified, what's the concrete plan/timing for a browser pass across the 5 affected elements before this ships further?
