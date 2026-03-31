// =============================================================================
// MatchNotification — It's a match! overlay
//
// Hooks used:
//   - useEffect: auto-dismiss timer + cleanup
//   - useRef: tracks whether component is mounted (prevents setState on unmount)
//   - useCallback: stable dismiss handler
// =============================================================================

import { useEffect, useRef, useCallback } from 'react';
import { useMatches } from '../contexts/MatchContext';
import { useTheme } from '../contexts/ThemeContext';

export default function MatchNotification() {
  const { theme } = useTheme();
  const { newMatchProfile, dismissMatch } = useMatches();

  // useRef to track mount status — prevents "setState on unmounted component" warning
  // This is a common pattern for components with async operations
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // useEffect — auto-dismiss after 4 seconds
  useEffect(() => {
    if (!newMatchProfile) return;

    const timer = setTimeout(() => {
      // Only call setState if component is still mounted
      if (isMountedRef.current) {
        dismissMatch();
      }
    }, 4000);

    // Cleanup: clear timer if dismissed manually before 4s, or if component unmounts
    return () => clearTimeout(timer);
  }, [newMatchProfile, dismissMatch]);

  const handleDismiss = useCallback(() => {
    dismissMatch();
  }, [dismissMatch]);

  if (!newMatchProfile) return null;

  return (
    <div
      onClick={handleDismiss}
      role="dialog"
      aria-modal="true"
      aria-label="It's a match!"
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.85)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        zIndex: 1000,
        animation: 'fadeIn 0.3s ease',
        cursor: 'pointer',
      }}
    >
      <div style={{ textAlign: 'center', padding: '24px', maxWidth: '340px' }}>
        <div style={{ fontSize: '5rem', marginBottom: '8px', animation: 'bounce 0.6s ease' }}>
          🎉
        </div>
        <h1 style={{
          fontSize: '2.5rem', fontWeight: 900,
          background: theme.gradient,
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          marginBottom: '8px',
        }}>
          It's a Match!
        </h1>
        <p style={{ color: '#fff', marginBottom: '24px', opacity: 0.9 }}>
          You and <strong>{newMatchProfile.name}</strong> liked each other!
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '24px' }}>
          <img
            src="https://i.pravatar.cc/500?img=33"
            alt="You"
            style={{ width: 90, height: 90, borderRadius: '50%', border: '3px solid #e91e8c', objectFit: 'cover' }}
          />
          <img
            src={newMatchProfile.photos?.[0]}
            alt={newMatchProfile.name}
            style={{ width: 90, height: 90, borderRadius: '50%', border: '3px solid #7c3aed', objectFit: 'cover' }}
          />
        </div>

        <button
          onClick={handleDismiss}
          style={{
            background: theme.gradient,
            color: '#fff',
            border: 'none',
            borderRadius: '30px',
            padding: '14px 40px',
            fontSize: '1rem',
            fontWeight: 700,
            cursor: 'pointer',
            width: '100%',
          }}
        >
          Send a Message 💬
        </button>
        <button
          onClick={handleDismiss}
          style={{
            marginTop: '12px',
            background: 'transparent',
            color: 'rgba(255,255,255,0.7)',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: '30px',
            padding: '12px 40px',
            fontSize: '0.9rem',
            cursor: 'pointer',
            width: '100%',
          }}
        >
          Keep Swiping
        </button>

        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', marginTop: '12px' }}>
          Tap anywhere to dismiss
        </p>
      </div>
    </div>
  );
}
