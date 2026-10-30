import { useState, type FormEvent } from 'react'
import { ApiError } from '../../../shared/api/errors'
import {
  EDITABLE_RECURRING_STATUSES,
  RECURRING_STATUS_LABELS,
  requiresDayOfMonth,
  requiresDayOfWeek,
  type Frequency,
  type RecurringOperationStatus,
} from '../recurring/types'
import { ScheduleFields } from '../recurring/ScheduleFields'
import { updateRecurringTransaction } from './api'
import type { RecurringTransaction } from './types'
import styles from '../MoneyTracker.module.css'

export function UpdateRecurringTransactionForm({
  recurringTransaction,
  onUpdated,
  onCancel,
  onSubmittingChange,
}: {
  recurringTransaction: RecurringTransaction
  onUpdated: () => void
  onCancel: () => void
  onSubmittingChange?: (isSubmitting: boolean) => void
}) {
  const [description, setDescription] = useState(recurringTransaction.description)
  const [amount, setAmount] = useState(String(recurringTransaction.amount))
  const [frequency, setFrequency] = useState<Frequency>(recurringTransaction.frequency)
  // The API never echoes back dayOfMonth/dayOfWeek (response DTO omits
  // them), so there's nothing to pre-fill. That's fine: the backend only
  // updates them when a value is actually sent (updateSchedule() treats
  // null as "leave unchanged"), so these stay empty/omitted unless the
  // user changes the frequency to something that now needs a new value.
  const [dayOfMonth, setDayOfMonth] = useState('')
  const [dayOfWeek, setDayOfWeek] = useState('')
  const [adjustToBusinessDay, setAdjustToBusinessDay] = useState(true)
  const [nextExecutionDate, setNextExecutionDate] = useState(recurringTransaction.nextExecutionDate)
  const [endDate, setEndDate] = useState(recurringTransaction.endDate ?? '')
  const [status, setStatus] = useState<RecurringOperationStatus>(recurringTransaction.status)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const frequencyChanged = frequency !== recurringTransaction.frequency
  const isScheduleValid =
    !frequencyChanged ||
    ((!requiresDayOfMonth(frequency) || dayOfMonth !== '') && (!requiresDayOfWeek(frequency) || dayOfWeek !== ''))

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setFieldErrors({})
    setIsSubmitting(true)
    onSubmittingChange?.(true)
    try {
      await updateRecurringTransaction(recurringTransaction.sid, {
        description: description.trim() || undefined,
        amount: Number(amount),
        frequency: frequencyChanged ? frequency : undefined,
        dayOfMonth: frequencyChanged && requiresDayOfMonth(frequency) && dayOfMonth ? Number(dayOfMonth) : undefined,
        dayOfWeek: frequencyChanged && requiresDayOfWeek(frequency) && dayOfWeek ? Number(dayOfWeek) : undefined,
        adjustToBusinessDay,
        status: status !== recurringTransaction.status ? status : undefined,
        nextExecutionDate: nextExecutionDate !== recurringTransaction.nextExecutionDate ? nextExecutionDate : undefined,
        endDate: endDate || undefined,
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
        <span className={styles.fieldStaticLabel}>Category</span>
        <p className={styles.mutedText}>Current category: {recurringTransaction.category.name} (can't be changed).</p>
      </div>

      <div className={styles.field}>
        <label htmlFor="update-recurring-transaction-description">Description</label>
        <input
          id="update-recurring-transaction-description"
          type="text"
          required
          autoFocus
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        {fieldErrors.description && <span className={styles.fieldError}>{fieldErrors.description}</span>}
      </div>

      <div className={styles.field}>
        <label htmlFor="update-recurring-transaction-amount">Amount</label>
        <input
          id="update-recurring-transaction-amount"
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
        idPrefix="update-recurring-transaction"
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
        showDayFields={frequencyChanged}
      />
      {frequencyChanged && (requiresDayOfMonth(frequency) || requiresDayOfWeek(frequency)) && (
        <p className={styles.mutedText}>Changing frequency requires picking a new day above.</p>
      )}

      <div className={styles.field}>
        <label htmlFor="update-recurring-transaction-next-execution">Next execution date</label>
        <input
          id="update-recurring-transaction-next-execution"
          type="date"
          value={nextExecutionDate}
          onChange={(e) => setNextExecutionDate(e.target.value)}
        />
        {fieldErrors.nextExecutionDate && <span className={styles.fieldError}>{fieldErrors.nextExecutionDate}</span>}
      </div>

      <div className={styles.field}>
        <label htmlFor="update-recurring-transaction-status">Status</label>
        <select
          id="update-recurring-transaction-status"
          value={status}
          onChange={(e) => setStatus(e.target.value as RecurringOperationStatus)}
        >
          {EDITABLE_RECURRING_STATUSES.map((s) => (
            <option key={s} value={s}>
              {RECURRING_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        {fieldErrors.status && <span className={styles.fieldError}>{fieldErrors.status}</span>}
      </div>

      <div className={styles.formActions}>
        <button
          type="submit"
          className={styles.primaryButton}
          disabled={isSubmitting || !amount || !description.trim() || !isScheduleValid}
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
