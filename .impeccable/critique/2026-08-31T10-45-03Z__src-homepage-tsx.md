---
target: post-login hub (src/HomePage.tsx)
total_score: 20
max_score: 36
na_heuristics: 10
p0_count: 0
p1_count: 1
timestamp: 2026-08-31T10-45-03Z
slug: src-homepage-tsx
---
Method: dual-agent (A: assessment-a-design-review · B: assessment-b-detector-evidence)

# Critique: Post-Login Hub (src/HomePage.tsx)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | No feedback on logout (no confirmation, no transition state); no "you are here" signal since Nav is intentionally absent here |
| 2 | Match System / Real World | 3 | Plain, natural language throughout ("Money Tracker," "Coming soon") |
| 3 | User Control and Freedom | 2 | Logout fires immediately, no undo, no confirmation |
| 4 | Consistency and Standards | 3 | Faithful to DESIGN.md tokens and list-over-cards convention; chevron is a raw glyph not a component |
| 5 | Error Prevention | 2 | Disabled Portfolio row correctly prevents a dead click; logout has no prevention at all |
| 6 | Recognition Rather Than Recall | 3 | Both options visible with descriptions |
| 7 | Flexibility and Efficiency | 1 | No shortcut, no default-route memory |
| 8 | Aesthetic and Minimalist Design | 3 | Clean and on-brand, but minimalism tips into bareness |
| 9 | Error Recovery | 1 | No recovery path if logout was accidental |
| 10 | Help and Documentation | n/a | Genuinely inapplicable for a two-row chooser |
| Total | | 20/36 (56%) | Acceptable, low end |

## Design Specificity Verdict
Category-interchangeable — could be any two-feature SaaS chooser. No greeting, time-of-day awareness, or data teaser acknowledging this is a 2-3-person daily-use personal tool. Detector scan (detect.mjs --json src/HomePage.tsx) returned exit 0, [] — clean, no mechanical findings. No browser automation tool was available; evaluation is source-based only.

## Priority Issues
- [P1] Logout has no confirmation on an irreversible action — one click, no undo, sits next to the page's only heading.
- [P2] Disabled Portfolio row (<span aria-disabled="true">) is invisible to keyboard/screen-reader users — not focusable, never announced.
- [P2] No visual pull toward the one clickable row — Money Tracker and disabled Portfolio carry near-identical visual weight.
- [P2] Every session pays the same click-through cost for a choice that isn't really a choice yet (Portfolio disabled) — a product-scope question, not just visual.
- [P3] Heading spends prime real estate on the product's own name rather than anything user-relevant.

## Persona Red Flags
- Jordan (first-timer): Portfolio's "Coming soon" is a dead end with no timeline.
- Sam (accessibility): tab order skips Portfolio entirely; focus rings elsewhere are correct and pass contrast.
- Alex (power user): can bypass via bookmarking /moneytracker directly, but no designed shortcut/default-route memory.

## Minor Observations
- Chevron is a raw "›" character, not an icon component.
- color-mix() hover background needs 2023-era evergreen browsers.
- 6px radius on .list is the only radius token in use; DESIGN.md still marks shapes unresolved.

## Questions
- Should this page exist at all while Portfolio is disabled, or should the app auto-forward to Money Tracker until there are genuinely two choices?
- What would it feel like if the first screen after login acknowledged who logged in, instead of restating the app's own name?
