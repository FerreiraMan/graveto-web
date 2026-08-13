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
