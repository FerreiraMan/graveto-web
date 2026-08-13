import { useState } from 'react'
import type { CategoryGroup } from './categoryTree'

// Radio-list category picker, collapsed by default: top-level categories are
// listed flat, and any with children get an expand toggle to reveal them
// on demand. Avoids dumping every category (parents + children) into view
// at once, which becomes unscannable once an account has more than a
// handful of categories.
export function CategoryPicker({
  groups,
  selectedSid,
  onSelect,
  noSelectionLabel,
  name,
}: {
  groups: CategoryGroup[]
  selectedSid: string
  onSelect: (sid: string) => void
  noSelectionLabel: string
  name: string
}) {
  const [expandedSid, setExpandedSid] = useState<string | null>(null)

  return (
    <ul>
      <li>
        <label>
          <input type="radio" name={name} checked={selectedSid === ''} onChange={() => onSelect('')} />
          {noSelectionLabel}
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
                name={name}
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
                        name={name}
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
