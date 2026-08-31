---
target: Money Tracker landing page (MoneyTrackerLayout, AccountListPage, AccountRow, AccountTabs)
total_score: 27
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
timestamp: 2026-08-31T12-03-08Z
slug: features-moneytracker-accounts-accountlistpage-tsx
---
Method: dual-agent (A: assessment-a-design-review · B: assessment-b-detector-evidence)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Loading/error/selected states present; detail column has no loading indicator on first account selection |
| 2 | Match System / Real World | 3 | Raw enum strings ("OWNER", "CONTRIBUTOR", "ACTIVE") shown verbatim instead of human-friendly labels |
| 3 | User Control and Freedom | 3 | Good cancel/collapse paths; no "reopen" or confirmation after closing an account — the change is silent |
| 4 | Consistency and Standards | 3 | Structurally mirrors the hub, but measurable token drift confirmed by detector |
| 5 | Error Prevention | 3 | Type-to-confirm close is well-calibrated; email field has no client-side format validation |
| 6 | Recognition Rather Than Recall | 3 | Detail pane doesn't echo which account is selected — user must cross-reference the highlighted row |
| 7 | Flexibility and Efficiency | 2 | Zero keyboard shortcuts, no arrow-key row navigation, no bulk actions |
| 8 | Aesthetic and Minimalist Design | 4 | Restrained, token-disciplined, no decorative noise |
| 9 | Error Recovery | 2 | No retry after fetch failure anywhere on this surface |
| 10 | Help and Documentation | 1 | Zero contextual help; empty state gives no explanation of what an account is |
| **Total** | | **27/40** | **Acceptable** |

## Design Specificity Verdict
Well-grounded, not generic. Total token adherence (zero hardcoded colors), row/list pattern structurally cloned from HomePage.module.css, tab treatment clones Nav.module.css's color-only active state. Detector: [] clean across all 4 files. Manual diff against HomePage.module.css found 6 concrete spacing/sizing mismatches (.row gap 1rem vs 0.75rem, .row vertical padding 1rem vs 1.125rem, .rowLabel font-size 1rem vs 0.9375rem, .chevron font-size 1.25rem vs 1rem, .chevron default color accent vs muted, .badge vertical padding 0.25rem vs 0.1875rem, .tabs gap 1rem vs 1.5rem) — some introduced by an earlier same-session "fix cramped spacing" edit that moved away from the canonical mirror target.

## What's Working
1. Token discipline is exemplary — zero hardcoded values, confirmed by both detector and manual diff.
2. Progressive disclosure architecture — single-expanded accordion, mutually exclusive sub-forms, key-based remount resetting stale state.
3. Close-account friction is well-calibrated and internally consistent (danger tint, focus-outline shift, disabled-until-match button).

## Priority Issues

**[P1] Spacing/sizing drift from the mirror target (.row, .chevron, .badge, .tabs)** — confirmed via direct diff against HomePage.module.css; detector can't catch numeric drift. Fix: restore exact HomePage values. → /impeccable polish

**[P1] No responsive behavior; two-pane layout breaks under ~720px** — .listColumn fixed at 360px, zero @media queries anywhere. Structurally confirmed, not hypothetical. → /impeccable layout

**[P2] Selected account not identified in detail pane** — user must cross-reference highlighted row; also an accessibility gap (no heading/landmark). → /impeccable clarify

**[P2] No retry path after any fetch failure** — static error, only recovery is reloading the browser. → /impeccable harden

**[P3] aria-pressed + aria-expanded redundancy on row button** — flagged independently by both assessments. → /impeccable harden

## Persona Red Flags
- Jordan (First-Timer): empty state gives no explanation of what an account is; only action styled as secondary link.
- Sam (Accessibility): no focus management on panel expand; detail pane has no heading/landmark.
- Casey (Mobile): confirmed structurally broken below ~720px; touch targets on linkButton/dangerButton under 44x44px.

## Minor Observations
- Currency symbol placement matches neither EU nor US convention.
- Roles/status render as raw enum strings; codebase already has a label-mapping precedent (TRANSACTION_TYPE_LABELS) unused here.
- CategoryListPage.tsx is completely unstyled next to the fully-polished Accounts tab — jarring discontinuity switching domain tabs.

## Questions to Consider
- Should row click still open the manage panel every time, or should manage become a separate action again for the common "just browsing" case?
- Is the two-pane no-breakpoint layout worth its complexity for a typical 2-5 account user vs. a simpler navigate-to-detail model?
