import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchAllAccounts } from './api'
import { AccountRow } from './AccountRow'
import type { Account } from './types'
import { ApiError } from '../../../shared/api/errors'
import { AccountTabs } from './AccountTabs'

export function AccountListPage() {
  const [accounts, setAccounts] = useState<Account[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedAccountSid, setSelectedAccountSid] = useState<string | null>(null)

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

  function refetchAccounts() {
    fetchAllAccounts()
      .then(setAccounts)
      .catch(() => {
        // Best-effort refresh after a transaction/transfer mutation — if it
        // fails, the balances shown are just momentarily stale, not wrong
        // in a way that blocks the user from continuing.
      })
  }

  return (
    <div style={{ display: 'flex', gap: '2rem' }}>
      <div>
        <h1>Accounts</h1>

        <Link to="/moneytracker/accounts/new">Create account</Link>

        {error && <p role="alert">{error}</p>}

        {accounts === null && !error && <p>Loading…</p>}

        {accounts !== null && accounts.length === 0 && <p>No accounts yet.</p>}

        {accounts !== null && accounts.length > 0 && (
          <ul>
            {accounts.map((account) => (
              <AccountRow
                key={account.sid}
                account={account}
                isSelected={account.sid === selectedAccountSid}
                onAccountUpdated={handleAccountUpdated}
                onSelect={() => setSelectedAccountSid(account.sid)}
              />
            ))}
          </ul>
        )}
      </div>

      <div>
        {selectedAccountSid ? (
          <AccountTabs
            key={selectedAccountSid}
            accountSid={selectedAccountSid}
            currency={accounts?.find((a) => a.sid === selectedAccountSid)?.baseCurrency ?? ''}
            onTransactionMutated={refetchAccounts}
          />
        ) : (
          <p>Select an account to view its transactions.</p>
        )}
      </div>
    </div>
  )
}
