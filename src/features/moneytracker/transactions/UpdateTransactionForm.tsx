import { useEffect, useRef, useState, type FormEvent } from 'react'
import { fetchAllCategories } from '../categories/api'
import { CategoryPicker } from '../categories/CategoryPicker'
import { buildCategoryTree } from '../categories/categoryTree'
import { CATEGORY_TRANSACTION_TYPES, TRANSACTION_TYPE_LABELS, type Category, type TransactionType } from '../categories/types'
import { ApiError } from '../../../shared/api/errors'
import { useDebouncedValue } from '../../../shared/hooks/useDebouncedValue'
import { updateTransaction } from './api'
import { DateTimeField } from './DateTimeField'
import { combineDateTime, type DateTimeValue } from './dateTime'
import type { Transaction } from './types'
import styles from '../MoneyTracker.module.css'

// occurredAt from the API is ISO_LOCAL_DATE_TIME ("YYYY-MM-DDTHH:mm:ss")
// — split into the {date, time} pair DateTimeField/combineDateTime
// operate on, same shape CreateTransactionForm's nowDateTime() produces.
function toDateTimeValue(occurredAt: string): DateTimeValue {
  const [date, time = ''] = occurredAt.split('T')
  return { date, time: time.slice(0, 5) }
}

export function UpdateTransactionForm({
  transaction,
  onUpdated,
  onCancel,
  onSubmittingChange,
}: {
  transaction: Transaction
  onUpdated: () => void
  onCancel: () => void
  onSubmittingChange?: (isSubmitting: boolean) => void
}) {
  const [availableCategories, setAvailableCategories] = useState<Category[]>([])
  const [categorySid, setCategorySid] = useState(transaction.category.sid)
  const [categorySearch, setCategorySearch] = useState('')
  const debouncedCategorySearch = useDebouncedValue(categorySearch, 400)
  const [hasLoadedCategoriesOnce, setHasLoadedCategoriesOnce] = useState(false)
  const [amount, setAmount] = useState(String(transaction.amount))
  const [description, setDescription] = useState(transaction.description ?? '')
  const [transactionType, setTransactionType] = useState<TransactionType>(transaction.type)
  const [occurredAt, setOccurredAt] = useState(toDateTimeValue(transaction.occurredAt))
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Same search/debounce pattern as CreateTransactionForm: only shows a
  // loading state before the very first result set has ever arrived, so
  // narrowing the search doesn't flash "Loading…" on every keystroke.
  useEffect(() => {
    let cancelled = false
    fetchAllCategories({
      accountSid: transaction.account.sid,
      type: transactionType,
      displayName: debouncedCategorySearch || undefined,
    })
      .then((result) => {
        if (cancelled) return
        setAvailableCategories(result)
        setHasLoadedCategoriesOnce(true)
      })
      .catch(() => {
        if (!cancelled) setAvailableCategories([])
      })
    return () => {
      cancelled = true
    }
  }, [transaction.account.sid, transactionType, debouncedCategorySearch])

  // Re-validates the selected category only against an actual TYPE
  // change, in its own effect with its own (unfiltered) fetch — kept
  // separate from the search-driven fetch above so a search term
  // narrowing the visible list is never mistaken for the category itself
  // becoming invalid. Fires once per real type change (rare), not per
  // keystroke, so the extra request is cheap. Skips the very first run
  // (transaction's own original type) since that selection is trivially
  // already valid.
  const isFirstRun = useRef(true)
  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false
      return
    }
    let cancelled = false
    fetchAllCategories({ accountSid: transaction.account.sid, type: transactionType })
      .then((result) => {
        if (cancelled) return
        setCategorySid((current) => (result.some((c) => c.sid === current) ? current : ''))
      })
      .catch(() => {
        // Best-effort check — leave the current selection as-is; a
        // genuinely invalid category still surfaces as a real error on
        // submit.
      })
    return () => {
      cancelled = true
    }
  }, [transaction.account.sid, transactionType])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setFieldErrors({})
    setIsSubmitting(true)
    onSubmittingChange?.(true)
    try {
      await updateTransaction(transaction.sid, {
        transactionType,
        categorySid,
        amount: Number(amount),
        description: description.trim() || undefined,
        occurredAt: combineDateTime(occurredAt),
      })
      onUpdated()
    } catch (err) {
      // Field-level validation errors render inline next to their own
      // input. Any other failure already surfaces via the global toast.
      if (err instanceof ApiError && err.problem?.invalid_params) {
        setFieldErrors(err.problem.invalid_params)
      }
    } finally {
      setIsSubmitting(false)
      onSubmittingChange?.(false)
    }
  }

  return (
    <form className={styles.formFadeIn} onSubmit={handleSubmit}>
      <div className={styles.field}>
        <label htmlFor="update-transaction-type">Type</label>
        <select
          id="update-transaction-type"
          autoFocus
          value={transactionType}
          onChange={(e) => setTransactionType(e.target.value as TransactionType)}
        >
          {CATEGORY_TRANSACTION_TYPES.map((t) => (
            <option key={t} value={t}>
              {TRANSACTION_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
        {fieldErrors.transactionType && <span className={styles.fieldError}>{fieldErrors.transactionType}</span>}
      </div>

      <fieldset className={styles.field}>
        <legend>Category</legend>
        <CategoryPicker
          key={transactionType}
          groups={buildCategoryTree(availableCategories)}
          selectedSid={categorySid}
          onSelect={setCategorySid}
          noSelectionLabel="Select a category"
          name="update-transaction-category"
          search={categorySearch}
          onSearchChange={setCategorySearch}
          isLoading={!hasLoadedCategoriesOnce}
        />
        {fieldErrors.categorySid && <span className={styles.fieldError}>{fieldErrors.categorySid}</span>}
      </fieldset>

      <div className={styles.field}>
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
        {fieldErrors.amount && <span className={styles.fieldError}>{fieldErrors.amount}</span>}
      </div>

      <DateTimeField
        idPrefix="update-transaction-occurred-at"
        label="Date and time"
        date={occurredAt.date}
        time={occurredAt.time}
        onDateChange={(value) => setOccurredAt((current) => ({ ...current, date: value }))}
        onTimeChange={(value) => setOccurredAt((current) => ({ ...current, time: value }))}
        error={fieldErrors.occurredAt}
      />

      <div className={styles.field}>
        <label htmlFor="update-transaction-description">Description</label>
        <input
          id="update-transaction-description"
          type="text"
          placeholder="e.g. Groceries, Rent"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        {fieldErrors.description && <span className={styles.fieldError}>{fieldErrors.description}</span>}
      </div>

      <div className={styles.formActions}>
        <button
          type="submit"
          className={styles.primaryButton}
          disabled={isSubmitting || !categorySid || !amount}
        >
          {isSubmitting ? 'Saving…' : 'Save changes'}
        </button>
        <button type="button" className={styles.secondaryButton} onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </button>
      </div>
    </form>
  )
}
