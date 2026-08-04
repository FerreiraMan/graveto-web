export type Currency = 'EUR' | 'USD' | 'GBP'
export type MembershipRole = 'OWNER' | 'CONTRIBUTOR'

export const CURRENCIES: Currency[] = ['EUR', 'USD', 'GBP']
export const MEMBERSHIP_ROLES: MembershipRole[] = ['OWNER', 'CONTRIBUTOR']

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
