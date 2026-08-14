import type { TransactionType } from '../categories/types'
import type { Frequency, RecurringEntityRef, RecurringOperationStatus } from '../recurring/types'

// Backend response uses @JsonInclude(NON_NULL) — nullable fields are
// omitted entirely rather than sent as null. Check with falsy/`!field`,
// never `=== null`. Dates are plain ISO_LOCAL_DATE strings ("YYYY-MM-DD"),
// not date-times, unlike Transaction.occurredAt.
export interface RecurringTransaction {
  sid: string
  account: RecurringEntityRef
  category: RecurringEntityRef
  userSid: string
  description: string
  amount: number
  currency: string
  transactionType: TransactionType
  frequency: Frequency
  nextExecutionDate: string
  status: RecurringOperationStatus
  endDate?: string
}

export interface RecurringTransactionFilterRequest {
  accountSid?: string
  status?: RecurringOperationStatus
}

export interface CreateRecurringTransactionRequest {
  accountSid: string
  categorySid: string
  description: string
  amount: number
  transactionType: TransactionType
  frequency: Frequency
  dayOfMonth?: number
  dayOfWeek?: number
  adjustToBusinessDay: boolean
  startDate?: string
  endDate?: string
}

// accountSid/categorySid/transactionType are immutable after creation —
// the backend update endpoint has no fields for them, mirroring how
// UpdateTransactionRequest excludes accountSid.
export interface UpdateRecurringTransactionRequest {
  description?: string
  amount?: number
  frequency?: Frequency
  dayOfMonth?: number
  dayOfWeek?: number
  adjustToBusinessDay?: boolean
  status?: RecurringOperationStatus
  nextExecutionDate?: string
  endDate?: string
}
