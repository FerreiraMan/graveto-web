import { useState } from 'react'
import { addMember, closeAccount, fetchAccount } from './api'
import {
  accountStatusLabel,
  MEMBERSHIP_ROLE_LABELS,
  MEMBERSHIP_ROLES,
  type Account,
  type Membership,
  type MembershipRole,
} from './types'
import { ApiError } from '../../../shared/api/errors'
import { currencySymbol } from '../currency'
import styles from '../MoneyTracker.module.css'

const CLOSE_CONFIRMATION_TEXT = 'CLOSE'

function sortByOwnerFirst(users: Membership[]): Membership[] {
  return [...users].sort((a, b) => (a.role === 'OWNER' ? -1 : b.role === 'OWNER' ? 1 : 0))
}

interface AccountRowProps {
  account: Account
  isExpanded: boolean
  onAccountUpdated: (updated: Account) => void
  onToggle: () => void
}

export function AccountRow({ account, isExpanded, onAccountUpdated, onToggle }: AccountRowProps) {
  const [details, setDetails] = useState<Account | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [isClosing, setIsClosing] = useState(false)
  const [isConfirmingClose, setIsConfirmingClose] = useState(false)
  const [confirmationText, setConfirmationText] = useState('')

  const [isAddingMember, setIsAddingMember] = useState(false)
  const [isSubmittingMember, setIsSubmittingMember] = useState(false)
  const [memberEmail, setMemberEmail] = useState('')
  const [memberRole, setMemberRole] = useState<MembershipRole>('CONTRIBUTOR')
  const [memberFieldErrors, setMemberFieldErrors] = useState<Record<string, string>>({})

  async function loadDetails() {
    setIsLoading(true)
    setError(null)
    try {
      const result = await fetchAccount(account.sid)
      setDetails(result)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load account details.')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleRowClick() {
    const wasExpanded = isExpanded
    onToggle()

    if (wasExpanded || details) return

    await loadDetails()
  }

  async function handleClose() {
    if (confirmationText !== CLOSE_CONFIRMATION_TEXT) return

    setIsClosing(true)
    setError(null)
    try {
      await closeAccount(account.sid)
      const refreshed = await fetchAccount(account.sid)
      setDetails(refreshed)
      onAccountUpdated(refreshed)
      setIsConfirmingClose(false)
      setConfirmationText('')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to close account.')
    } finally {
      setIsClosing(false)
    }
  }

  function cancelClose() {
    setIsConfirmingClose(false)
    setConfirmationText('')
  }

  async function handleAddMember() {
    setIsSubmittingMember(true)
    setMemberFieldErrors({})
    setError(null)
    try {
      await addMember(account.sid, { email: memberEmail.trim(), role: memberRole })
      const refreshed = await fetchAccount(account.sid)
      setDetails(refreshed)
      onAccountUpdated(refreshed)
      setIsAddingMember(false)
      setMemberEmail('')
      setMemberRole('CONTRIBUTOR')
    } catch (err) {
      if (err instanceof ApiError && err.problem?.invalid_params) {
        setMemberFieldErrors(err.problem.invalid_params)
      } else {
        setError(err instanceof ApiError ? err.message : 'Failed to add member.')
      }
    } finally {
      setIsSubmittingMember(false)
    }
  }

  function cancelAddMember() {
    setIsAddingMember(false)
    setMemberEmail('')
    setMemberRole('CONTRIBUTOR')
    setMemberFieldErrors({})
  }

  const displayedStatus = details?.status ?? account.status
  const displayedBalance = details?.balance ?? account.balance
  const isClosed = displayedStatus !== 'ACTIVE'

  return (
    <li>
      <button
        type="button"
        className={`${styles.row} ${isExpanded ? styles.rowSelected : ''}`}
        onClick={handleRowClick}
        aria-expanded={isExpanded}
      >
        <span className={styles.rowText}>
          <span className={styles.rowLabel}>{account.institution}</span>
          <span className={styles.rowBalance}>
            {displayedBalance}
            {currencySymbol(account.baseCurrency)}
          </span>
        </span>
        <span className={styles.rowMeta}>
          {isClosed && <span className={styles.badge}>{accountStatusLabel(displayedStatus)}</span>}
          <span className={styles.chevron} aria-hidden="true">
            {isExpanded ? '▾' : '▸'}
          </span>
        </span>
      </button>

      {isExpanded && (
        <div className={styles.managePanel}>
          {isLoading && <p className={styles.mutedText}>Loading…</p>}
          {error && (
            <p className={styles.errorText} role="alert">
              {error}{' '}
              <button type="button" className={styles.linkButton} onClick={loadDetails}>
                Retry
              </button>
            </p>
          )}
          {details && (
            <>
              <ul className={styles.detailList}>
                <li>
                  <strong>Balance:</strong> {details.balance}
                  {currencySymbol(details.baseCurrency)}
                </li>
                <li>
                  <strong>Status:</strong> {accountStatusLabel(details.status)}
                </li>
                <li>
                  <strong>Users</strong>
                  <ul className={styles.userList}>
                    {sortByOwnerFirst(details.users).map((user) => (
                      <li key={user.sid}>
                        {user.email ?? user.sid} —{' '}
                        {user.role in MEMBERSHIP_ROLE_LABELS
                          ? MEMBERSHIP_ROLE_LABELS[user.role as MembershipRole]
                          : user.role}
                      </li>
                    ))}
                  </ul>
                </li>
              </ul>

              {!isAddingMember && !isConfirmingClose && (
                <div className={styles.actionRow}>
                  <button type="button" className={styles.linkButton} onClick={() => setIsAddingMember(true)}>
                    Add member
                  </button>
                  {details.status !== 'CLOSED' && (
                    <button type="button" className={styles.dangerButton} onClick={() => setIsConfirmingClose(true)}>
                      Close account
                    </button>
                  )}
                </div>
              )}

              {isAddingMember && (
                <div className={styles.inlineForm}>
                  <div className={styles.field}>
                    <label htmlFor={`member-email-${account.sid}`}>Email</label>
                    <input
                      id={`member-email-${account.sid}`}
                      type="email"
                      value={memberEmail}
                      onChange={(e) => setMemberEmail(e.target.value)}
                    />
                    {memberFieldErrors.email && <span className={styles.fieldError}>{memberFieldErrors.email}</span>}
                  </div>

                  <div className={styles.field}>
                    <label htmlFor={`member-role-${account.sid}`}>Role</label>
                    <select
                      id={`member-role-${account.sid}`}
                      value={memberRole}
                      onChange={(e) => setMemberRole(e.target.value as MembershipRole)}
                    >
                      {MEMBERSHIP_ROLES.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                    {memberFieldErrors.role && <span className={styles.fieldError}>{memberFieldErrors.role}</span>}
                  </div>

                  <div className={styles.formActions}>
                    <button
                      type="button"
                      className={styles.primaryButton}
                      onClick={handleAddMember}
                      disabled={isSubmittingMember || memberEmail.trim() === ''}
                    >
                      {isSubmittingMember ? 'Adding…' : 'Confirm add member'}
                    </button>
                    <button
                      type="button"
                      className={styles.secondaryButton}
                      onClick={cancelAddMember}
                      disabled={isSubmittingMember}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Deliberately heavier than a Yes/Cancel confirm: closing an
               * account is much harder to undo than logging out, so it asks
               * for a typed match rather than one click — kept even though
               * the rest of the app's destructive actions use a lighter
               * pattern (see LogoutControl). */}
              {isConfirmingClose && (
                <div className={styles.closeConfirm}>
                  <label htmlFor={`confirm-close-${account.sid}`}>
                    Type "{CLOSE_CONFIRMATION_TEXT}" to confirm closing this account
                  </label>
                  <input
                    id={`confirm-close-${account.sid}`}
                    type="text"
                    value={confirmationText}
                    onChange={(e) => setConfirmationText(e.target.value)}
                    autoComplete="off"
                  />
                  <div className={styles.formActions}>
                    <button
                      type="button"
                      className={styles.dangerConfirmButton}
                      onClick={handleClose}
                      disabled={isClosing || confirmationText !== CLOSE_CONFIRMATION_TEXT}
                    >
                      {isClosing ? 'Closing…' : 'Confirm close'}
                    </button>
                    <button
                      type="button"
                      className={styles.secondaryButton}
                      onClick={cancelClose}
                      disabled={isClosing}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </li>
  )
}
