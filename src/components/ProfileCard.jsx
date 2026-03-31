// =============================================================================
// ProfileCard — Advanced hooks: forwardRef + useImperativeHandle + useLayoutEffect
//
// forwardRef: allows parent to get a ref to this component
// useImperativeHandle: controls WHAT the parent can do via that ref
//   → parent calls cardRef.current.swipeLeft() instead of manipulating DOM
// useLayoutEffect: runs synchronously after DOM mutations (before paint)
//   → used for measuring card dimensions without visual flicker
// =============================================================================

import { forwardRef, useImperativeHandle, useLayoutEffect, useRef, useState, useCallback } from 'react';
import { useTheme } from '../contexts/ThemeContext';

// forwardRef wraps the component so parents can pass a ref prop
const ProfileCard = forwardRef(function ProfileCard(
  { profile, style, dragHandlers, direction, isTop, onSwipeLeft, onSwipeRight, onSuperLike },
  ref  // ← ref forwarded from parent
) {
  const { theme } = useTheme();
  const cardRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [currentPhoto, setCurrentPhoto] = useState(0);
  const [showInfo, setShowInfo] = useState(false);

  // useLayoutEffect — runs synchronously AFTER DOM update but BEFORE browser paint
  // Perfect for reading DOM measurements (avoids flickering)
  // vs useEffect which runs AFTER paint (can cause visible layout jumps)
  useLayoutEffect(() => {
    if (cardRef.current) {
      const { width, height } = cardRef.current.getBoundingClientRect();
      setDimensions({ width: Math.round(width), height: Math.round(height) });
    }
  }, []); // Measure once on mount

  // useImperativeHandle — exposes a controlled API to the parent via ref
  // Without this, forwardRef would expose the raw DOM node
  // With this, parent can only call the methods we explicitly define
  useImperativeHandle(ref, () => ({
    swipeLeft: () => {
      onSwipeLeft?.();
    },
    swipeRight: () => {
      onSwipeRight?.();
    },
    swipeSuperLike: () => {
      onSuperLike?.();
    },
    getDimensions: () => dimensions,
    focus: () => cardRef.current?.focus(),
  }), [onSwipeLeft, onSwipeRight, onSuperLike, dimensions]);

  const nextPhoto = useCallback((e) => {
    e.stopPropagation();
    setCurrentPhoto(prev => (prev + 1) % (profile.photos?.length ?? 1));
  }, [profile.photos]);

  const prevPhoto = useCallback((e) => {
    e.stopPropagation();
    setCurrentPhoto(prev =>
      prev === 0 ? (profile.photos?.length ?? 1) - 1 : prev - 1
    );
  }, [profile.photos]);

  // Direction overlay colors
  const directionOverlay = {
    right: 'rgba(16, 185, 129, 0.6)',
    left:  'rgba(239, 68, 68, 0.6)',
    up:    'rgba(245, 158, 11, 0.6)',
  };

  const directionLabel = {
    right: '❤️ LIKE',
    left:  '✕ PASS',
    up:    '⭐ SUPER',
  };

  return (
    <div
      ref={cardRef}
      style={{
        position: 'absolute',
        width: '100%',
        maxWidth: '380px',
        borderRadius: '20px',
        overflow: 'hidden',
        background: theme.surface,
        boxShadow: theme.cardShadow,
        cursor: isTop ? 'grab' : 'default',
        userSelect: 'none',
        touchAction: 'none',
        transition: dragHandlers ? 'none' : 'transform 0.3s ease',
        ...style,
      }}
      {...(isTop ? dragHandlers : {})}
      role="article"
      aria-label={`${profile.name}'s profile`}
      tabIndex={isTop ? 0 : -1}
    >
      {/* Photo area */}
      <div style={{ position: 'relative', height: '420px' }}>
        <img
          src={profile.photos?.[currentPhoto] ?? profile.photos?.[0]}
          alt={`${profile.name}`}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          draggable={false}
        />

        {/* Direction overlay */}
        {isTop && direction && (
          <div style={{
            position: 'absolute', inset: 0,
            background: directionOverlay[direction],
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2.5rem', fontWeight: 900, color: '#fff',
            letterSpacing: '0.1em',
          }}>
            {directionLabel[direction]}
          </div>
        )}

        {/* Photo navigation dots */}
        {profile.photos?.length > 1 && (
          <div style={{
            position: 'absolute', top: 12, left: 0, right: 0,
            display: 'flex', justifyContent: 'center', gap: '6px',
          }}>
            {profile.photos.map((_, i) => (
              <div key={i} style={{
                width: i === currentPhoto ? 24 : 8,
                height: 8,
                borderRadius: 4,
                background: i === currentPhoto ? '#fff' : 'rgba(255,255,255,0.5)',
                transition: 'all 0.2s',
              }} />
            ))}
          </div>
        )}

        {/* Photo tap zones */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex' }}>
          <div style={{ flex: 1 }} onClick={prevPhoto} />
          <div style={{ flex: 1 }} onClick={nextPhoto} />
        </div>

        {/* Online indicator */}
        {profile.isOnline && (
          <div style={{
            position: 'absolute', top: 12, right: 12,
            background: '#10b981', borderRadius: '12px',
            padding: '3px 10px', fontSize: '0.7rem', color: '#fff', fontWeight: 700,
          }}>
            Online
          </div>
        )}

        {/* Gradient overlay at bottom */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '140px',
          background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
        }} />

        {/* Profile quick-info */}
        <div style={{ position: 'absolute', bottom: 16, left: 16, right: 16, color: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 800 }}>{profile.name}</span>
            <span style={{ fontSize: '1.3rem', fontWeight: 400 }}>{profile.age}</span>
            {profile.compatibility >= 90 && (
              <span style={{ marginLeft: 'auto', fontSize: '0.75rem', background: theme.gradient, borderRadius: 12, padding: '2px 8px', fontWeight: 700 }}>
                {profile.compatibility}% match
              </span>
            )}
          </div>
          <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>
            📍 {profile.distance} miles away
          </div>
        </div>
      </div>

      {/* Info toggle */}
      <div style={{ padding: '12px 16px', background: theme.surface }}>
        <button
          onClick={() => setShowInfo(v => !v)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: theme.textMuted, fontSize: '0.85rem', padding: 0, fontFamily: 'inherit',
          }}
        >
          {showInfo ? '▲ Less info' : '▼ More info'}
        </button>

        {showInfo && (
          <div style={{ marginTop: '8px' }}>
            <p style={{ color: theme.text, fontSize: '0.9rem', margin: '0 0 12px', lineHeight: 1.5 }}>
              {profile.bio}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {profile.interests.map(interest => (
                <span key={interest} style={{
                  background: theme.surfaceAlt, border: `1px solid ${theme.border}`,
                  borderRadius: 20, padding: '3px 10px',
                  fontSize: '0.75rem', color: theme.text,
                }}>
                  {interest}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Dimensions display — shows useLayoutEffect result */}
        {dimensions.width > 0 && (
          <div style={{ marginTop: '4px', fontSize: '0.65rem', color: theme.textMuted }}>
            Card: {dimensions.width}×{dimensions.height}px (measured via useLayoutEffect)
          </div>
        )}
      </div>
    </div>
  );
});

export default ProfileCard;
