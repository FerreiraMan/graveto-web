import { useEffect, useState, type FormEvent } from 'react'
import { fetchAllCategories } from '../categories/api'
import { CategoryPicker } from '../categories/CategoryPicker'
import { groupByParent } from '../categories/categoryTree'
import { CATEGORY_TRANSACTION_TYPES, TRANSACTION_TYPE_LABELS, type Category, type TransactionType } from '../categories/types'
import { ApiError } from '../../../shared/api/errors'
import { requiresDayOfMonth, requiresDayOfWeek, type Frequency } from '../recurring/types'
import { ScheduleFields } from '../recurring/ScheduleFields'
import { createRecurringTransaction } from './api'

export function CreateRecurringTransactionForm({
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

  return (
    <form onSubmit={handleSubmit}>
      <h3>Create recurring transaction</h3>

      {error && <p role="alert">{error}</p>}

      <div>
        <label htmlFor="recurring-transaction-type">Type</label>
        <select
          id="recurring-transaction-type"
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
          name="recurring-transaction-category"
        />
        {fieldErrors.categorySid && <span>{fieldErrors.categorySid}</span>}
      </fieldset>

      <div>
        <label htmlFor="recurring-transaction-description">Description</label>
        <input
          id="recurring-transaction-description"
          type="text"
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        {fieldErrors.description && <span>{fieldErrors.description}</span>}
      </div>

      <div>
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
        {fieldErrors.amount && <span>{fieldErrors.amount}</span>}
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

      <div>
        <label htmlFor="recurring-transaction-start-date">Start date (optional)</label>
        <input
          id="recurring-transaction-start-date"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
        {fieldErrors.startDate && <span>{fieldErrors.startDate}</span>}
      </div>

      <button type="submit" disabled={isSubmitting || !categorySid || !amount || !description.trim() || !isScheduleValid}>
        {isSubmitting ? 'Creating…' : 'Create recurring transaction'}
      </button>
      <button type="button" onClick={onCancel} disabled={isSubmitting}>
        Cancel
      </button>
    </form>
  )
}
