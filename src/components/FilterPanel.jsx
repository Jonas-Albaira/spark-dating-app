// =============================================================================
// FilterPanel — Filter/search for the Matches tab
//
// Hooks used:
//   - useState: filter form state
//   - useId: accessible, unique form element IDs (React 18)
//   - useDeferredValue: defers search input processing (React 18)
//   - useMemo: applies filters to the matches list
// =============================================================================

import { useState, useId, useDeferredValue, useMemo } from 'react';
import { useTheme } from '../contexts/ThemeContext';

export default function FilterPanel({ matches, onFilteredChange }) {
  const { theme } = useTheme();

  // useId — generates stable, unique IDs for accessibility (aria-labelledby, htmlFor)
  // Solves the problem of ID collisions when a component renders multiple times
  // or is used in SSR (server-generated IDs won't match client IDs without useId)
  const searchId     = useId();
  const interestId   = useId();
  const lookingForId = useId();

  const [searchInput, setSearchInput] = useState('');
  const [selectedInterest, setSelectedInterest] = useState('all');
  const [selectedLookingFor, setSelectedLookingFor] = useState('all');
  const [isExpanded, setIsExpanded] = useState(false);

  // useDeferredValue — creates a "deferred" copy of the search input
  // React will render the UI with the old deferredSearch value first (fast),
  // then re-render with the new value when it has capacity (non-blocking)
  // This keeps the input responsive even if filtering is expensive
  const deferredSearch = useDeferredValue(searchInput);

  // Is the deferred value stale? Use this to show a loading indicator
  const isStale = searchInput !== deferredSearch;

  const allInterests = useMemo(() => {
    const interests = matches.flatMap(m => m.interests ?? []);
    return ['all', ...new Set(interests)].sort((a, b) =>
      a === 'all' ? -1 : a.localeCompare(b)
    );
  }, [matches]);

  // useMemo — filtered list only recomputes when actual filter values change
  // Note: uses deferredSearch (not searchInput) so filtering lags behind typing
  const filtered = useMemo(() => {
    return matches.filter(m => {
      const matchesSearch =
        !deferredSearch ||
        m.name.toLowerCase().includes(deferredSearch.toLowerCase()) ||
        m.bio?.toLowerCase().includes(deferredSearch.toLowerCase());

      const matchesInterest =
        selectedInterest === 'all' ||
        m.interests?.includes(selectedInterest);

      const matchesLookingFor =
        selectedLookingFor === 'all' ||
        m.lookingFor === selectedLookingFor;

      return matchesSearch && matchesInterest && matchesLookingFor;
    });
  }, [matches, deferredSearch, selectedInterest, selectedLookingFor]);

  // Notify parent of filtered results
  useMemo(() => {
    onFilteredChange?.(filtered);
  }, [filtered, onFilteredChange]);

  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '10px',
    border: `1px solid ${theme.border}`,
    background: theme.surfaceAlt,
    color: theme.text,
    fontSize: '0.9rem',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  };

  const labelStyle = {
    display: 'block',
    color: theme.textMuted,
    fontSize: '0.78rem',
    marginBottom: '4px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  };

  return (
    <div style={{
      background: theme.surface,
      borderRadius: '16px',
      padding: '16px',
      border: `1px solid ${theme.border}`,
      marginBottom: '16px',
    }}>
      {/* Search input with useId-generated ID for accessibility */}
      <div style={{ position: 'relative' }}>
        <label htmlFor={searchId} style={labelStyle}>Search Matches</label>
        <input
          id={searchId}
          type="text"
          placeholder="Name or bio..."
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          style={{ ...inputStyle, paddingRight: isStale ? '40px' : '14px' }}
          aria-label="Search matches by name or bio"
        />
        {/* Stale indicator — shows while useDeferredValue is catching up */}
        {isStale && (
          <div style={{
            position: 'absolute', right: 12, top: '50%', marginTop: '6px',
            width: 16, height: 16,
            border: `2px solid ${theme.primary}`,
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 0.6s linear infinite',
          }} />
        )}
      </div>

      <button
        onClick={() => setIsExpanded(v => !v)}
        style={{
          marginTop: '10px', background: 'none', border: 'none',
          color: theme.secondary, cursor: 'pointer', fontSize: '0.85rem',
          padding: 0, fontFamily: 'inherit',
        }}
      >
        {isExpanded ? '▲ Fewer filters' : '▼ More filters'}
      </button>

      {isExpanded && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
          {/* Interest filter — useId for unique label association */}
          <div>
            <label htmlFor={interestId} style={labelStyle}>Interest</label>
            <select
              id={interestId}
              value={selectedInterest}
              onChange={e => setSelectedInterest(e.target.value)}
              style={{ ...inputStyle }}
              aria-label="Filter by interest"
            >
              {allInterests.map(interest => (
                <option key={interest} value={interest}>
                  {interest === 'all' ? 'All interests' : interest}
                </option>
              ))}
            </select>
          </div>

          {/* Looking for filter */}
          <div>
            <label htmlFor={lookingForId} style={labelStyle}>Looking For</label>
            <select
              id={lookingForId}
              value={selectedLookingFor}
              onChange={e => setSelectedLookingFor(e.target.value)}
              style={{ ...inputStyle }}
            >
              <option value="all">All</option>
              <option value="relationship">Relationship</option>
              <option value="casual">Casual</option>
            </select>
          </div>
        </div>
      )}

      {/* Results count */}
      <div style={{ marginTop: '10px', color: theme.textMuted, fontSize: '0.8rem' }}>
        Showing {filtered.length} of {matches.length} matches
        {isStale && <span style={{ color: theme.primary }}> (filtering…)</span>}
      </div>
    </div>
  );
}
