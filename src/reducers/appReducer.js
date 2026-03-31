// =============================================================================
// useReducer PATTERN — Centralized state machine for complex state transitions
//
// WHY useReducer over useState here:
//   - Multiple sub-values that change together (matches + likes + passes)
//   - Next state depends on previous state (can't use stale closure)
//   - Actions are self-documenting — easy to reason about what changed and why
//   - Easier to test (pure function: (state, action) => newState)
// =============================================================================

export const initialState = {
  matches: [],       // profiles user matched with
  likedIds: [],      // profiles user swiped right
  passedIds: [],     // profiles user swiped left
  superLikedIds: [], // profiles user super-liked
  newMatchProfile: null, // triggers the match notification overlay
};

// Action type constants — prevents typo bugs from string literals
export const ACTIONS = {
  LIKE:         'LIKE',
  PASS:         'PASS',
  SUPER_LIKE:   'SUPER_LIKE',
  UNDO_LAST:    'UNDO_LAST',
  DISMISS_MATCH:'DISMISS_MATCH',
  LOAD_MATCHES: 'LOAD_MATCHES',
};

export function appReducer(state, action) {
  switch (action.type) {

    case ACTIONS.LIKE: {
      const profile = action.payload;
      // Simulate a match: 40% chance (in real app, server decides)
      const isMatch = Math.random() > 0.6;
      return {
        ...state,
        likedIds: [...state.likedIds, profile.id],
        matches: isMatch ? [...state.matches, { ...profile, matchedAt: new Date().toISOString(), lastMessage: null }] : state.matches,
        newMatchProfile: isMatch ? profile : state.newMatchProfile,
      };
    }

    case ACTIONS.PASS:
      return {
        ...state,
        passedIds: [...state.passedIds, action.payload.id],
      };

    case ACTIONS.SUPER_LIKE: {
      const profile = action.payload;
      // Super like always results in a match
      return {
        ...state,
        superLikedIds: [...state.superLikedIds, profile.id],
        likedIds: [...state.likedIds, profile.id],
        matches: [...state.matches, { ...profile, matchedAt: new Date().toISOString(), lastMessage: null, superLiked: true }],
        newMatchProfile: profile,
      };
    }

    case ACTIONS.UNDO_LAST: {
      // Remove the last swiped profile — useful for "rewind" premium feature
      const lastLiked = state.likedIds[state.likedIds.length - 1];
      const lastPassed = state.passedIds[state.passedIds.length - 1];
      if (!lastLiked && !lastPassed) return state;
      return {
        ...state,
        likedIds: state.likedIds.slice(0, -1),
        passedIds: state.passedIds.slice(0, -1),
        matches: state.matches.filter(m => m.id !== lastLiked),
      };
    }

    case ACTIONS.DISMISS_MATCH:
      return { ...state, newMatchProfile: null };

    case ACTIONS.LOAD_MATCHES:
      return { ...state, matches: action.payload };

    default:
      // Always return current state for unknown actions
      // Throwing here is also valid in strict apps
      return state;
  }
}
