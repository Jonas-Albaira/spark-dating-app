// =============================================================================
// Navigation — Bottom tab bar
//
// Hooks used:
//   - useMatches (context): reads match count for badge
//   - useOnlineStatus (custom): shows offline banner
// =============================================================================

import { useMatches } from '../contexts/MatchContext';
import { useTheme } from '../contexts/ThemeContext';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

const TABS = [
  { id: 'discover', label: 'Discover', icon: '🔥' },
  { id: 'matches',  label: 'Matches',  icon: '❤️' },
  { id: 'messages', label: 'Messages', icon: '💬' },
  { id: 'profile',  label: 'Profile',  icon: '👤' },
];

export default function Navigation({ activeTab, onTabChange }) {
  const { theme, isDark } = useTheme();
  const { sortedMatches } = useMatches();
  const isOnline = useOnlineStatus(); // Custom hook using browser events

  const newMatchesCount = sortedMatches.filter(m => {
    const diff = Date.now() - new Date(m.matchedAt);
    return diff < 3600000; // Last hour
  }).length;

  return (
    <>
      {/* Offline banner — shown via useOnlineStatus */}
      {!isOnline && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 500,
          background: '#ef4444', color: '#fff',
          textAlign: 'center', padding: '8px',
          fontSize: '0.85rem', fontWeight: 600,
        }}>
          You're offline — reconnect to see new profiles
        </div>
      )}

      {/* Bottom tab bar */}
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: theme.surface,
        borderTop: `1px solid ${theme.border}`,
        display: 'flex',
        zIndex: 100,
        paddingBottom: 'env(safe-area-inset-bottom)',
        boxShadow: isDark ? 'none' : '0 -4px 20px rgba(0,0,0,0.08)',
      }}>
        {TABS.map(tab => {
          const isActive = activeTab === tab.id;
          const badge = tab.id === 'matches' ? newMatchesCount : 0;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
              style={{
                flex: 1,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                padding: '10px 4px',
                background: 'none', border: 'none',
                cursor: 'pointer',
                color: isActive ? theme.primary : theme.textMuted,
                position: 'relative',
                transition: 'color 0.15s',
                fontFamily: 'inherit',
              }}
            >
              <span style={{ fontSize: '1.3rem', lineHeight: 1 }}>{tab.icon}</span>
              <span style={{ fontSize: '0.65rem', marginTop: '3px', fontWeight: isActive ? 700 : 400 }}>
                {tab.label}
              </span>
              {/* Active indicator dot */}
              {isActive && (
                <div style={{
                  position: 'absolute', top: 6, width: 4, height: 4,
                  borderRadius: '50%', background: theme.primary,
                }} />
              )}
              {/* Match badge */}
              {badge > 0 && (
                <div style={{
                  position: 'absolute', top: 6, right: '20%',
                  background: theme.primary, color: '#fff',
                  borderRadius: '10px', minWidth: '16px', height: '16px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.6rem', fontWeight: 800,
                  border: `2px solid ${theme.surface}`,
                }}>
                  {badge > 9 ? '9+' : badge}
                </div>
              )}
            </button>
          );
        })}
      </nav>
    </>
  );
}
