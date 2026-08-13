import type { Transaction } from '../transactions/types'

export interface CreateTransferRequest {
  sourceAccountSid: string
  destinationAccountSid: string
  amount: number
  description?: string
  occurredAt?: string
}

// Transfers have no category/type to update — a transfer is always the
// INCOME/EXPENSE pair it was created as, so only these fields are mutable.
export interface UpdateTransferRequest {
  amount?: number
  description?: string
  occurredAt?: string
}

export interface Transfer {
  correlationId: string
  sourceTransaction: Transaction
  destinationTransaction: Transaction
}
