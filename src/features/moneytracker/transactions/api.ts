import { apiRequest } from '../../../shared/api/client'
import type { Page } from '../../../shared/api/types'
import type {
  CreateTransactionRequest,
  Transaction,
  TransactionFilterRequest,
  TransactionPageRequest,
  UpdateTransactionRequest,
} from './types'

export function fetchTransactions(
  filters: TransactionFilterRequest,
  page?: TransactionPageRequest,
): Promise<Page<Transaction>> {
  const params = new URLSearchParams()
  params.append('accountSid', filters.accountSid)
  if (filters.categorySid) params.append('categorySid', filters.categorySid)
  if (filters.startDate) params.append('startDate', filters.startDate)
  if (filters.endDate) params.append('endDate', filters.endDate)
  if (filters.type) params.append('type', filters.type)
  if (filters.status) params.append('status', filters.status)
  if (page?.page !== undefined) params.append('page', String(page.page))
  if (page?.size !== undefined) params.append('size', String(page.size))

  return apiRequest<Page<Transaction>>(`/transactions?${params.toString()}`)
}

export function createTransaction(request: CreateTransactionRequest): Promise<Transaction> {
  return apiRequest<Transaction>('/transactions', { method: 'POST', body: request })
}

export function updateTransaction(sid: string, request: UpdateTransactionRequest): Promise<Transaction> {
  return apiRequest<Transaction>(`/transactions/${sid}`, { method: 'PATCH', body: request })
}

export function deleteTransaction(sid: string): Promise<Transaction> {
  return apiRequest<Transaction>(`/transactions/${sid}`, { method: 'DELETE' })
}
