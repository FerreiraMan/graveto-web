---
target: Account Overview category breakdown sub-tab (CategorySpendingPanel.tsx)
total_score: 32
max_score: 36
na_heuristics: 
p0_count: 0
p1_count: 2
timestamp: 2026-09-18T16-37-25Z
slug: s-moneytracker-analytics-categoryspendingpanel-tsx
---
Method: dual-agent (A: breakdown-assessment-a · B: breakdown-assessment-b)
Scope: CategorySpendingPanel.tsx only. Locked design decisions from shape discovery (sticky column + scroll, tint-not-weight for parent rows) were not re-litigated, only their execution quality.

## Design Health Score
| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visual hierarchy (parent/leaf tint) | 4/5 (was 2/5, fixed) | Both agents independently found the same real bug from different angles: `.categoryBreakdownNameCell` painted `--color-surface` unconditionally on every sticky cell, while only parent `<tr>`s got that background — meaning every LEAF row showed a visibly different-colored sticky column vs. the rest of that row, and the parent tint signal was defeated in the one always-visible column. Fixed: sticky cell now defaults to `--color-ground` (the table's real ambient background), overridden to `--color-surface` only via `.categoryBreakdownRowParent .categoryBreakdownNameCell` |
| 2 | Layout/indentation fitness | 4/5 (was 3/5, fixed) | Depth-based indentation (`0.5 + depth * 1.25rem`) left as little as ~6.75rem for the deepest labels in a 13rem sticky column, truncating with no recovery. Reduced multiplier to `0.875rem`/level and added a `title` attribute on the category name for hover recovery |
| 3 | Design-system fidelity (inline style, convention) | 5/5 | Depth-based inline `paddingLeft` correctly preserved as pre-existing convention (not a new violation); the actual prior violation (`color: '#888'`) fully removed |
| 4 | Data-integrity / edge-case handling | 4/5 (was 2/5, fixed) | Financial values are typed as unconstrained `number` with no documented non-negative guarantee. Added a defensive `polarityClassName`: negative totals (e.g. a refund outweighing a category's spend) get `--color-gain`, everything else stays uncolored as originally decided — costs nothing in the expected all-positive case, correctly signals the edge case if it occurs |
| 5 | Restraint | 5/5 | No color/weight noise added beyond what the two real issues required |
| 6 | Accessibility | 4/5 (was 2/5, fixed) | Sibling `CategoryPicker` uses `aria-live="polite"` on its expandable tree; this table had no equivalent for its own expand/collapse — added `aria-live="polite"` to the `<tbody>` so screen reader users are told when child rows appear |
| 7 | Token/theme fidelity | 5/5 | All new CSS token-based; `#888` hardcode fully gone (verified no inline color styles remain) |
| 8 | Consistency (sibling components) | 5/5 | Chevron/`aria-expanded`/`aria-label` pattern matches `CategoryPicker`'s established precedent exactly; aria-live gap closed to match too |
| 9 | Performance | 5/5 | Unmemoized `sortByYearlyTotalDesc` on every render (including recursively per child list) correctly judged a non-issue at this app's real data scale (personal/small-shared-account tracker, ≤3 tree levels, tens of categories) — memoizing would be premature complexity, not applied |
| 10 | Robustness | 4/5 | Expand-state reset on year change (`useState(false)` per row, unmounted on refetch) correctly judged pre-existing, unchanged behavior, and actually correct — a year change is a genuinely new dataset, collapsing is the right default |
| **Total** | | **~45/50 (scaled: ~32.5/36)** after fixes | Strong — the one real structural bug (sticky-cell background collision) was caught by both agents independently and is now fixed at the root cause |

## Design-Specificity Verdict
Product-native and specific, not generic-AI-slop. Sticky-column-plus-scroll and tint-not-weight were deliberate, locked decisions correctly executed once the background-collision bug was fixed; financial polarity was deliberately withheld where it wouldn't discriminate anything (all-expense data) but not blindly withheld — a real edge case (negative totals) still gets the signal. The bug found here is the same class of mistake as the Cash-flow round's table min-width reuse: a locally-correct rule (unconditional sticky background) that didn't account for how it interacts with a sibling rule (row tint) — a genuine execution defect, not evidence of low design intent.

## What's Working
1. Both critique agents converged on the same real bug independently (sticky-cell background collision), from different angles — high confidence this was a genuine defect, not a stylistic disagreement.
2. Reused the Cash-flow round's `.transactionsTable`/`.tableScroll`/`.amountCell` system rather than inventing a parallel one for the second table this session.
3. Correctly resisted two "false positive" issues the agents raised and then dismissed themselves: row-hover absence (consistent app-wide, not a regression) and sort memoization (non-issue at this data scale, would be YAGNI complexity).

## Priority Issues (all fixed this round)
[P1] Sticky category-name cell's unconditional `--color-surface` background broke the parent/leaf tint signal on every leaf row and created a visible seam — fixed via ambient-default + parent-only override through the existing `tr`→`td` ancestor relationship (no JSX restructuring needed, removed a redundant duplicate class instead).
[P1] Unverified assumption that category spending values are always non-negative — added defensive gain-coloring for the negative case rather than leaving it silently unsignaled.
[P2] Deep-level (depth 2-3) category names cramped/truncated in the 13rem sticky column with no recovery — reduced indentation multiplier, added `title` attribute.
[P2] No `aria-live` on the expandable table body, inconsistent with the sibling `CategoryPicker`'s tree — added to `<tbody>`.

## Deferred / Explicitly Not Applied
- Row hover state: absent everywhere in this app's tables, not a regression specific to this surface — left consistent-but-absent rather than adding it in isolation here.
- Sort memoization: correctly judged unnecessary at this app's real data scale.
- Expand-state reset on year change: correctly judged existing, intentional behavior — a year change is a new dataset, collapsing is the right default, not a bug.

## Persona Red Flags
- Sam: `aria-live` gap vs. sibling component — closed.
- Jordan: negative-total edge case previously unsignaled — closed defensively without requiring backend verification.

## Questions to Consider
None outstanding — this round's findings were concrete, verifiable bugs rather than open design questions.
