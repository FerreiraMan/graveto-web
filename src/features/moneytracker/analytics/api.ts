import { apiRequest } from '../../../shared/api/client'
import type { CashFlowReport } from './types'

// year is optional — the backend defaults to the current year when omitted.
export function fetchCashFlowReport(accountSid: string, year?: number): Promise<CashFlowReport> {
  const params = new URLSearchParams()
  if (year !== undefined) params.append('year', String(year))
  const query = params.toString()

  return apiRequest<CashFlowReport>(`/analytics/${accountSid}/cash-flow${query ? `?${query}` : ''}`)
}
