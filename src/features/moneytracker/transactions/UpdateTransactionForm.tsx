import { useEffect, useState, type FormEvent } from 'react'
import { fetchAllCategories } from '../categories/api'
import { CategoryPicker } from '../categories/CategoryPicker'
import { groupByParent } from '../categories/categoryTree'
import { CATEGORY_TRANSACTION_TYPES, TRANSACTION_TYPE_LABELS, type Category, type TransactionType } from '../categories/types'
import { ApiError } from '../../../shared/api/errors'
import { updateTransaction } from './api'
import type { Transaction } from './types'

// datetime-local inputs need "YYYY-MM-DDTHH:mm" — occurredAt from the API is
// ISO_LOCAL_DATE_TIME ("YYYY-MM-DDTHH:mm:ss"), so trim any seconds/nanos.
function toDateTimeLocal(occurredAt: string): string {
  return occurredAt.slice(0, 16)
}

export function UpdateTransactionForm({
  transaction,
  onUpdated,
  onCancel,
}: {
  transaction: Transaction
  onUpdated: () => void
  onCancel: () => void
}) {
  const [availableCategories, setAvailableCategories] = useState<Category[]>([])
  const [categorySid, setCategorySid] = useState(transaction.category.sid)
  const [amount, setAmount] = useState(String(transaction.amount))
  const [description, setDescription] = useState(transaction.description ?? '')
  const [transactionType, setTransactionType] = useState<TransactionType>(transaction.type)
  const [occurredAt, setOccurredAt] = useState(toDateTimeLocal(transaction.occurredAt))
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetchAllCategories({ accountSid: transaction.account.sid, type: transactionType })
      .then((result) => {
        if (cancelled) return
        setAvailableCategories(result)
        // Keep the current category selected only if it's still a valid
        // option for the (possibly new) type; otherwise force a re-pick
        // rather than silently submitting a category from the old type.
        setCategorySid((current) => (result.some((c) => c.sid === current) ? current : ''))
      })
      .catch(() => {
        if (!cancelled) setAvailableCategories([])
      })
    return () => {
      cancelled = true
    }
  }, [transaction.account.sid, transactionType])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setFieldErrors({})
    setIsSubmitting(true)
    try {
      await updateTransaction(transaction.sid, {
        transactionType,
        categorySid,
        amount: Number(amount),
        description: description.trim() || undefined,
        occurredAt,
      })
      onUpdated()
    } catch (err) {
      if (err instanceof ApiError && err.problem?.invalid_params) {
        setFieldErrors(err.problem.invalid_params)
      } else {
        setError(err instanceof ApiError ? err.message : 'Failed to update transaction.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h3>Update transaction</h3>

      {error && <p role="alert">{error}</p>}

      <div>
        <label htmlFor="update-transaction-type">Type</label>
        <select
          id="update-transaction-type"
          value={transactionType}
          onChange={(e) => setTransactionType(e.target.value as TransactionType)}
        >
          {CATEGORY_TRANSACTION_TYPES.map((t) => (
            <option key={t} value={t}>
              {TRANSACTION_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
        {fieldErrors.transactionType && <span>{fieldErrors.transactionType}</span>}
      </div>

      <fieldset>
        <legend>Category</legend>
        <CategoryPicker
          key={transactionType}
          groups={groupByParent(availableCategories)}
          selectedSid={categorySid}
          onSelect={setCategorySid}
          noSelectionLabel="Select a category"
          name="update-transaction-category"
        />
        {fieldErrors.categorySid && <span>{fieldErrors.categorySid}</span>}
      </fieldset>

      <div>
        <label htmlFor="update-transaction-amount">Amount</label>
        <input
          id="update-transaction-amount"
          type="number"
          step="0.01"
          min="0.01"
          required
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        {fieldErrors.amount && <span>{fieldErrors.amount}</span>}
      </div>

      <div>
        <label htmlFor="update-transaction-description">Description</label>
        <input
          id="update-transaction-description"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        {fieldErrors.description && <span>{fieldErrors.description}</span>}
      </div>

      <div>
        <label htmlFor="update-transaction-occurred-at">Date and time</label>
        <input
          id="update-transaction-occurred-at"
          type="datetime-local"
          value={occurredAt}
          onChange={(e) => setOccurredAt(e.target.value)}
        />
        {fieldErrors.occurredAt && <span>{fieldErrors.occurredAt}</span>}
      </div>

      <button type="submit" disabled={isSubmitting || !categorySid || !amount}>
        {isSubmitting ? 'Saving…' : 'Save changes'}
      </button>
      <button type="button" onClick={onCancel} disabled={isSubmitting}>
        Cancel
      </button>
    </form>
  )
}
