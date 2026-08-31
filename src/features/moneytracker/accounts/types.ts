export type Currency = 'EUR' | 'USD' | 'GBP'
export type MembershipRole = 'OWNER' | 'CONTRIBUTOR'
export type AccountStatus = 'ACTIVE' | 'CLOSED'

export const CURRENCIES: Currency[] = ['EUR', 'USD', 'GBP']
export const MEMBERSHIP_ROLES: MembershipRole[] = ['OWNER', 'CONTRIBUTOR']

// FE-only display labels — kept separate from the wire enum so copy can
// change without touching the API contract or any other consumer of it.
export const MEMBERSHIP_ROLE_LABELS: Record<MembershipRole, string> = {
  OWNER: 'Owner',
  CONTRIBUTOR: 'Contributor',
}

// Account status is a free-form string on the wire (not a closed enum
// today), so this map only covers the values the UI treats specially;
// anything else falls back to the raw string in the caller.
export const ACCOUNT_STATUS_LABELS: Record<AccountStatus, string> = {
  ACTIVE: 'Active',
  CLOSED: 'Closed',
}

export function accountStatusLabel(status: string): string {
  return status in ACCOUNT_STATUS_LABELS ? ACCOUNT_STATUS_LABELS[status as AccountStatus] : status
}

export interface CreateAccountRequest {
  initialBalance: number
  currency: Currency
  institution: string
}

export interface AddMemberRequest {
  email: string
  role: MembershipRole
}

export interface Membership {
  sid: string
  email: string | null
  role: string
}

export interface Account {
  sid: string
  balance: number
  baseCurrency: Currency
  status: string
  institution: string
  users: Membership[]
}
