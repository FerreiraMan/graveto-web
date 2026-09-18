import { useRef, useState, type KeyboardEvent } from 'react'
import { AccountOverviewSection } from './AccountOverviewSection'
import { AccountTransactionsPanel } from '../transactions/AccountTransactionsPanel'
import { RecurringOperationsPanel } from '../recurring/RecurringOperationsPanel'
import styles from '../MoneyTracker.module.css'

type AccountTab = 'overview' | 'transactions' | 'recurring'

const TABS: { id: AccountTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'transactions', label: 'Transactions' },
  { id: 'recurring', label: 'Recurring operations' },
]

// Hosts the per-account tab bar. Kept as its own component (rather than
// inline in AccountListPage) so the key={accountSid} remount on the parent
// resets both the selected tab AND every tab's internal state in one place.
//
// No institution-name heading here — the left-column account list (see
// AccountRow) already shows which account is selected at all times, so
// repeating it above the tabs was redundant, not informative.
//
// Full WAI-ARIA Tabs pattern (tablist/tab/tabpanel, aria-selected,
// aria-controls, roving tabindex + arrow keys) — this switches which of
// three panels is visible with no page navigation involved, so it's a
// real tabbed interface, not a set of links (aria-current alone would be
// link semantics and fails a keyboard/screen-reader audit for this case).
export function AccountTabs({
  accountSid,
  currency,
  onTransactionMutated,
}: {
  accountSid: string
  currency: string
  onTransactionMutated: () => void
}) {
  const [activeTab, setActiveTab] = useState<AccountTab>('overview')
  const tabRefs = useRef<Record<AccountTab, HTMLButtonElement | null>>({
    overview: null,
    transactions: null,
    recurring: null,
  })

  function handleTabKeyDown(event: KeyboardEvent, index: number) {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return
    event.preventDefault()
    const nextIndex =
      event.key === 'ArrowRight' ? (index + 1) % TABS.length : (index - 1 + TABS.length) % TABS.length
    const nextTab = TABS[nextIndex]
    setActiveTab(nextTab.id)
    tabRefs.current[nextTab.id]?.focus()
  }

  return (
    <div>
      <div className={styles.accountTabs} role="tablist" aria-label="Account sections">
        {TABS.map((tab, index) => (
          <button
            key={tab.id}
            ref={(el) => {
              tabRefs.current[tab.id] = el
            }}
            type="button"
            role="tab"
            id={`account-tab-${tab.id}`}
            aria-selected={activeTab === tab.id}
            aria-controls={`account-tabpanel-${tab.id}`}
            tabIndex={activeTab === tab.id ? 0 : -1}
            className={`${styles.accountTab} ${activeTab === tab.id ? styles.accountTabActive : ''}`}
            onClick={() => setActiveTab(tab.id)}
            onKeyDown={(e) => handleTabKeyDown(e, index)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div
        id="account-tabpanel-overview"
        role="tabpanel"
        aria-labelledby="account-tab-overview"
        hidden={activeTab !== 'overview'}
      >
        {activeTab === 'overview' && <AccountOverviewSection accountSid={accountSid} currency={currency} />}
      </div>
      <div
        id="account-tabpanel-transactions"
        role="tabpanel"
        aria-labelledby="account-tab-transactions"
        hidden={activeTab !== 'transactions'}
      >
        {activeTab === 'transactions' && (
          <AccountTransactionsPanel accountSid={accountSid} onTransactionMutated={onTransactionMutated} />
        )}
      </div>
      <div
        id="account-tabpanel-recurring"
        role="tabpanel"
        aria-labelledby="account-tab-recurring"
        hidden={activeTab !== 'recurring'}
      >
        {activeTab === 'recurring' && <RecurringOperationsPanel accountSid={accountSid} />}
      </div>
    </div>
  )
}
