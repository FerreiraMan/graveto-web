import { useEffect, useRef, useState } from 'react'
import type { CategoryGroup } from './categoryTree'
import type { Category } from './types'
import styles from '../MoneyTracker.module.css'

function CategoryPickerNode({
  group,
  selectedSid,
  onSelect,
  isSelectable,
  name,
  defaultExpanded,
}: {
  group: CategoryGroup
  selectedSid: string
  onSelect: (sid: string) => void
  isSelectable: (category: Category) => boolean
  name: string
  defaultExpanded: boolean
}) {
  const { category, children, isSynthetic } = group
  const hasChildren = children.length > 0
  const [expanded, setExpanded] = useState(defaultExpanded)
  const selectable = isSelectable(category)
  const isSelected = selectedSid === category.sid
  const rowRef = useRef<HTMLDivElement>(null)

  // A search result is pointless if its branch stays collapsed —
  // defaultExpanded (driven by an active search query, see CategoryPicker
  // below) forces every returned branch open so results are immediately
  // visible rather than hidden behind a manual toggle.
  useEffect(() => {
    if (defaultExpanded) setExpanded(true)
  }, [defaultExpanded])

  // Keeps the chosen category in view as its own scroll target — the
  // list can run past the tree's fixed height once a branch with several
  // children is open, so without this the user has to hunt for what they
  // just picked. Centering (not just "into view") minimizes how far
  // they'd need to scroll to see siblings above and below it too. Smooth
  // scroll acknowledges the jump as caused by the selection rather than
  // reading as the list silently rearranging itself.
  useEffect(() => {
    if (isSelected) {
      rowRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }
  }, [isSelected])

  // When a branch opens, pin its parent as close to the top of the tree
  // as the scroll bounds allow — that's what leaves the most room below
  // it for the children that just appeared, rather than the browser's
  // default "nearest edge" behavior, which can leave most of the new
  // list still hidden below the fold.
  useEffect(() => {
    if (expanded) {
      rowRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' })
    }
  }, [expanded])

  return (
    <li className={styles.categoryNode}>
      <div className={styles.categoryRow} ref={rowRef}>
        {hasChildren ? (
          <button
            type="button"
            className={styles.categoryToggle}
            onClick={() => setExpanded((current) => !current)}
            aria-expanded={expanded}
            aria-label={`${expanded ? 'Collapse' : 'Expand'} ${category.displayName} subcategories`}
          >
            {expanded ? '▾' : '▸'}
          </button>
        ) : (
          <span className={styles.categoryToggleSpacer} aria-hidden="true" />
        )}
        {isSynthetic ? (
          <span className={`${styles.categoryLabel} ${styles.categoryLabelSynthetic}`}>{category.displayName}</span>
        ) : (
          <label className={styles.categoryLabel}>
            <input
              type="radio"
              name={name}
              checked={isSelected}
              disabled={!selectable}
              onChange={() => onSelect(category.sid)}
            />
            {category.displayName}
          </label>
        )}
      </div>

      {hasChildren && expanded && (
        <ul className={styles.categoryChildren}>
          {children.map((child) => (
            <CategoryPickerNode
              key={child.category.sid}
              group={child}
              selectedSid={selectedSid}
              onSelect={onSelect}
              isSelectable={isSelectable}
              name={name}
              defaultExpanded={defaultExpanded}
            />
          ))}
        </ul>
      )}
    </li>
  )
}

// Radio-list category picker, collapsed by default: top-level categories are
// listed flat, and any with children get an expand toggle to reveal them
// on demand, recursively — matches the backend's category tree, currently
// up to 3 levels deep (e.g. Transportation -> Fuel -> Diesel). Avoids
// dumping every category (all levels) into view at once, which becomes
// unscannable once an account has more than a handful of categories.
//
// isSelectable lets a caller render every category (so the tree is always
// fully browsable/visible) while disabling selection of ones that aren't
// valid for its use case — e.g. CreateCategoryPage disables categories
// already at max depth, since the backend rejects them as parents.
//
// noSelectionLabel is optional: a filter picker needs an explicit "clear
// the filter" row (e.g. "All categories"), but a required create-form
// field has no valid empty state to offer, so omitting it removes the row
// entirely rather than rendering a dead option nothing can submit with.
//
// search/onSearchChange are optional and controlled — the caller owns the
// query, debounces it, and refetches from the backend with it (same
// displayName filter CategoryListPage already uses server-side), then
// passes the already-filtered `groups` in as normal — built with
// buildCategoryTree (not groupByParent) so a match whose real parent got
// excluded by the filter still renders nested under a synthetic stand-in
// rather than vanishing. This component never filters locally, so results
// always reflect what the backend actually matched; it only reacts to a
// query being active (hides the no-selection row, auto-expands returned
// branches, shows an empty state).
export function CategoryPicker({
  groups,
  selectedSid,
  onSelect,
  noSelectionLabel,
  name,
  isSelectable = () => true,
  search,
  onSearchChange,
  isLoading = false,
}: {
  groups: CategoryGroup[]
  selectedSid: string
  onSelect: (sid: string) => void
  noSelectionLabel?: string
  name: string
  isSelectable?: (category: Category) => boolean
  search?: string
  onSearchChange?: (query: string) => void
  isLoading?: boolean
}) {
  const hasQuery = Boolean(search && search.trim() !== '')

  return (
    <div>
      {onSearchChange && (
        <input
          type="text"
          className={styles.categorySearch}
          placeholder="Search categories"
          aria-label="Search categories"
          value={search ?? ''}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      )}

      <ul className={styles.categoryTree} aria-live="polite">
        {isLoading && <li className={styles.categoryEmpty}>Loading…</li>}
        {!isLoading && noSelectionLabel && !hasQuery && (
          <li className={styles.categoryNode}>
            <div className={styles.categoryRow}>
              <span className={styles.categoryToggleSpacer} aria-hidden="true" />
              <label className={styles.categoryLabel}>
                <input type="radio" name={name} checked={selectedSid === ''} onChange={() => onSelect('')} />
                {noSelectionLabel}
              </label>
            </div>
          </li>
        )}
        {!isLoading &&
          groups.map((group) => (
            <CategoryPickerNode
              key={group.category.sid}
              group={group}
              selectedSid={selectedSid}
              onSelect={onSelect}
              isSelectable={isSelectable}
              name={name}
              defaultExpanded={hasQuery}
            />
          ))}
        {!isLoading && hasQuery && groups.length === 0 && (
          <li className={styles.categoryEmpty}>No categories match "{search?.trim()}".</li>
        )}
      </ul>
    </div>
  )
}
