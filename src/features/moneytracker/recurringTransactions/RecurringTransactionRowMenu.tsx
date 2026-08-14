import { useEffect, useState } from 'react'
import { ApiError } from '../../../shared/api/errors'
import { isTerminalStatus } from '../recurring/types'
import { cancelRecurringTransaction } from './api'
import type { RecurringTransaction } from './types'

export function RecurringTransactionRowMenu({
  recurringTransaction,
  isOpen,
  onOpenChange,
  onEdit,
  onCanceled,
}: {
  recurringTransaction: RecurringTransaction
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  onEdit: () => void
  onCanceled: () => void
}) {
  const [isConfirmingCancel, setIsConfirmingCancel] = useState(false)
  const [isCanceling, setIsCanceling] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isTerminal = isTerminalStatus(recurringTransaction.status)

  useEffect(() => {
    if (!isOpen) {
      setIsConfirmingCancel(false)
      setError(null)
    }
  }, [isOpen])

  async function handleCancel() {
    setIsCanceling(true)
    setError(null)
    try {
      await cancelRecurringTransaction(recurringTransaction.sid)
      onCanceled()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to cancel.')
      setIsCanceling(false)
    }
  }

  // Terminal (COMPLETED/CANCELED) recurring operations can't be updated or
  // canceled again server-side — no actions to offer beyond the toggle.
  if (isTerminal) {
    return null
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => onOpenChange(!isOpen)}
        aria-expanded={isOpen}
        aria-label="Recurring transaction actions"
      >
        ☰
      </button>

      {error && <p role="alert">{error}</p>}

      {isOpen && !isConfirmingCancel && (
        <div>
          <button
            type="button"
            onClick={() => {
              onOpenChange(false)
              onEdit()
            }}
          >
            Update
          </button>
          <button type="button" onClick={() => setIsConfirmingCancel(true)}>
            Cancel
          </button>
        </div>
      )}

      {isConfirmingCancel && (
        <div>
          <span>Cancel this recurring transaction?</span>
          <button type="button" onClick={handleCancel} disabled={isCanceling}>
            {isCanceling ? 'Canceling…' : 'Confirm'}
          </button>
          <button type="button" onClick={() => onOpenChange(false)} disabled={isCanceling}>
            Back
          </button>
        </div>
      )}
    </div>
  )
}
