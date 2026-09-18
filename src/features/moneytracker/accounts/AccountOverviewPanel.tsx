import { useEffect, useState } from 'react'
import { fetchCashFlowReport } from '../analytics/api'
import type { CashFlowReport } from '../analytics/types'
import { ApiError } from '../../../shared/api/errors'
import { currencySymbol } from '../currency'
import styles from '../MoneyTracker.module.css'

const MONTH_FORMATTER = new Intl.DateTimeFormat(undefined, { month: 'long' })

function monthLabel(month: number): string {
  // MonthlyCashFlowDto.month is 1-indexed; Date expects 0-indexed months.
  return MONTH_FORMATTER.format(new Date(2000, month - 1, 1))
}

// Financial-polarity className for a signed figure — mirrors the same
// gain/loss token usage as the transactions table (AccountTransactionsPanel),
// reinforced by a leading +/- sign in the markup so meaning never relies on
// color alone. Zero is neither a gain nor a loss, left uncolored.
function polarityClassName(value: number): string {
  if (value > 0) return styles.amountGain
  if (value < 0) return styles.amountLoss
  return ''
}

function signedAmount(value: number, symbol: string): string {
  const sign = value > 0 ? '+' : value < 0 ? '−' : ''
  return `${sign}${Math.abs(value)}${symbol}`
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
      {error && (
        <p className={styles.errorText} role="alert">
          {error}
        </p>
      )}

      {report === null && !error && <p className={styles.mutedText}>Loading…</p>}

      {report !== null && (
        <>
          <dl className={styles.cashFlowSummary}>
            <div className={styles.cashFlowStat}>
              <dt>Income</dt>
              <dd className={styles.amountGain}>+{report.yearlyIncome}{symbol}</dd>
            </div>
            <div className={styles.cashFlowStat}>
              <dt>Expense</dt>
              <dd className={styles.amountLoss}>−{report.yearlyExpense}{symbol}</dd>
            </div>
            <div className={styles.cashFlowStat}>
              <dt>Transfers in</dt>
              <dd>
                {report.yearlyTransfersIn}
                {symbol}
              </dd>
            </div>
            <div className={styles.cashFlowStat}>
              <dt>Transfers out</dt>
              <dd>
                {report.yearlyTransfersOut}
                {symbol}
              </dd>
            </div>
            <div className={styles.cashFlowStat}>
              <dt>Net income/expense</dt>
              <dd className={polarityClassName(report.yearlyNetIncomeExpense)}>
                {signedAmount(report.yearlyNetIncomeExpense, symbol)}
              </dd>
            </div>
            <div className={`${styles.cashFlowStat} ${styles.cashFlowStatEmphasis}`}>
              <dt>Balance at end of year</dt>
              <dd>
                {report.balanceAtEndOfYear}
                {symbol}
              </dd>
            </div>
          </dl>

          <div className={styles.tableScroll}>
            <table className={styles.transactionsTable}>
              <colgroup>
                <col className={styles.colMonth} />
                <col className={styles.colCashFlowAmount} />
                <col className={styles.colCashFlowAmount} />
                <col className={styles.colCashFlowAmount} />
                <col className={styles.colCashFlowAmount} />
                <col className={styles.colCashFlowAmount} />
                <col className={styles.colCashFlowAmount} />
              </colgroup>
              <thead>
                <tr>
                  <th scope="col">Month</th>
                  <th scope="col" className={styles.amountHeader}>
                    Income
                  </th>
                  <th scope="col" className={styles.amountHeader}>
                    Expense
                  </th>
                  <th scope="col" className={styles.amountHeader}>
                    Transfers in
                  </th>
                  <th scope="col" className={styles.amountHeader}>
                    Transfers out
                  </th>
                  <th scope="col" className={styles.amountHeader} aria-label="Net income/expense">
                    Net
                  </th>
                  <th scope="col" className={styles.amountHeader} aria-label="Balance at end of month">
                    Balance
                  </th>
                </tr>
              </thead>
              <tbody>
                {report.monthlyCashFlow.map((m) => (
                  <tr key={m.month}>
                    <td>{monthLabel(m.month)}</td>
                    <td className={`${styles.amountCell} ${styles.amountGain}`}>
                      {m.income}
                      {symbol}
                    </td>
                    <td className={`${styles.amountCell} ${styles.amountLoss}`}>
                      {m.expense}
                      {symbol}
                    </td>
                    <td className={styles.amountCell}>
                      {m.transfersIn}
                      {symbol}
                    </td>
                    <td className={styles.amountCell}>
                      {m.transfersOut}
                      {symbol}
                    </td>
                    <td className={`${styles.amountCell} ${polarityClassName(m.monthlyNetIncomeExpense)}`}>
                      {signedAmount(m.monthlyNetIncomeExpense, symbol)}
                    </td>
                    <td className={styles.amountCell}>
                      {m.balanceAtEndOfMonth}
                      {symbol}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
