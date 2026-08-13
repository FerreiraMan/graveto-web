import { useState } from 'react'
import { addMember, closeAccount, fetchAccount } from './api'
import { MEMBERSHIP_ROLES, type Account, type Membership, type MembershipRole } from './types'
import { ApiError } from '../../../shared/api/errors'

const CLOSE_CONFIRMATION_TEXT = 'CLOSE'

function sortByOwnerFirst(users: Membership[]): Membership[] {
  return [...users].sort((a, b) => (a.role === 'OWNER' ? -1 : b.role === 'OWNER' ? 1 : 0))
}

interface AccountRowProps {
  account: Account
  onAccountUpdated: (updated: Account) => void
}

export function AccountRow({ account, onAccountUpdated }: AccountRowProps) {
  const [expanded, setExpanded] = useState(false)
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

  async function toggleExpand() {
    if (expanded) {
      setExpanded(false)
      return
    }

    setExpanded(true)

    if (details) return

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

  return (
    <li>
      <button type="button" onClick={toggleExpand}>
        {expanded ? '▾' : '▸'} {account.institution} — {displayedBalance} {account.baseCurrency} (
        {displayedStatus})
      </button>

      {expanded && (
        <div>
          {isLoading && <p>Loading…</p>}
          {error && <p role="alert">{error}</p>}
          {details && (
            <>
              <ul>
                <li>SID: {details.sid}</li>
                <li>Balance: {details.balance} {details.baseCurrency}</li>
                <li>Status: {details.status}</li>
                <li>Institution: {details.institution}</li>
                <li>
                  Users:
                  <ul>
                    {sortByOwnerFirst(details.users).map((user) => (
                      <li key={user.sid}>
                        {user.email ?? user.sid} — {user.role}
                      </li>
                    ))}
                  </ul>
                </li>
              </ul>

              {!isAddingMember && (
                <button type="button" onClick={() => setIsAddingMember(true)}>
                  Add member
                </button>
              )}

              {details.status !== 'CLOSED' && !isConfirmingClose && (
                <button type="button" onClick={() => setIsConfirmingClose(true)}>
                  Close account
                </button>
              )}

              {isAddingMember && (
                <div>
                  <div>
                    <label htmlFor={`member-email-${account.sid}`}>Email</label>
                    <input
                      id={`member-email-${account.sid}`}
                      type="email"
                      value={memberEmail}
                      onChange={(e) => setMemberEmail(e.target.value)}
                    />
                    {memberFieldErrors.email && <span>{memberFieldErrors.email}</span>}
                  </div>

                  <div>
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
                    {memberFieldErrors.role && <span>{memberFieldErrors.role}</span>}
                  </div>

                  <button
                    type="button"
                    onClick={handleAddMember}
                    disabled={isSubmittingMember || memberEmail.trim() === ''}
                  >
                    {isSubmittingMember ? 'Adding…' : 'Confirm add member'}
                  </button>
                  <button type="button" onClick={cancelAddMember} disabled={isSubmittingMember}>
                    Cancel
                  </button>
                </div>
              )}

              {isConfirmingClose && (
                <div>
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
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isClosing || confirmationText !== CLOSE_CONFIRMATION_TEXT}
                  >
                    {isClosing ? 'Closing…' : 'Confirm close'}
                  </button>
                  <button type="button" onClick={cancelClose} disabled={isClosing}>
                    Cancel
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </li>
  )
}
