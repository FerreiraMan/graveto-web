import { useEffect, useRef, useState } from 'react'
import { fetchAllCategories } from '../categories/api'
import { CategoryPicker } from '../categories/CategoryPicker'
import { ALL_TRANSACTION_TYPES, TRANSACTION_TYPE_LABELS, type Category, type TransactionType } from '../categories/types'
import { ApiError } from '../../../shared/api/errors'
import { currencySymbol } from '../currency'
import { fetchTransactions } from './api'
import {
  TRANSACTION_STATUS_LABELS,
  formatAmount,
  isTransferLeg,
  transactionPolarity,
  type Transaction,
  type TransactionFilterRequest,
  type TransactionStatus,
} from './types'
import { groupByParent } from '../categories/categoryTree'
import { CreateTransactionModal } from './CreateTransactionModal'
import { UpdateTransactionForm } from './UpdateTransactionForm'
import { UpdateTransferForm } from '../transfers/UpdateTransferForm'
import { TransactionRowMenu } from './TransactionRowMenu'
import styles from '../MoneyTracker.module.css'

const TRANSACTION_STATUSES: TransactionStatus[] = ['ACTIVE', 'DELETED']
const PAGE_SIZE = 20

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
  const [isCreating, setIsCreating] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [openMenuSid, setOpenMenuSid] = useState<string | null>(null)
  const createButtonRef = useRef<HTMLButtonElement>(null)

  const [transactions, setTransactions] = useState<Transaction[] | null>(null)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
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
        setTotalElements(result.totalElements)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Failed to load transactions.')
      })

    return () => {
      cancelled = true
    }
  }, [accountSid, categorySid, startDate, endDate, type, status, page, refetchToken])

  function handleMutated() {
    setIsCreating(false)
    setEditingTransaction(null)
    setRefetchToken((token) => token + 1)
    onTransactionMutated()
  }

  const activeFilterCount = [categorySid, startDate, endDate, type, status].filter(Boolean).length

  return (
    <div>
      <h2 id="transactions-heading" className={styles.srOnly}>
        Transactions
      </h2>

      <button
        type="button"
        ref={createButtonRef}
        className={styles.primaryButton}
        onClick={() => setIsCreating(true)}
      >
        Create
      </button>

      {isCreating && (
        <CreateTransactionModal
          accountSid={accountSid}
          onClose={() => {
            setIsCreating(false)
            createButtonRef.current?.focus()
          }}
          onCreated={() => {
            handleMutated()
            createButtonRef.current?.focus()
          }}
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
        <>
          <p className={styles.mutedText}>
            {totalElements} {totalElements === 1 ? 'transaction' : 'transactions'}
          </p>

          <div className={styles.tableScroll}>
            <table className={styles.transactionsTable} aria-labelledby="transactions-heading">
              <colgroup>
                <col className={styles.colDate} />
                <col className={styles.colDescription} />
                <col className={styles.colCategory} />
                <col className={styles.colType} />
                <col className={styles.colAmount} />
                <col className={styles.colStatus} />
                <col className={styles.colActions} />
              </colgroup>
              <thead>
                <tr>
                  <th scope="col">Date</th>
                  <th scope="col">Description</th>
                  <th scope="col">Category</th>
                  <th scope="col">Type</th>
                  <th scope="col" className={styles.amountHeader}>
                    Amount
                  </th>
                  <th scope="col">Status</th>
                  <th scope="col">
                    <span className={styles.srOnly}>Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody key={page}>
                {transactions.map((transaction) => {
                  const polarity = transactionPolarity(transaction.type)
                  const isDeleted = transaction.status === 'DELETED'
                  const amountClassName =
                    polarity === 'gain' ? styles.amountGain : polarity === 'loss' ? styles.amountLoss : ''
                  const sign = polarity === 'gain' ? '+' : polarity === 'loss' ? '−' : ''

                  return (
                    <tr key={transaction.sid} className={isDeleted ? styles.transactionRowDeleted : ''}>
                      <td>{transaction.occurredAt.slice(0, 10)}</td>
                      <td>{transaction.description ?? '—'}</td>
                      <td>{transaction.category.name}</td>
                      <td>{TRANSACTION_TYPE_LABELS[transaction.type]}</td>
                      <td className={`${styles.amountCell} ${amountClassName}`}>
                        {sign}
                        {formatAmount(transaction.amount)} {currencySymbol(transaction.currency)}
                      </td>
                      <td>{TRANSACTION_STATUS_LABELS[transaction.status]}</td>
                      <td className={styles.actionsCell}>
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
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {transactions !== null && totalPages > 1 && (
        <div className={styles.pagination}>
          {page > 0 && (
            <button type="button" className={styles.linkButton} onClick={() => setPage((p) => p - 1)}>
              Previous
            </button>
          )}
          <span aria-live="polite">
            Page {page + 1} of {totalPages}
          </span>
          {page + 1 < totalPages && (
            <button type="button" className={styles.linkButton} onClick={() => setPage((p) => p + 1)}>
              Next
            </button>
          )}
        </div>
      )}
    </div>
  )
}
