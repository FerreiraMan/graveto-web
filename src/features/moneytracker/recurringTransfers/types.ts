import type { Frequency, RecurringEntityRef, RecurringOperationStatus } from '../recurring/types'

export interface RecurringTransfer {
  sid: string
  sourceAccount: RecurringEntityRef
  destinationAccount: RecurringEntityRef
  userSid: string
  description: string
  amount: number
  currency: string
  frequency: Frequency
  nextExecutionDate: string
  status: RecurringOperationStatus
  endDate?: string
}

// accountSid is mandatory server-side — always the currently selected
// account, treated as the transfer's source. Never optional; kept
// non-optional here (unlike destinationAccountSid/status) so the type
// itself reflects that, rather than only enforcing it at the call site.
export interface RecurringTransferFilterRequest {
  accountSid: string
  destinationAccountSid?: string
  status?: RecurringOperationStatus
}

export interface CreateRecurringTransferRequest {
  sourceAccountSid: string
  destinationAccountSid: string
  description: string
  amount: number
  frequency: Frequency
  dayOfMonth?: number
  dayOfWeek?: number
  adjustToBusinessDay: boolean
  startDate?: string
  endDate?: string
}

export interface UpdateRecurringTransferRequest {
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
