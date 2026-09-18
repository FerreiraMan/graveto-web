import { useRef, type KeyboardEvent, type ReactNode } from 'react'
import styles from '../MoneyTracker.module.css'

export interface TabBarItem<T extends string> {
  id: T
  label: string
}

// Shared WAI-ARIA Tabs implementation (tablist/tab, aria-selected,
// aria-controls, roving tabindex + arrow-key navigation) — extracted so
// every nested tab bar (account-level, and now Overview's Cash flow /
// Category breakdown sub-tabs) gets the same underline styling and the
// same keyboard behavior from one place, rather than re-implementing the
// same ARIA/keyboard logic per call site.
export function TabBar<T extends string>({
  idPrefix,
  label,
  tabs,
  activeTab,
  onTabChange,
}: {
  idPrefix: string
  label: string
  tabs: TabBarItem<T>[]
  activeTab: T
  onTabChange: (tab: T) => void
}) {
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  function handleKeyDown(event: KeyboardEvent, index: number) {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return
    event.preventDefault()
    const nextIndex = event.key === 'ArrowRight' ? (index + 1) % tabs.length : (index - 1 + tabs.length) % tabs.length
    const nextTab = tabs[nextIndex]
    onTabChange(nextTab.id)
    tabRefs.current[nextTab.id]?.focus()
  }

  return (
    <div className={styles.accountTabs} role="tablist" aria-label={label}>
      {tabs.map((tab, index) => (
        <button
          key={tab.id}
          ref={(el) => {
            tabRefs.current[tab.id] = el
          }}
          type="button"
          role="tab"
          id={`${idPrefix}-tab-${tab.id}`}
          aria-selected={activeTab === tab.id}
          aria-controls={`${idPrefix}-tabpanel-${tab.id}`}
          tabIndex={activeTab === tab.id ? 0 : -1}
          className={`${styles.accountTab} ${activeTab === tab.id ? styles.accountTabActive : ''}`}
          onClick={() => onTabChange(tab.id)}
          onKeyDown={(e) => handleKeyDown(e, index)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

// Wraps a tab's content region as a proper tabpanel — kept mounted (via
// `hidden`) rather than conditionally rendered, so aria-controls always
// points at a real element; the heavier children inside still only
// render while active, so no wasted fetches for an inactive tab.
export function TabPanel({
  idPrefix,
  tabId,
  isActive,
  children,
}: {
  idPrefix: string
  tabId: string
  isActive: boolean
  children: ReactNode
}) {
  return (
    <div id={`${idPrefix}-tabpanel-${tabId}`} role="tabpanel" aria-labelledby={`${idPrefix}-tab-${tabId}`} hidden={!isActive}>
      {isActive && children}
    </div>
  )
}
