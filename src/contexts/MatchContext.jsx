// =============================================================================
// CONTEXT + useReducer — MatchContext
//
// Distributes match/swipe state (managed in appReducer) to the component tree.
// Separating this from AuthContext follows Single Responsibility Principle.
// =============================================================================

import { createContext, useContext, useReducer, useMemo, useEffect } from 'react';
import { appReducer, initialState, ACTIONS } from '../reducers/appReducer';
import { INITIAL_MATCHES } from '../data/profiles';

const MatchContext = createContext(null);

export function MatchProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Seed initial matches on mount
  useEffect(() => {
    dispatch({ type: ACTIONS.LOAD_MATCHES, payload: INITIAL_MATCHES });
  }, []);

  // useMemo — derived state: sorted matches by most recent
  // Only recomputes when state.matches changes, not on every render
  const sortedMatches = useMemo(() => {
    return [...state.matches].sort(
      (a, b) => new Date(b.matchedAt) - new Date(a.matchedAt)
    );
  }, [state.matches]);

  // useMemo — stats object only recalculates when the data it depends on changes
  const stats = useMemo(() => ({
    totalLikes: state.likedIds.length,
    totalPasses: state.passedIds.length,
    totalMatches: state.matches.length,
    superLikes: state.superLikedIds.length,
    matchRate: state.likedIds.length > 0
      ? Math.round((state.matches.length / state.likedIds.length) * 100)
      : 0,
  }), [state.likedIds, state.passedIds, state.matches, state.superLikedIds]);

  const value = useMemo(() => ({
    ...state,
    sortedMatches,
    stats,
    dispatch,
    // Action creators (convenience wrappers)
    likeProfile: (profile) => dispatch({ type: ACTIONS.LIKE, payload: profile }),
    passProfile: (profile) => dispatch({ type: ACTIONS.PASS, payload: profile }),
    superLike:   (profile) => dispatch({ type: ACTIONS.SUPER_LIKE, payload: profile }),
    undoLast:    ()        => dispatch({ type: ACTIONS.UNDO_LAST }),
    dismissMatch:()        => dispatch({ type: ACTIONS.DISMISS_MATCH }),
  }), [state, sortedMatches, stats]);

  return <MatchContext.Provider value={value}>{children}</MatchContext.Provider>;
}

export function useMatches() {
  const context = useContext(MatchContext);
  if (!context) throw new Error('useMatches must be used within a MatchProvider');
  return context;
}
