import { apiRequest } from '../../../shared/api/client'
import type { Category, CategoryFilterRequest, CreateCategoryRequest } from './types'

export function fetchAllCategories(filters?: CategoryFilterRequest): Promise<Category[]> {
  const params = new URLSearchParams()
  if (filters?.displayName) params.append('displayName', filters.displayName)
  if (filters?.accountSid) params.append('accountSid', filters.accountSid)
  if (filters?.parentSid) params.append('parentSid', filters.parentSid)
  if (filters?.type) params.append('type', filters.type)
  const query = params.toString() ? `?${params.toString()}` : ''
  return apiRequest<Category[]>(`/categories${query}`)
}

export function createCategory(request: CreateCategoryRequest): Promise<Category> {
  return apiRequest<Category>('/categories', { method: 'POST', body: request })
}
