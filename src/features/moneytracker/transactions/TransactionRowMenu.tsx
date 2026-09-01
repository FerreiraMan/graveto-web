import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ApiError } from '../../../shared/api/errors'
import { deleteTransaction } from './api'
import { deleteTransfer } from '../transfers/api'
import { TransferDetails } from '../transfers/TransferDetails'
import { currencySymbol } from '../currency'
import { formatAmount, isTransferLeg, type Transaction } from './types'
import styles from '../MoneyTracker.module.css'

export function TransactionRowMenu({
  transaction,
  accountSid,
  isOpen,
  onOpenChange,
  onEdit,
  onDeleted,
}: {
  transaction: Transaction
  accountSid: string
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  onEdit: () => void
  onDeleted: () => void
}) {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [position, setPosition] = useState<{ y: number; right: number; openUpward: boolean } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  const isTransfer = isTransferLeg(transaction)

  // The popover is rendered through a portal (see the return statement)
  // specifically so it can escape the table's scroll container — anything
  // positioned inside .tableScroll gets clipped by its overflow, no matter
  // how the popover is placed within its own row. Position is computed in
  // viewport coordinates from the trigger's own rect, recalculated on open
  // and whenever the popover's own content changes height (showDetails)
  // or the page scrolls/resizes under it.
  useEffect(() => {
    if (!isOpen || !containerRef.current) return

    function recalculate() {
      if (!containerRef.current) return
      const ESTIMATED_POPOVER_HEIGHT = 160
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
  }, [isOpen, showDetails])

  // Whenever this row's menu closes — whether the user closed it directly,
  // or another row's menu was opened instead — its sub-state (confirm
  // prompt, details, any stale error) should reset, so reopening always
  // starts from the default top-level view.
  useEffect(() => {
    if (!isOpen) {
      setIsConfirmingDelete(false)
      setShowDetails(false)
      setError(null)
    }
  }, [isOpen])

  // Moves focus into the popover on open and back to the trigger on every
  // close path — without this, a keyboard user who opens the menu has no
  // way to actually reach its items, since the popover is portaled to the
  // end of the document and isn't next in tab order from the trigger. Uses
  // a callback ref instead of an effect keyed on `isOpen`/`position`,
  // since the popover is a real mount/unmount (not a hide/show) each time
  // it opens and closes — the callback fires with the node on mount and
  // with `null` on unmount, exactly once per open, regardless of how many
  // times `position` itself is recalculated while it's open (scroll,
  // resize, showDetails).
  function focusPopoverOnMount(node: HTMLDivElement | null) {
    popoverRef.current = node
    if (node) {
      node.querySelector<HTMLElement>('button')?.focus()
    } else {
      triggerRef.current?.focus()
    }
  }

  // Click-outside and Escape both close the popover — it's a lightweight
  // floating menu, not a modal, so no focus trap or scroll lock: just the
  // two dismissal paths a popover is expected to support. Checks both refs
  // since the popover renders through a portal — it's not a DOM descendant
  // of the trigger/container anymore, so containerRef alone would treat
  // every click inside the popover as "outside" and close it immediately.
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

  async function handleDelete() {
    setIsDeleting(true)
    setError(null)
    try {
      // Transfer-linked transactions are rejected by the transaction delete
      // endpoint — the backend requires deleting the transfer as a whole via
      // its own correlationId, which removes both legs together.
      if (isTransfer && transaction.correlationId) {
        await deleteTransfer(transaction.correlationId)
      } else {
        await deleteTransaction(transaction.sid)
      }
      onOpenChange(false)
      onDeleted()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete.')
      setIsDeleting(false)
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
        aria-label="Transaction actions"
      >
        ⋮
      </button>

      {isOpen &&
        position &&
        createPortal(
          <div
            ref={focusPopoverOnMount}
            role="group"
            aria-label="Actions for this transaction"
            className={styles.rowMenuPopover}
            style={
              position.openUpward
                ? { bottom: position.y, right: position.right }
                : { top: position.y, right: position.right }
            }
          >
            {error && (
              <p className={styles.errorText} role="alert">
                {error}
              </p>
            )}

            {!isConfirmingDelete && (
              <div className={styles.rowMenuItems}>
                {isTransfer && (
                  <button
                    type="button"
                    className={styles.rowMenuItem}
                    onClick={() => setShowDetails((show) => !show)}
                    aria-expanded={showDetails}
                  >
                    Details
                  </button>
                )}
                <button
                  type="button"
                  className={styles.rowMenuItem}
                  onClick={() => {
                    onOpenChange(false)
                    onEdit()
                  }}
                >
                  Update{isTransfer ? ' transfer' : ''}
                </button>
                <button
                  type="button"
                  className={styles.rowMenuItemDanger}
                  onClick={() => setIsConfirmingDelete(true)}
                >
                  Delete{isTransfer ? ' transfer' : ''}
                </button>
              </div>
            )}

            {showDetails && transaction.correlationId && (
              <TransferDetails correlationId={transaction.correlationId} accountSid={accountSid} />
            )}

            {isConfirmingDelete && (
              <div className={styles.rowMenuConfirm}>
                <span>
                  Delete {formatAmount(transaction.amount)} {currencySymbol(transaction.currency)}
                  {transaction.description ? ` · ${transaction.description}` : ''} ·{' '}
                  {transaction.occurredAt.slice(0, 10)}?
                </span>
                <button
                  type="button"
                  className={styles.rowMenuConfirmYes}
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting…' : 'Delete'}
                </button>
                <button
                  type="button"
                  className={styles.rowMenuConfirmNo}
                  onClick={() => setIsConfirmingDelete(false)}
                  disabled={isDeleting}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>,
          document.body,
        )}
    </div>
  )
}
