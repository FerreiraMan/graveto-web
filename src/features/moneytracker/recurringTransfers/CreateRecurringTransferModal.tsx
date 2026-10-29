import { useEffect, useRef, useState, type FormEvent } from 'react'
import { fetchAllAccounts } from '../accounts/api'
import type { Account } from '../accounts/types'
import { ApiError } from '../../../shared/api/errors'
import { requiresDayOfMonth, requiresDayOfWeek, type Frequency } from '../recurring/types'
import { ScheduleFields } from '../recurring/ScheduleFields'
import { createRecurringTransfer } from './api'
import styles from '../MoneyTracker.module.css'

// Shares CreateAccountModal/CreateTransactionModal's shell (overlay, focus
// trap, scroll lock, Escape, fadeIn/modalIn) — same pattern as this app's
// other two create flows, not a new one.
export function CreateRecurringTransferModal({
  sourceAccountSid,
  onClose,
  onCreated,
}: {
  sourceAccountSid: string
  onClose: () => void
  onCreated: () => void
}) {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [destinationAccountSid, setDestinationAccountSid] = useState('')
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
    fetchAllAccounts()
      .then((result) => {
        if (!cancelled) setAccounts(result)
      })
      .catch(() => {
        if (!cancelled) setAccounts([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  const destinationOptions = accounts.filter((account) => account.sid !== sourceAccountSid)

  const isScheduleValid =
    (!requiresDayOfMonth(frequency) || dayOfMonth !== '') && (!requiresDayOfWeek(frequency) || dayOfWeek !== '')

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setFieldErrors({})
    setIsSubmitting(true)
    try {
      await createRecurringTransfer({
        sourceAccountSid,
        destinationAccountSid,
        description: description.trim(),
        amount: Number(amount),
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
        setError(err instanceof ApiError ? err.message : 'Failed to create recurring transfer.')
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
        aria-labelledby="create-recurring-transfer-title"
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="create-recurring-transfer-title" className={styles.modalTitle}>
          Create recurring transfer
        </h2>

        <form onSubmit={handleSubmit}>
          {error && (
            <p className={styles.errorText} role="alert">
              {error}
            </p>
          )}

          <div className={styles.field}>
            <label htmlFor="recurring-transfer-destination">To account</label>
            <select
              id="recurring-transfer-destination"
              required
              autoFocus
              value={destinationAccountSid}
              onChange={(e) => setDestinationAccountSid(e.target.value)}
              className={destinationAccountSid === '' ? styles.selectPlaceholder : ''}
            >
              <option value="" disabled>
                Select destination account
              </option>
              {destinationOptions.map((account) => (
                <option key={account.sid} value={account.sid}>
                  {account.institution}
                </option>
              ))}
            </select>
            {fieldErrors.destinationAccountSid && <span className={styles.fieldError}>{fieldErrors.destinationAccountSid}</span>}
          </div>

          <div className={styles.field}>
            <label htmlFor="recurring-transfer-description">Description</label>
            <input
              id="recurring-transfer-description"
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            {fieldErrors.description && <span className={styles.fieldError}>{fieldErrors.description}</span>}
          </div>

          <div className={styles.field}>
            <label htmlFor="recurring-transfer-amount">Amount</label>
            <input
              id="recurring-transfer-amount"
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
            idPrefix="recurring-transfer"
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
            <label htmlFor="recurring-transfer-start-date">Start date (optional)</label>
            <input
              id="recurring-transfer-start-date"
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
              disabled={isSubmitting || !destinationAccountSid || !amount || !description.trim() || !isScheduleValid}
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
