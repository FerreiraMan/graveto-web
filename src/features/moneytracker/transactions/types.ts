import type { TransactionType } from '../categories/types'

export type TransactionStatus = 'ACTIVE' | 'DELETED'

export const TRANSACTION_STATUS_LABELS: Record<TransactionStatus, string> = {
  ACTIVE: 'Active',
  DELETED: 'Deleted',
}

// Backend response uses @JsonInclude(NON_NULL) — nullable fields are omitted
// entirely rather than sent as null. Check with falsy/`!field`, never `=== null`.
export interface Transaction {
  sid: string
  amount: number
  currency: string
  description?: string
  type: TransactionType
  correlationId?: string
  account: TransactionEntityRef
  category: TransactionEntityRef
  status: TransactionStatus
  deletedAt?: string
  occurredAt: string
}

export interface TransactionEntityRef {
  sid: string
  name: string
}

const TRANSFER_TYPES = new Set(['TRANSFER_IN', 'TRANSFER_OUT'])

export function isTransferLeg(transaction: Transaction): boolean {
  return Boolean(transaction.correlationId) || TRANSFER_TYPES.has(transaction.type)
}

// Financial polarity for display (DESIGN.md: a dedicated gain/loss signal,
// never the general accent color). Transfers move money between the
// user's own accounts — neither a gain nor a loss — and an opening
// balance is a starting snapshot, not a flow event, so both stay neutral.
export type FinancialPolarity = 'gain' | 'loss' | 'neutral'

export function transactionPolarity(type: TransactionType): FinancialPolarity {
  if (type === 'INCOME') return 'gain'
  if (type === 'EXPENSE') return 'loss'
  return 'neutral'
}

// Fixed 2-decimal, thousands-separated formatting for scanning a column of
// money — the raw JS number (e.g. "1234.5") doesn't align or compare well
// down a column, or read clearly in a confirm prompt.
export function formatAmount(amount: number): string {
  return amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export interface TransactionFilterRequest {
  accountSid: string
  categorySid?: string
  startDate?: string
  endDate?: string
  type?: TransactionType
  status?: TransactionStatus
}

export interface TransactionPageRequest {
  page?: number
  size?: number
}

export interface CreateTransactionRequest {
  accountSid: string
  categorySid: string
  amount: number
  description?: string
  transactionType: TransactionType
  occurredAt?: string
}

// Only mutable fields — accountSid can't change after creation, and this
// endpoint rejects transfer-linked transactions entirely (backend directs
// those to the Transfer API instead).
export interface UpdateTransactionRequest {
  transactionType?: TransactionType
  categorySid?: string
  amount?: number
  description?: string
  occurredAt?: string
}
