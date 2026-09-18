import { useEffect, useState } from 'react'

// Delays reflecting a fast-changing value (typically text input driving a
// search request) until it's stopped changing for `delay` ms — avoids
// firing a network request on every keystroke.
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}
