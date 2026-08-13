import { useState, type FormEvent } from 'react'
import { ApiError } from '../../../shared/api/errors'
import { updateTransfer } from './api'
import type { Transaction } from '../transactions/types'

// datetime-local inputs need "YYYY-MM-DDTHH:mm" — occurredAt from the API is
// ISO_LOCAL_DATE_TIME ("YYYY-MM-DDTHH:mm:ss"), so trim any seconds/nanos.
function toDateTimeLocal(occurredAt: string): string {
  return occurredAt.slice(0, 16)
}

export function UpdateTransferForm({
  transaction,
  onUpdated,
  onCancel,
}: {
  transaction: Transaction
  onUpdated: () => void
  onCancel: () => void
}) {
  const [amount, setAmount] = useState(String(transaction.amount))
  const [description, setDescription] = useState(transaction.description ?? '')
  const [occurredAt, setOccurredAt] = useState(toDateTimeLocal(transaction.occurredAt))
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setFieldErrors({})
    setIsSubmitting(true)
    try {
      // transaction.correlationId is guaranteed set here — this form only
      // renders for transfer-linked transactions.
      await updateTransfer(transaction.correlationId!, {
        amount: Number(amount),
        description: description.trim() || undefined,
        occurredAt,
      })
      onUpdated()
    } catch (err) {
      if (err instanceof ApiError && err.problem?.invalid_params) {
        setFieldErrors(err.problem.invalid_params)
      } else {
        setError(err instanceof ApiError ? err.message : 'Failed to update transfer.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h3>Update transfer</h3>

      {error && <p role="alert">{error}</p>}

      <div>
        <label htmlFor="update-transfer-amount">Amount</label>
        <input
          id="update-transfer-amount"
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
        <label htmlFor="update-transfer-description">Description</label>
        <input
          id="update-transfer-description"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        {fieldErrors.description && <span>{fieldErrors.description}</span>}
      </div>

      <div>
        <label htmlFor="update-transfer-occurred-at">Date and time</label>
        <input
          id="update-transfer-occurred-at"
          type="datetime-local"
          value={occurredAt}
          onChange={(e) => setOccurredAt(e.target.value)}
        />
        {fieldErrors.occurredAt && <span>{fieldErrors.occurredAt}</span>}
      </div>

      <button type="submit" disabled={isSubmitting || !amount}>
        {isSubmitting ? 'Saving…' : 'Save changes'}
      </button>
      <button type="button" onClick={onCancel} disabled={isSubmitting}>
        Cancel
      </button>
    </form>
  )
}
