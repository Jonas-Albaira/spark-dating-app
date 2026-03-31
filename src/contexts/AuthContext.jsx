// =============================================================================
// CONTEXT + useReducer PATTERN — AuthContext
//
// Manages authentication state. Combines Context (for distribution)
// with useReducer (for predictable state transitions) — a common pattern
// that scales better than useState for auth flows.
// =============================================================================

import { createContext, useContext, useReducer, useEffect } from 'react';
import { CURRENT_USER } from '../data/profiles';

const AuthContext = createContext(null);

const AUTH_ACTIONS = {
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  UPDATE_PROFILE: 'UPDATE_PROFILE',
  UPDATE_PREFERENCES: 'UPDATE_PREFERENCES',
};

function authReducer(state, action) {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN:
      return { ...state, user: action.payload, isAuthenticated: true };
    case AUTH_ACTIONS.LOGOUT:
      return { user: null, isAuthenticated: false };
    case AUTH_ACTIONS.UPDATE_PROFILE:
      return { ...state, user: { ...state.user, ...action.payload } };
    case AUTH_ACTIONS.UPDATE_PREFERENCES:
      return {
        ...state,
        user: {
          ...state.user,
          preferences: { ...state.user.preferences, ...action.payload },
        },
      };
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [authState, dispatch] = useReducer(authReducer, {
    user: null,
    isAuthenticated: false,
  });

  // useEffect — side effect: persist auth to localStorage on every change
  // Runs after every render where authState changes
  useEffect(() => {
    if (authState.isAuthenticated) {
      localStorage.setItem('spark_user', JSON.stringify(authState.user));
    } else {
      localStorage.removeItem('spark_user');
    }
  }, [authState]);

  // useEffect with empty deps [] — runs once on mount (component lifecycle)
  // Restores session from localStorage (like componentDidMount)
  useEffect(() => {
    const stored = localStorage.getItem('spark_user');
    if (stored) {
      dispatch({ type: AUTH_ACTIONS.LOGIN, payload: JSON.parse(stored) });
    }
  }, []);

  const login = () => dispatch({ type: AUTH_ACTIONS.LOGIN, payload: CURRENT_USER });
  const logout = () => dispatch({ type: AUTH_ACTIONS.LOGOUT });
  const updateProfile = (data) => dispatch({ type: AUTH_ACTIONS.UPDATE_PROFILE, payload: data });
  const updatePreferences = (data) => dispatch({ type: AUTH_ACTIONS.UPDATE_PREFERENCES, payload: data });

  return (
    <AuthContext.Provider value={{ ...authState, login, logout, updateProfile, updatePreferences }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
