import { useEffect, useRef, useState } from 'react'
import { CreateTransactionForm } from './CreateTransactionForm'
import { CreateTransferForm } from '../transfers/CreateTransferForm'
import { nowDateTime } from './dateTime'
import styles from '../MoneyTracker.module.css'

type CreateKind = 'transaction' | 'transfer'

// Shares CreateAccountModal's shell exactly (overlay, focus trap, scroll
// lock, Escape, fadeIn/modalIn) — this app's second modal instance, same
// pattern, not a new one. The type switch lives inside the modal rather
// than as a separate menu-then-form step, so opening "Create" is always
// one action with one destination.
//
// amount/description/date/time are owned here, not inside each form, and
// passed down as controlled props — switching Transaction<->Transfer only
// swaps which fields are shown (category vs destination account), it
// shouldn't discard values that apply to both and are typically the
// slower ones to re-enter (a deliberately backdated date, in particular).
// Category itself stays local to CreateTransactionForm: it's genuinely
// type-specific (transfers have none), so resetting it on switch is
// correct, not a loss.
export function CreateTransactionModal({
  accountSid,
  onClose,
  onCreated,
}: {
  accountSid: string
  onClose: () => void
  onCreated: () => void
}) {
  const [kind, setKind] = useState<CreateKind>('transaction')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [occurredAt, setOccurredAt] = useState(nowDateTime)
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
        aria-labelledby="create-transaction-title"
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="create-transaction-title" className={styles.modalTitle}>
          New entry
        </h2>

        <div className={styles.segmentedControl} role="radiogroup" aria-label="Entry type">
          <button
            type="button"
            role="radio"
            aria-checked={kind === 'transaction'}
            className={kind === 'transaction' ? styles.segmentActive : styles.segment}
            disabled={isSubmitting}
            autoFocus
            onClick={() => setKind('transaction')}
          >
            Transaction
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={kind === 'transfer'}
            className={kind === 'transfer' ? styles.segmentActive : styles.segment}
            disabled={isSubmitting}
            onClick={() => setKind('transfer')}
          >
            Transfer
          </button>
        </div>

        {kind === 'transaction' ? (
          <CreateTransactionForm
            key="transaction"
            accountSid={accountSid}
            amount={amount}
            onAmountChange={setAmount}
            description={description}
            onDescriptionChange={setDescription}
            occurredAt={occurredAt}
            onOccurredAtChange={setOccurredAt}
            onCreated={onCreated}
            onCancel={onClose}
            onSubmittingChange={setIsSubmitting}
          />
        ) : (
          <CreateTransferForm
            key="transfer"
            sourceAccountSid={accountSid}
            amount={amount}
            onAmountChange={setAmount}
            description={description}
            onDescriptionChange={setDescription}
            occurredAt={occurredAt}
            onOccurredAtChange={setOccurredAt}
            onCreated={onCreated}
            onCancel={onClose}
            onSubmittingChange={setIsSubmitting}
          />
        )}
      </div>
    </div>
  )
}
