import { useEffect, useState } from 'react'
import { isTerminalStatus } from '../recurring/types'
import { RecurringRowMenu } from '../recurring/RecurringRowMenu'
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

  const isTerminal = isTerminalStatus(recurringTransaction.status)

  useEffect(() => {
    if (!isOpen) {
      setIsConfirmingCancel(false)
    }
  }, [isOpen])

  async function handleCancel() {
    setIsCanceling(true)
    try {
      await cancelRecurringTransaction(recurringTransaction.sid)
      onCanceled()
    } catch {
      // Non-field failures already surface via the global notification toast.
      setIsCanceling(false)
    }
  }

  // Terminal (COMPLETED/CANCELED) recurring operations can't be updated or
  // canceled again server-side — no actions to offer beyond the toggle.
  if (isTerminal) {
    return null
  }

  return (
    <RecurringRowMenu
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      triggerLabel="Recurring transaction actions"
      groupLabel="Actions for this recurring transaction"
      isConfirming={isConfirmingCancel}
      onEdit={onEdit}
      editLabel="Update"
      onRequestCancel={() => setIsConfirmingCancel(true)}
      cancelLabel="Cancel"
      confirmMessage={`Cancel "${recurringTransaction.description}"?`}
      onConfirmCancel={handleCancel}
      onDismissConfirm={() => setIsConfirmingCancel(false)}
      isCanceling={isCanceling}
    />
  )
}
