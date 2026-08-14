import { useEffect, useState } from 'react'
import { ApiError } from '../../../shared/api/errors'
import { isTerminalStatus } from '../recurring/types'
import { cancelRecurringTransfer } from './api'
import type { RecurringTransfer } from './types'

export function RecurringTransferRowMenu({
  recurringTransfer,
  isOpen,
  onOpenChange,
  onEdit,
  onCanceled,
}: {
  recurringTransfer: RecurringTransfer
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  onEdit: () => void
  onCanceled: () => void
}) {
  const [isConfirmingCancel, setIsConfirmingCancel] = useState(false)
  const [isCanceling, setIsCanceling] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isTerminal = isTerminalStatus(recurringTransfer.status)

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
      await cancelRecurringTransfer(recurringTransfer.sid)
      onCanceled()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to cancel.')
      setIsCanceling(false)
    }
  }

  if (isTerminal) {
    return null
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => onOpenChange(!isOpen)}
        aria-expanded={isOpen}
        aria-label="Recurring transfer actions"
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
          <span>Cancel this recurring transfer?</span>
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
