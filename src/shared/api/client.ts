import { API_BASE_URL } from './config'
import { ApiError, type ProblemDetail } from './errors'
import { getToken } from './token'

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: unknown
  auth?: boolean
}

export async function apiRequest<TResponse>(
  path: string,
  { method = 'GET', body, auth = true }: RequestOptions = {},
): Promise<TResponse> {
  const headers: Record<string, string> = {}

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }

  if (auth) {
    const token = getToken()
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    const problem: ProblemDetail | null = await response.json().catch(() => null)
    throw new ApiError(response.status, problem)
  }

  if (response.status === 204) {
    return undefined as TResponse
  }

  return (await response.json()) as TResponse
}
