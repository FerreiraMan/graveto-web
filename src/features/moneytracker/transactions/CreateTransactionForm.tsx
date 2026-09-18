import { useEffect, useState, type FormEvent } from 'react'
import { fetchAllCategories } from '../categories/api'
import { CategoryPicker } from '../categories/CategoryPicker'
import { buildCategoryTree } from '../categories/categoryTree'
import { CATEGORY_TRANSACTION_TYPES, TRANSACTION_TYPE_LABELS, type Category, type TransactionType } from '../categories/types'
import { ApiError } from '../../../shared/api/errors'
import { useDebouncedValue } from '../../../shared/hooks/useDebouncedValue'
import { createTransaction } from './api'
import { DateTimeField } from './DateTimeField'
import { combineDateTime, type DateTimeValue } from './dateTime'
import styles from '../MoneyTracker.module.css'

export function CreateTransactionForm({
  accountSid,
  amount,
  onAmountChange,
  description,
  onDescriptionChange,
  occurredAt,
  onOccurredAtChange,
  onCreated,
  onCancel,
  onSubmittingChange,
}: {
  accountSid: string
  amount: string
  onAmountChange: (value: string) => void
  description: string
  onDescriptionChange: (value: string) => void
  occurredAt: DateTimeValue
  onOccurredAtChange: (value: DateTimeValue) => void
  onCreated: () => void
  onCancel: () => void
  onSubmittingChange?: (isSubmitting: boolean) => void
}) {
  const [availableCategories, setAvailableCategories] = useState<Category[]>([])
  const [categorySid, setCategorySid] = useState('')
  const [categorySearch, setCategorySearch] = useState('')
  const debouncedCategorySearch = useDebouncedValue(categorySearch, 400)
  const [hasLoadedCategoriesOnce, setHasLoadedCategoriesOnce] = useState(false)
  const [transactionType, setTransactionType] = useState<TransactionType>('EXPENSE')
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Category selection resets when the account or type changes (a
  // different account/type has a different valid category set), but not
  // when the search query changes — narrowing the visible list while
  // typing shouldn't silently discard something already picked.
  useEffect(() => {
    setCategorySid('')
  }, [accountSid, transactionType])

  // Only shows a loading state before the very first result set has ever
  // arrived — every search after that swaps the list in place once the
  // new results land, keeping the current ones visible in the meantime.
  // Wiping the tree back to "Loading…" on every keystroke's eventual
  // fetch (the previous approach) made the popover feel like it was
  // reloading itself on every character typed, rather than narrowing.
  useEffect(() => {
    let cancelled = false
    fetchAllCategories({
      accountSid,
      type: transactionType,
      displayName: debouncedCategorySearch || undefined,
    })
      .then((result) => {
        if (!cancelled) {
          setAvailableCategories(result)
          setHasLoadedCategoriesOnce(true)
        }
      })
      .catch(() => {
        if (!cancelled) setAvailableCategories([])
      })
    return () => {
      cancelled = true
    }
  }, [accountSid, transactionType, debouncedCategorySearch])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setFieldErrors({})
    setIsSubmitting(true)
    onSubmittingChange?.(true)
    try {
      await createTransaction({
        accountSid,
        categorySid,
        amount: Number(amount),
        description: description.trim() || undefined,
        transactionType,
        occurredAt: combineDateTime(occurredAt),
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
      onSubmittingChange?.(false)
    }
  }

  return (
    <form className={styles.formFadeIn} onSubmit={handleSubmit}>
      {error && (
        <p className={styles.errorText} role="alert">
          {error}
        </p>
      )}

      <div className={styles.field}>
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
        {fieldErrors.transactionType && <span className={styles.fieldError}>{fieldErrors.transactionType}</span>}
      </div>

      <fieldset className={styles.field}>
        <legend>Category</legend>
        <CategoryPicker
          key={`${accountSid}-${transactionType}`}
          groups={buildCategoryTree(availableCategories)}
          selectedSid={categorySid}
          onSelect={setCategorySid}
          name="transaction-category"
          search={categorySearch}
          onSearchChange={setCategorySearch}
          isLoading={!hasLoadedCategoriesOnce}
        />
        {fieldErrors.categorySid && <span className={styles.fieldError}>{fieldErrors.categorySid}</span>}
      </fieldset>

      <div className={styles.field}>
        <label htmlFor="transaction-amount">Amount</label>
        <input
          id="transaction-amount"
          type="number"
          step="0.01"
          min="0.01"
          placeholder="0.00"
          required
          value={amount}
          onChange={(e) => onAmountChange(e.target.value)}
        />
        {fieldErrors.amount && <span className={styles.fieldError}>{fieldErrors.amount}</span>}
      </div>

      <DateTimeField
        idPrefix="transaction-occurred-at"
        label="Date and time"
        date={occurredAt.date}
        time={occurredAt.time}
        onDateChange={(value) => onOccurredAtChange({ ...occurredAt, date: value })}
        onTimeChange={(value) => onOccurredAtChange({ ...occurredAt, time: value })}
        error={fieldErrors.occurredAt}
      />

      <div className={styles.field}>
        <label htmlFor="transaction-description">Description</label>
        <input
          id="transaction-description"
          type="text"
          placeholder="e.g. Groceries, Rent"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
        />
        {fieldErrors.description && <span className={styles.fieldError}>{fieldErrors.description}</span>}
      </div>

      <div className={styles.formActions}>
        <button type="submit" className={styles.primaryButton} disabled={isSubmitting || !categorySid || !amount}>
          {isSubmitting ? 'Creating…' : 'Create'}
        </button>
        <button type="button" className={styles.secondaryButton} onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </button>
      </div>
    </form>
  )
}
