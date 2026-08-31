import { useEffect, useState, type FormEvent } from 'react'
import { createAccount } from './api'
import { CURRENCIES, type Account, type Currency } from './types'
import { ApiError } from '../../../shared/api/errors'
import styles from '../MoneyTracker.module.css'

// Renders inline over AccountListPage rather than navigating to its own
// route — creating an account is a quick, single-purpose action that
// doesn't need to leave the list behind. This is the app's first modal;
// everywhere else (see LogoutControl) intentionally avoids one, so this
// isn't a default to reach for again without a similar reason.
export function CreateAccountModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: (created: Account) => void
}) {
  const [initialBalance, setInitialBalance] = useState('0')
  const [currency, setCurrency] = useState<Currency>('EUR')
  const [institution, setInstitution] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && !isSubmitting) onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isSubmitting, onClose])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setFieldErrors({})
    setIsSubmitting(true)

    try {
      const created = await createAccount({
        initialBalance: Number(initialBalance),
        currency,
        institution: institution.trim(),
      })
      onCreated(created)
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

  function handleOverlayClick() {
    if (!isSubmitting) onClose()
  }

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-account-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="create-account-title" className={styles.modalTitle}>
          New account
        </h2>

        <form onSubmit={handleSubmit}>
          {error && (
            <p className={styles.errorText} role="alert">
              {error}
            </p>
          )}

          <div className={styles.field}>
            <label htmlFor="institution">Institution</label>
            <input
              id="institution"
              name="institution"
              type="text"
              required
              autoFocus
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
            />
            {fieldErrors.institution && <span className={styles.fieldError}>{fieldErrors.institution}</span>}
          </div>

          <div className={styles.field}>
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
            {fieldErrors.initialBalance && <span className={styles.fieldError}>{fieldErrors.initialBalance}</span>}
          </div>

          <div className={styles.field}>
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
            {fieldErrors.currency && <span className={styles.fieldError}>{fieldErrors.currency}</span>}
          </div>

          <div className={styles.formActions}>
            <button type="submit" className={styles.primaryButton} disabled={isSubmitting}>
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
