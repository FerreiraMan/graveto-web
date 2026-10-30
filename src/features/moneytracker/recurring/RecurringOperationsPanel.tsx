import { useEffect, useState } from 'react'
import { EDITABLE_RECURRING_STATUSES, RECURRING_STATUS_LABELS, isTerminalStatus, type RecurringOperationStatus } from '../recurring/types'
import { TRANSACTION_TYPE_LABELS } from '../categories/types'
import { fetchAllAccounts } from '../accounts/api'
import type { Account } from '../accounts/types'
import { currencySymbol } from '../currency'
import { fetchRecurringTransactions } from '../recurringTransactions/api'
import type { RecurringTransaction } from '../recurringTransactions/types'
import { CreateRecurringTransactionModal } from '../recurringTransactions/CreateRecurringTransactionModal'
import { UpdateRecurringTransactionModal } from '../recurringTransactions/UpdateRecurringTransactionModal'
import { RecurringTransactionRowMenu } from '../recurringTransactions/RecurringTransactionRowMenu'
import { fetchRecurringTransfersForAccount } from '../recurringTransfers/api'
import type { RecurringTransfer } from '../recurringTransfers/types'
import { CreateRecurringTransferModal } from '../recurringTransfers/CreateRecurringTransferModal'
import { UpdateRecurringTransferModal } from '../recurringTransfers/UpdateRecurringTransferModal'
import { RecurringTransferRowMenu } from '../recurringTransfers/RecurringTransferRowMenu'
import { TabBar, TabPanel } from '../shared/TabBar'
import styles from '../MoneyTracker.module.css'

const ALL_RECURRING_STATUSES: RecurringOperationStatus[] = [...EDITABLE_RECURRING_STATUSES, 'COMPLETED', 'CANCELED']

// adjustToBusinessDay is optional on the response types (unverified
// whether the backend always sends it) — rendering a bare 'No' for a
// missing value would be a confident wrong answer, indistinguishable
// from a real 'No'. 'Unknown' makes the absence visible instead.
function businessDayLabel(adjustToBusinessDay: boolean | undefined): string {
  if (adjustToBusinessDay === undefined) return 'Unknown'
  return adjustToBusinessDay ? 'Yes' : 'No'
}

// Unlike adjustToBusinessDay, endDate has always been genuinely optional
// by design (every create/update form already treats an empty end-date
// input as "no end date") — so absent here unambiguously means the
// operation never ends, not an unverified-backend gap. Rendered as a
// plain dash, not "Unknown", since there's no missing-data ambiguity to
// flag — same placeholder convention as every other empty cell in these
// tables (e.g. a transaction with no description).
function endDateLabel(endDate: string | undefined): string {
  return endDate ?? '-'
}

type RecurringSubTab = 'transactions' | 'transfers'

const SUB_TABS: { id: RecurringSubTab; label: string }[] = [
  { id: 'transactions', label: 'Transactions' },
  { id: 'transfers', label: 'Transfers' },
]

function RecurringTransactionsSection({
  accountSid,
  onFormOpenChange,
}: {
  accountSid: string
  onFormOpenChange: (isOpen: boolean) => void
}) {
  const [status, setStatus] = useState<RecurringOperationStatus | ''>('')
  const [items, setItems] = useState<RecurringTransaction[] | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [editing, setEditing] = useState<RecurringTransaction | null>(null)
  const [openMenuSid, setOpenMenuSid] = useState<string | null>(null)
  const [refetchToken, setRefetchToken] = useState(0)

  useEffect(() => {
    onFormOpenChange(isCreating || editing !== null)
  }, [isCreating, editing, onFormOpenChange])

  useEffect(() => {
    let cancelled = false
    setItems(null)

    fetchRecurringTransactions({ accountSid, status: status || undefined })
      .then((result) => {
        if (!cancelled) setItems(result)
      })
      .catch(() => {
        // Non-field failures already surface via the global notification
        // toast. Settling to an empty list (rather than leaving `items`
        // null forever) stops the view from being stuck on "Loading…"
        // indefinitely after a failed request.
        if (!cancelled) setItems([])
      })

    return () => {
      cancelled = true
    }
  }, [accountSid, status, refetchToken])

  function handleMutated() {
    setIsCreating(false)
    setEditing(null)
    setOpenMenuSid(null)
    setRefetchToken((token) => token + 1)
  }

  return (
    <section className={styles.recurringSection}>
      <div className={styles.recurringSectionHeader}>
        <h3 className={styles.srOnly}>Recurring transactions</h3>
        <button type="button" className={styles.primaryButton} onClick={() => setIsCreating(true)}>
          Create
        </button>
      </div>

      {isCreating && (
        <CreateRecurringTransactionModal accountSid={accountSid} onClose={() => setIsCreating(false)} onCreated={handleMutated} />
      )}

      {editing && (
        <UpdateRecurringTransactionModal recurringTransaction={editing} onUpdated={handleMutated} onClose={() => setEditing(null)} />
      )}

      <div className={styles.recurringFilterRow}>
        <div className={`${styles.field} ${styles.recurringStatusField}`}>
          <label htmlFor="recurring-transaction-status-filter">Status</label>
          <select
            id="recurring-transaction-status-filter"
            value={status}
            onChange={(e) => setStatus(e.target.value as RecurringOperationStatus | '')}
          >
            <option value="">All statuses</option>
            {ALL_RECURRING_STATUSES.map((s) => (
              <option key={s} value={s}>
                {RECURRING_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {items === null && <p className={styles.mutedText}>Loading…</p>}

      {items !== null && items.length === 0 && <p className={styles.mutedText}>No recurring transactions found.</p>}

      {items !== null && items.length > 0 && (
        <div className={styles.tableScroll}>
          <table className={`${styles.transactionsTable} ${styles.recurringTransactionsTable}`}>
            <colgroup>
              <col className={styles.colDescription} />
              <col className={styles.colCategory} />
              <col className={styles.colType} />
              <col className={styles.colAmount} />
              <col className={styles.colDate} />
              <col className={styles.colBusinessDay} />
              <col className={styles.colDate} />
              <col className={styles.colStatus} />
              <col className={styles.colActions} />
            </colgroup>
            <thead>
              <tr>
                <th scope="col">Description</th>
                <th scope="col">Category</th>
                <th scope="col">Type</th>
                <th scope="col" className={styles.amountHeader}>
                  Amount
                </th>
                <th scope="col">Next execution</th>
                <th scope="col">Adjust to business day</th>
                <th scope="col">Ends</th>
                <th scope="col">Status</th>
                <th scope="col"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.sid}>
                  <td>{item.description}</td>
                  <td>{item.category.name}</td>
                  <td>{TRANSACTION_TYPE_LABELS[item.transactionType]}</td>
                  <td className={styles.amountCell}>
                    {item.amount}
                    {currencySymbol(item.currency)}
                  </td>
                  <td>{item.nextExecutionDate}</td>
                  <td>{businessDayLabel(item.adjustToBusinessDay)}</td>
                  <td>{endDateLabel(item.endDate)}</td>
                  <td>
                    <span className={`${styles.badge} ${item.status === 'ACTIVE' ? styles.badgeActive : ''}`}>
                      {RECURRING_STATUS_LABELS[item.status]}
                    </span>
                  </td>
                  <td className={styles.actionsCell}>
                    {isTerminalStatus(item.status) ? (
                      <span className={styles.mutedText}>
                        <span aria-hidden="true">-</span>
                        <span className={styles.srOnly}>No actions available</span>
                      </span>
                    ) : (
                      <RecurringTransactionRowMenu
                        recurringTransaction={item}
                        isOpen={openMenuSid === item.sid}
                        onOpenChange={(isOpen) => setOpenMenuSid(isOpen ? item.sid : null)}
                        onEdit={() => setEditing(item)}
                        onCanceled={handleMutated}
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

function RecurringTransfersSection({
  accountSid,
  onFormOpenChange,
}: {
  accountSid: string
  onFormOpenChange: (isOpen: boolean) => void
}) {
  const [status, setStatus] = useState<RecurringOperationStatus | ''>('')
  const [destinationAccountSid, setDestinationAccountSid] = useState('')
  const [accounts, setAccounts] = useState<Account[]>([])
  const [items, setItems] = useState<RecurringTransfer[] | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [editing, setEditing] = useState<RecurringTransfer | null>(null)
  const [openMenuSid, setOpenMenuSid] = useState<string | null>(null)
  const [refetchToken, setRefetchToken] = useState(0)

  useEffect(() => {
    onFormOpenChange(isCreating || editing !== null)
  }, [isCreating, editing, onFormOpenChange])

  useEffect(() => {
    fetchAllAccounts()
      .then(setAccounts)
      .catch(() => {
        // Destination filter dropdown is a convenience — if it fails to load, the
        // transfer list below still works unfiltered, so no user-facing error here.
      })
  }, [])

  useEffect(() => {
    let cancelled = false
    setItems(null)

    fetchRecurringTransfersForAccount(accountSid, {
      status: status || undefined,
      destinationAccountSid: destinationAccountSid || undefined,
    })
      .then((result) => {
        if (!cancelled) setItems(result)
      })
      .catch(() => {
        // Non-field failures already surface via the global notification
        // toast. Settling to an empty list (rather than leaving `items`
        // null forever) stops the view from being stuck on "Loading…"
        // indefinitely after a failed request.
        if (!cancelled) setItems([])
      })

    return () => {
      cancelled = true
    }
  }, [accountSid, status, destinationAccountSid, refetchToken])

  function handleMutated() {
    setIsCreating(false)
    setEditing(null)
    setOpenMenuSid(null)
    setRefetchToken((token) => token + 1)
  }

  return (
    <section className={styles.recurringSection}>
      <div className={styles.recurringSectionHeader}>
        <h3 className={styles.srOnly}>Recurring transfers</h3>
        <button type="button" className={styles.primaryButton} onClick={() => setIsCreating(true)}>
          Create
        </button>
      </div>

      {isCreating && (
        <CreateRecurringTransferModal sourceAccountSid={accountSid} onClose={() => setIsCreating(false)} onCreated={handleMutated} />
      )}

      {editing && (
        <UpdateRecurringTransferModal recurringTransfer={editing} onUpdated={handleMutated} onClose={() => setEditing(null)} />
      )}

      <div className={styles.recurringFilterRow}>
        <div className={`${styles.field} ${styles.recurringStatusField}`}>
          <label htmlFor="recurring-transfer-status-filter">Status</label>
          <select
            id="recurring-transfer-status-filter"
            value={status}
            onChange={(e) => setStatus(e.target.value as RecurringOperationStatus | '')}
          >
            <option value="">All statuses</option>
            {ALL_RECURRING_STATUSES.map((s) => (
              <option key={s} value={s}>
                {RECURRING_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label htmlFor="recurring-transfer-destination-filter">Destination account</label>
          <select
            id="recurring-transfer-destination-filter"
            value={destinationAccountSid}
            onChange={(e) => setDestinationAccountSid(e.target.value)}
          >
            <option value="">All destination accounts</option>
            {accounts
              .filter((account) => account.sid !== accountSid)
              .map((account) => (
                <option key={account.sid} value={account.sid}>
                  {account.institution}
                </option>
              ))}
          </select>
        </div>
      </div>

      {items === null && <p className={styles.mutedText}>Loading…</p>}

      {items !== null && items.length === 0 && <p className={styles.mutedText}>No recurring transfers found.</p>}

      {items !== null && items.length > 0 && (
        <div className={styles.tableScroll}>
          <table className={`${styles.transactionsTable} ${styles.recurringTransfersTable}`}>
            <colgroup>
              <col className={styles.colDescription} />
              <col className={styles.colCategory} />
              <col className={styles.colAmount} />
              <col className={styles.colDate} />
              <col className={styles.colBusinessDay} />
              <col className={styles.colDate} />
              <col className={styles.colStatus} />
              <col className={styles.colActions} />
            </colgroup>
            <thead>
              <tr>
                <th scope="col">Description</th>
                <th scope="col">Destination account</th>
                <th scope="col" className={styles.amountHeader}>
                  Amount
                </th>
                <th scope="col">Next execution</th>
                <th scope="col">Adjust to business day</th>
                <th scope="col">Ends</th>
                <th scope="col">Status</th>
                <th scope="col"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.sid}>
                  <td>{item.description}</td>
                  <td>{item.destinationAccount.name}</td>
                  <td className={styles.amountCell}>
                    {item.amount}
                    {currencySymbol(item.currency)}
                  </td>
                  <td>{item.nextExecutionDate}</td>
                  <td>{businessDayLabel(item.adjustToBusinessDay)}</td>
                  <td>{endDateLabel(item.endDate)}</td>
                  <td>
                    <span className={`${styles.badge} ${item.status === 'ACTIVE' ? styles.badgeActive : ''}`}>
                      {RECURRING_STATUS_LABELS[item.status]}
                    </span>
                  </td>
                  <td className={styles.actionsCell}>
                    {isTerminalStatus(item.status) ? (
                      <span className={styles.mutedText}>
                        <span aria-hidden="true">-</span>
                        <span className={styles.srOnly}>No actions available</span>
                      </span>
                    ) : (
                      <RecurringTransferRowMenu
                        recurringTransfer={item}
                        isOpen={openMenuSid === item.sid}
                        onOpenChange={(isOpen) => setOpenMenuSid(isOpen ? item.sid : null)}
                        onEdit={() => setEditing(item)}
                        onCanceled={handleMutated}
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

// Recurring transactions and recurring transfers get their own sub-tab
// (reusing the same TabBar/TabPanel pattern as Overview's Cash flow /
// Category breakdown) rather than sitting side by side in a 2-column grid.
// Side-by-side was tried first, but these two tables are different shapes
// (7 columns vs 6) and each grows independently when its own edit form
// opens — halving the available width made them cramped sooner than
// needed, and the mismatched column heights read worse than two full-width
// views one click apart.
//
// TabPanel fully unmounts an inactive tab's content (not just hides it) —
// correct for Overview's read-only sub-tabs, but a real data-loss risk
// here, where a tab can hold an in-progress create/edit form: switching
// away would silently discard it. Each section reports whether it
// currently has one open via onFormOpenChange; the inactive tab's trigger
// is disabled while that's true, rather than allowing the switch and
// confirming after the fact (no native browser dialog — this app builds
// its own confirmation UI everywhere else, and the simpler fix here is to
// not offer the destructive action at all until the form is closed).
export function RecurringOperationsPanel({ accountSid }: { accountSid: string }) {
  const [activeSubTab, setActiveSubTab] = useState<RecurringSubTab>('transactions')
  const [hasOpenForm, setHasOpenForm] = useState(false)

  return (
    <div>
      <h2 className={styles.srOnly}>Recurring operations</h2>

      <div className={styles.recurringSubTabs}>
        <TabBar
          idPrefix="recurring"
          label="Recurring operations sections"
          tabs={SUB_TABS}
          activeTab={activeSubTab}
          onTabChange={setActiveSubTab}
          disabledTabs={hasOpenForm ? SUB_TABS.filter((tab) => tab.id !== activeSubTab).map((tab) => tab.id) : []}
        />
      </div>

      <TabPanel idPrefix="recurring" tabId="transactions" isActive={activeSubTab === 'transactions'}>
        <RecurringTransactionsSection accountSid={accountSid} onFormOpenChange={setHasOpenForm} />
      </TabPanel>
      <TabPanel idPrefix="recurring" tabId="transfers" isActive={activeSubTab === 'transfers'}>
        <RecurringTransfersSection accountSid={accountSid} onFormOpenChange={setHasOpenForm} />
      </TabPanel>
    </div>
  )
}
