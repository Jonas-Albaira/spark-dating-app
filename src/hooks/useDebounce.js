// =============================================================================
// CUSTOM HOOK: useDebounce
//
// Delays updating a value until the user stops changing it.
// Used for search inputs to avoid firing on every keystroke.
//
// Demonstrates:
//   - useState + useEffect cleanup pattern
//   - Returning a cleanup function from useEffect (timer cancellation)
// =============================================================================

import { useState, useEffect } from 'react';

export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Set timeout to update debounced value after delay
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // CLEANUP FUNCTION — React calls this:
    //   1. Before the next effect runs (value changed before delay elapsed)
    //   2. When the component unmounts
    // This prevents stale timers from firing after unmount (memory leak prevention)
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
