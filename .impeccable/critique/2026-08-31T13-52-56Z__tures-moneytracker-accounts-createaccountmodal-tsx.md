---
target: Create-account modal (CreateAccountModal.tsx)
total_score: 28
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
timestamp: 2026-08-31T13-52-56Z
slug: tures-moneytracker-accounts-createaccountmodal-tsx
---
Method: dual-agent (A: modal-assessment-a · B: modal-assessment-b)

## Design Health Score
| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | "Creating..." state fine; no explicit success confirmation |
| 2 | Match System / Real World | 4 | Copy flow reads as intentional, not template |
| 3 | User Control and Freedom | 3 | 3 dismissal paths exist but none visually discoverable in-panel |
| 4 | Consistency and Standards | 4 | Reuses .field/.formActions/.primaryButton verbatim |
| 5 | Error Prevention | 2 | required/min/step advisory only |
| 6 | Recognition Rather Than Recall | 3 | Raw ISO currency codes, no disambiguation |
| 7 | Flexibility and Efficiency | 2 | No shortcut to open; native Enter-submit works |
| 8 | Aesthetic and Minimalist Design | 4 | Exactly 3 fields, nothing extraneous |
| 9 | Error Recovery | 2 | API errors shown verbatim, no rewriting |
| 10 | Help and Documentation | 1 | Zero placeholder/helper text |
| Total | | 28/40 | Acceptable |

## Design Specificity Verdict
Genuinely grounded - .modal reuses .list's exact surface/border/radius treatment, form fields reuse the shared .field rule used elsewhere in the module. detect.mjs: [] exit 0. Manual scan found aria-modal="true" is present but NOT backed by an actual focus trap - confirmed independently by both assessments (zero focus-trap code anywhere in src/).

## What's Working
1. Token discipline flawless in modal-specific CSS; the one raw value (overlay backdrop) is defensible - no equivalent token exists.
2. Copy revision from earlier this session (trigger -> title -> submit) reads as coherent, not redundant, to both independent reviewers.
3. Dialog role/label wiring, autoFocus, role=alert on errors, disabled-during-submit all correctly implemented.

## Priority Issues
[P1] No focus trap despite aria-modal="true" - Tab/Shift+Tab escapes into the dimmed page behind. Confirmed by both assessments independently.
[P1] Instantaneous open/close, no transition - app already has a fadeIn 180ms ease-out precedent (LogoutControl) unused here.
[P2] Focus never returns to the trigger button on any close path - no ref, no restore logic.
[P2] No body scroll lock - page behind the overlay can still be scrolled.
[P3] Currency shown as raw ISO codes (EUR/USD/GBP) - currencySymbol() helper already exists elsewhere, unused here.

## Proportionality tension (raised independently by both assessments)
This modal is now the heaviest-weight interaction in the app, applied to the lowest-stakes action (create, trivially reversible) - while closing an account (hard to undo) uses a lighter inline panel with no overlay. Worth naming explicitly even though the popup itself was an explicit user request.

## Persona Red Flags
- Sam: missing focus trap is the single highest-risk finding for this persona.
- Riley: no "create another" flow for batch account setup; no rhythm without a transition.
- Casey: no helper text on "Institution", no currency disambiguation, full-screen dim may overstate the action's stakes.

## Questions to Consider
- Is a full-screen dimmed overlay the right mechanism for "stay on this page," or would a lighter slide-out/inline expansion achieve the same goal without the heaviest-interaction-for-lightest-action inversion?
- Should the .overlay/.modal CSS classes be scoped more tightly (e.g. createAccountOverlay) so future contributors don't reach for a modal by default, given the app's stated preference against them?
