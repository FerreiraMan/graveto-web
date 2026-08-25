import { useCallback, useState } from 'react'
import { AccountOverviewPanel } from './AccountOverviewPanel'
import { CategorySpendingPanel } from '../analytics/CategorySpendingPanel'

type OverviewSubTab = 'cash-flow' | 'category-breakdown'

const SUB_TABS: { id: OverviewSubTab; label: string }[] = [
  { id: 'cash-flow', label: 'Cash flow' },
  { id: 'category-breakdown', label: 'Category breakdown' },
]

// Hosts the Overview tab's own sub-navigation: cash flow (the default view)
// and the category spending breakdown. Both share a single year selection,
// since they're two views of the same year's data for this account.
export function AccountOverviewSection({ accountSid, currency }: { accountSid: string; currency: string }) {
  const [activeSubTab, setActiveSubTab] = useState<OverviewSubTab>('cash-flow')

  // undefined until a year has been resolved — the initial cash-flow fetch
  // omits `year` entirely so the backend applies its own default (current
  // year). The available-years list only exists once that first fetch
  // resolves, since only the cash-flow report returns yearsWithCashFlows —
  // Category breakdown has no year list of its own, it just shares this one.
  const [year, setYear] = useState<number | undefined>(undefined)
  const [availableYears, setAvailableYears] = useState<number[]>([])

  const handleYearResolved = useCallback((resolvedYear: number, years: number[]) => {
    setAvailableYears(years)
    setYear((current) => current ?? resolvedYear)
  }, [])

  // If the user opens Category breakdown before Cash flow has ever loaded,
  // it still needs an initial year from somewhere so its own request (and
  // the shared selector, once cash flow eventually resolves years) has one.
  const handleInitialYearResolved = useCallback((resolvedYear: number) => {
    setYear((current) => current ?? resolvedYear)
  }, [])

  return (
    <div>
      <h2>Overview</h2>

      {availableYears.length > 0 && (
        <div>
          <label htmlFor="analytics-year">Year</label>
          <select id="analytics-year" value={year ?? ''} onChange={(e) => setYear(Number(e.target.value))}>
            {availableYears.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      )}

      <nav>
        {SUB_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveSubTab(tab.id)}
            aria-current={activeSubTab === tab.id ? 'true' : undefined}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {activeSubTab === 'cash-flow' && (
        <AccountOverviewPanel
          accountSid={accountSid}
          currency={currency}
          year={year}
          onYearResolved={handleYearResolved}
        />
      )}
      {activeSubTab === 'category-breakdown' && (
        <CategorySpendingPanel
          accountSid={accountSid}
          currency={currency}
          year={year}
          onInitialYearResolved={handleInitialYearResolved}
        />
      )}
    </div>
  )
}
