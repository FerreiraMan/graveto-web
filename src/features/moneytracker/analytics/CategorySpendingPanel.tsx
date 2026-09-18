import { useEffect, useState } from 'react'
import { fetchCategorySpendingReport } from './api'
import type { CategoryAggregate, CategorySpendingReport } from './types'
import { ApiError } from '../../../shared/api/errors'
import { currencySymbol } from '../currency'
import styles from '../MoneyTracker.module.css'

function sortByYearlyTotalDesc(categories: CategoryAggregate[]): CategoryAggregate[] {
  return [...categories].sort((a, b) => b.yearlyTotal - a.yearlyTotal)
}

function monthlyTotal(monthlyTotals: Record<string, number>, month: number): number {
  return monthlyTotals[String(month)] ?? 0
}

// Category spending is expected to be non-negative (these are expense
// aggregates), so no financial-polarity color applies to the normal case —
// applying gain/loss coloring where every value is the same sign wouldn't
// discriminate anything. The one exception: a negative total (e.g. a
// refund/reversal outweighing the category's spend for that period) is a
// real net gain within an otherwise-expense category, so it still gets
// the gain color rather than silently rendering as an unremarkable
// expense figure. Defensive fallback, not the expected path — the
// frontend has no documented guarantee against negative totals.
function polarityClassName(value: number): string {
  return value < 0 ? styles.amountGain : ''
}

// Rollup (parent) rows get a subtle surface tint — not just muted text —
// so they read as structurally different from leaf rows (a container of
// spending, not a spend itself) at a glance while scanning down the tree,
// not only when reading the text color closely. No font-weight change:
// DESIGN.md keeps this surface's typography plain, weight isn't a signal
// this app uses.
function CategoryAggregateRow({
  aggregate,
  symbol,
  depth,
}: {
  aggregate: CategoryAggregate
  symbol: string
  depth: number
}) {
  const [expanded, setExpanded] = useState(false)
  const hasChildren = aggregate.childCategories.length > 0
  const sortedChildren = sortByYearlyTotalDesc(aggregate.childCategories)
  const rowClassName = hasChildren ? styles.categoryBreakdownRowParent : ''

  return (
    <>
      <tr className={rowClassName}>
        <td className={styles.categoryBreakdownNameCell} style={{ paddingLeft: `${0.5 + depth * 0.875}rem` }}>
          <div className={styles.categoryRow}>
            {hasChildren ? (
              <button
                type="button"
                className={styles.categoryToggle}
                onClick={() => setExpanded((current) => !current)}
                aria-expanded={expanded}
                aria-label={`${expanded ? 'Collapse' : 'Expand'} ${aggregate.categoryName} subcategories`}
              >
                {expanded ? '▾' : '▸'}
              </button>
            ) : (
              <span className={styles.categoryToggleSpacer} aria-hidden="true" />
            )}
            <span title={aggregate.categoryName}>{aggregate.categoryName}</span>
          </div>
        </td>
        {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
          const value = monthlyTotal(aggregate.monthlyTotals, month)
          return (
            <td key={month} className={`${styles.amountCell} ${polarityClassName(value)}`}>
              {value}
              {symbol}
            </td>
          )
        })}
        <td
          className={`${styles.amountCell} ${polarityClassName(aggregate.yearlyTotal)}`}
          title={hasChildren ? 'Includes spending from subcategories below' : undefined}
        >
          {aggregate.yearlyTotal}
          {symbol}
        </td>
      </tr>

      {hasChildren &&
        expanded &&
        sortedChildren.map((child) => (
          <CategoryAggregateRow key={child.categorySid} aggregate={child} symbol={symbol} depth={depth + 1} />
        ))}
    </>
  )
}

const MONTH_FORMATTER = new Intl.DateTimeFormat(undefined, { month: 'short' })

function monthLabel(month: number): string {
  return MONTH_FORMATTER.format(new Date(2000, month - 1, 1))
}

export function CategorySpendingPanel({
  accountSid,
  currency,
  year,
  onInitialYearResolved,
}: {
  accountSid: string
  currency: string
  // Shared with the Cash flow sub-tab via the parent (AccountOverviewSection)
  // so both requests use the same year. undefined on first load lets the
  // backend apply its own default.
  year: number | undefined
  // Category spending has no years-with-data list of its own — if this tab
  // loads before Cash flow ever has, this reports the backend-resolved year
  // up so the shared year state has an initial value from somewhere.
  onInitialYearResolved: (year: number) => void
}) {
  const [report, setReport] = useState<CategorySpendingReport | null>(null)
  const [error, setError] = useState<string | null>(null)
  const symbol = currencySymbol(currency)

  useEffect(() => {
    let cancelled = false
    setReport(null)
    setError(null)

    fetchCategorySpendingReport(accountSid, year)
      .then((result) => {
        if (cancelled) return
        setReport(result)
        onInitialYearResolved(result.year)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Failed to load category spending report.')
      })

    return () => {
      cancelled = true
    }
  }, [accountSid, year, onInitialYearResolved])

  return (
    <div>
      {error && (
        <p className={styles.errorText} role="alert">
          {error}
        </p>
      )}

      {report === null && !error && <p className={styles.mutedText}>Loading…</p>}

      {report !== null && report.categories.length === 0 && (
        <p className={styles.mutedText}>No category spending for this year.</p>
      )}

      {report !== null && report.categories.length > 0 && (
        <div className={styles.tableScroll}>
          <table className={`${styles.transactionsTable} ${styles.categoryBreakdownTable}`}>
            <colgroup>
              <col className={styles.colCategoryName} />
              {Array.from({ length: 13 }, (_, i) => i).map((i) => (
                <col key={i} className={styles.colBreakdownAmount} />
              ))}
            </colgroup>
            <thead>
              <tr>
                <th scope="col" className={styles.categoryBreakdownNameCell}>
                  Category
                </th>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                  <th key={month} scope="col" className={styles.amountHeader}>
                    {monthLabel(month)}
                  </th>
                ))}
                <th scope="col" className={styles.amountHeader}>
                  Yearly total
                </th>
              </tr>
            </thead>
            <tbody aria-live="polite">
              {sortByYearlyTotalDesc(report.categories).map((aggregate) => (
                <CategoryAggregateRow key={aggregate.categorySid} aggregate={aggregate} symbol={symbol} depth={0} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
