import { useEffect, useState, type FormEvent } from 'react'
import { fetchAllAccounts } from '../accounts/api'
import type { Account } from '../accounts/types'
import { ApiError } from '../../../shared/api/errors'
import { requiresDayOfMonth, requiresDayOfWeek, type Frequency } from '../recurring/types'
import { ScheduleFields } from '../recurring/ScheduleFields'
import { createRecurringTransfer } from './api'

export function CreateRecurringTransferForm({
  sourceAccountSid,
  onCreated,
  onCancel,
}: {
  sourceAccountSid: string
  onCreated: () => void
  onCancel: () => void
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

  return (
    <form onSubmit={handleSubmit}>
      <h3>Create recurring transfer</h3>

      {error && <p role="alert">{error}</p>}

      <div>
        <label htmlFor="recurring-transfer-destination">To account</label>
        <select
          id="recurring-transfer-destination"
          required
          value={destinationAccountSid}
          onChange={(e) => setDestinationAccountSid(e.target.value)}
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
        {fieldErrors.destinationAccountSid && <span>{fieldErrors.destinationAccountSid}</span>}
      </div>

      <div>
        <label htmlFor="recurring-transfer-description">Description</label>
        <input
          id="recurring-transfer-description"
          type="text"
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        {fieldErrors.description && <span>{fieldErrors.description}</span>}
      </div>

      <div>
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
        {fieldErrors.amount && <span>{fieldErrors.amount}</span>}
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

      <div>
        <label htmlFor="recurring-transfer-start-date">Start date (optional)</label>
        <input
          id="recurring-transfer-start-date"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
        {fieldErrors.startDate && <span>{fieldErrors.startDate}</span>}
      </div>

      <button
        type="submit"
        disabled={isSubmitting || !destinationAccountSid || !amount || !description.trim() || !isScheduleValid}
      >
        {isSubmitting ? 'Creating…' : 'Create recurring transfer'}
      </button>
      <button type="button" onClick={onCancel} disabled={isSubmitting}>
        Cancel
      </button>
    </form>
  )
}
