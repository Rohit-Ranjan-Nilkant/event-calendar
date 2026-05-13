import { useState, useEffect } from "react"

/**
 * Returns a debounced version of `value` that only updates after
 * `delay` ms of inactivity. Useful for search inputs to avoid
 * firing a fetch on every keystroke.
 */
export function useDebounce<T>(value: T, delay = 400): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}
