import { apiRequest } from '../../shared/api/client'
import type { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse } from './types'

export function login(request: LoginRequest): Promise<LoginResponse> {
  return apiRequest<LoginResponse>('/auth/login', { method: 'POST', body: request, auth: false })
}

export function register(request: RegisterRequest): Promise<RegisterResponse> {
  return apiRequest<RegisterResponse>('/auth/register', { method: 'POST', body: request, auth: false })
}
