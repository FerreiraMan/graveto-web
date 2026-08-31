---
target: post-login hub (src/HomePage.tsx) - follow-up
total_score: 24
max_score: 36
na_heuristics: 10
p0_count: 0
p1_count: 0
timestamp: 2026-08-31T11-13-24Z
slug: src-homepage-tsx
---
Method: dual-agent (A: assessment-a-design-review · B: assessment-b-detector-evidence)

# Follow-Up Critique: Post-Login Hub (src/HomePage.tsx)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Inline confirmation is good feedback; no transition state after "Yes" fires |
| 2 | Match System / Real World | 3 | Natural language, greeting matches real usage time |
| 3 | User Control and Freedom | 3 | Confirm+Cancel gives a real emergency exit |
| 4 | Consistency and Standards | 3 | Faithful to DESIGN.md tokens/rules; chevron is a raw glyph |
| 5 | Error Prevention | 3 | Real disabled button for Portfolio, confirmation step for logout |
| 6 | Recognition Rather Than Recall | 3 | Both options visible, nothing hidden |
| 7 | Flexibility and Efficiency | 1 | Still a mandatory click-through every session |
| 8 | Aesthetic and Minimalist Design | 3 | Clean and on-brand; minimal but not empty anymore |
| 9 | Error Recovery | 2 | Cancel path exists; no feedback if logout call itself failed |
| 10 | Help and Documentation | n/a | Genuinely inapplicable |
| Total | | 24/36 (67%) | Good, lower end — up from 20/36 (56%) |

## Design Specificity Verdict
No longer category-interchangeable — greeting, nav-hiding rationale, and honest "no aggregator yet" comment demonstrate real product awareness. Remaining gap: zero data signal from the app itself (backend-dependent, not a design defect). Detector clean ([], exit 0) on both src/HomePage.tsx and src/App.tsx.

## Priority Issues
- [P2] visibility:hidden on the title during logout confirmation removes the page's only heading from the accessibility tree; confirmation controls also lack role="group"/aria-label tying them together.
- [P2] nameFromEmail() only splits on "@" — dots/underscores/plus-addressing leak through verbatim (e.g. "ferreirapedro.sjm"), undermining the greeting's "we know you" effect.
- [P2] No transition on the Log out -> confirmation swap; instant change risks a fast double-click landing on "Yes" before the state change registers.
- [P3] Hub remains a mandatory click-through with one active destination — repeat of an already-discussed, deliberate tradeoff, not new.

## Persona Red Flags
- Jordan: low risk, page is self-explanatory; Portfolio's "Coming soon" has no timeline.
- Sam: heading disappears from a11y tree during logout confirm (the one real regression); disabled-button semantics, focus rings, contrast all verified clean.
- Alex: can bookmark /moneytracker directly as a workaround; confirmation step is mild acceptable friction.

## Minor Observations
- titleHidden duplicates .title's properties except visibility — maintenance smell.
- color-mix() has no pre-2023-browser fallback, acceptable for self-hosted use.
- Raw "›" glyph is font-metric-dependent across platforms.
- Long email local-parts mid-word-wrap on narrow viewports (accepted tradeoff).
