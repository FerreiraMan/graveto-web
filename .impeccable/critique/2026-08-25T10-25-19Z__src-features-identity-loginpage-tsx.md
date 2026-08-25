---
target: login/registration landing page
total_score: 19
max_score: 32
na_heuristics: 7,10
p0_count: 1
p1_count: 1
timestamp: 2026-08-25T10-25-19Z
slug: src-features-identity-loginpage-tsx
---
Method: dual-agent (A: assessment-a-design-review · B: assessment-b-detector-evidence)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Button text changes on submit, but no spinner/progress cue for a potentially slow self-hosted backend |
| 2 | Match System / Real World | 3 | Plain, unsurprising copy throughout |
| 3 | User Control and Freedom | 2 | Clean login↔register switch, but no "Forgot password?" — a real dead end |
| 4 | Consistency and Standards | 3 | Token-driven, consistent card layout, correct autocomplete attributes |
| 5 | Error Prevention | 1 | 5-char password minimum, no confirm field, no inline/real-time validation |
| 6 | Recognition Rather Than Recall | 3 | Labeled fields, working autocomplete/autofill |
| 7 | Flexibility and Efficiency | n/a | A 2-field auth form for a 2-3 person household has no meaningful shortcut surface |
| 8 | Aesthetic and Minimalist Design | 3 | Faithful to the Night Ledger direction, but minimal to the point of anonymous |
| 9 | Error Recovery | 2 | `role="alert"` used correctly, but no recovery path exists at all (no reset flow) |
| 10 | Help and Documentation | n/a | Not a reasonable expectation for a 2-field household login |
| **Total** | | **19/32** | **Acceptable (59%)** |

Detector confirms zero mechanical findings (clean run, exit 0) — the 19/32 is a UX/product-gap score, not a code-quality one.

## Design Specificity Verdict

**LLM assessment:** Generic. This card has no Graveto identity — no name, logo, tagline, or visual motif anywhere on the page. It could be any dark SaaS product's login. The Night Ledger direction's restraint was correctly applied to color/type/layout, but restraint was also applied to *identity*, which the direction never asked for. A first-time invited household member has zero confidence they're in the right place.

**Deterministic scan:** `detect.mjs` returned `[]` (clean) across `LoginPage.tsx`, `RegisterPage.tsx`, `App.tsx` — no mechanical/structural issues. This is a design-completeness gap, not a code defect; the detector has no signal for "missing brand identity."

**Visual overlays:** Not available — no browser automation tool is exposed in this environment, so no live injection/overlay was possible. Assessment B instead computed contrast ratios directly from the CSS source values, listed below. The screenshot you shared earlier of the rendered login page is the only live-rendered evidence in this run, and it's consistent with both assessments' static reads.

## Overall Impression

The auth surface **faithfully executes** the seed direction — flat, dark, one accent, no shadows, restrained. But two things undercut it: it has **no product identity** (a phishing page could look identical), and the **register flow has real, not just aesthetic, gaps** (no password recovery, weak minimum length, no confirmation field) that will cause actual lockouts once your 2-3 household members are using this for real. The biggest opportunity is closing the trust/identity gap cheaply (a wordmark, one line of copy) without breaking the quiet aesthetic — that's a five-minute fix with outsized payoff for a financial tool.

## What's Working

1. **Faithful execution of the design direction.** Flat, token-driven, single accent, correct `focus-visible` states on both input and button — better accessibility baseline than most MVPs ship.
2. **Correct autocomplete semantics.** `email` / `current-password` / `new-password` distinction is exactly right and often gotten wrong elsewhere.
3. **Clean escape hatch between login and register.** The switch link pattern works and matches expectations.

## Priority Issues

**[P0] No password recovery path**
*Why it matters:* For a self-hosted app shared by 2-3 household members, a forgotten password today has no self-service fix. This isn't a polish gap — it's an operational dead end that will actually happen.
*Fix:* At minimum, add a "Forgot password?" link and a backend-supported reset flow. If backend support isn't there yet, that's the real next task, not a CSS one.
*Suggested command:* `/impeccable harden`

**[P1] No product identity on the auth surface**
*Why it matters:* Nothing on the page says "Graveto" — no name, mark, or tagline. For a tool holding real financial data, that's a trust gap (visually indistinguishable from a phishing clone) and a missed first impression for invited household members.
*Fix:* Add a small wordmark/name above the card title, within the existing restrained palette (e.g. muted-gray "GRAVETO" label in a small tracked caps style, teal only if it doubles as a link). Keep it quiet — this doesn't need a logo mark, just a name.
*Suggested command:* `/impeccable clarify`

**[P2] Weak registration ceremony**
*Why it matters:* 5-character minimum is below OWASP/NIST guidance; no confirm-password field means a single typo on registration plus no recovery (P0) equals a locked-out household member with no way back in.
*Fix:* Raise the minimum (8+), add a confirm-password field, surface the requirement inline before submit rather than only as a post-submit error.
*Suggested command:* `/impeccable harden`

**[P2] No feedback distinction between network and auth failures**
*Why it matters:* On a self-hosted setup, "server unreachable" and "wrong password" are both real, distinct failure modes a household member will hit — collapsing them into the same red text makes self-diagnosis impossible.
*Fix:* Differentiate the copy (e.g. "Can't reach the server — check your connection" vs "Incorrect email or password").
*Suggested command:* `/impeccable clarify`

**[P3] Marginal label contrast at small size**
*Why it matters:* Muted label text (`#8a8f98` on `#1c1f24`) computes to ~4.76-5.09:1 (assessments differ slightly on the exact figure but agree it's a narrow AA pass, not a comfortable margin) at 13px — technically passes WCAG AA but is tight for low-vision users on a text size this small.
*Fix:* Either bump label size slightly or lighten the muted token a touch; don't need a new color, just a nudge.
*Suggested command:* `/impeccable polish`

## Persona Red Flags

**Jordan (First-Timer, invited household member):** Arrives at `/register` via a shared link with zero context — no app name, no explanation of what they're signing up for or who invited them. After registering, "Registration successful, you can now log in" gives no indication of what happens next (do they see shared data immediately? does someone need to add them to an account?). This is the multi-user onboarding gap PRODUCT.md's membership model implies but the UI never surfaces. High risk of confusion or abandonment at exactly the moment you want a new household member to trust the tool.

**Sam (Accessibility-Dependent User):** Baseline is solid — correct label association, `role="alert"` on errors, visible focus rings. Gaps: no `aria-invalid` or `aria-describedby` linking a field to its error, so a screen reader user tabbing back to a field doesn't hear why it failed without re-navigating to the alert region. Not a blocking failure, but a real friction point.

**Riley (Stress Tester):** No rate-limit/lockout feedback on repeated failed logins, no max-length or trim handling on inputs, generic error message on duplicate-email registration instead of a specific "this email is already registered." Low blast radius given only 2-3 users, but these are exactly the rough edges that surface within the first few real weeks of household use.

## Minor Observations

- Button hover color jump (`#3fb8af` → `#55c9c0`) has no transition — a 120ms ease would add polish without violating the restrained direction.
- Register's success state has no actionable button, only an inline text link — a styled "Go to log in" button would read as a clearer next step.
- No `noValidate` on the forms — native browser validation tooltips may fire before/alongside the custom inline errors on some browsers.

## Questions to Consider

- If someone saw this page with no URL bar, would they know it's Graveto and not any other dark SaaS login? What's the smallest addition that fixes that without breaking the quiet aesthetic?
- What actually happens today when a household member registers — do they see shared account data immediately, or is there a membership step that's currently invisible in the UI?
- With no password reset flow, what is the real recovery path right now if you or a household member gets locked out?
