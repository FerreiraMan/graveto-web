import { apiRequest } from '../../../shared/api/client'
import type {
  CreateRecurringTransactionRequest,
  RecurringTransaction,
  RecurringTransactionFilterRequest,
  UpdateRecurringTransactionRequest,
} from './types'

// GET /recurring-transactions returns a plain array, not a Page<T> —
// unlike /transactions, this endpoint has no pagination.
export function fetchRecurringTransactions(filters: RecurringTransactionFilterRequest): Promise<RecurringTransaction[]> {
  const params = new URLSearchParams()
  if (filters.accountSid) params.append('accountSid', filters.accountSid)
  if (filters.status) params.append('status', filters.status)

  return apiRequest<RecurringTransaction[]>(`/recurring-transactions?${params.toString()}`)
}

export function createRecurringTransaction(
  request: CreateRecurringTransactionRequest,
): Promise<RecurringTransaction> {
  return apiRequest<RecurringTransaction>('/recurring-transactions', { method: 'POST', body: request })
}

export function updateRecurringTransaction(
  sid: string,
  request: UpdateRecurringTransactionRequest,
): Promise<RecurringTransaction> {
  return apiRequest<RecurringTransaction>(`/recurring-transactions/${sid}`, { method: 'PATCH', body: request })
}

// Cancels the recurring transaction (soft — sets status to CANCELED),
// mirroring the backend's markAsCanceled(), not a hard delete.
export function cancelRecurringTransaction(sid: string): Promise<RecurringTransaction> {
  return apiRequest<RecurringTransaction>(`/recurring-transactions/${sid}`, { method: 'DELETE' })
}
