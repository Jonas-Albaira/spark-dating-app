// =============================================================================
// CUSTOM HOOK: useOnlineStatus
//
// Subscribes to browser network status events.
//
// Demonstrates:
//   - useEffect for external subscriptions (event listeners)
//   - ALWAYS clean up subscriptions to prevent memory leaks
//   - The subscribe/unsubscribe pattern
// =============================================================================

import { useState, useEffect } from 'react';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline  = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online',  handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup: remove listeners when component unmounts
    // Without this, the handlers keep running even after the component is gone
    return () => {
      window.removeEventListener('online',  handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []); // Empty deps: subscribe once, unsubscribe on unmount

  return isOnline;
}
