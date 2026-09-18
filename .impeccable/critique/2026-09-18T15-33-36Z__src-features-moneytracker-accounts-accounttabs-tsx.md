---
target: Account detail tab bar (AccountTabs.tsx underline restyle + heading removal)
total_score: 29
max_score: 36
na_heuristics: 
p0_count: 0
p1_count: 1
timestamp: 2026-09-18T15-33-36Z
slug: src-features-moneytracker-accounts-accounttabs-tsx
---
Method: dual-agent (A: tabs-assessment-a · B: tabs-assessment-b)

## Design Health Score
| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Token/color discipline | 5/5 | Fully token-based, accent scoped to active/focus only, no shadow, no hex/rgb |
| 2 | Design-system fidelity | 4/5 | Underline mechanism is not prohibited by DESIGN.md's actual text (accent-for-active-tab is satisfied); genuine sibling inconsistency exists vs the app's other `.tabs` pattern (see below), not a spec violation |
| 3 | Comment/code truthfulness | 3/5 | Duplicate dead `.accountTabActive` rule confirmed real (verified via grep, not assumed) |
| 4 | Active-state legibility | 4/5 | Hover/active collision correctly fixed on this component; underline + color together give a real, working two-channel signal |
| 5 | Housekeeping | 3/5 | Same duplicate-rule issue as #3; otherwise clean |
| 6 | Accessibility (tab semantics) | 2/5 | Real WAI-ARIA gap: `<nav>` + `aria-current` is link semantics, not the Tabs pattern (should be `role="tablist"`/`"tab"`/`"tabpanel"`, `aria-selected`, `aria-controls`, roving tabindex + arrow keys) — fails WCAG 4.1.2 for a genuine view-switcher |
| 7 | Token discipline (CSS-level) | 4/5 | Clean aside from the duplicate rule |
| 8 | Hierarchy/spacing | 3.5/5 | Underline math (margin-bottom:-1px + 2px border over 1px nav border) is correct, no misalignment; but `.detailColumn` has no intentional top padding, so tabs now sit flush at the column's top edge post-heading-removal |
| 9 | Sibling consistency | 3/5 | Confirmed real: the app's other tab pattern (top-level `.tabs`/`.tabs a`, real page nav links) is color-only with NO underline, and still has the exact hover/active collision this round fixed here — two different visual languages for "tabs" now coexist in the app |
| 10 | Product-nativeness / restraint | 5/5 | Bespoke, on-system, no generic-AI-slop patterns |
| **Total** | | **~32/40 (scaled: ~29/36)** | Good, with one real accessibility gap and one real cross-component inconsistency |

## Design-Specificity Verdict
Product-native, decisively — not generic-AI-slop. Full token discipline, accent strictly scoped to interactive/active, no box-shadow, transitions match the session's existing 150ms convention. The heading-removal rationale is genuinely product-specific (verified: `AccountRow`'s `.rowSelected` highlight really does keep the selected account visible in the left column at all times — no responsive breakpoint stacks the columns, so this isn't a viewport-dependent regression). The one softening note: Assessment A's claim that the underline "violates DESIGN.md" was checked against the actual document text and found unsupported — DESIGN.md specifies accent color marks the active tab, not that color must be the ONLY carrier; the underline is a legitimate, spec-compliant enhancement, not a fork off-spec. The real sibling-consistency question is empirical (a second, older tab pattern exists with a different visual language), not a documented-spec violation.

## What's Working
1. Hover/active collision genuinely fixed — hover now goes to plain text color, active keeps accent + underline, verified this reads unambiguously except when hovering the already-active tab (which correctly stays accent-colored throughout, by design).
2. Heading removal is a verified-safe simplification, not a guess — the left-column list's `.rowSelected` state was checked directly and does carry the identity signal at all times.
3. Underline arithmetic is correct — no double-line or misalignment between the nav's 1px full-width border and each tab's 2px active underline.

## Priority Issues
[P1] Tab semantics use link/nav ARIA (`<nav>` + `aria-current`) for what is functionally a view-switching tabbed interface (three panels, one visible at a time, no page navigation). Fails WCAG 4.1.2 on a manual audit. Fix: convert to the WAI-ARIA Tabs pattern — `role="tablist"` on the nav, `role="tab"` + `aria-selected` + `aria-controls` on each button, `role="tabpanel"` on the rendered content, roving `tabindex` with arrow-key navigation between tabs.

[P2] Duplicate dead `.accountTabActive` CSS rule — a leftover `{ color: var(--color-accent); }` block still exists below the real, complete rule (verified via grep: three separate `.accountTabActive` declarations exist, lines 649/654/658). Fix: delete the redundant leftover block.

[P3] `.detailColumn` has no intentional top padding — with the heading gone, the tab bar now sits flush against the column's top edge, misaligned with the left column's own top spacing. Fix: add a small `padding-top` (or equivalent margin) to `.detailColumn` to restore visual alignment between the two columns.

[P3 — flagged as a question, not auto-fixed] The app has two different tab visual languages now: the account-detail tabs (this round: underline + fixed hover/active collision) and the top-level page nav `.tabs`/`.tabs a` (color-only, unfixed hover/active collision — hovering ANY link there currently looks identical to the active one). Worth deciding whether to bring the top-nav in line with this round's pattern, or leave them intentionally distinct (page nav vs in-page view-switcher) — this is a separate, larger-blast-radius surface (the primary app nav, used on every page) and wasn't touched this round.

## Persona Red Flags
- Sam: tab semantics will fail a screen-reader/keyboard-only audit — arrow-key tab navigation doesn't work, `aria-selected`/`aria-controls` are absent.
- Jordan: no visible issue — the removed heading was correctly identified as redundant, not informative.
- Casey: no viewport-stacking risk found — the account list stays visible at all checked states, so no responsive regression from the heading removal.

## Questions to Consider
- Should the top-level page nav (`.tabs`/`.tabs a`) be brought in line with this round's underline + hover-fix pattern, given it currently has the exact collision bug this round fixed elsewhere?
