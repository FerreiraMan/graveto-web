<!-- SEED: established with the user before implementation; re-run /impeccable document once there's code to capture the actual tokens and components. -->
---
name: Graveto
description: A personal money tracker for tracking spending, accounts, and (soon) portfolio.
---

# Design System: Graveto

## Overview

**Creative North Star: "The Night Ledger"**

Graveto is checked daily, often in the evening, by its owner and 2-3 shared account members reviewing spending, recurring transactions, and cash flow. The surface exists to be read quickly and trusted, not to persuade or entertain — a dark, quiet operating surface where the data is the content and the interface gets out of the way. Restrained color strategy: a near-black neutral ground carries the interface, with a single cool accent reserved for interactive elements (links, active tabs, focus states) and financial polarity (green for income/gains, red for expense/losses) kept as its own separate, meaningful signal rather than folded into the general accent.

Dark by default reflects real usage: checked in the evening, glanced at repeatedly, never a marketing surface. Rejected: warm/cream editorial looks, high-saturation "fintech app" gradients, and any color scheme that competes with the green/red financial polarity signal.

**Key Characteristics:**
- Restrained: one accent color, used sparingly, everywhere else neutral
- Dark-first: near-black grounds, light text, low visual noise
- Data-forward: tables and lists are the primary UI, not cards or illustrations
- Financial polarity (income/expense, gain/loss) is a dedicated signal, never reused for general UI accenting

## Colors

Neutral-dominant dark surface with one cool accent for interactivity; green/red reserved exclusively for financial meaning.

### Primary
- **Signal Teal** (`#3fb8af` — [to be refined during implementation]): links, active nav/tab state, focus rings, primary buttons. Used sparingly — this is the only non-financial, non-neutral color in the system.

### Neutral
- **Near-Black Ground** (`#121417` — [to be refined during implementation]): page background.
- **Raised Surface** (`#1c1f24` — [to be refined during implementation]): tables, panels, cards — one step lighter than the ground to imply layering without shadows.
- **Border/Divider** (`#2a2e35` — [to be refined during implementation]): table borders, dividers, input outlines.
- **Primary Text** (`#e8e9eb` — [to be refined during implementation]): body text, headings.
- **Muted Text** (`#8a8f98` — [to be refined during implementation]): secondary/rollup values (e.g. category parent totals that sum their children), placeholder text, helper copy.

### Financial Polarity (dedicated, not general UI accent)
- **Gain / Income** (`#4caf82` — [to be refined during implementation]): income, positive net flow, gains.
- **Loss / Expense** (`#e0685f` — [to be refined during implementation]): expense, negative net flow, losses.

### Named Rules
**The One Accent Rule.** Signal Teal is the only color used for general interactivity (links, active states, buttons, focus). It never appears as a status or financial-polarity signal, and financial polarity never appears on ordinary interactive chrome.

## Typography

**Body/UI Font:** `system-ui, 'Segoe UI', Roboto, sans-serif` (existing stack, kept as-is)

**Character:** Plain, fast-rendering, and unremarkable on purpose — an Operate surface earns trust through consistency and speed, not typographic voice. No display or decorative face.

### Hierarchy
[To be resolved during implementation — the codebase currently uses browser-default sizing (`<h1>`–`<h4>`, unstyled `<table>`/`<td>`) with no defined type scale. A future document pass should extract the scale once real sizes are chosen.]

## Layout

[To be resolved during implementation — no grid, container, or spacing scale exists yet. Given the data-forward Operate character, favor dense, left-aligned tables/lists over centered card layouts; confirm a spacing scale (e.g. 4/8px base) when it's introduced.]

## Elevation & Depth

Flat by default, no shadows. Depth between the page ground and raised surfaces (tables, panels) is conveyed by a one-step lightness difference (Near-Black Ground → Raised Surface), not by shadow — consistent with the restrained, quiet character.

### Named Rules
**The Flat-By-Default Rule.** No box-shadows. Layering comes from background lightness steps only.

## Shapes

[To be resolved during implementation — no radius/border convention exists yet in the codebase. A small, consistent radius (e.g. 4-6px) on inputs/buttons/panels would suit the quiet, functional character; nothing decorative or heavily rounded.]

## Components

No component library or reusable styled components exist yet — the current implementation is bare semantic HTML (`<table>`, `<select>`, `<button>`, `<ul>`) with browser-default styling. The following are directional intents for when components are actually styled, not existing implementation.

### Tables
- The primary content surface for this product (transactions, cash flow, category breakdown). Raised Surface background, Border/Divider row separators, dense row height, no zebra striping (adds noise without adding information at this density).
- Rollup rows (e.g. a parent category summing its children) use Muted Text for their totals — the existing convention already established in code (dimmed color + tooltip explaining the rollup) — kept and generalized as the dedicated visual language for "this number is a sum, not a direct entry."

### Buttons
- **Shape:** [to be resolved — small radius once one is chosen]
- **Primary:** Signal Teal background or text, used for the primary action per view.
- **Secondary/Ghost:** neutral border or text-only, for tab/filter toggles (year selector, sub-tabs) — these are frequent, low-commitment actions and shouldn't compete visually with primary actions.

### Selects/Inputs
- **Style:** Raised Surface background, Border/Divider outline, Primary Text.
- **Focus:** Signal Teal outline/ring.

### Navigation (tabs)
- Text-based tabs (Overview / Transactions / Recurring operations, and Overview's own Cash flow / Category breakdown sub-tabs) with Signal Teal indicating the active tab; inactive tabs in Muted Text.

## Do's and Don'ts

### Do:
- **Do** reserve Signal Teal for interactivity only — links, active states, focus, primary actions.
- **Do** use Gain/Income and Loss/Expense colors exclusively for actual financial polarity — never as decorative accents elsewhere.
- **Do** convey hierarchy/depth through neutral lightness steps, not shadows.
- **Do** keep tables dense and left-aligned; this is a data-reading tool, not a marketing surface.

### Don't:
- **Don't** introduce a second general-purpose accent color — the restraint is the point.
- **Don't** use green/red for anything other than income/expense or gain/loss.
- **Don't** add card-and-illustration-style empty states or decorative imagery — this product has no use for them given its Operate character.
- **Don't** add box-shadows or heavy elevation effects.
