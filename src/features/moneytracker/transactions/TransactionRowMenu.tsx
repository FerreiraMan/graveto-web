import { useEffect, useState } from 'react'
import { ApiError } from '../../../shared/api/errors'
import { deleteTransaction } from './api'
import { deleteTransfer } from '../transfers/api'
import { TransferDetails } from '../transfers/TransferDetails'
import { isTransferLeg, type Transaction } from './types'

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

  const isTransfer = isTransferLeg(transaction)

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
      onDeleted()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete.')
      setIsDeleting(false)
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => onOpenChange(!isOpen)}
        aria-expanded={isOpen}
        aria-label="Transaction actions"
      >
        ☰
      </button>

      {error && <p role="alert">{error}</p>}

      {isOpen && !isConfirmingDelete && (
        <div>
          {isTransfer && (
            <button type="button" onClick={() => setShowDetails((show) => !show)} aria-expanded={showDetails}>
              Details
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              onOpenChange(false)
              onEdit()
            }}
          >
            Update{isTransfer ? ' transfer' : ''}
          </button>
          <button type="button" onClick={() => setIsConfirmingDelete(true)}>
            Delete{isTransfer ? ' transfer' : ''}
          </button>
        </div>
      )}

      {isOpen && showDetails && transaction.correlationId && (
        <TransferDetails correlationId={transaction.correlationId} accountSid={accountSid} />
      )}

      {isConfirmingDelete && (
        <div>
          <span>Delete this {isTransfer ? 'transfer' : 'transaction'}?</span>
          <button type="button" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? 'Deleting…' : 'Confirm'}
          </button>
          <button type="button" onClick={() => onOpenChange(false)} disabled={isDeleting}>
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}
