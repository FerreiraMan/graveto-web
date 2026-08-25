import { useEffect, useState } from 'react'
import { fetchCategorySpendingReport } from './api'
import type { CategoryAggregate, CategorySpendingReport } from './types'
import { ApiError } from '../../../shared/api/errors'
import { currencySymbol } from '../currency'

function sortByYearlyTotalDesc(categories: CategoryAggregate[]): CategoryAggregate[] {
  return [...categories].sort((a, b) => b.yearlyTotal - a.yearlyTotal)
}

function monthlyTotal(monthlyTotals: Record<string, number>, month: number): number {
  return monthlyTotals[String(month)] ?? 0
}

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

  return (
    <>
      <tr>
        <td style={{ paddingLeft: `${depth * 1.5}rem` }}>
          {hasChildren ? (
            <button type="button" onClick={() => setExpanded((current) => !current)}>
              {expanded ? '▾' : '▸'} {aggregate.categoryName}
            </button>
          ) : (
            aggregate.categoryName
          )}
        </td>
        {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
          <td key={month} style={hasChildren ? { color: '#888' } : undefined}>
            {monthlyTotal(aggregate.monthlyTotals, month)}
            {symbol}
          </td>
        ))}
        <td
          style={hasChildren ? { color: '#888' } : undefined}
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
      {error && <p role="alert">{error}</p>}

      {report === null && !error && <p>Loading…</p>}

      {report !== null && report.categories.length === 0 && <p>No category spending for this year.</p>}

      {report !== null && report.categories.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Category</th>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                <th key={month}>{monthLabel(month)}</th>
              ))}
              <th>Yearly total</th>
            </tr>
          </thead>
          <tbody>
            {sortByYearlyTotalDesc(report.categories).map((aggregate) => (
              <CategoryAggregateRow key={aggregate.categorySid} aggregate={aggregate} symbol={symbol} depth={0} />
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
