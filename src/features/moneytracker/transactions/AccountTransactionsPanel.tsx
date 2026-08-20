import { useEffect, useState } from 'react'
import { fetchAllCategories } from '../categories/api'
import { CategoryPicker } from '../categories/CategoryPicker'
import { ALL_TRANSACTION_TYPES, TRANSACTION_TYPE_LABELS, type Category, type TransactionType } from '../categories/types'
import { ApiError } from '../../../shared/api/errors'
import { currencySymbol } from '../currency'
import { fetchTransactions } from './api'
import { TRANSACTION_STATUS_LABELS, isTransferLeg, type Transaction, type TransactionFilterRequest, type TransactionStatus } from './types'
import { groupByParent } from '../categories/categoryTree'
import { CreateTransactionForm } from './CreateTransactionForm'
import { CreateTransferForm } from '../transfers/CreateTransferForm'
import { UpdateTransactionForm } from './UpdateTransactionForm'
import { UpdateTransferForm } from '../transfers/UpdateTransferForm'
import { TransactionRowMenu } from './TransactionRowMenu'

const TRANSACTION_STATUSES: TransactionStatus[] = ['ACTIVE', 'DELETED']
const PAGE_SIZE = 20

type CreateMode = 'transaction' | 'transfer' | null

export function AccountTransactionsPanel({
  accountSid,
  onTransactionMutated,
}: {
  accountSid: string
  onTransactionMutated: () => void
}) {
  const [categoryOptions, setCategoryOptions] = useState<Category[]>([])
  const [categorySid, setCategorySid] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [type, setType] = useState<TransactionType | ''>('')
  const [status, setStatus] = useState<TransactionStatus | ''>('')
  const [page, setPage] = useState(0)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [refetchToken, setRefetchToken] = useState(0)
  const [createMode, setCreateMode] = useState<CreateMode>(null)
  const [createMenuOpen, setCreateMenuOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [openMenuSid, setOpenMenuSid] = useState<string | null>(null)

  const [transactions, setTransactions] = useState<Transaction[] | null>(null)
  const [totalPages, setTotalPages] = useState(0)
  const [error, setError] = useState<string | null>(null)

  // Every filter change (except page itself) should reset back to page 0 —
  // otherwise a user filtering from e.g. page 3 could land on an out-of-range
  // page for the new, smaller result set.
  useEffect(() => {
    setPage(0)
  }, [accountSid, categorySid, startDate, endDate, type, status])

  useEffect(() => {
    setCategorySid('')
    fetchAllCategories({ accountSid })
      .then(setCategoryOptions)
      .catch(() => {
        setCategoryOptions([])
      })
  }, [accountSid])

  useEffect(() => {
    let cancelled = false
    setTransactions(null)
    setError(null)

    const filters: TransactionFilterRequest = { accountSid }
    if (categorySid) filters.categorySid = categorySid
    if (startDate) filters.startDate = startDate
    if (endDate) filters.endDate = endDate
    if (type) filters.type = type
    if (status) filters.status = status

    fetchTransactions(filters, { page, size: PAGE_SIZE })
      .then((result) => {
        if (cancelled) return
        setTransactions(result.content)
        setTotalPages(result.totalPages)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Failed to load transactions.')
      })

    return () => {
      cancelled = true
    }
  }, [accountSid, categorySid, startDate, endDate, type, status, page, refetchToken])

  function handleMutated() {
    setCreateMode(null)
    setEditingTransaction(null)
    setRefetchToken((token) => token + 1)
    onTransactionMutated()
  }

  const activeFilterCount = [categorySid, startDate, endDate, type, status].filter(Boolean).length

  return (
    <div>
      <h2>Transactions</h2>

      <div>
        <button type="button" onClick={() => setCreateMenuOpen((open) => !open)} aria-expanded={createMenuOpen}>
          Create
        </button>
        {createMenuOpen && (
          <div>
            <button
              type="button"
              onClick={() => {
                setCreateMenuOpen(false)
                setCreateMode('transaction')
              }}
            >
              Transaction
            </button>
            <button
              type="button"
              onClick={() => {
                setCreateMenuOpen(false)
                setCreateMode('transfer')
              }}
            >
              Transfer
            </button>
          </div>
        )}
      </div>

      {createMode === 'transaction' && (
        <CreateTransactionForm
          accountSid={accountSid}
          onCreated={handleMutated}
          onCancel={() => setCreateMode(null)}
        />
      )}

      {createMode === 'transfer' && (
        <CreateTransferForm
          sourceAccountSid={accountSid}
          onCreated={handleMutated}
          onCancel={() => setCreateMode(null)}
        />
      )}

      {editingTransaction && isTransferLeg(editingTransaction) && (
        <UpdateTransferForm
          transaction={editingTransaction}
          onUpdated={handleMutated}
          onCancel={() => setEditingTransaction(null)}
        />
      )}

      {editingTransaction && !isTransferLeg(editingTransaction) && (
        <UpdateTransactionForm
          transaction={editingTransaction}
          onUpdated={handleMutated}
          onCancel={() => setEditingTransaction(null)}
        />
      )}

      <button type="button" onClick={() => setFiltersOpen((open) => !open)} aria-expanded={filtersOpen}>
        Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
      </button>

      {filtersOpen && (
        <div>
          <fieldset>
            <legend>Category</legend>
            <CategoryPicker
              key={accountSid}
              groups={groupByParent(categoryOptions)}
              selectedSid={categorySid}
              onSelect={setCategorySid}
              noSelectionLabel="All categories"
              name="transaction-category-filter"
            />
          </fieldset>

          <label htmlFor="transaction-start-date">From</label>
          <input
            id="transaction-start-date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />

          <label htmlFor="transaction-end-date">To</label>
          <input
            id="transaction-end-date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />

          <label htmlFor="transaction-type-filter">Type</label>
          <select
            id="transaction-type-filter"
            value={type}
            onChange={(e) => setType(e.target.value as TransactionType | '')}
          >
            <option value="">All types</option>
            {ALL_TRANSACTION_TYPES.map((t) => (
              <option key={t} value={t}>
                {TRANSACTION_TYPE_LABELS[t]}
              </option>
            ))}
          </select>

          <label htmlFor="transaction-status-filter">Status</label>
          <select
            id="transaction-status-filter"
            value={status}
            onChange={(e) => setStatus(e.target.value as TransactionStatus | '')}
          >
            <option value="">All statuses</option>
            {TRANSACTION_STATUSES.map((s) => (
              <option key={s} value={s}>
                {TRANSACTION_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
      )}

      {error && <p role="alert">{error}</p>}

      {transactions === null && !error && <p>Loading…</p>}

      {transactions !== null && transactions.length === 0 && <p>No transactions found.</p>}

      {transactions !== null && transactions.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Category</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => (
              <tr key={transaction.sid}>
                <td>{transaction.occurredAt.slice(0, 10)}</td>
                <td>{transaction.description ?? '—'}</td>
                <td>{transaction.category.name}</td>
                <td>{TRANSACTION_TYPE_LABELS[transaction.type]}</td>
                <td>
                  {transaction.amount}
                  {currencySymbol(transaction.currency)}
                </td>
                <td>{TRANSACTION_STATUS_LABELS[transaction.status]}</td>
                <td>
                  <TransactionRowMenu
                    transaction={transaction}
                    accountSid={accountSid}
                    isOpen={openMenuSid === transaction.sid}
                    onOpenChange={(isOpen) => {
                      setOpenMenuSid(isOpen ? transaction.sid : null)
                      if (isOpen) setEditingTransaction(null)
                    }}
                    onEdit={() => setEditingTransaction(transaction)}
                    onDeleted={handleMutated}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {transactions !== null && totalPages > 1 && (
        <div>
          <button type="button" onClick={() => setPage((p) => p - 1)} disabled={page === 0}>
            Previous
          </button>
          <span>
            {' '}
            Page {page + 1} of {totalPages}{' '}
          </span>
          <button type="button" onClick={() => setPage((p) => p + 1)} disabled={page + 1 >= totalPages}>
            Next
          </button>
        </div>
      )}
    </div>
  )
}
