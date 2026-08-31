---
target: Nav bars (main App.tsx Nav + MoneyTrackerLayout secondary tab bar)
total_score: 29
max_score: 36
na_heuristics: 10
p0_count: 0
p1_count: 1
timestamp: 2026-08-31T13-52-56Z
slug: src-nav-module-css
---
Method: dual-agent (A: nav-assessment-a · B: nav-assessment-b)

## Design Health Score
| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Active state immediate |
| 2 | Match System / Real World | 4 | Plain jargon-free labels |
| 3 | User Control and Freedom | 3 | No Escape-to-cancel on logout confirm |
| 4 | Consistency and Standards | 4 | 10/11 CSS properties identical between .nav and .tabs (verified diff) |
| 5 | Error Prevention | 3 | Two-step logout confirm |
| 6 | Recognition Rather Than Recall | 4 | Everything always visible |
| 7 | Flexibility and Efficiency | 2 | No accelerators, reasonable at this scale |
| 8 | Aesthetic and Minimalist Design | 4 | Zero decoration |
| 9 | Error Recovery | 2 | Adequate for a nav |
| 10 | Help and Documentation | n/a | Genuinely inapplicable at 3+2 item scale |
| Total | | 29/36 | Good |

## Design Specificity Verdict
Strongly grounded in Night Ledger tokens, zero hardcoded colors/shadows. detect.mjs: [] exit 0. Manual property diff confirms .tabs mirrors .nav on 10/11 properties (only align-items:center missing, cosmetically invisible).

## What's Working
1. Pixel-perfect DESIGN.md fidelity, verified not assumed.
2. Logout confirmation is well-built and shared via props (hub + nav can't drift).
3. Restraint as a feature - no icons/avatars/dropdowns.

## Priority Issues
[P1] No visual hierarchy between the two stacked nav levels - both bars visually identical, could read as one flat 5-item nav.
[P2] Missing :focus-visible on .nav a and .tabs a - confirmed zero focus rules in Nav.module.css; pattern already exists elsewhere in MoneyTracker.module.css (.accountTab, .row) just not applied here.
[P2] Two unlabeled <nav> landmarks mounted simultaneously inside Money Tracker - screen readers can't distinguish them.
[P3] Logout confirmation has no Escape handler.
[P3] Asymmetric NavLink `end` prop usage between Accounts/Categories tabs.

## Persona Red Flags
- Sam: indistinguishable nav landmarks + inconsistent focus visibility across links.
- Jordan: identical styling between nav levels prevents accurate IA mental model.
- Casey: two stacked bars consume vertical space on mobile with no responsive adjustment.

## Questions to Consider
- At 4+ top-level items, does the identical-styling-between-levels approach still hold, or does it need real hierarchy differentiation before then?
- Should the secondary tab bar remain a full-width <nav>, or move inside the content area as page-level tabs?
