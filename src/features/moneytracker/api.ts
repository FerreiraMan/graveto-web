import { apiRequest } from '../../shared/api/client'
import type { Account, AddMemberRequest, CreateAccountRequest } from './types'

export function createAccount(request: CreateAccountRequest): Promise<Account> {
  return apiRequest<Account>('/accounts', { method: 'POST', body: request })
}

export function fetchAllAccounts(): Promise<Account[]> {
  return apiRequest<Account[]>('/accounts')
}

export function fetchAccount(sid: string): Promise<Account> {
  return apiRequest<Account>(`/accounts/${sid}`)
}

export function closeAccount(sid: string): Promise<Account> {
  return apiRequest<Account>(`/accounts/${sid}/close`, { method: 'PATCH' })
}

export function addMember(sid: string, request: AddMemberRequest): Promise<Account> {
  return apiRequest<Account>(`/accounts/${sid}/memberships`, { method: 'POST', body: request })
}
