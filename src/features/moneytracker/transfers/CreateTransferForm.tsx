import { useEffect, useState, type FormEvent } from 'react'
import { fetchAllAccounts } from '../accounts/api'
import type { Account } from '../accounts/types'
import { ApiError } from '../../../shared/api/errors'
import { createTransfer } from './api'
import { DateTimeField } from '../transactions/DateTimeField'
import { combineDateTime, type DateTimeValue } from '../transactions/dateTime'
import styles from '../MoneyTracker.module.css'

export function CreateTransferForm({
  sourceAccountSid,
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
  sourceAccountSid: string
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
  const [accounts, setAccounts] = useState<Account[]>([])
  const [destinationAccountSid, setDestinationAccountSid] = useState('')
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchAllAccounts()
      .then(setAccounts)
      .catch(() => {
        setAccounts([])
      })
      .finally(() => setIsLoadingAccounts(false))
  }, [])

  // A transfer can't have the same account on both sides — exclude the
  // source account from its own destination options rather than letting
  // the user pick it and hit a backend error.
  const destinationOptions = accounts.filter((account) => account.sid !== sourceAccountSid)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setFieldErrors({})
    setIsSubmitting(true)
    onSubmittingChange?.(true)
    try {
      await createTransfer({
        sourceAccountSid,
        destinationAccountSid,
        amount: Number(amount),
        description: description.trim() || undefined,
        occurredAt: combineDateTime(occurredAt),
      })
      onCreated()
    } catch (err) {
      if (err instanceof ApiError && err.problem?.invalid_params) {
        setFieldErrors(err.problem.invalid_params)
      } else {
        setError(err instanceof ApiError ? err.message : 'Failed to create transfer.')
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
        <label htmlFor="transfer-destination">To account</label>
        <select
          id="transfer-destination"
          required
          disabled={isLoadingAccounts}
          className={destinationAccountSid === '' ? styles.selectPlaceholder : ''}
          value={destinationAccountSid}
          onChange={(e) => setDestinationAccountSid(e.target.value)}
        >
          <option value="" disabled>
            {isLoadingAccounts ? 'Loading accounts…' : 'Select destination account'}
          </option>
          {destinationOptions.map((account) => (
            <option key={account.sid} value={account.sid}>
              {account.institution}
            </option>
          ))}
        </select>
        {fieldErrors.destinationAccountSid && (
          <span className={styles.fieldError}>{fieldErrors.destinationAccountSid}</span>
        )}
      </div>

      <div className={styles.field}>
        <label htmlFor="transfer-amount">Amount</label>
        <input
          id="transfer-amount"
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
        idPrefix="transfer-occurred-at"
        label="Date and time"
        date={occurredAt.date}
        time={occurredAt.time}
        onDateChange={(value) => onOccurredAtChange({ ...occurredAt, date: value })}
        onTimeChange={(value) => onOccurredAtChange({ ...occurredAt, time: value })}
        error={fieldErrors.occurredAt}
      />

      <div className={styles.field}>
        <label htmlFor="transfer-description">Description</label>
        <input
          id="transfer-description"
          type="text"
          placeholder="e.g. Monthly savings"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
        />
        {fieldErrors.description && <span className={styles.fieldError}>{fieldErrors.description}</span>}
      </div>

      <div className={styles.formActions}>
        <button
          type="submit"
          className={styles.primaryButton}
          disabled={isSubmitting || !destinationAccountSid || !amount}
        >
          {isSubmitting ? 'Creating…' : 'Create'}
        </button>
        <button type="button" className={styles.secondaryButton} onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </button>
      </div>
    </form>
  )
}
