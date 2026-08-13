import { apiRequest } from '../../../shared/api/client'
import type { CreateTransferRequest, Transfer, UpdateTransferRequest } from './types'

export function createTransfer(request: CreateTransferRequest): Promise<unknown> {
  return apiRequest('/transfers', { method: 'POST', body: request })
}

export function fetchTransfer(correlationId: string): Promise<Transfer> {
  return apiRequest<Transfer>(`/transfers/${correlationId}`)
}

export function updateTransfer(correlationId: string, request: UpdateTransferRequest): Promise<unknown> {
  return apiRequest(`/transfers/${correlationId}`, { method: 'PATCH', body: request })
}

export function deleteTransfer(correlationId: string): Promise<unknown> {
  return apiRequest(`/transfers/${correlationId}`, { method: 'DELETE' })
}
