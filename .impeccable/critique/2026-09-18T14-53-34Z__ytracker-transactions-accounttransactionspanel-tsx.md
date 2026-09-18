---
target: Transactions filter panel (AccountTransactionsPanel.tsx date presets, category search reuse, toolbar restyle)
total_score: 27
max_score: 36
na_heuristics: 
p0_count: 0
p1_count: 2
timestamp: 2026-09-18T14-53-34Z
slug: ytracker-transactions-accounttransactionspanel-tsx
---
Method: dual-agent (A: filter-assessment-a · B: filter-assessment-b)

## Design Health Score
| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visual hierarchy (Create/Filters/Clear weight tiers) | 5/6 | Filled-primary/ghost-pill/text-link correctly tiered; act-vs-view grouping could be tighter |
| 2 | Consistency and Standards | 5/6 | Reuses .field/.secondaryButton idioms correctly; pill deliberately distinct from rectangular buttons, documented |
| 3 | Restraint / signal discipline | 6/6 | Instant panel toggle is correct (quiet daily-glance surface); fadeIn correctly reserved for error text only |
| 4 | Interaction stability & feedback | 3/6 | Clear-filters causes toolbar reflow + focus loss to document.body on click |
| 5 | Affordance prominence | 4/6 | Preset chips (highest-value addition) rendered at smallest, most muted text on the panel |
| 6 | Responsive / overflow behavior | 2/4 | Fixed-width fields (11rem/15rem) with no min-width:0 overflow below ~400px; same bug class already fixed twice this session elsewhere (DateTimeField, .dateTimeRow) recurred here |
| 7 | State correctness | 4/4 | clearFilters batches correctly (single fetch, not 6); preset+page-reset interaction has no race, just a benign cancelled-guard double-fetch |
| 8 | Accessibility | 3/4 | aria-expanded correct; no aria-controls; Clear-filters unmount causes real focus loss (not just reflow) |
| 9 | Token fidelity | 4/4 | Zero hardcoded colors/hex in new CSS; accent used only for interactive/active states; no box-shadow; radius/pill idioms consistent with existing components |
| 10 | Product-nativeness | 3/4 | Grounded in codebase's own idioms; only drift is conceptual — presets answer the prior critique's "date-anchored navigation" question with a parallel filter mechanism, not a resolution |
| **Total** | | **27/36** | Good (down from 29/36 on this same file's prior critique — regression isolated to this round's new filter-panel additions) |

## Design-Specificity Verdict
Product-native, not generic-AI-slop. Both agents independently confirmed: pill shape deliberately contrasts `.secondaryButton`'s rectangular outline with an in-code rationale; chips reuse the app's existing color/token language; accent strictly scoped to interactive/active states; radius (6px panel, 999px pills) matches existing `.list`/`.modal`/segmented-control precedent; zero hardcoded hex/rgb in any new rule. The only drift is conceptual, not visual: treating the round's headline feature (date presets) as the quietest element on the panel, and answering a "date-anchored navigation" question from the prior critique with a filter mechanism rather than a real navigation fix.

## What's Working
1. Toolbar weight hierarchy (filled primary / ghost pill / text link) is textbook-correct per DESIGN.md's button rules.
2. `clearFilters()`'s 6 setState calls correctly batch to a single re-fetch under React 18 — verified via effect dependency tracing, not assumed.
3. Token discipline holds completely across every new class this round — no exceptions found by either agent.

## Priority Issues
[P1] Category filter has no per-facet clear — removing the "All categories" no-selection row (correct for the create form's required-field context) was inverted here: a filter's entire purpose is per-facet clearing, and the only way to unset category alone is now either picking a different one or nuking all 5 filters via "Clear filters." Fix: restore the no-selection row in this panel's `CategoryPicker` call only; leave the create form as-is.

[P1] Filter panel overflows narrow viewports — `.filterPanel .field` uses fixed `width: 11rem`/`15rem` with no `min-width: 0` or shrink tolerance; below ~400px the category field alone overflows its container. This is the exact bug class (native form controls refusing to shrink inside flex without an explicit override) already fixed twice this session elsewhere (DateTimeField's hour/minute split, `.dateTimeRow`). Fix: `flex: 1 1 11rem; min-width: 0; max-width: 100%` (category `flex-basis: 15rem`).

[P2] Preset chips visually demoted below their actual value — 0.75rem font-size is the smallest text on the panel, despite being the round's headline addition. Fix: bump to 0.8125rem to match sibling filter-label prominence.

[P2] "Clear filters" causes toolbar reflow and real focus loss — the button unmounts entirely when `activeFilterCount` returns to 0, shifting the Filters toggle horizontally on every zero-crossing, and (confirmed via trace) drops focus to `document.body` if the user was focused on Clear when it disappears. Fix: redirect focus to the Filters toggle in `clearFilters()`, or keep the button always mounted and toggle `disabled` instead of conditionally rendering it.

[P3] No `aria-controls` linking the Filters toggle to the panel it opens/closes — recommended, not required (this isn't a strict ARIA disclosure-pattern precedent elsewhere in the app), but trivial to add and closes a real gap.

[P3] Presets are a parallel filter mechanism, not a resolution to the prior critique's "date-anchored navigation" question — the underlying pagination is still a plain Prev/Next page counter with no jump-to-month. Noted, not actioned this round.

## Persona Red Flags
- Sam: category-only clear is now unreachable without clearing everything else; Clear-filters focus loss on click.
- Jordan: preset chips (the actual new capability) visually read as the least important control on the panel.
- Casey: filter panel has zero narrow-viewport handling — a plausible mobile-usage risk already flagged generally in the prior critique, now concretely reproduced in this specific addition.

## Questions to Consider
- Should pagination itself eventually gain date-anchored jump-to-month navigation, given presets only narrow the range but don't change how you page through results?
