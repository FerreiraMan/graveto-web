import { useEffect, useRef, useState, type FormEvent } from 'react'
import { createAccount } from './api'
import { CURRENCIES, type Account, type Currency } from './types'
import { currencySymbol } from '../currency'
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
  const [initialBalance, setInitialBalance] = useState('')
  const [currency, setCurrency] = useState<Currency>('EUR')
  const [institution, setInstitution] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)

  // aria-modal="true" only tells assistive tech the background is inert —
  // it doesn't stop a sighted keyboard user's Tab key from reaching it, so
  // the trap has to be enforced here. Cycles within the panel's own
  // focusable elements rather than pulling in a dependency for something
  // this small.
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

  // Body scroll lock: the dimmed overlay only covers the viewport visually
  // — without this, wheel/trackpad/keyboard scrolling still moves the page
  // underneath it while the modal is open.
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
        ref={modalRef}
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
            <label htmlFor="institution">Account name</label>
            <input
              id="institution"
              name="institution"
              type="text"
              placeholder="e.g. Everyday spending, Revolut"
              required
              autoFocus
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
            />
            {fieldErrors.institution && <span className={styles.fieldError}>{fieldErrors.institution}</span>}
          </div>

          <div className={styles.fieldRow}>
            <div className={styles.field}>
              <label htmlFor="initialBalance">Initial balance</label>
              <input
                id="initialBalance"
                name="initialBalance"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
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
                    {c} ({currencySymbol(c)})
                  </option>
                ))}
              </select>
              {fieldErrors.currency && <span className={styles.fieldError}>{fieldErrors.currency}</span>}
            </div>
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
