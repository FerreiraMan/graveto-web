// Matches Spring Data's default Page<T> JSON serialization shape.
export interface Page<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
  first: boolean
  last: boolean
}
