import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchAllAccounts } from '../accounts/api'
import type { Account } from '../accounts/types'
import { fetchAllCategories } from './api'
import { useDebouncedValue } from '../../../shared/hooks/useDebouncedValue'
import { buildCategoryTree, type CategoryGroup } from './categoryTree'
import { CATEGORY_TRANSACTION_TYPES, type Category, type CategoryFilterRequest, TRANSACTION_TYPE_LABELS, type TransactionType } from './types'
import { ApiError } from '../../../shared/api/errors'

function CategoryDetails({ category }: { category: Category }) {
  return (
    <dl>
      <dt>Type</dt>
      <dd>{TRANSACTION_TYPE_LABELS[category.type]}</dd>
      <dt>Custom Category</dt>
      <dd>{category.isSystem ? 'No' : 'Yes'}</dd>
    </dl>
  )
}

function CategoryTreeItem({
  category,
  childGroups = [],
  isSynthetic = false,
}: {
  category: Category
  childGroups?: CategoryGroup[]
  isSynthetic?: boolean
}) {
  // Synthetic parent nodes exist only because a search matched inside them —
  // start expanded so the match is immediately visible, no extra click.
  const [expanded, setExpanded] = useState(isSynthetic)
  const hasChildren = childGroups.length > 0

  return (
    <li>
      <button type="button" onClick={() => setExpanded((current) => !current)}>
        {expanded ? '▾' : '▸'} {category.displayName}
      </button>

      {expanded && !isSynthetic && <CategoryDetails category={category} />}

      {hasChildren && expanded && (
        <ul>
          {childGroups.map((child) => (
            <CategoryTreeItem
              key={child.category.sid}
              category={child.category}
              childGroups={child.children}
              isSynthetic={child.isSynthetic}
            />
          ))}
        </ul>
      )}
    </li>
  )
}

export function CategoryListPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [selectedAccountSid, setSelectedAccountSid] = useState<string>('')
  const [selectedParentSid, setSelectedParentSid] = useState<string>('')
  const [selectedType, setSelectedType] = useState<TransactionType | ''>('')
  const [displayNameFilter, setDisplayNameFilter] = useState('')
  const debouncedDisplayNameFilter = useDebouncedValue(displayNameFilter, 200)
  const [categories, setCategories] = useState<Category[] | null>(null)
  const [parentOptions, setParentOptions] = useState<Category[]>([])
  const [error, setError] = useState<string | null>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)

  useEffect(() => {
    fetchAllAccounts()
      .then(setAccounts)
      .catch(() => {
        // Account dropdown is a convenience filter — if it fails to load, the
        // system-categories view below still works, so no user-facing error here.
      })
  }, [])

  // Parent-filter options must include every parent for the selected account,
  // even ones the current displayName/type/parentSid filters would exclude
  // from the main list — otherwise picking a parent to filter by shrinks its
  // own option list. Only fetched when one of those filters is active; with
  // no other filter active, the main list already contains every parent, so
  // no second request is needed.
  const hasOtherFilters = Boolean(selectedParentSid || selectedType || debouncedDisplayNameFilter)

  useEffect(() => {
    if (!hasOtherFilters) return

    let cancelled = false

    const filters: CategoryFilterRequest = {}
    if (selectedAccountSid) filters.accountSid = selectedAccountSid

    fetchAllCategories(filters)
      .then((result) => {
        if (!cancelled) setParentOptions(result.filter((category) => !category.parentSid))
      })
      .catch(() => {
        if (!cancelled) setParentOptions([])
      })

    return () => {
      cancelled = true
    }
  }, [selectedAccountSid, hasOtherFilters])

  // A parent belongs to exactly one account and one type. If either changes,
  // the currently selected parent filter may no longer be valid (wrong
  // account, or a type it could never match) — reset it rather than
  // silently filtering to a combination that can never return results.
  useEffect(() => {
    setSelectedParentSid('')
  }, [selectedAccountSid, selectedType])

  useEffect(() => {
    let cancelled = false
    setCategories(null)
    setError(null)

    const filters: CategoryFilterRequest = {}
    if (selectedAccountSid) filters.accountSid = selectedAccountSid
    if (selectedParentSid) filters.parentSid = selectedParentSid
    if (selectedType) filters.type = selectedType
    if (debouncedDisplayNameFilter) filters.displayName = debouncedDisplayNameFilter

    fetchAllCategories(filters)
      .then((result) => {
        if (!cancelled) setCategories(result)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Failed to load categories.')
      })

    return () => {
      cancelled = true
    }
  }, [selectedAccountSid, selectedParentSid, selectedType, debouncedDisplayNameFilter])

  const tree = categories !== null ? buildCategoryTree(categories) : null

  const parentDropdownOptions = hasOtherFilters
    ? parentOptions
    : (categories ?? []).filter((category) => !category.parentSid)

  const activeFilterCount = [selectedAccountSid, selectedParentSid, selectedType, debouncedDisplayNameFilter].filter(
    Boolean,
  ).length

  return (
    <div>
      <h1>Categories</h1>

      <Link to="/moneytracker/categories/new">Create category</Link>

      <button type="button" onClick={() => setFiltersOpen((open) => !open)} aria-expanded={filtersOpen}>
        Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
      </button>

      {filtersOpen && (
        <div>
          <label htmlFor="account-filter">Account</label>
          <select
            id="account-filter"
            value={selectedAccountSid}
            onChange={(e) => setSelectedAccountSid(e.target.value)}
          >
            <option value="">All accounts</option>
            {accounts.map((account) => (
              <option key={account.sid} value={account.sid}>
                {account.institution}
              </option>
            ))}
          </select>

          <label htmlFor="display-name-filter">Name</label>
          <input
            id="display-name-filter"
            type="text"
            value={displayNameFilter}
            onChange={(e) => setDisplayNameFilter(e.target.value)}
            placeholder="Filter by name"
          />

          <label htmlFor="parent-filter">Parent</label>
          <select
            id="parent-filter"
            value={selectedParentSid}
            onChange={(e) => setSelectedParentSid(e.target.value)}
          >
            <option value="">All parents</option>
            {parentDropdownOptions.map((category) => (
              <option key={category.sid} value={category.sid}>
                {category.displayName}
              </option>
            ))}
          </select>

          <label htmlFor="type-filter">Type</label>
          <select
            id="type-filter"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as TransactionType)}
          >
            <option value="">All types</option>
            {CATEGORY_TRANSACTION_TYPES.map((type) => (
              <option key={type} value={type}>
                {TRANSACTION_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </div>
      )}

      {error && <p role="alert">{error}</p>}

      {tree === null && !error && <p>Loading…</p>}

      {tree !== null && tree.length === 0 && <p>No categories found.</p>}

      {tree !== null && tree.length > 0 && (
        <ul>
          {tree.map((node) => (
            <CategoryTreeItem
              key={node.category.sid}
              category={node.category}
              childGroups={node.children}
              isSynthetic={node.isSynthetic}
            />
          ))}
        </ul>
      )}
    </div>
  )
}
