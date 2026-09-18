import { useState } from 'react'
import { AccountOverviewSection } from './AccountOverviewSection'
import { AccountTransactionsPanel } from '../transactions/AccountTransactionsPanel'
import { RecurringOperationsPanel } from '../recurring/RecurringOperationsPanel'
import { TabBar, TabPanel } from '../shared/TabBar'

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
// Tab bar itself is the shared TabBar/TabPanel (see ../shared/TabBar) —
// full WAI-ARIA Tabs pattern (tablist/tab/tabpanel, aria-selected,
// aria-controls, roving tabindex + arrow keys), reused as-is by Overview's
// own Cash flow / Category breakdown sub-tabs one level down.
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

  return (
    <div>
      <TabBar idPrefix="account" label="Account sections" tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      <TabPanel idPrefix="account" tabId="overview" isActive={activeTab === 'overview'}>
        <AccountOverviewSection accountSid={accountSid} currency={currency} />
      </TabPanel>
      <TabPanel idPrefix="account" tabId="transactions" isActive={activeTab === 'transactions'}>
        <AccountTransactionsPanel accountSid={accountSid} onTransactionMutated={onTransactionMutated} />
      </TabPanel>
      <TabPanel idPrefix="account" tabId="recurring" isActive={activeTab === 'recurring'}>
        <RecurringOperationsPanel accountSid={accountSid} />
      </TabPanel>
    </div>
  )
}
