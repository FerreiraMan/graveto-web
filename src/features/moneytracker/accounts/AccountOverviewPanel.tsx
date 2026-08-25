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

export function AccountOverviewPanel({
  accountSid,
  currency,
  year,
  onYearResolved,
}: {
  accountSid: string
  currency: string
  // undefined until a year has been picked — the initial fetch omits
  // `year` entirely so the backend applies its own default. Lives in the
  // parent (AccountTabs) so the Category Spending tab can share it.
  year: number | undefined
  // Called once a report has loaded, with the backend-confirmed year and
  // the full list of years with data — the parent uses this to populate
  // the shared year selector and to resolve the initial "no year picked
  // yet" state to whatever year the backend actually used.
  onYearResolved: (year: number, availableYears: number[]) => void
}) {
  const [report, setReport] = useState<CashFlowReport | null>(null)
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
        onYearResolved(result.year, result.yearsWithCashFlows)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Failed to load cash flow report.')
      })

    return () => {
      cancelled = true
    }
  }, [accountSid, year, onYearResolved])

  return (
    <div>
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
              Transfers in: {report.yearlyTransfersIn}
              {symbol}
            </li>
            <li>
              Transfers out: {report.yearlyTransfersOut}
              {symbol}
            </li>
            <li>
              Net income/expense: {report.yearlyNetIncomeExpense}
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
                <th>Transfers in</th>
                <th>Transfers out</th>
                <th>Net income/expense</th>
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
                    {m.transfersIn}
                    {symbol}
                  </td>
                  <td>
                    {m.transfersOut}
                    {symbol}
                  </td>
                  <td>
                    {m.monthlyNetIncomeExpense}
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
