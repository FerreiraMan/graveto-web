import { useEffect, useRef, useState } from 'react'
import { UpdateRecurringTransferForm } from './UpdateRecurringTransferForm'
import type { RecurringTransfer } from './types'
import styles from '../MoneyTracker.module.css'

// Shares CreateRecurringTransferModal/CreateAccountModal's shell exactly
// (overlay, focus trap, scroll lock, Escape, fadeIn/modalIn) — same
// pattern as every other create/update flow in the app. Previously
// rendered inline above the table inside RecurringOperationsPanel;
// moved to a modal for the same reason as UpdateTransactionModal/
// UpdateRecurringTransactionModal.
export function UpdateRecurringTransferModal({
  recurringTransfer,
  onClose,
  onUpdated,
}: {
  recurringTransfer: RecurringTransfer
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
        aria-labelledby="update-recurring-transfer-title"
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="update-recurring-transfer-title" className={styles.modalTitle}>
          Update recurring transfer
        </h2>

        <UpdateRecurringTransferForm
          recurringTransfer={recurringTransfer}
          onUpdated={onUpdated}
          onCancel={onClose}
          onSubmittingChange={setIsSubmitting}
        />
      </div>
    </div>
  )
}
