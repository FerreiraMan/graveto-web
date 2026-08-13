import { useEffect, useState } from 'react'
import { ApiError } from '../../../shared/api/errors'
import { fetchTransfer } from './api'
import type { Transfer } from './types'

export function TransferDetails({ correlationId, accountSid }: { correlationId: string; accountSid: string }) {
  const [transfer, setTransfer] = useState<Transfer | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    fetchTransfer(correlationId)
      .then((result) => {
        if (!cancelled) setTransfer(result)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Failed to load transfer details.')
      })

    return () => {
      cancelled = true
    }
  }, [correlationId])

  if (error) return <p role="alert">{error}</p>
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
