import { useEffect, useState, type FormEvent } from 'react'
import { fetchAllCategories } from '../categories/api'
import { CategoryPicker } from '../categories/CategoryPicker'
import { groupByParent } from '../categories/categoryTree'
import { CATEGORY_TRANSACTION_TYPES, TRANSACTION_TYPE_LABELS, type Category, type TransactionType } from '../categories/types'
import { ApiError } from '../../../shared/api/errors'
import { createTransaction } from './api'

export function CreateTransactionForm({
  accountSid,
  onCreated,
  onCancel,
}: {
  accountSid: string
  onCreated: () => void
  onCancel: () => void
}) {
  const [availableCategories, setAvailableCategories] = useState<Category[]>([])
  const [categorySid, setCategorySid] = useState('')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [transactionType, setTransactionType] = useState<TransactionType>('EXPENSE')
  const [occurredAt, setOccurredAt] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false
    setCategorySid('')
    fetchAllCategories({ accountSid, type: transactionType })
      .then((result) => {
        if (!cancelled) setAvailableCategories(result)
      })
      .catch(() => {
        if (!cancelled) setAvailableCategories([])
      })
    return () => {
      cancelled = true
    }
  }, [accountSid, transactionType])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setFieldErrors({})
    setIsSubmitting(true)
    try {
      await createTransaction({
        accountSid,
        categorySid,
        amount: Number(amount),
        description: description.trim() || undefined,
        transactionType,
        occurredAt: occurredAt || undefined,
      })
      onCreated()
    } catch (err) {
      if (err instanceof ApiError && err.problem?.invalid_params) {
        setFieldErrors(err.problem.invalid_params)
      } else {
        setError(err instanceof ApiError ? err.message : 'Failed to create transaction.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h3>Create transaction</h3>

      {error && <p role="alert">{error}</p>}

      <div>
        <label htmlFor="transaction-type">Type</label>
        <select
          id="transaction-type"
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
          key={`${accountSid}-${transactionType}`}
          groups={groupByParent(availableCategories)}
          selectedSid={categorySid}
          onSelect={setCategorySid}
          noSelectionLabel="Select a category"
          name="transaction-category"
        />
        {fieldErrors.categorySid && <span>{fieldErrors.categorySid}</span>}
      </fieldset>

      <div>
        <label htmlFor="transaction-amount">Amount</label>
        <input
          id="transaction-amount"
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
        <label htmlFor="transaction-description">Description</label>
        <input
          id="transaction-description"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        {fieldErrors.description && <span>{fieldErrors.description}</span>}
      </div>

      <div>
        <label htmlFor="transaction-occurred-at">Date and time</label>
        <input
          id="transaction-occurred-at"
          type="datetime-local"
          value={occurredAt}
          onChange={(e) => setOccurredAt(e.target.value)}
        />
        {fieldErrors.occurredAt && <span>{fieldErrors.occurredAt}</span>}
      </div>

      <button type="submit" disabled={isSubmitting || !categorySid || !amount}>
        {isSubmitting ? 'Creating…' : 'Create transaction'}
      </button>
      <button type="button" onClick={onCancel} disabled={isSubmitting}>
        Cancel
      </button>
    </form>
  )
}
