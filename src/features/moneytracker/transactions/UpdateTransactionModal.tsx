import { useEffect, useRef, useState } from 'react'
import { UpdateTransactionForm } from './UpdateTransactionForm'
import type { Transaction } from './types'
import styles from '../MoneyTracker.module.css'

// Shares CreateTransactionModal/CreateAccountModal's shell exactly
// (overlay, focus trap, scroll lock, Escape, fadeIn/modalIn) — same
// pattern as every other create/update flow in the app. Previously
// rendered inline in place of the row inside AccountTransactionsPanel;
// moved to a modal once the form grew to full parity with Create's field
// set (category search included) and started crowding the table itself.
export function UpdateTransactionModal({
  transaction,
  onClose,
  onUpdated,
}: {
  transaction: Transaction
  onClose: () => void
  onUpdated: () => void
}) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Tab' || !modalRef.current) return

      const focusable = modalRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )
      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && !isSubmitting) onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isSubmitting, onClose])

  function handleOverlayClick() {
    if (!isSubmitting) onClose()
  }

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="update-transaction-title"
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="update-transaction-title" className={styles.modalTitle}>
          Update transaction
        </h2>

        <UpdateTransactionForm
          transaction={transaction}
          onUpdated={onUpdated}
          onCancel={onClose}
          onSubmittingChange={setIsSubmitting}
        />
      </div>
    </div>
  )
}
