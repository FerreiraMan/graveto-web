import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchAllAccounts } from './api'
import { AccountRow } from './AccountRow'
import type { Account } from './types'
import { ApiError } from '../../shared/api/errors'

export function AccountListPage() {
  const [accounts, setAccounts] = useState<Account[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    fetchAllAccounts()
      .then((result) => {
        if (!cancelled) setAccounts(result)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Failed to load accounts.')
      })

    return () => {
      cancelled = true
    }
  }, [])

  function handleAccountUpdated(updated: Account) {
    setAccounts((current) =>
      current === null ? current : current.map((a) => (a.sid === updated.sid ? updated : a)),
    )
  }

  return (
    <div>
      <h1>Accounts</h1>

      <Link to="/moneytracker/accounts/new">Create account</Link>

      {error && <p role="alert">{error}</p>}

      {accounts === null && !error && <p>Loading…</p>}

      {accounts !== null && accounts.length === 0 && <p>No accounts yet.</p>}

      {accounts !== null && accounts.length > 0 && (
        <ul>
          {accounts.map((account) => (
            <AccountRow key={account.sid} account={account} onAccountUpdated={handleAccountUpdated} />
          ))}
        </ul>
      )}
    </div>
  )
}
