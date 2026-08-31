import { useState } from 'react'
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
export function AccountTabs({
  accountSid,
  institution,
  currency,
  onTransactionMutated,
}: {
  accountSid: string
  institution: string
  currency: string
  onTransactionMutated: () => void
}) {
  const [activeTab, setActiveTab] = useState<AccountTab>('overview')

  return (
    <div>
      <h2 className={styles.detailHeading}>{institution}</h2>

      <nav className={styles.accountTabs}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`${styles.accountTab} ${activeTab === tab.id ? styles.accountTabActive : ''}`}
            onClick={() => setActiveTab(tab.id)}
            aria-current={activeTab === tab.id ? 'true' : undefined}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {activeTab === 'overview' && <AccountOverviewSection accountSid={accountSid} currency={currency} />}
      {activeTab === 'transactions' && (
        <AccountTransactionsPanel accountSid={accountSid} onTransactionMutated={onTransactionMutated} />
      )}
      {activeTab === 'recurring' && <RecurringOperationsPanel accountSid={accountSid} />}
    </div>
  )
}
