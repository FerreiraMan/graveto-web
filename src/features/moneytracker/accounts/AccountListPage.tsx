import { useEffect, useState } from 'react'
import { fetchAllAccounts } from './api'
import { AccountRow } from './AccountRow'
import { CreateAccountModal } from './CreateAccountModal'
import type { Account } from './types'
import { ApiError } from '../../../shared/api/errors'
import { AccountTabs } from './AccountTabs'
import styles from '../MoneyTracker.module.css'

export function AccountListPage() {
  const [accounts, setAccounts] = useState<Account[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedAccountSid, setSelectedAccountSid] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    let cancelled = false

    function load() {
      setError(null)
      fetchAllAccounts()
        .then((result) => {
          if (!cancelled) setAccounts(result)
        })
        .catch((err) => {
          if (!cancelled) setError(err instanceof ApiError ? err.message : 'Failed to load accounts.')
        })
    }

    load()

    return () => {
      cancelled = true
    }
  }, [retryCount])

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
    <div className={styles.layout}>
      <div className={styles.listColumn}>
        <h1 className={styles.srOnly}>Accounts</h1>

        <div className={styles.pageHeader}>
          <button type="button" className={styles.primaryButton} onClick={() => setIsCreating(true)}>
            Create account
          </button>
        </div>

        {error && (
          <p className={styles.errorText} role="alert">
            {error}{' '}
            <button type="button" className={styles.linkButton} onClick={() => setRetryCount((n) => n + 1)}>
              Retry
            </button>
          </p>
        )}

        {accounts === null && !error && <p className={styles.mutedText}>Loading…</p>}

        {accounts !== null && accounts.length === 0 && <p className={styles.mutedText}>No accounts yet.</p>}

        {accounts !== null && accounts.length > 0 && (
          <ul className={styles.list}>
            {accounts.map((account) => (
              <AccountRow
                key={account.sid}
                account={account}
                isExpanded={account.sid === selectedAccountSid}
                onAccountUpdated={handleAccountUpdated}
                onToggle={() =>
                  setSelectedAccountSid((current) => (current === account.sid ? null : account.sid))
                }
              />
            ))}
          </ul>
        )}
      </div>

      <div className={styles.detailColumn}>
        {selectedAccountSid ? (
          <AccountTabs
            key={selectedAccountSid}
            accountSid={selectedAccountSid}
            institution={accounts?.find((a) => a.sid === selectedAccountSid)?.institution ?? ''}
            currency={accounts?.find((a) => a.sid === selectedAccountSid)?.baseCurrency ?? ''}
            onTransactionMutated={refetchAccounts}
          />
        ) : (
          <p className={styles.mutedText}>Select an account to view its transactions.</p>
        )}
      </div>

      {isCreating && (
        <CreateAccountModal
          onClose={() => setIsCreating(false)}
          onCreated={(created) => {
            setAccounts((current) => (current === null ? [created] : [...current, created]))
            setSelectedAccountSid(created.sid)
            setIsCreating(false)
          }}
        />
      )}
    </div>
  )
}
