// =============================================================================
// App.jsx — Root component
//
// Hooks used:
//   - useState: current tab
//   - useTransition: tab switches are non-urgent (keeps UI snappy)
//   - useContext (via useTheme, useAuth): reads from context providers
//   - useCallback: stable tab change handler
//
// Architecture:
//   Providers (Theme → Auth → Match) wrap the app to distribute state.
//   Context consumers access state without prop drilling.
// =============================================================================

import { useState, useTransition, useCallback } from 'react';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { MatchProvider } from './contexts/MatchContext';
import Navigation from './components/Navigation';
import SwipeStack from './components/SwipeStack';
import MatchesGrid from './components/MatchesGrid';
import ChatList from './components/ChatList';
import ProfileSettings from './components/ProfileSettings';
import MatchNotification from './components/MatchNotification';

// Inner app — has access to all context values
function AppContent() {
  const { theme, toggleTheme, isDark } = useTheme();
  const { isAuthenticated, login, user } = useAuth();

  const [activeTab, setActiveTab] = useState('discover');

  // useTransition: tab changes are "non-urgent" — React can keep UI responsive
  // while preparing the next tab's content in the background
  const [isTabPending, startTabTransition] = useTransition();

  const handleTabChange = useCallback((tab) => {
    startTabTransition(() => {
      setActiveTab(tab);
    });
  }, []);

  // ── Login screen ──────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div style={{
        minHeight: '100vh',
        background: theme.bg,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '24px',
      }}>
        <div style={{ textAlign: 'center', maxWidth: '340px', width: '100%' }}>
          <div style={{ fontSize: '4rem', marginBottom: '8px' }}>🔥</div>
          <h1 style={{
            fontSize: '2.8rem', fontWeight: 900, margin: '0 0 8px',
            background: theme.gradient,
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            Spark
          </h1>
          <p style={{ color: theme.textMuted, marginBottom: '40px' }}>
            A React hooks study app for your Senior Engineer interview
          </p>

          <button
            onClick={login}
            style={{
              width: '100%', padding: '16px',
              borderRadius: '14px', border: 'none',
              background: theme.gradient,
              color: '#fff', fontSize: '1rem', fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: '0 4px 20px rgba(233, 30, 140, 0.4)',
            }}
          >
            Get Started 🚀
          </button>

          <div style={{
            marginTop: '32px', padding: '16px',
            background: theme.surface, borderRadius: '12px',
            border: `1px solid ${theme.border}`,
            textAlign: 'left',
          }}>
            <div style={{ color: theme.textMuted, fontSize: '0.78rem', fontWeight: 700, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Hooks covered in this app
            </div>
            {[
              'useState', 'useEffect', 'useReducer', 'useContext',
              'useRef', 'useMemo', 'useCallback', 'useId',
              'useTransition', 'useDeferredValue', 'useLayoutEffect',
              'useImperativeHandle', '5× custom hooks',
            ].map(hook => (
              <div key={hook} style={{
                display: 'inline-block', margin: '3px',
                padding: '3px 10px', borderRadius: '20px',
                background: theme.surfaceAlt, border: `1px solid ${theme.border}`,
                color: theme.primary, fontSize: '0.75rem', fontWeight: 600,
              }}>
                {hook}
              </div>
            ))}
          </div>

          <button
            onClick={toggleTheme}
            style={{
              marginTop: '16px', background: 'none', border: 'none',
              color: theme.textMuted, cursor: 'pointer', fontSize: '0.85rem', fontFamily: 'inherit',
            }}
          >
            {isDark ? '☀️ Light mode' : '🌙 Dark mode'}
          </button>
        </div>
      </div>
    );
  }

  // ── Main app ──────────────────────────────────────────────────────────────
  const tabContent = {
    discover: <SwipeStack />,
    matches:  <MatchesGrid />,
    messages: <ChatList />,
    profile:  <ProfileSettings />,
  };

  const tabTitles = {
    discover: '🔥 Discover',
    matches:  '❤️ Matches',
    messages: '💬 Messages',
    profile:  `👤 ${user?.name ?? 'Profile'}`,
  };

  return (
    <div style={{ minHeight: '100vh', background: theme.bg, fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      {/* CSS keyframes (injected inline for this demo) */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes bounce { 0%,100% { transform: scale(1) } 50% { transform: scale(1.2) } }
        @keyframes spin   { to { transform: rotate(360deg) } }
      `}</style>

      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: theme.surface,
        borderBottom: `1px solid ${theme.border}`,
        padding: '12px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.4rem' }}>🔥</span>
          <span style={{
            fontWeight: 900, fontSize: '1.3rem',
            background: theme.gradient,
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            Spark
          </span>
        </div>

        <div style={{ color: theme.text, fontWeight: 600, fontSize: '0.95rem' }}>
          {tabTitles[activeTab]}
          {/* isPending from useTransition — tab is loading */}
          {isTabPending && (
            <span style={{ marginLeft: '8px', color: theme.textMuted, fontSize: '0.75rem' }}>
              ⟳
            </span>
          )}
        </div>

        <button
          onClick={toggleTheme}
          style={{
            background: theme.surfaceAlt, border: `1px solid ${theme.border}`,
            borderRadius: '20px', padding: '6px 12px',
            cursor: 'pointer', fontSize: '0.85rem', color: theme.text, fontFamily: 'inherit',
          }}
          aria-label="Toggle dark mode"
        >
          {isDark ? '☀️' : '🌙'}
        </button>
      </header>

      {/* Tab content */}
      <main style={{
        paddingBottom: '80px', // space for fixed nav
        opacity: isTabPending ? 0.7 : 1,
        transition: 'opacity 0.15s',
      }}>
        {tabContent[activeTab]}
      </main>

      {/* Bottom navigation */}
      <Navigation activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Match notification overlay */}
      <MatchNotification />
    </div>
  );
}

// Root — wraps everything in providers (Theme > Auth > Match)
// Provider order: outer providers don't depend on inner ones
export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MatchProvider>
          <AppContent />
        </MatchProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
