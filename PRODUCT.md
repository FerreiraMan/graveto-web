# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary user is the account owner (personal use), plus shared account members — never more than 2 to 3 users per account. Users track their own household/personal finances together via shared accounts with membership roles.

## Product Purpose

A personal money tracker tailored to the owner's own needs: track spending across accounts, manage recurring transactions/transfers, view cash flow and category spending analytics, and (planned) track an investment portfolio — consolidating everything the owner needs to see their full financial picture in one place. Started as a learning platform but is intended for genuine everyday daily use, not just as a demo.

## Positioning

Not built to compete on a market feature checklist — it exists because it is tailored precisely to the owner's own accounts, categories, and workflow, which off-the-shelf tools (e.g. Excel, YNAB, Firefly III) do not do exactly the way the owner wants. Differentiation is personal fit, not a public unique mechanism.

## Operating Context

- Backend (`graveto`, Spring Boot/Java) and frontend (`graveto-web`, React/Vite/TypeScript) are separate repos with a documented Java DTO contract as the source of truth; frontend types are hand-mirrored from backend record definitions.
- Core moneytracker domain (already built): accounts with shared membership/roles, transactions, recurring transactions/transfers, categories (tree-structured, max depth 3), cash flow analytics (yearly/monthly income, expense, transfers in/out, net income/expense, balance), category spending analytics (recursive category tree with rolled-up totals).
- Portfolio/investment tracking is a planned, not-yet-built capability — the backend MVP is described as "almost finished," so this is a durable near-term product fact, not speculative.

## Capabilities and Constraints

- Multi-user via account membership (existing, built capability), capped at 2-3 users per account by expected usage, not a hard technical limit that's been confirmed.
- Currency handling: amounts render as symbol-suffixed values with no space (e.g. `1234.56€`), matching Portuguese convention; supported symbols currently EUR/USD/GBP with fallback to the raw code.
- Self-hosted today; cloud integration is not excluded as future direction.
- No portfolio/investment tracking yet — planned addition to the moneytracker feature set.

## Product Principles

- Build for real daily personal use, not just a portfolio/demo piece — correctness and workflow fit matter more than breadth.
- Follow the backend's contract exactly; the backend is the source of truth for shape and semantics, the frontend adapts to it.
- Prefer the codebase's existing conventions and native platform capabilities over new dependencies or abstractions not yet justified by real usage.
- Keep the account owner's actual workflow (accounts, spending, recurring operations, and soon portfolio) as the frame for scope — not a generic finance-app feature list.
