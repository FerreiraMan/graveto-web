---
target: Update forms -> modal conversion (transaction, recurring transaction, recurring transfer)
total_score: 31
max_score: 36
timestamp: 2026-10-30T10-59-29Z
slug: neytracker-transactions-updatetransactionmodal-tsx
---
# Critique: Update forms -> modal conversion (transaction, recurring transaction, recurring transfer)

Score: 31/36

## Findings

1. P2 - UpdateTransactionForm category-search wiping a valid selection. The
   combined fetch/reset effect reset categorySid on every debounced search
   keystroke, not just on a real type change, silently deselecting a valid
   category just because a search term temporarily filtered it out of the
   visible list. FIXED: split into two effects - one for the search-driven
   fetch (display only, never resets selection), one keyed only on
   [accountSid, transactionType] that re-validates the selection on an
   actual type change (skips the initial mount).

2. P2 - Orphaned <label> with no htmlFor/control on the two new "can't be
   changed" disclosure lines (UpdateRecurringTransactionForm,
   UpdateRecurringTransferForm). FIXED: added a new .fieldStaticLabel CSS
   class (same look as .field label) and switched to a plain <span>.

3. P2 - Missing autoFocus on the first field of all 3 new Update
   modals/forms, inconsistent with every Create modal's established
   pattern. FIXED: added autoFocus to UpdateTransactionForm's Type select
   and both recurring forms' Description input (their first real control
   now that category/destination is a static disclosure).

4. P2 - No focus-restore when an Update modal closes (Cancel/Escape/
   overlay-click/successful save) - falls back to document.body. DEFERRED:
   the Create-flow equivalent uses a stable ref on the triggering button
   held by the parent panel; Update's trigger is a per-row menu button with
   no ref exposed to the parent. Proper fix requires forwarding a ref
   through 2 more files across 3 row-menu variants - flagged as a known
   follow-up rather than rushed in this round.

5. P2 - endDate can never be cleared once set (`endDate: endDate || undefined`
   sends undefined on an intentionally-cleared field, and the backend
   treats omitted fields as "leave unchanged"). Pre-existing code, not
   introduced this round - NOT fixed, needs a confirmed backend
   clear-sentinel (explicit null vs omitted) before it can be fixed safely.

6. P3 - TabBar.tsx's TabPanel comment is slightly stale relative to its
   actual {isActive && children} unmount behavior. Not fixed (cosmetic,
   comment-only).

## Verified correct, no action needed
- Modal shell (focus trap, scroll lock, Escape, overlay click) matches
  CreateTransactionModal's pattern exactly across all 3 new modals.
- disabledTabs/onFormOpenChange guard in RecurringOperationsPanel still
  correctly covers the modal case - the modal is still a descendant of the
  TabPanel-wrapped section, so switching tabs would still discard it; guard
  is unaffected by the inline-to-modal change.
- No dead code, no unused imports/props, no orphaned CSS left behind from
  the inline removal.
- Data-population principle (trust the cached row prop, no re-fetch) and
  the two backend-confirmed "can't change category/destination" constraints
  are correctly reflected.
