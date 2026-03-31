// =============================================================================
// CUSTOM HOOK: useLocalStorage
//
// Syncs state with localStorage. Demonstrates:
//   - Custom hook composition (useState + useEffect + useCallback)
//   - Lazy state initialization (function passed to useState)
//   - useCallback for stable references
// =============================================================================

import { useState, useEffect, useCallback } from 'react';

export function useLocalStorage(key, initialValue) {
  // Lazy initializer — the function is only called once on mount
  // (avoids expensive localStorage read on every render)
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`useLocalStorage: error reading key "${key}"`, error);
      return initialValue;
    }
  });

  // Keep localStorage in sync whenever the value changes
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.warn(`useLocalStorage: error writing key "${key}"`, error);
    }
  }, [key, storedValue]);

  // useCallback — stable reference so components using this won't re-render
  // unnecessarily when the parent re-renders
  const setValue = useCallback((value) => {
    setStoredValue(prev =>
      typeof value === 'function' ? value(prev) : value
    );
  }, []);

  const removeValue = useCallback(() => {
    localStorage.removeItem(key);
    setStoredValue(initialValue);
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}
