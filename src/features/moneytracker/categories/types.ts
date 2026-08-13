export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'OPENING_BALANCE'

export const ALL_TRANSACTION_TYPES: TransactionType[] = [
  'INCOME',
  'EXPENSE',
  'TRANSFER_IN',
  'TRANSFER_OUT',
  'OPENING_BALANCE',
]

// Only user-selectable types — the others are system-internal (transfers,
// opening balance), excluded server-side from every category query
// (isNotInternal spec), and only ever attached to built-in SystemCategory
// defaults. They're never user-created and never returned by
// fetchAllCategories, so exposing them in a category dropdown (create form
// or filter) would be dead UI — filtering by them always returns empty, and
// users can't pick them. Transactions themselves are not restricted this
// way — a transfer or opening balance is a real transaction — so
// transaction-facing UI should use ALL_TRANSACTION_TYPES instead.
export const CATEGORY_TRANSACTION_TYPES: TransactionType[] = ['INCOME', 'EXPENSE']

// FE-only display labels — kept separate from the wire enum so copy can
// change without touching the API contract or any other consumer of it.
export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  INCOME: 'Income',
  EXPENSE: 'Expense',
  TRANSFER_IN: 'Transfer in',
  TRANSFER_OUT: 'Transfer out',
  OPENING_BALANCE: 'Opening balance',
}

export interface CreateCategoryRequest {
  name: string
  accountSid: string
  parentSid?: string
  transactionType: TransactionType
}

// Backend response uses @JsonInclude(NON_NULL), so nullable fields are
// omitted from the JSON entirely rather than sent as null — hence optional
// (?:), not `| null`. Always check with falsy/`!field`, never `=== null`.
export interface Category {
  sid: string
  displayName: string
  parentDisplayName?: string
  accountSid?: string
  parentSid?: string
  type: TransactionType
  isSystem: boolean
}

export interface CategoryFilterRequest {
  displayName?: string
  accountSid?: string
  parentSid?: string
  type?: TransactionType
}
