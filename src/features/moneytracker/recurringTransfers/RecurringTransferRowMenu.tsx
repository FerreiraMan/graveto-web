import { useEffect, useState } from 'react'
import { isTerminalStatus } from '../recurring/types'
import { RecurringRowMenu } from '../recurring/RecurringRowMenu'
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

  const isTerminal = isTerminalStatus(recurringTransfer.status)

  useEffect(() => {
    if (!isOpen) {
      setIsConfirmingCancel(false)
    }
  }, [isOpen])

  async function handleCancel() {
    setIsCanceling(true)
    try {
      await cancelRecurringTransfer(recurringTransfer.sid)
      onCanceled()
    } catch {
      // Non-field failures already surface via the global notification toast.
      setIsCanceling(false)
    }
  }

  if (isTerminal) {
    return null
  }

  return (
    <RecurringRowMenu
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      triggerLabel="Recurring transfer actions"
      groupLabel="Actions for this recurring transfer"
      isConfirming={isConfirmingCancel}
      onEdit={onEdit}
      editLabel="Update"
      onRequestCancel={() => setIsConfirmingCancel(true)}
      cancelLabel="Cancel"
      confirmMessage={`Cancel "${recurringTransfer.description}"?`}
      onConfirmCancel={handleCancel}
      onDismissConfirm={() => setIsConfirmingCancel(false)}
      isCanceling={isCanceling}
    />
  )
}
