import { apiRequest } from '../../../shared/api/client'
import type {
  CreateRecurringTransferRequest,
  RecurringTransfer,
  RecurringTransferFilterRequest,
  UpdateRecurringTransferRequest,
} from './types'

function fetchByFilter(filters: RecurringTransferFilterRequest): Promise<RecurringTransfer[]> {
  const params = new URLSearchParams()
  params.append('accountSid', filters.accountSid)
  if (filters.destinationAccountSid) params.append('destinationAccountSid', filters.destinationAccountSid)
  if (filters.status) params.append('status', filters.status)

  return apiRequest<RecurringTransfer[]>(`/recurring-transfers?${params.toString()}`)
}

// Recurring transfers are source-account-centric: accountSid is mandatory
// server-side and always means "this account as the source", matching the
// currently selected account — never optional, never the destination side.
// destinationAccountSid stays available as a further, optional narrowing
// filter (e.g. "transfers from this account to that one specifically").
export function fetchRecurringTransfersForAccount(
  accountSid: string,
  filters?: Omit<RecurringTransferFilterRequest, 'accountSid'>,
): Promise<RecurringTransfer[]> {
  return fetchByFilter({ accountSid, ...filters })
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
