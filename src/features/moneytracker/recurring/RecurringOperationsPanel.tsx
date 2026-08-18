import { useEffect, useState } from 'react'
import { ApiError } from '../../../shared/api/errors'
import { EDITABLE_RECURRING_STATUSES, RECURRING_STATUS_LABELS, type RecurringOperationStatus } from '../recurring/types'
import { TRANSACTION_TYPE_LABELS } from '../categories/types'
import { fetchAllAccounts } from '../accounts/api'
import type { Account } from '../accounts/types'
import { fetchRecurringTransactions } from '../recurringTransactions/api'
import type { RecurringTransaction } from '../recurringTransactions/types'
import { CreateRecurringTransactionForm } from '../recurringTransactions/CreateRecurringTransactionForm'
import { UpdateRecurringTransactionForm } from '../recurringTransactions/UpdateRecurringTransactionForm'
import { RecurringTransactionRowMenu } from '../recurringTransactions/RecurringTransactionRowMenu'
import { fetchRecurringTransfersForAccount } from '../recurringTransfers/api'
import type { RecurringTransfer } from '../recurringTransfers/types'
import { CreateRecurringTransferForm } from '../recurringTransfers/CreateRecurringTransferForm'
import { UpdateRecurringTransferForm } from '../recurringTransfers/UpdateRecurringTransferForm'
import { RecurringTransferRowMenu } from '../recurringTransfers/RecurringTransferRowMenu'

const ALL_RECURRING_STATUSES: RecurringOperationStatus[] = [...EDITABLE_RECURRING_STATUSES, 'COMPLETED', 'CANCELED']

// Only one create/edit form can be open across BOTH subsections at a time —
// opening any one of these closes whatever else was open, same rule as the
// per-row hamburger menus. A discriminated union (rather than 4 separate
// booleans/nullables) makes "closing everything else" a single setState
// call instead of 4, and makes "is anything open" one falsy check.
type OpenForm =
  | { kind: 'create-transaction' }
  | { kind: 'create-transfer' }
  | { kind: 'edit-transaction'; item: RecurringTransaction }
  | { kind: 'edit-transfer'; item: RecurringTransfer }
  | null

function RecurringTransactionsSection({
  accountSid,
  openForm,
  onOpenForm,
  openMenuSid,
  onOpenMenuSid,
  refetchToken,
  onMutated,
}: {
  accountSid: string
  openForm: OpenForm
  onOpenForm: (form: OpenForm) => void
  openMenuSid: string | null
  onOpenMenuSid: (sid: string | null) => void
  refetchToken: number
  onMutated: () => void
}) {
  const [status, setStatus] = useState<RecurringOperationStatus | ''>('')
  const [items, setItems] = useState<RecurringTransaction[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setItems(null)
    setError(null)

    fetchRecurringTransactions({ accountSid, status: status || undefined })
      .then((result) => {
        if (!cancelled) setItems(result)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Failed to load recurring transactions.')
      })

    return () => {
      cancelled = true
    }
  }, [accountSid, status, refetchToken])

  const isCreating = openForm?.kind === 'create-transaction'
  const editing = openForm?.kind === 'edit-transaction' ? openForm.item : null

  return (
    <section>
      <h3>Recurring transactions</h3>

      <button type="button" onClick={() => onOpenForm({ kind: 'create-transaction' })}>
        Create recurring transaction
      </button>

      {isCreating && (
        <CreateRecurringTransactionForm
          accountSid={accountSid}
          onCreated={onMutated}
          onCancel={() => onOpenForm(null)}
        />
      )}

      {editing && (
        <UpdateRecurringTransactionForm
          recurringTransaction={editing}
          onUpdated={onMutated}
          onCancel={() => onOpenForm(null)}
        />
      )}

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

      {error && <p role="alert">{error}</p>}

      {items === null && !error && <p>Loading…</p>}

      {items !== null && items.length === 0 && <p>No recurring transactions found.</p>}

      {items !== null && items.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th>Category</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Next execution</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.sid}>
                <td>{item.description}</td>
                <td>{item.category.name}</td>
                <td>{TRANSACTION_TYPE_LABELS[item.transactionType]}</td>
                <td>
                  {item.amount} {item.currency}
                </td>
                <td>{item.nextExecutionDate}</td>
                <td>{RECURRING_STATUS_LABELS[item.status]}</td>
                <td>
                  <RecurringTransactionRowMenu
                    recurringTransaction={item}
                    isOpen={openMenuSid === item.sid}
                    onOpenChange={(isOpen) => {
                      onOpenMenuSid(isOpen ? item.sid : null)
                      if (isOpen) onOpenForm(null)
                    }}
                    onEdit={() => onOpenForm({ kind: 'edit-transaction', item })}
                    onCanceled={onMutated}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}

function RecurringTransfersSection({
  accountSid,
  openForm,
  onOpenForm,
  openMenuSid,
  onOpenMenuSid,
  refetchToken,
  onMutated,
}: {
  accountSid: string
  openForm: OpenForm
  onOpenForm: (form: OpenForm) => void
  openMenuSid: string | null
  onOpenMenuSid: (sid: string | null) => void
  refetchToken: number
  onMutated: () => void
}) {
  const [status, setStatus] = useState<RecurringOperationStatus | ''>('')
  const [destinationAccountSid, setDestinationAccountSid] = useState('')
  const [accounts, setAccounts] = useState<Account[]>([])
  const [items, setItems] = useState<RecurringTransfer[] | null>(null)
  const [error, setError] = useState<string | null>(null)

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
    setError(null)

    fetchRecurringTransfersForAccount(accountSid, { status: status || undefined, destinationAccountSid: destinationAccountSid || undefined })
      .then((result) => {
        if (!cancelled) setItems(result)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Failed to load recurring transfers.')
      })

    return () => {
      cancelled = true
    }
  }, [accountSid, status, destinationAccountSid, refetchToken])

  const isCreating = openForm?.kind === 'create-transfer'
  const editing = openForm?.kind === 'edit-transfer' ? openForm.item : null

  return (
    <section>
      <h3>Recurring transfers</h3>

      <button type="button" onClick={() => onOpenForm({ kind: 'create-transfer' })}>
        Create recurring transfer
      </button>

      {isCreating && (
        <CreateRecurringTransferForm
          sourceAccountSid={accountSid}
          onCreated={onMutated}
          onCancel={() => onOpenForm(null)}
        />
      )}

      {editing && (
        <UpdateRecurringTransferForm
          recurringTransfer={editing}
          onUpdated={onMutated}
          onCancel={() => onOpenForm(null)}
        />
      )}

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

      {error && <p role="alert">{error}</p>}

      {items === null && !error && <p>Loading…</p>}

      {items !== null && items.length === 0 && <p>No recurring transfers found.</p>}

      {items !== null && items.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th>Destination account</th>
              <th>Amount</th>
              <th>Next execution</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.sid}>
                <td>{item.description}</td>
                <td>{item.destinationAccount.name}</td>
                <td>
                  {item.amount} {item.currency}
                </td>
                <td>{item.nextExecutionDate}</td>
                <td>{RECURRING_STATUS_LABELS[item.status]}</td>
                <td>
                  <RecurringTransferRowMenu
                    recurringTransfer={item}
                    isOpen={openMenuSid === item.sid}
                    onOpenChange={(isOpen) => {
                      onOpenMenuSid(isOpen ? item.sid : null)
                      if (isOpen) onOpenForm(null)
                    }}
                    onEdit={() => onOpenForm({ kind: 'edit-transfer', item })}
                    onCanceled={onMutated}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}

export function RecurringOperationsPanel({ accountSid }: { accountSid: string }) {
  // Lifted here (rather than owned separately by each section) so opening a
  // form or row menu in one subsection structurally closes whatever was
  // open in the other — same single-open-at-a-time rule already enforced
  // within each subsection's own row menus.
  const [openForm, setOpenForm] = useState<OpenForm>(null)
  const [openMenuSid, setOpenMenuSid] = useState<string | null>(null)
  const [refetchToken, setRefetchToken] = useState(0)

  function handleOpenForm(form: OpenForm) {
    setOpenForm(form)
    if (form) setOpenMenuSid(null)
  }

  function handleOpenMenuSid(sid: string | null) {
    setOpenMenuSid(sid)
  }

  function handleMutated() {
    setOpenForm(null)
    setRefetchToken((token) => token + 1)
  }

  return (
    <div>
      <h2>Recurring operations</h2>
      <RecurringTransactionsSection
        accountSid={accountSid}
        openForm={openForm}
        onOpenForm={handleOpenForm}
        openMenuSid={openMenuSid}
        onOpenMenuSid={handleOpenMenuSid}
        refetchToken={refetchToken}
        onMutated={handleMutated}
      />
      <RecurringTransfersSection
        accountSid={accountSid}
        openForm={openForm}
        onOpenForm={handleOpenForm}
        openMenuSid={openMenuSid}
        onOpenMenuSid={handleOpenMenuSid}
        refetchToken={refetchToken}
        onMutated={handleMutated}
      />
    </div>
  )
}
