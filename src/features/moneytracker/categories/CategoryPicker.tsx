import { useState } from 'react'
import type { CategoryGroup } from './categoryTree'
import type { Category } from './types'

function CategoryPickerNode({
  group,
  selectedSid,
  onSelect,
  isSelectable,
  name,
}: {
  group: CategoryGroup
  selectedSid: string
  onSelect: (sid: string) => void
  isSelectable: (category: Category) => boolean
  name: string
}) {
  const { category, children } = group
  const hasChildren = children.length > 0
  const [expanded, setExpanded] = useState(false)
  const selectable = isSelectable(category)

  return (
    <li>
      <label>
        <input
          type="radio"
          name={name}
          checked={selectedSid === category.sid}
          disabled={!selectable}
          onChange={() => onSelect(category.sid)}
        />
        {category.displayName}
      </label>
      {hasChildren && (
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          aria-label={`${expanded ? 'Collapse' : 'Expand'} ${category.displayName} subcategories`}
        >
          {expanded ? '▾' : '▸'}
        </button>
      )}

      {hasChildren && expanded && (
        <ul>
          {children.map((child) => (
            <CategoryPickerNode
              key={child.category.sid}
              group={child}
              selectedSid={selectedSid}
              onSelect={onSelect}
              isSelectable={isSelectable}
              name={name}
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
export function CategoryPicker({
  groups,
  selectedSid,
  onSelect,
  noSelectionLabel,
  name,
  isSelectable = () => true,
}: {
  groups: CategoryGroup[]
  selectedSid: string
  onSelect: (sid: string) => void
  noSelectionLabel: string
  name: string
  isSelectable?: (category: Category) => boolean
}) {
  return (
    <ul>
      <li>
        <label>
          <input type="radio" name={name} checked={selectedSid === ''} onChange={() => onSelect('')} />
          {noSelectionLabel}
        </label>
      </li>
      {groups.map((group) => (
        <CategoryPickerNode
          key={group.category.sid}
          group={group}
          selectedSid={selectedSid}
          onSelect={onSelect}
          isSelectable={isSelectable}
          name={name}
        />
      ))}
    </ul>
  )
}
