import { useEffect, useState } from 'react'
import { fetchTransfer } from './api'
import type { Transfer } from './types'

export function TransferDetails({ correlationId, accountSid }: { correlationId: string; accountSid: string }) {
  const [transfer, setTransfer] = useState<Transfer | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    setTransfer(null)
    setFailed(false)

    fetchTransfer(correlationId)
      .then((result) => {
        if (!cancelled) setTransfer(result)
      })
      .catch(() => {
        // Non-field failures already surface via the global notification
        // toast. `failed` here only exists so this panel settles out of
        // "Loading…" rather than hanging on it indefinitely — there's no
        // natural inline retry for a detail panel this small.
        if (!cancelled) setFailed(true)
      })

    return () => {
      cancelled = true
    }
  }, [correlationId])

  if (failed) return null
  if (!transfer) return <p>Loading…</p>

  // Whichever leg isn't the account this panel belongs to is the
  // counterparty — the "other side" of the transfer.
  const counterparty =
    transfer.sourceTransaction.account.sid === accountSid
      ? transfer.destinationTransaction
      : transfer.sourceTransaction
  const isOutgoing = transfer.sourceTransaction.account.sid === accountSid

  return (
    <dl>
      <dt>{isOutgoing ? 'Sent to' : 'Received from'}</dt>
      <dd>{counterparty.account.name}</dd>
    </dl>
  )
}
