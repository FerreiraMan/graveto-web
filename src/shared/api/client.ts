import { API_BASE_URL } from './config'
import { ApiError, type ProblemDetail } from './errors'
import { getToken } from './token'
import { getGlobalErrorHandlers } from './errorHandlers'

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
    const error = new ApiError(response.status, problem)

    const handlers = getGlobalErrorHandlers()
    if (handlers) {
      if (response.status === 401) {
        handlers.onUnauthorized()
      } else if (!problem?.invalid_params) {
        // Field-level validation errors are handled inline by the calling form.
        // Everything else (network/auth/conflict/server errors) has no natural
        // place to render inline, so surface it as a global notification.
        handlers.notify(error.message)
      }
    }

    throw error
  }

  if (response.status === 204) {
    return undefined as TResponse
  }

  return (await response.json()) as TResponse
}
