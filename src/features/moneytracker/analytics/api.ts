import { apiRequest } from '../../../shared/api/client'
import type { CashFlowReport, CategorySpendingReport } from './types'

// year is optional — the backend defaults to the current year when omitted.
export function fetchCashFlowReport(accountSid: string, year?: number): Promise<CashFlowReport> {
  const params = new URLSearchParams()
  if (year !== undefined) params.append('year', String(year))
  const query = params.toString()

  return apiRequest<CashFlowReport>(`/analytics/${accountSid}/cash-flow${query ? `?${query}` : ''}`)
}

// year is optional — the backend defaults to the current year when omitted.
export function fetchCategorySpendingReport(accountSid: string, year?: number): Promise<CategorySpendingReport> {
  const params = new URLSearchParams()
  if (year !== undefined) params.append('year', String(year))
  const query = params.toString()

  return apiRequest<CategorySpendingReport>(`/analytics/${accountSid}/category-spending${query ? `?${query}` : ''}`)
}
