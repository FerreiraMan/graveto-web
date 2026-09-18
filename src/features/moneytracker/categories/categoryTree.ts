import type { Category } from './types'

export interface CategoryGroup {
  category: Category
  children: CategoryGroup[]
  // True for a synthetic stand-in parent (see buildCategoryTree) rather
  // than a real category returned by the API — never selectable, exists
  // only to give an orphaned child somewhere labeled to nest under.
  isSynthetic?: boolean
}

// Builds a nested category tree of arbitrary depth. The backend currently
// caps categories at 3 levels (root -> level 2 -> level 3, e.g.
// Transportation -> Fuel -> Diesel), but this doesn't hardcode that limit —
// it recurses on whatever parent/child links exist in the data, so a future
// depth change on the backend doesn't require touching this again.
//
// Assumes a complete category set (the whole account's categories, or
// close to it) — any category whose parentSid isn't present in the array
// is silently dropped, since there's nowhere real to nest it. That's the
// correct behavior for a full fetch (an absent parent there means bad
// data), but wrong for a filtered subset — see buildCategoryTree, which
// reconstructs a labeled stand-in for exactly that case.
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

  function buildGroup(category: Category): CategoryGroup {
    const children = byParentSid.get(category.sid) ?? []
    return {
      category,
      children: children.map(buildGroup),
    }
  }

  return topLevel.map(buildGroup)
}

// Builds a tree for display where the input may be a filtered subset (e.g.
// a displayName search) rather than a complete category set: real
// categories nest normally via groupByParent, and any child whose real
// parent got excluded by the filter is nested under a synthetic stand-in
// parent instead of being dropped — reconstructed from parentSid /
// parentDisplayName, which the API already returns for exactly this case.
// The stand-in isn't a real, selectable category (isSynthetic: true) and
// only reconstructs one missing level — a synthetic parent's own parent,
// if also excluded, is not itself further reconstructed. A deliberately
// simple fallback for filtered views, not a full ancestor-chain rebuild.
export function buildCategoryTree(categories: Category[]): CategoryGroup[] {
  const bySid = new Map(categories.map((category) => [category.sid, category]))
  const orphans = categories.filter((category) => category.parentSid && !bySid.has(category.parentSid))
  const withoutOrphans = categories.filter((category) => !category.parentSid || bySid.has(category.parentSid))

  const realGroups = groupByParent(withoutOrphans)

  const syntheticByParentSid = new Map<string, Category[]>()
  for (const orphan of orphans) {
    const siblings = syntheticByParentSid.get(orphan.parentSid!) ?? []
    siblings.push(orphan)
    syntheticByParentSid.set(orphan.parentSid!, siblings)
  }

  const syntheticGroups: CategoryGroup[] = [...syntheticByParentSid.entries()].map(([parentSid, children]) => ({
    category: {
      sid: parentSid,
      displayName: children[0].parentDisplayName ?? 'Unknown',
      accountSid: children[0].accountSid,
      type: children[0].type,
      isSystem: children[0].isSystem,
    },
    children: children.map((child) => ({ category: child, children: [] })),
    isSynthetic: true,
  }))

  return [...realGroups, ...syntheticGroups]
}

// A category can be a parent for a new category only if it isn't already
// at the backend's max depth (currently 3 levels: root -> level 2 -> level
// 3). Mirrors CategoryServiceImpl's check server-side
// (parent.getParent() != null && parent.getParent().getParent() != null)
// so the picker can disable those options instead of letting the user
// submit and get rejected with a 422.
export function isEligibleParent(category: Category, categories: Category[]): boolean {
  const bySid = new Map(categories.map((c) => [c.sid, c]))

  let current: Category | undefined = category
  let depth = 0
  while (current?.parentSid) {
    depth++
    current = bySid.get(current.parentSid)
  }

  // depth counts how many ancestors the category already has: 0 = root,
  // 1 = level 2, 2 = level 3 (max). A level-3 category can't be a parent.
  return depth < 2
}
