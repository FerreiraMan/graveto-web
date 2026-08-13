import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchAllAccounts } from '../accounts/api'
import type { Account } from '../accounts/types'
import { fetchAllCategories } from './api'
import { groupByParent } from './categoryTree'
import { CATEGORY_TRANSACTION_TYPES, type Category, type CategoryFilterRequest, type TransactionType } from './types'
import { ApiError } from '../../../shared/api/errors'

interface CategoryNode {
  category: Category
  childCategories: Category[]
  isSynthetic: boolean
}

// Builds a two-level tree for display: real top-level categories (grouped
// via the shared groupByParent helper) plus synthetic stand-in parents for
// any child whose real parent got excluded by an active filter.
//
// When a filter (e.g. displayName search) matches a child but excludes its
// parent, the parent is missing from the result set. Rather than dropping
// the child or showing it as a bare top-level item, a synthetic parent node
// is created from parentSid/parentDisplayName so the child still renders
// nested under a labeled, expandable parent — same shape the user expects
// when browsing unfiltered. The API already returns categories in
// alphabetical order by displayName, so no re-sorting is done here —
// insertion order is preserved.
function buildCategoryTree(categories: Category[]): CategoryNode[] {
  const bySid = new Map(categories.map((category) => [category.sid, category]))
  const orphans = categories.filter((category) => category.parentSid && !bySid.has(category.parentSid))
  const withoutOrphans = categories.filter((category) => !category.parentSid || bySid.has(category.parentSid))

  const realNodes: CategoryNode[] = groupByParent(withoutOrphans).map(({ category, childCategories }) => ({
    category,
    childCategories,
    isSynthetic: false,
  }))

  const syntheticByParentSid = new Map<string, Category[]>()
  for (const orphan of orphans) {
    const siblings = syntheticByParentSid.get(orphan.parentSid!) ?? []
    siblings.push(orphan)
    syntheticByParentSid.set(orphan.parentSid!, siblings)
  }

  const syntheticNodes: CategoryNode[] = [...syntheticByParentSid.entries()].map(([parentSid, children]) => ({
    category: {
      sid: parentSid,
      displayName: children[0].parentDisplayName ?? 'Unknown',
      accountSid: children[0].accountSid,
      type: children[0].type,
      isSystem: children[0].isSystem,
    },
    childCategories: children,
    isSynthetic: true,
  }))

  return [...realNodes, ...syntheticNodes]
}

function CategoryDetails({ category }: { category: Category }) {
  return (
    <dl>
      <dt>Type</dt>
      <dd>{category.type}</dd>
      <dt>Custom Category</dt>
      <dd>{category.isSystem ? 'No' : 'Yes'}</dd>
    </dl>
  )
}

function CategoryTreeItem({
  category,
  childCategories = [],
  isSynthetic = false,
}: {
  category: Category
  childCategories?: Category[]
  isSynthetic?: boolean
}) {
  // Synthetic parent nodes exist only because a search matched inside them —
  // start expanded so the match is immediately visible, no extra click.
  const [expanded, setExpanded] = useState(isSynthetic)
  const hasChildren = childCategories.length > 0

  return (
    <li>
      <button type="button" onClick={() => setExpanded((current) => !current)}>
        {expanded ? '▾' : '▸'} {category.displayName}
      </button>

      {expanded && !isSynthetic && <CategoryDetails category={category} />}

      {hasChildren && expanded && (
        <ul>
          {childCategories.map((child) => (
            <CategoryTreeItem key={child.sid} category={child} />
          ))}
        </ul>
      )}
    </li>
  )
}

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
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

  return (
    <div>
      <h1>Categories</h1>

      <Link to="/moneytracker/categories/new">Create category</Link>

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
              {type}
            </option>
          ))}
        </select>
      </div>

      {error && <p role="alert">{error}</p>}

      {tree === null && !error && <p>Loading…</p>}

      {tree !== null && tree.length === 0 && <p>No categories found.</p>}

      {tree !== null && tree.length > 0 && (
        <ul>
          {tree.map((node) => (
            <CategoryTreeItem
              key={node.category.sid}
              category={node.category}
              childCategories={node.childCategories}
              isSynthetic={node.isSynthetic}
            />
          ))}
        </ul>
      )}
    </div>
  )
}
