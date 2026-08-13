import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchAllAccounts } from '../accounts/api'
import type { Account } from '../accounts/types'
import { createCategory, fetchAllCategories } from './api'
import { CategoryPicker } from './CategoryPicker'
import { groupByParent } from './categoryTree'
import { CATEGORY_TRANSACTION_TYPES, type Category, TRANSACTION_TYPE_LABELS, type TransactionType } from './types'
import { ApiError } from '../../../shared/api/errors'

export function CreateCategoryPage() {
  const navigate = useNavigate()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [accountSid, setAccountSid] = useState('')
  const [availableParents, setAvailableParents] = useState<Category[]>([])
  const [displayName, setDisplayName] = useState('')
  const [parentSid, setParentSid] = useState('')
  const [transactionType, setTransactionType] = useState<TransactionType>('EXPENSE')
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchAllAccounts()
      .then(setAccounts)
      .catch(() => {
        // Handled implicitly: account dropdown stays empty, submit disabled until one loads.
      })
  }, [])

  useEffect(() => {
    setParentSid('')

    if (!accountSid) {
      setAvailableParents([])
      return
    }

    fetchAllCategories({ accountSid, type: transactionType })
      .then(setAvailableParents)
      .catch(() => {
        setAvailableParents([])
      })
  }, [accountSid, transactionType])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setFieldErrors({})
    setIsSubmitting(true)
    try {
      await createCategory({
        name: displayName.trim(),
        accountSid,
        parentSid: parentSid || undefined,
        transactionType,
      })
      navigate('/moneytracker/categories')
    } catch (err) {
      if (err instanceof ApiError && err.problem?.invalid_params) {
        setFieldErrors(err.problem.invalid_params)
      } else {
        setError(err instanceof ApiError ? err.message : 'Failed to create category.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const parentGroups = groupByParent(availableParents)

  return (
    <form onSubmit={handleSubmit}>
      <h1>Create category</h1>

      {error && <p role="alert">{error}</p>}

      <div>
        <label htmlFor="accountSid">Account</label>
        <select id="accountSid" required value={accountSid} onChange={(e) => setAccountSid(e.target.value)}>
          <option value="" disabled>
            Select an account
          </option>
          {accounts.map((account) => (
            <option key={account.sid} value={account.sid}>
              {account.institution}
            </option>
          ))}
        </select>
        {fieldErrors.accountSid && <span>{fieldErrors.accountSid}</span>}
      </div>

      <div>
        <label htmlFor="displayName">Name</label>
        <input
          id="displayName"
          name="displayName"
          type="text"
          required
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />
        {fieldErrors.displayName && <span>{fieldErrors.displayName}</span>}
      </div>

      <div>
        <label htmlFor="transactionType">Transaction type</label>
        <select
          id="transactionType"
          value={transactionType}
          onChange={(e) => setTransactionType(e.target.value as TransactionType)}
        >
          {CATEGORY_TRANSACTION_TYPES.map((type) => (
            <option key={type} value={type}>
              {TRANSACTION_TYPE_LABELS[type]}
            </option>
          ))}
        </select>
        {fieldErrors.transactionType && <span>{fieldErrors.transactionType}</span>}
      </div>

      <fieldset disabled={!accountSid}>
        <legend>Parent category (optional)</legend>
        <CategoryPicker
          key={accountSid}
          groups={parentGroups}
          selectedSid={parentSid}
          onSelect={setParentSid}
          noSelectionLabel="No parent"
          name="parentSid"
        />
        {fieldErrors.parentSid && <span>{fieldErrors.parentSid}</span>}
      </fieldset>

      <button type="submit" disabled={isSubmitting || !accountSid}>
        {isSubmitting ? 'Creating…' : 'Create category'}
      </button>
      <button type="button" onClick={() => navigate('/moneytracker/categories')} disabled={isSubmitting}>
        Cancel
      </button>
    </form>
  )
}

