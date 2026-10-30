import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import styles from '../MoneyTracker.module.css'

// Shared portal/positioning/focus/dismissal shell behind both
// RecurringTransactionRowMenu and RecurringTransferRowMenu — the two were
// previously near-identical copies (same hamburger trigger, same
// Update/Cancel items, same inline confirm step) differing only in which
// label/handlers they close over. Extracted once both were about to be
// upgraded to TransactionRowMenu's real popover pattern (portal, viewport
// positioning, focus management, click-outside/Escape) rather than
// duplicating that machinery a second and third time — same reasoning as
// extracting TabBar when a second ARIA tablist was about to be built.
export function RecurringRowMenu({
  isOpen,
  onOpenChange,
  triggerLabel,
  groupLabel,
  isConfirming,
  onEdit,
  editLabel,
  onRequestCancel,
  cancelLabel,
  confirmMessage,
  onConfirmCancel,
  onDismissConfirm,
  isCanceling,
}: {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  triggerLabel: string
  groupLabel: string
  isConfirming: boolean
  onEdit: () => void
  editLabel: string
  onRequestCancel: () => void
  cancelLabel: string
  confirmMessage: string
  onConfirmCancel: () => void
  onDismissConfirm: () => void
  isCanceling: boolean
}) {
  const [position, setPosition] = useState<{ y: number; right: number; openUpward: boolean } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!isOpen || !containerRef.current) return

    function recalculate() {
      if (!containerRef.current) return
      const ESTIMATED_POPOVER_HEIGHT = 120
      const GAP = 4
      const rect = containerRef.current.getBoundingClientRect()
      const openUpward = window.innerHeight - rect.bottom < ESTIMATED_POPOVER_HEIGHT

      setPosition({
        y: openUpward ? window.innerHeight - rect.top + GAP : rect.bottom + GAP,
        right: window.innerWidth - rect.right,
        openUpward,
      })
    }

    recalculate()
    window.addEventListener('scroll', recalculate, true)
    window.addEventListener('resize', recalculate)
    return () => {
      window.removeEventListener('scroll', recalculate, true)
      window.removeEventListener('resize', recalculate)
    }
  }, [isOpen, isConfirming])

  useEffect(() => {
    if (!isOpen) return

    function handlePointerDown(e: MouseEvent) {
      const target = e.target as Node
      if (containerRef.current?.contains(target)) return
      if (popoverRef.current?.contains(target)) return
      onOpenChange(false)
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onOpenChange(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onOpenChange])

  function focusPopoverOnMount(node: HTMLDivElement | null) {
    popoverRef.current = node
    if (node) {
      node.querySelector<HTMLElement>('button')?.focus()
    } else {
      triggerRef.current?.focus()
    }
  }

  return (
    <div className={styles.rowMenuContainer} ref={containerRef}>
      <button
        type="button"
        ref={triggerRef}
        className={`${styles.rowMenuTrigger} ${isOpen ? styles.rowMenuTriggerActive : ''}`}
        onClick={() => onOpenChange(!isOpen)}
        aria-expanded={isOpen}
        aria-label={triggerLabel}
      >
        ⋮
      </button>

      {isOpen &&
        position &&
        createPortal(
          <div
            ref={focusPopoverOnMount}
            role="group"
            aria-label={groupLabel}
            aria-live="polite"
            className={styles.rowMenuPopover}
            style={
              position.openUpward
                ? { bottom: position.y, right: position.right }
                : { top: position.y, right: position.right }
            }
          >
            {!isConfirming && (
              <div className={styles.rowMenuItems}>
                <button
                  type="button"
                  className={styles.rowMenuItem}
                  onClick={() => {
                    onOpenChange(false)
                    onEdit()
                  }}
                >
                  {editLabel}
                </button>
                <button type="button" className={styles.rowMenuItemDanger} onClick={onRequestCancel}>
                  {cancelLabel}
                </button>
              </div>
            )}

            {isConfirming && (
              <div className={styles.rowMenuConfirm}>
                <span>{confirmMessage}</span>
                <button
                  type="button"
                  className={styles.rowMenuConfirmYes}
                  onClick={onConfirmCancel}
                  disabled={isCanceling}
                >
                  {isCanceling ? 'Canceling…' : 'Confirm'}
                </button>
                <button
                  type="button"
                  className={styles.rowMenuConfirmNo}
                  onClick={onDismissConfirm}
                  disabled={isCanceling}
                >
                  Back
                </button>
              </div>
            )}
          </div>,
          document.body,
        )}
    </div>
  )
}
