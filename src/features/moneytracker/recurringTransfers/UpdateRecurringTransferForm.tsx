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
import { updateRecurringTransfer } from './api'
import type { RecurringTransfer } from './types'

export function UpdateRecurringTransferForm({
  recurringTransfer,
  onUpdated,
  onCancel,
}: {
  recurringTransfer: RecurringTransfer
  onUpdated: () => void
  onCancel: () => void
}) {
  const [description, setDescription] = useState(recurringTransfer.description)
  const [amount, setAmount] = useState(String(recurringTransfer.amount))
  const [frequency, setFrequency] = useState<Frequency>(recurringTransfer.frequency)
  // See CreateRecurringTransactionForm / UpdateRecurringTransactionForm for
  // why these start empty and are only sent when frequency actually
  // changes: the API never echoes back the existing dayOfMonth/dayOfWeek,
  // and the backend leaves them untouched when omitted on update.
  const [dayOfMonth, setDayOfMonth] = useState('')
  const [dayOfWeek, setDayOfWeek] = useState('')
  const [adjustToBusinessDay, setAdjustToBusinessDay] = useState(true)
  const [nextExecutionDate, setNextExecutionDate] = useState(recurringTransfer.nextExecutionDate)
  const [endDate, setEndDate] = useState(recurringTransfer.endDate ?? '')
  const [status, setStatus] = useState<RecurringOperationStatus>(recurringTransfer.status)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const frequencyChanged = frequency !== recurringTransfer.frequency
  const isScheduleValid =
    !frequencyChanged ||
    ((!requiresDayOfMonth(frequency) || dayOfMonth !== '') && (!requiresDayOfWeek(frequency) || dayOfWeek !== ''))

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setFieldErrors({})
    setIsSubmitting(true)
    try {
      await updateRecurringTransfer(recurringTransfer.sid, {
        description: description.trim() || undefined,
        amount: Number(amount),
        frequency: frequencyChanged ? frequency : undefined,
        dayOfMonth: frequencyChanged && requiresDayOfMonth(frequency) && dayOfMonth ? Number(dayOfMonth) : undefined,
        dayOfWeek: frequencyChanged && requiresDayOfWeek(frequency) && dayOfWeek ? Number(dayOfWeek) : undefined,
        adjustToBusinessDay,
        status: status !== recurringTransfer.status ? status : undefined,
        nextExecutionDate: nextExecutionDate !== recurringTransfer.nextExecutionDate ? nextExecutionDate : undefined,
        endDate: endDate || undefined,
      })
      onUpdated()
    } catch (err) {
      if (err instanceof ApiError && err.problem?.invalid_params) {
        setFieldErrors(err.problem.invalid_params)
      } else {
        setError(err instanceof ApiError ? err.message : 'Failed to update recurring transfer.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h3>Update recurring transfer</h3>

      {error && <p role="alert">{error}</p>}

      <div>
        <label htmlFor="update-recurring-transfer-description">Description</label>
        <input
          id="update-recurring-transfer-description"
          type="text"
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        {fieldErrors.description && <span>{fieldErrors.description}</span>}
      </div>

      <div>
        <label htmlFor="update-recurring-transfer-amount">Amount</label>
        <input
          id="update-recurring-transfer-amount"
          type="number"
          step="0.01"
          min="0.01"
          required
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        {fieldErrors.amount && <span>{fieldErrors.amount}</span>}
      </div>

      <ScheduleFields
        idPrefix="update-recurring-transfer"
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
        <p>Changing frequency requires picking a new day above.</p>
      )}

      <div>
        <label htmlFor="update-recurring-transfer-next-execution">Next execution date</label>
        <input
          id="update-recurring-transfer-next-execution"
          type="date"
          value={nextExecutionDate}
          onChange={(e) => setNextExecutionDate(e.target.value)}
        />
        {fieldErrors.nextExecutionDate && <span>{fieldErrors.nextExecutionDate}</span>}
      </div>

      <div>
        <label htmlFor="update-recurring-transfer-status">Status</label>
        <select
          id="update-recurring-transfer-status"
          value={status}
          onChange={(e) => setStatus(e.target.value as RecurringOperationStatus)}
        >
          {EDITABLE_RECURRING_STATUSES.map((s) => (
            <option key={s} value={s}>
              {RECURRING_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        {fieldErrors.status && <span>{fieldErrors.status}</span>}
      </div>

      <button type="submit" disabled={isSubmitting || !amount || !description.trim() || !isScheduleValid}>
        {isSubmitting ? 'Saving…' : 'Save changes'}
      </button>
      <button type="button" onClick={onCancel} disabled={isSubmitting}>
        Cancel
      </button>
    </form>
  )
}
