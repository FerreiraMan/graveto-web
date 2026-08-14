import { apiRequest } from '../../../shared/api/client'
import type {
  CreateRecurringTransferRequest,
  RecurringTransfer,
  RecurringTransferFilterRequest,
  UpdateRecurringTransferRequest,
} from './types'

function fetchByFilter(filters: RecurringTransferFilterRequest): Promise<RecurringTransfer[]> {
  const params = new URLSearchParams()
  if (filters.sourceAccountSid) params.append('sourceAccountSid', filters.sourceAccountSid)
  if (filters.destinationAccountSid) params.append('destinationAccountSid', filters.destinationAccountSid)
  if (filters.status) params.append('status', filters.status)

  return apiRequest<RecurringTransfer[]>(`/recurring-transfers?${params.toString()}`)
}

// sourceAccountSid and destinationAccountSid combine with AND server-side,
// not OR — passing both would only match a transfer that is (impossibly)
// both source and destination of itself. To show every recurring transfer
// touching this account regardless of direction, fetch each role
// separately and merge. Safe to concat without dedup: a transfer can never
// have the same account on both sides, so the two result sets are disjoint.
export async function fetchRecurringTransfersForAccount(
  accountSid: string,
  status?: RecurringTransferFilterRequest['status'],
): Promise<RecurringTransfer[]> {
  const [asSource, asDestination] = await Promise.all([
    fetchByFilter({ sourceAccountSid: accountSid, status }),
    fetchByFilter({ destinationAccountSid: accountSid, status }),
  ])

  return [...asSource, ...asDestination]
}

export function createRecurringTransfer(request: CreateRecurringTransferRequest): Promise<RecurringTransfer> {
  return apiRequest<RecurringTransfer>('/recurring-transfers', { method: 'POST', body: request })
}

export function updateRecurringTransfer(
  sid: string,
  request: UpdateRecurringTransferRequest,
): Promise<RecurringTransfer> {
  return apiRequest<RecurringTransfer>(`/recurring-transfers/${sid}`, { method: 'PATCH', body: request })
}

export function cancelRecurringTransfer(sid: string): Promise<RecurringTransfer> {
  return apiRequest<RecurringTransfer>(`/recurring-transfers/${sid}`, { method: 'DELETE' })
}
