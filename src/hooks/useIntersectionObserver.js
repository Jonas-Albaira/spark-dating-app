// =============================================================================
// CUSTOM HOOK: useIntersectionObserver
//
// Observes when a DOM element enters or exits the viewport.
// Used for lazy-loading images and infinite scroll.
//
// Demonstrates:
//   - useRef for stable DOM element reference
//   - useEffect with dependency on the ref's .current
//   - Returning a ref (ref callback pattern)
// =============================================================================

import { useState, useEffect, useRef, useCallback } from 'react';

export function useIntersectionObserver(options = {}) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [entry, setEntry] = useState(null);
  const targetRef = useRef(null);

  // Callback ref — lets us set up observer as soon as the element mounts
  const setRef = useCallback((node) => {
    targetRef.current = node;
  }, []);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
      setEntry(entry);
    }, {
      threshold: options.threshold ?? 0.1,
      root: options.root ?? null,
      rootMargin: options.rootMargin ?? '0px',
    });

    observer.observe(target);

    // Cleanup: disconnect observer when element unmounts or deps change
    return () => observer.disconnect();
  }, [options.threshold, options.root, options.rootMargin]);

  return { ref: setRef, isIntersecting, entry };
}
