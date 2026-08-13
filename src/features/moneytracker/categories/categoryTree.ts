import type { Category } from './types'

export interface CategoryGroup {
  category: Category
  childCategories: Category[]
}

// Groups a flat category list into a two-level structure: top-level
// categories (no parentSid) with their direct children nested beneath.
// The domain enforces max depth of 2 — a child is never itself a valid
// parent — so no recursion is needed here.
export function groupByParent(categories: Category[]): CategoryGroup[] {
  const byParentSid = new Map<string, Category[]>()
  const topLevel: Category[] = []

  for (const category of categories) {
    if (category.parentSid) {
      const siblings = byParentSid.get(category.parentSid) ?? []
      siblings.push(category)
      byParentSid.set(category.parentSid, siblings)
    } else {
      topLevel.push(category)
    }
  }

  return topLevel.map((category) => ({
    category,
    childCategories: byParentSid.get(category.sid) ?? [],
  }))
}
