import { useEffect, useRef, useState, type FormEvent } from 'react'
import { fetchAllCategories } from '../categories/api'
import { CategoryPicker } from '../categories/CategoryPicker'
import { groupByParent } from '../categories/categoryTree'
import { CATEGORY_TRANSACTION_TYPES, TRANSACTION_TYPE_LABELS, type Category, type TransactionType } from '../categories/types'
import { ApiError } from '../../../shared/api/errors'
import { requiresDayOfMonth, requiresDayOfWeek, type Frequency } from '../recurring/types'
import { ScheduleFields } from '../recurring/ScheduleFields'
import { createRecurringTransaction } from './api'
import styles from '../MoneyTracker.module.css'

// Shares CreateAccountModal/CreateTransactionModal's shell (overlay, focus
// trap, scroll lock, Escape, fadeIn/modalIn) — same pattern as this app's
// other two create flows, not a new one.
export function CreateRecurringTransactionModal({
  accountSid,
  onClose,
  onCreated,
}: {
  accountSid: string
  onClose: () => void
  onCreated: () => void
}) {
  const [availableCategories, setAvailableCategories] = useState<Category[]>([])
  const [categorySid, setCategorySid] = useState('')
  const [transactionType, setTransactionType] = useState<TransactionType>('EXPENSE')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [frequency, setFrequency] = useState<Frequency>('MONTHLY')
  const [dayOfMonth, setDayOfMonth] = useState('')
  const [dayOfWeek, setDayOfWeek] = useState('')
  const [adjustToBusinessDay, setAdjustToBusinessDay] = useState(true)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Tab' || !modalRef.current) return

      const focusable = modalRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )
      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && !isSubmitting) onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isSubmitting, onClose])

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

  const isScheduleValid =
    (!requiresDayOfMonth(frequency) || dayOfMonth !== '') && (!requiresDayOfWeek(frequency) || dayOfWeek !== '')

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setFieldErrors({})
    setIsSubmitting(true)
    try {
      await createRecurringTransaction({
        accountSid,
        categorySid,
        description: description.trim(),
        amount: Number(amount),
        transactionType,
        frequency,
        dayOfMonth: requiresDayOfMonth(frequency) && dayOfMonth ? Number(dayOfMonth) : undefined,
        dayOfWeek: requiresDayOfWeek(frequency) && dayOfWeek ? Number(dayOfWeek) : undefined,
        adjustToBusinessDay,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      })
      onCreated()
    } catch (err) {
      if (err instanceof ApiError && err.problem?.invalid_params) {
        setFieldErrors(err.problem.invalid_params)
      } else {
        setError(err instanceof ApiError ? err.message : 'Failed to create recurring transaction.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleOverlayClick() {
    if (!isSubmitting) onClose()
  }

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-recurring-transaction-title"
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="create-recurring-transaction-title" className={styles.modalTitle}>
          Create recurring transaction
        </h2>

        <form onSubmit={handleSubmit}>
          {error && (
            <p className={styles.errorText} role="alert">
              {error}
            </p>
          )}

          <div className={styles.field}>
            <label htmlFor="recurring-transaction-type">Type</label>
            <select
              id="recurring-transaction-type"
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
              key={`${accountSid}-${transactionType}`}
              groups={groupByParent(availableCategories)}
              selectedSid={categorySid}
              onSelect={setCategorySid}
              noSelectionLabel="Select a category"
              name="recurring-transaction-category"
            />
            {fieldErrors.categorySid && <span className={styles.fieldError}>{fieldErrors.categorySid}</span>}
          </fieldset>

          <div className={styles.field}>
            <label htmlFor="recurring-transaction-description">Description</label>
            <input
              id="recurring-transaction-description"
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            {fieldErrors.description && <span className={styles.fieldError}>{fieldErrors.description}</span>}
          </div>

          <div className={styles.field}>
            <label htmlFor="recurring-transaction-amount">Amount</label>
            <input
              id="recurring-transaction-amount"
              type="number"
              step="0.01"
              min="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            {fieldErrors.amount && <span className={styles.fieldError}>{fieldErrors.amount}</span>}
          </div>

          <ScheduleFields
            idPrefix="recurring-transaction"
            frequency={frequency}
            onFrequencyChange={(newFrequency) => {
              setFrequency(newFrequency)
              setDayOfMonth('')
              setDayOfWeek('')
            }}
            dayOfMonth={dayOfMonth}
            onDayOfMonthChange={setDayOfMonth}
            dayOfWeek={dayOfWeek}
            onDayOfWeekChange={setDayOfWeek}
            adjustToBusinessDay={adjustToBusinessDay}
            onAdjustToBusinessDayChange={setAdjustToBusinessDay}
            endDate={endDate}
            onEndDateChange={setEndDate}
            fieldErrors={fieldErrors}
          />

          <div className={styles.field}>
            <label htmlFor="recurring-transaction-start-date">Start date (optional)</label>
            <input
              id="recurring-transaction-start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            {fieldErrors.startDate && <span className={styles.fieldError}>{fieldErrors.startDate}</span>}
          </div>

          <div className={styles.formActions}>
            <button
              type="submit"
              className={styles.primaryButton}
              disabled={isSubmitting || !categorySid || !amount || !description.trim() || !isScheduleValid}
            >
              {isSubmitting ? 'Creating…' : 'Create'}
            </button>
            <button type="button" className={styles.secondaryButton} onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
