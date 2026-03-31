// =============================================================================
// CUSTOM HOOK: useSwipe
//
// Handles touch and mouse drag gestures for card swiping.
//
// Demonstrates:
//   - useRef for mutable values (no re-render needed)
//   - useCallback for stable event handlers
//   - useState for reactive UI values (position, rotation)
//   - Difference between useRef (mutable box) and useState (triggers render)
// =============================================================================

import { useState, useRef, useCallback } from 'react';

export function useSwipe({ onSwipeLeft, onSwipeRight, onSwipeUp, threshold = 100 }) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  // useRef: stores drag start point WITHOUT triggering re-renders
  // If this were useState, every mousemove would cause an extra render
  const startPos = useRef({ x: 0, y: 0 });
  const hasSwiped = useRef(false);

  // Derived value: rotation proportional to horizontal drag
  const rotation = position.x / 15;

  // Determine swipe direction from current position
  const direction =
    position.x > threshold / 2 ? 'right' :
    position.x < -threshold / 2 ? 'left' :
    position.y < -threshold / 2 ? 'up' : null;

  const handleDragStart = useCallback((clientX, clientY) => {
    startPos.current = { x: clientX, y: clientY };
    hasSwiped.current = false;
    setIsDragging(true);
  }, []);

  const handleDragMove = useCallback((clientX, clientY) => {
    if (!isDragging) return;
    setPosition({
      x: clientX - startPos.current.x,
      y: clientY - startPos.current.y,
    });
  }, [isDragging]);

  const handleDragEnd = useCallback(() => {
    if (!isDragging || hasSwiped.current) return;
    setIsDragging(false);

    if (position.x > threshold) {
      hasSwiped.current = true;
      onSwipeRight?.();
    } else if (position.x < -threshold) {
      hasSwiped.current = true;
      onSwipeLeft?.();
    } else if (position.y < -threshold) {
      hasSwiped.current = true;
      onSwipeUp?.();
    }

    // Reset position (animate back to center if no swipe)
    setPosition({ x: 0, y: 0 });
  }, [isDragging, position, threshold, onSwipeLeft, onSwipeRight, onSwipeUp]);

  // Mouse event handlers
  const onMouseDown = useCallback((e) => handleDragStart(e.clientX, e.clientY), [handleDragStart]);
  const onMouseMove = useCallback((e) => handleDragMove(e.clientX, e.clientY), [handleDragMove]);
  const onMouseUp = useCallback(() => handleDragEnd(), [handleDragEnd]);

  // Touch event handlers (mobile)
  const onTouchStart = useCallback((e) => {
    const touch = e.touches[0];
    handleDragStart(touch.clientX, touch.clientY);
  }, [handleDragStart]);

  const onTouchMove = useCallback((e) => {
    const touch = e.touches[0];
    handleDragMove(touch.clientX, touch.clientY);
  }, [handleDragMove]);

  const onTouchEnd = useCallback(() => handleDragEnd(), [handleDragEnd]);

  return {
    position,
    rotation,
    isDragging,
    direction,
    dragHandlers: { onMouseDown, onMouseMove, onMouseUp, onTouchStart, onTouchMove, onTouchEnd },
    reset: () => setPosition({ x: 0, y: 0 }),
  };
}
