import { useEffect, useState, type FormEvent } from 'react'
import { fetchAllAccounts } from '../accounts/api'
import type { Account } from '../accounts/types'
import { ApiError } from '../../../shared/api/errors'
import { createTransfer } from './api'

export function CreateTransferForm({
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
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [occurredAt, setOccurredAt] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchAllAccounts()
      .then(setAccounts)
      .catch(() => {
        setAccounts([])
      })
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
    try {
      await createTransfer({
        sourceAccountSid,
        destinationAccountSid,
        amount: Number(amount),
        description: description.trim() || undefined,
        occurredAt: occurredAt || undefined,
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
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h3>Create transfer</h3>

      {error && <p role="alert">{error}</p>}

      <div>
        <label htmlFor="transfer-destination">To account</label>
        <select
          id="transfer-destination"
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
        <label htmlFor="transfer-amount">Amount</label>
        <input
          id="transfer-amount"
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
        <label htmlFor="transfer-description">Description</label>
        <input
          id="transfer-description"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        {fieldErrors.description && <span>{fieldErrors.description}</span>}
      </div>

      <div>
        <label htmlFor="transfer-occurred-at">Date and time</label>
        <input
          id="transfer-occurred-at"
          type="datetime-local"
          value={occurredAt}
          onChange={(e) => setOccurredAt(e.target.value)}
        />
        {fieldErrors.occurredAt && <span>{fieldErrors.occurredAt}</span>}
      </div>

      <button type="submit" disabled={isSubmitting || !destinationAccountSid || !amount}>
        {isSubmitting ? 'Creating…' : 'Create transfer'}
      </button>
      <button type="button" onClick={onCancel} disabled={isSubmitting}>
        Cancel
      </button>
    </form>
  )
}
