import { useEffect, useState } from 'react'
import { fetchCashFlowReport } from '../analytics/api'
import type { CashFlowReport } from '../analytics/types'
import { ApiError } from '../../../shared/api/errors'
import { currencySymbol } from '../currency'

const MONTH_FORMATTER = new Intl.DateTimeFormat(undefined, { month: 'long' })

function monthLabel(month: number): string {
  // MonthlyCashFlowDto.month is 1-indexed; Date expects 0-indexed months.
  return MONTH_FORMATTER.format(new Date(2000, month - 1, 1))
}

export function AccountOverviewPanel({ accountSid, currency }: { accountSid: string; currency: string }) {
  // undefined until the user picks a year — the first fetch omits `year`
  // entirely so the backend applies its own default (current year).
  const [year, setYear] = useState<number | undefined>(undefined)
  const [report, setReport] = useState<CashFlowReport | null>(null)
  // Kept separate from `report` so the year selector stays mounted (with
  // its last known options) while a new year's data is loading, instead of
  // disappearing and reappearing on every change — report itself is still
  // cleared to null while loading, same "Loading…" convention as the other
  // panels in this feature.
  const [availableYears, setAvailableYears] = useState<number[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const symbol = currencySymbol(currency)

  useEffect(() => {
    let cancelled = false
    setReport(null)
    setError(null)

    fetchCashFlowReport(accountSid, year)
      .then((result) => {
        if (cancelled) return
        setReport(result)
        setAvailableYears(result.yearsWithCashFlows)
        // First load has no explicit year yet — pin it to whatever the
        // backend actually used so the select reflects reality immediately.
        setYear((current) => current ?? result.year)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Failed to load cash flow report.')
      })

    return () => {
      cancelled = true
    }
  }, [accountSid, year])

  return (
    <div>
      <h2>Overview</h2>

      {availableYears !== null && (
        <>
          <label htmlFor="cash-flow-year">Year</label>
          <select id="cash-flow-year" value={year ?? ''} onChange={(e) => setYear(Number(e.target.value))}>
            {availableYears.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </>
      )}

      {error && <p role="alert">{error}</p>}

      {report === null && !error && <p>Loading…</p>}

      {report !== null && (
        <>
          <ul>
            <li>
              Income: {report.yearlyIncome}
              {symbol}
            </li>
            <li>
              Expense: {report.yearlyExpense}
              {symbol}
            </li>
            <li>
              Net flow: {report.yearlyNetFlow}
              {symbol}
            </li>
            <li>
              Balance at end of year: {report.balanceAtEndOfYear}
              {symbol}
            </li>
          </ul>

          <table>
            <thead>
              <tr>
                <th>Month</th>
                <th>Income</th>
                <th>Expense</th>
                <th>Net flow</th>
                <th>Balance at end of month</th>
              </tr>
            </thead>
            <tbody>
              {report.monthlyCashFlow.map((m) => (
                <tr key={m.month}>
                  <td>{monthLabel(m.month)}</td>
                  <td>
                    {m.income}
                    {symbol}
                  </td>
                  <td>
                    {m.expense}
                    {symbol}
                  </td>
                  <td>
                    {m.netFlow}
                    {symbol}
                  </td>
                  <td>
                    {m.balanceAtEndOfMonth}
                    {symbol}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  )
}
