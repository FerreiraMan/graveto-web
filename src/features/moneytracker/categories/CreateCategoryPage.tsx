import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchAllAccounts } from '../accounts/api'
import type { Account } from '../accounts/types'
import { createCategory, fetchAllCategories } from './api'
import { groupByParent, type CategoryGroup } from './categoryTree'
import { CATEGORY_TRANSACTION_TYPES, type Category, type TransactionType } from './types'
import { ApiError } from '../../../shared/api/errors'

function ParentPicker({
  groups,
  selectedSid,
  onSelect,
}: {
  groups: CategoryGroup[]
  selectedSid: string
  onSelect: (sid: string) => void
}) {
  const [expandedSid, setExpandedSid] = useState<string | null>(null)

  return (
    <ul>
      <li>
        <label>
          <input type="radio" name="parentSid" checked={selectedSid === ''} onChange={() => onSelect('')} />
          No parent
        </label>
      </li>
      {groups.map(({ category, childCategories }) => {
        const hasChildren = childCategories.length > 0
        const expanded = expandedSid === category.sid

        return (
          <li key={category.sid}>
            <label>
              <input
                type="radio"
                name="parentSid"
                checked={selectedSid === category.sid}
                onChange={() => onSelect(category.sid)}
              />
              {category.displayName}
            </label>
            {hasChildren && (
              <button
                type="button"
                onClick={() => setExpandedSid(expanded ? null : category.sid)}
                aria-label={`${expanded ? 'Collapse' : 'Expand'} ${category.displayName} subcategories`}
              >
                {expanded ? '▾' : '▸'}
              </button>
            )}

            {hasChildren && expanded && (
              <ul>
                {childCategories.map((child) => (
                  <li key={child.sid}>
                    <label>
                      <input
                        type="radio"
                        name="parentSid"
                        checked={selectedSid === child.sid}
                        onChange={() => onSelect(child.sid)}
                      />
                      {child.displayName}
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </li>
        )
      })}
    </ul>
  )
}

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
              {type}
            </option>
          ))}
        </select>
        {fieldErrors.transactionType && <span>{fieldErrors.transactionType}</span>}
      </div>

      <fieldset disabled={!accountSid}>
        <legend>Parent category (optional)</legend>
        <ParentPicker groups={parentGroups} selectedSid={parentSid} onSelect={setParentSid} />
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

