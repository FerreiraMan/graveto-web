---
target: Account Overview cash-flow sub-tab (AccountOverviewSection.tsx + AccountOverviewPanel.tsx)
total_score: 31
max_score: 36
na_heuristics: 
p0_count: 0
p1_count: 3
timestamp: 2026-09-18T16-11-46Z
slug: res-moneytracker-accounts-accountoverviewpanel-tsx
---
Method: dual-agent (A: overview-assessment-a · B: overview-assessment-b)
Scope: AccountOverviewSection.tsx + AccountOverviewPanel.tsx (Cash flow sub-tab only). Category breakdown out of scope, deferred.

## Design Health Score
| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visual hierarchy vs. semantics | 4/5 (was 2/5, fixed) | Emphasis was on Balance (a fact already visible in the account list) instead of Net income/expense (this surface's actual "how did I do" answer) — flipped |
| 2 | Financial polarity spec compliance | 4/5 | Transfers correctly left uncolored (not a gain/loss per DESIGN.md); income/expense/net all correctly colored post-fix |
| 3 | Cross-view consistency | 4/5 (was 2/5, fixed) | Summary row colored income/expense unconditionally, table gated on `>0` — real inconsistency for a value that's never negative; now consistent |
| 4 | Layout/table fitness | 4/5 (was 2/5, fixed) | Reused `.transactionsTable`'s `min-width: 45rem` blindly; with 6 near-equal amount columns and long headers ("Balance at end of month", "Net income/expense"), headers wrap since `th` has no `nowrap`. Shortened to "Net"/"Balance" with `aria-label` carrying the full text |
| 5 | Restraint | 5/5 | Stat row, not KPI cards — correct for this app's data-forward stance |
| 6 | Hierarchy/IA (tab nesting) | 4/5 (was 2/5, fixed) | Nested Cash-flow/Category-breakdown sub-tabs rendered visually identical to the account-level tabs one level up — real ambiguity about which row does what. Gave the nested level a smaller, subordinate treatment |
| 7 | Accessibility | 4/5 | Correct `<dl>`/`<dt>`/`<dd>` semantics; no `aria-live` on the full report swap when year changes — flagged, not fixed (see below) |
| 8 | Responsive/layout robustness | 4/5 (was 2/5, fixed) | `.overviewHeader .accountTabs` was missing `min-width: 0` inside its flex row — same overflow bug class fixed twice already this session, now fixed a third time |
| 9 | Token/system consistency | 5/5 | All new CSS is token-based; `.yearSelector`'s `--color-ground` background correctly matches the codebase's own established `.field input/select` convention (checked directly — one critique claim that it should be `--color-surface` was verified wrong and rejected) |
| 10 | Code quality / DRY | 4/5 | `signedAmount`/`polarityClassName` are correctly NOT unified with `AccountTransactionsPanel`'s `transactionPolarity`-based sign logic (value-sign vs. transaction-type are genuinely different decisions) — the low-level sign-glyph formatting is a minor, low-value duplication, deferred |
| **Total** | | **~35/40 (scaled: ~31.5/36)** after fixes | Good — several real, concrete bugs (not stylistic taste) caught and corrected |

## Design-Specificity Verdict
Product-native. Built for Night Ledger specifically: financial polarity kept as a dedicated signal (not general UI accent), transfers correctly left uncolored per spec, `<dl>` semantics chosen deliberately, no cards/shadows. The defects found were all "reused a neighbor pattern without re-deriving fit for this context" (table min-width, tab styling, missing min-width:0) rather than generic-AI blandness — exactly the failure mode to watch for when extracting/reusing existing patterns, not a sign of low craft.

## What's Working
1. Reusing the `.transactionsTable` financial-polarity CSS system (tokens, tabular-nums, sign-plus-color) instead of inventing a parallel one.
2. Extracting `TabBar`/`TabPanel` as a shared component rather than duplicating the WAI-ARIA tablist logic a second time — correct move given a second tab bar was about to exist.
3. Transfers-uncolored restraint is correct and was nearly "fixed" incorrectly by a first-pass instinct to color everything — glad this held.

## Priority Issues (all fixed this round)
[P1] Wrong stat emphasized (Balance instead of Net income/expense) — fixed, moved `.cashFlowStatEmphasis` to Net.
[P1] Nested sub-tabs visually identical to account-level tabs, flattening real hierarchy — fixed, `.overviewHeader .accountTab` now smaller/subordinate.
[P1] Missing `min-width: 0` on `.overviewHeader .accountTabs`, same overflow bug class as two prior fixes this session — fixed.
[P2] Income/expense coloring inconsistent between summary (`unconditional`) and table (`>0` guard) — fixed, guard removed.
[P2] Monthly table headers ("Net income/expense", "Balance at end of month") wrap under the inherited 45rem min-width with 6 near-equal columns — fixed via shortened labels + `aria-label` for the full text.

## Deferred (not fixed, flagged for a future round)
- No `aria-live` announcement when the year selector swaps the entire report (6 stats + up to 72 table cells). Consistent with the rest of the app (transactions table page/filter changes also don't announce) — this is a cross-cutting a11y gap, not specific to this surface, better solved once for the whole app than patched here alone.
- Minor DRY gap: the sign-glyph (`+`/`−`) formatting logic exists in both this file and `AccountTransactionsPanel` — low value to extract given the two callers derive polarity from genuinely different inputs (value sign vs. transaction type).

## Persona Red Flags
- Sam: no `aria-live` on year-change — real but consistent with existing app-wide behavior, not a new regression.
- Jordan: emphasis now correctly points at year performance, not a fact already visible elsewhere in the UI.

## Questions to Consider
- Should the deferred `aria-live` gap become its own cross-cutting task once more async-swap surfaces exist, rather than being fixed piecemeal per-surface?
