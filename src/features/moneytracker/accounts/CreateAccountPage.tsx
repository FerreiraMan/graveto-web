import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { createAccount } from './api'
import { CURRENCIES, type Currency } from './types'
import { ApiError } from '../../../shared/api/errors'

export function CreateAccountPage() {
  const navigate = useNavigate()
  const [initialBalance, setInitialBalance] = useState('0')
  const [currency, setCurrency] = useState<Currency>('EUR')
  const [institution, setInstitution] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setFieldErrors({})
    setIsSubmitting(true)

    try {
      await createAccount({
        initialBalance: Number(initialBalance),
        currency,
        institution: institution.trim(),
      })
      navigate('/moneytracker')
    } catch (err) {
      if (err instanceof ApiError && err.problem?.invalid_params) {
        setFieldErrors(err.problem.invalid_params)
      } else {
        setError(err instanceof ApiError ? err.message : 'Failed to create account.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1>Create account</h1>

      {error && <p role="alert">{error}</p>}

      <div>
        <label htmlFor="institution">Institution</label>
        <input
          id="institution"
          name="institution"
          type="text"
          required
          value={institution}
          onChange={(e) => setInstitution(e.target.value)}
        />
        {fieldErrors.institution && <span>{fieldErrors.institution}</span>}
      </div>

      <div>
        <label htmlFor="initialBalance">Initial balance</label>
        <input
          id="initialBalance"
          name="initialBalance"
          type="number"
          min="0"
          step="0.01"
          required
          value={initialBalance}
          onChange={(e) => setInitialBalance(e.target.value)}
        />
        {fieldErrors.initialBalance && <span>{fieldErrors.initialBalance}</span>}
      </div>

      <div>
        <label htmlFor="currency">Currency</label>
        <select
          id="currency"
          name="currency"
          value={currency}
          onChange={(e) => setCurrency(e.target.value as Currency)}
        >
          {CURRENCIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        {fieldErrors.currency && <span>{fieldErrors.currency}</span>}
      </div>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creating…' : 'Create account'}
      </button>
      <button type="button" onClick={() => navigate('/moneytracker')} disabled={isSubmitting}>
        Cancel
      </button>
    </form>
  )
}
