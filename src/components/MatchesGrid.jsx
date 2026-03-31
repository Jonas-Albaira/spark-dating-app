// =============================================================================
// MatchesGrid — Displays matched profiles with filtering
//
// Hooks used:
//   - useState: filtered matches list, view mode
//   - useMemo: sorted + filtered matches
//   - useCallback: stable filter change handler
// =============================================================================

import { useState, useMemo, useCallback } from 'react';
import { useMatches } from '../contexts/MatchContext';
import { useTheme } from '../contexts/ThemeContext';
import FilterPanel from './FilterPanel';

export default function MatchesGrid() {
  const { theme } = useTheme();
  const { sortedMatches } = useMatches();
  const [filteredMatches, setFilteredMatches] = useState(sortedMatches);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  // useCallback — stable reference passed to FilterPanel's onFilteredChange
  const handleFilteredChange = useCallback((filtered) => {
    setFilteredMatches(filtered);
  }, []);

  // useMemo — separate new matches (last 24h) from older ones
  const { newMatches, olderMatches } = useMemo(() => {
    const oneDayAgo = Date.now() - 86400000;
    return {
      newMatches: filteredMatches.filter(m => new Date(m.matchedAt) > oneDayAgo),
      olderMatches: filteredMatches.filter(m => new Date(m.matchedAt) <= oneDayAgo),
    };
  }, [filteredMatches]);

  if (sortedMatches.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: theme.textMuted }}>
        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>💔</div>
        <h3 style={{ color: theme.text }}>No matches yet</h3>
        <p>Start swiping to find your spark!</p>
      </div>
    );
  }

  const cardStyle = (match) => ({
    background: theme.surface,
    borderRadius: '16px',
    overflow: 'hidden',
    border: `1px solid ${match.superLiked ? theme.accent : theme.border}`,
    boxShadow: match.superLiked ? `0 0 12px ${theme.accent}44` : 'none',
    cursor: 'pointer',
    transition: 'transform 0.15s, box-shadow 0.15s',
  });

  function MatchCard({ match, compact }) {
    return (
      <div style={cardStyle(match)}>
        <div style={{ position: 'relative' }}>
          <img
            src={match.photos?.[0]}
            alt={match.name}
            style={{ width: '100%', height: compact ? 100 : 160, objectFit: 'cover', display: 'block' }}
          />
          {match.isOnline && (
            <div style={{
              position: 'absolute', top: 8, right: 8,
              width: 12, height: 12, borderRadius: '50%',
              background: '#10b981', border: `2px solid ${theme.surface}`,
            }} />
          )}
          {match.superLiked && (
            <div style={{
              position: 'absolute', top: 8, left: 8,
              background: theme.accent, borderRadius: 12,
              padding: '2px 8px', fontSize: '0.65rem', color: '#fff', fontWeight: 700,
            }}>
              ⭐ Super
            </div>
          )}
        </div>
        <div style={{ padding: compact ? '8px' : '12px' }}>
          <div style={{ fontWeight: 700, color: theme.text, fontSize: compact ? '0.85rem' : '0.95rem' }}>
            {match.name}, {match.age}
          </div>
          {!compact && (
            <div style={{ color: theme.textMuted, fontSize: '0.75rem', marginTop: '2px' }}>
              {match.distance} mi · {match.lookingFor}
            </div>
          )}
          <div style={{ color: theme.textMuted, fontSize: '0.7rem', marginTop: '4px' }}>
            {formatTime(match.matchedAt)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '16px' }}>
      <FilterPanel matches={sortedMatches} onFilteredChange={handleFilteredChange} />

      {/* View mode toggle */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginBottom: '16px' }}>
        {['grid', 'list'].map(mode => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            style={{
              padding: '6px 14px', borderRadius: '20px',
              border: `1.5px solid ${viewMode === mode ? theme.primary : theme.border}`,
              background: viewMode === mode ? `${theme.primary}22` : 'transparent',
              color: viewMode === mode ? theme.primary : theme.textMuted,
              cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'inherit',
            }}
          >
            {mode === 'grid' ? '⊞ Grid' : '☰ List'}
          </button>
        ))}
      </div>

      {/* New Matches section */}
      {newMatches.length > 0 && (
        <section style={{ marginBottom: '24px' }}>
          <h3 style={{ color: theme.text, fontSize: '0.9rem', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            New Matches ✨ ({newMatches.length})
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(140px, 1fr))' : '1fr',
            gap: '12px',
          }}>
            {newMatches.map(match => (
              <MatchCard key={match.id} match={match} compact={viewMode === 'grid'} />
            ))}
          </div>
        </section>
      )}

      {/* Older Matches */}
      {olderMatches.length > 0 && (
        <section>
          <h3 style={{ color: theme.text, fontSize: '0.9rem', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            All Matches ({olderMatches.length})
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(140px, 1fr))' : '1fr',
            gap: '12px',
          }}>
            {olderMatches.map(match => (
              <MatchCard key={match.id} match={match} compact={viewMode === 'grid'} />
            ))}
          </div>
        </section>
      )}

      {filteredMatches.length === 0 && sortedMatches.length > 0 && (
        <div style={{ textAlign: 'center', color: theme.textMuted, padding: '40px' }}>
          No matches found with those filters.
        </div>
      )}
    </div>
  );
}

function formatTime(isoString) {
  const diff = Date.now() - new Date(isoString);
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}
