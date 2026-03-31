// =============================================================================
// SwipeStack — Main discover/swipe interface
//
// Hooks used:
//   - useState: current card index
//   - useMemo: filtered & ordered profile deck
//   - useCallback: stable action handlers
//   - useRef: imperative card ref (calling useImperativeHandle methods)
//   - useTransition: marks swipe actions as non-urgent (keeps UI responsive)
//   - useSwipe (custom): drag gesture handling
// =============================================================================

import { useState, useMemo, useCallback, useRef, useTransition } from 'react';
import { useMatches } from '../contexts/MatchContext';
import { useTheme } from '../contexts/ThemeContext';
import { PROFILES } from '../data/profiles';
import { useSwipe } from '../hooks/useSwipe';
import ProfileCard from './ProfileCard';

export default function SwipeStack() {
  const { theme } = useTheme();
  const { likeProfile, passProfile, superLike, undoLast, likedIds, passedIds, superLikedIds } = useMatches();

  const [currentIndex, setCurrentIndex] = useState(0);

  // useTransition — marks state updates as "non-urgent"
  // React can interrupt these to handle more urgent updates (like typing)
  // isPending: true while transition is in progress — show loading indicator
  const [isPending, startTransition] = useTransition();

  // Ref to the top card — uses the useImperativeHandle API we defined
  const topCardRef = useRef(null);

  // useMemo — compute the deck of unswipe profiles only when dependencies change
  // Avoids re-filtering on every render (could be expensive with large datasets)
  const deck = useMemo(() => {
    const seenIds = new Set([...likedIds, ...passedIds, ...superLikedIds]);
    return PROFILES.filter(p => !seenIds.has(p.id));
  }, [likedIds, passedIds, superLikedIds]);

  const currentProfile = deck[currentIndex];
  const nextProfile = deck[currentIndex + 1];

  // useCallback — stable references prevent SwipeStack from causing re-renders
  // in child components that receive these as props
  const handleLike = useCallback(() => {
    if (!currentProfile) return;
    likeProfile(currentProfile);
    // Wrap index update in startTransition: non-urgent, can be interrupted
    startTransition(() => {
      setCurrentIndex(prev => prev + 1);
    });
  }, [currentProfile, likeProfile]);

  const handlePass = useCallback(() => {
    if (!currentProfile) return;
    passProfile(currentProfile);
    startTransition(() => {
      setCurrentIndex(prev => prev + 1);
    });
  }, [currentProfile, passProfile]);

  const handleSuperLike = useCallback(() => {
    if (!currentProfile) return;
    superLike(currentProfile);
    startTransition(() => {
      setCurrentIndex(prev => prev + 1);
    });
  }, [currentProfile, superLike]);

  const handleUndo = useCallback(() => {
    if (currentIndex === 0) return;
    undoLast();
    startTransition(() => {
      setCurrentIndex(prev => Math.max(0, prev - 1));
    });
  }, [currentIndex, undoLast]);

  // useSwipe custom hook — handles all drag logic
  const { position, rotation, direction, isDragging, dragHandlers } = useSwipe({
    onSwipeRight: handleLike,
    onSwipeLeft:  handlePass,
    onSwipeUp:    handleSuperLike,
    threshold: 100,
  });

  // Calling imperative handle from buttons (alternative to dragging)
  const handleButtonLike      = useCallback(() => topCardRef.current?.swipeRight(),     []);
  const handleButtonPass      = useCallback(() => topCardRef.current?.swipeLeft(),      []);
  const handleButtonSuperLike = useCallback(() => topCardRef.current?.swipeSuperLike(), []);

  if (!currentProfile) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: theme.textMuted }}>
        <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🎉</div>
        <h2 style={{ color: theme.text, marginBottom: '8px' }}>You've seen everyone!</h2>
        <p>Check back later for new profiles, or adjust your filters.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', padding: '16px' }}>

      {/* isPending indicator from useTransition */}
      {isPending && (
        <div style={{
          position: 'fixed', top: 16, right: 16, zIndex: 100,
          background: theme.secondary, color: '#fff',
          borderRadius: 20, padding: '4px 12px', fontSize: '0.75rem',
        }}>
          updating...
        </div>
      )}

      {/* Card stack — 2 cards visible, current on top */}
      <div style={{
        position: 'relative',
        width: '100%', maxWidth: '380px',
        height: '560px',
        margin: '0 auto',
      }}>
        {/* Background card (next profile) */}
        {nextProfile && (
          <ProfileCard
            key={`next-${nextProfile.id}`}
            profile={nextProfile}
            isTop={false}
            style={{
              transform: 'scale(0.95) translateY(10px)',
              zIndex: 1,
            }}
          />
        )}

        {/* Top card (current profile, draggable) */}
        <ProfileCard
          key={`top-${currentProfile.id}`}
          ref={topCardRef}
          profile={currentProfile}
          isTop={true}
          direction={direction}
          dragHandlers={dragHandlers}
          onSwipeLeft={handlePass}
          onSwipeRight={handleLike}
          onSuperLike={handleSuperLike}
          style={{
            zIndex: 2,
            transform: `translate(${position.x}px, ${position.y}px) rotate(${rotation}deg)`,
            cursor: isDragging ? 'grabbing' : 'grab',
          }}
        />
      </div>

      {/* Action buttons — trigger useImperativeHandle methods */}
      <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
        <ActionButton
          onClick={handleUndo}
          disabled={currentIndex === 0}
          theme={theme}
          size={44}
          color={theme.accent}
          title="Undo"
        >
          ↩
        </ActionButton>

        <ActionButton
          onClick={handleButtonPass}
          theme={theme}
          size={56}
          color={theme.danger}
          title="Pass"
        >
          ✕
        </ActionButton>

        <ActionButton
          onClick={handleButtonSuperLike}
          theme={theme}
          size={44}
          color={theme.accent}
          title="Super Like"
        >
          ⭐
        </ActionButton>

        <ActionButton
          onClick={handleButtonLike}
          theme={theme}
          size={56}
          color={theme.success}
          title="Like"
        >
          ❤️
        </ActionButton>
      </div>

      {/* Progress indicator */}
      <div style={{ color: theme.textMuted, fontSize: '0.8rem' }}>
        {deck.length - currentIndex} profiles remaining
      </div>
    </div>
  );
}

// Small presentational component (no hooks needed — pure UI)
function ActionButton({ onClick, disabled, children, size, color, title, theme }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        width: size, height: size,
        borderRadius: '50%',
        border: `2px solid ${color}`,
        background: disabled ? theme.border : 'transparent',
        color: disabled ? theme.textMuted : color,
        fontSize: size > 50 ? '1.4rem' : '1.1rem',
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.15s',
        boxShadow: disabled ? 'none' : `0 2px 8px ${color}44`,
      }}
    >
      {children}
    </button>
  );
}
