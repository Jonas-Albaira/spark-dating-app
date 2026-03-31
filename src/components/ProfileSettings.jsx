// =============================================================================
// ProfileSettings — Edit user profile
//
// Hooks used:
//   - useReducer: form state management (alternative to many useState calls)
//   - useEffect: initializes form from auth context, detects unsaved changes
//   - useCallback: stable submit/change handlers
//   - useRef: tracks "dirty" state without causing re-renders
//   - useLocalStorage (custom): persists draft between sessions
// =============================================================================

import { useReducer, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useMatches } from '../contexts/MatchContext';

// Form reducer — all form field updates in one place
function formReducer(state, action) {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };
    case 'SET_PREFERENCE':
      return { ...state, preferences: { ...state.preferences, [action.field]: action.value } };
    case 'RESET':
      return action.payload;
    case 'TOGGLE_INTEREST': {
      const interests = state.interests.includes(action.interest)
        ? state.interests.filter(i => i !== action.interest)
        : [...state.interests, action.interest];
      return { ...state, interests };
    }
    default:
      return state;
  }
}

const AVAILABLE_INTERESTS = [
  'Hiking', 'Cooking', 'Tech', 'Coffee', 'Photography',
  'Travel', 'Music', 'Art', 'Yoga', 'Running',
  'Reading', 'Dogs', 'Wine', 'Cycling', 'Film',
  'Sustainability', 'Startups', 'Design', 'Jazz', 'Gaming',
];

export default function ProfileSettings() {
  const { theme } = useTheme();
  const { user, updateProfile, updatePreferences } = useAuth();
  const { stats } = useMatches();

  // useLocalStorage custom hook: persist draft form between page refreshes
  const [savedDraft, saveDraft] = useLocalStorage('spark_profile_draft', null);

  // useReducer for complex form state — better than 10 separate useState calls
  const [formState, dispatch] = useReducer(
    formReducer,
    savedDraft ?? user ?? {}
  );

  // useRef: track dirty state (form changed) WITHOUT causing re-renders
  // If this were useState, every keystroke would re-render the whole component
  const isDirtyRef = useRef(false);
  const [saveStatus, setSaveStatus] = useLocalStorage('spark_save_status', null);

  // useEffect: initialize form when user changes (e.g., after login)
  useEffect(() => {
    if (user && !savedDraft) {
      dispatch({ type: 'RESET', payload: user });
    }
  }, [user]); // Runs whenever `user` reference changes

  // useEffect: auto-save draft every time formState changes
  useEffect(() => {
    if (!isDirtyRef.current) return;
    saveDraft(formState);
  }, [formState, saveDraft]);

  // useCallback: stable change handler — won't cause input re-renders
  const handleFieldChange = useCallback((field, value) => {
    isDirtyRef.current = true;
    dispatch({ type: 'SET_FIELD', field, value });
  }, []);

  const handlePrefChange = useCallback((field, value) => {
    isDirtyRef.current = true;
    dispatch({ type: 'SET_PREFERENCE', field, value });
  }, []);

  const handleInterestToggle = useCallback((interest) => {
    isDirtyRef.current = true;
    dispatch({ type: 'TOGGLE_INTEREST', interest });
  }, []);

  const handleSave = useCallback(() => {
    updateProfile({
      name: formState.name,
      bio: formState.bio,
      interests: formState.interests,
    });
    updatePreferences(formState.preferences);
    isDirtyRef.current = false;
    saveDraft(null);
    setSaveStatus('Saved!');
    setTimeout(() => setSaveStatus(null), 2000);
  }, [formState, updateProfile, updatePreferences, saveDraft, setSaveStatus]);

  const handleReset = useCallback(() => {
    dispatch({ type: 'RESET', payload: user });
    isDirtyRef.current = false;
    saveDraft(null);
  }, [user, saveDraft]);

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

  const sectionStyle = {
    background: theme.surface,
    borderRadius: '16px',
    padding: '20px',
    border: `1px solid ${theme.border}`,
    marginBottom: '16px',
  };

  const labelStyle = {
    display: 'block',
    color: theme.textMuted,
    fontSize: '0.78rem',
    marginBottom: '6px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  };

  return (
    <div style={{ maxWidth: '560px', margin: '0 auto', padding: '16px' }}>
      {/* Stats section */}
      <div style={{ ...sectionStyle, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', textAlign: 'center' }}>
        {[
          { label: 'Likes', value: stats.totalLikes, icon: '❤️' },
          { label: 'Passes', value: stats.totalPasses, icon: '✕' },
          { label: 'Matches', value: stats.totalMatches, icon: '🎉' },
          { label: 'Match %', value: `${stats.matchRate}%`, icon: '📊' },
        ].map(({ label, value, icon }) => (
          <div key={label}>
            <div style={{ fontSize: '1.4rem' }}>{icon}</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: theme.primary }}>{value}</div>
            <div style={{ fontSize: '0.7rem', color: theme.textMuted }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Profile photo */}
      <div style={{ ...sectionStyle, textAlign: 'center' }}>
        <img
          src={user?.photos?.[0] ?? 'https://i.pravatar.cc/500?img=33'}
          alt="Profile"
          style={{ width: 90, height: 90, borderRadius: '50%', objectFit: 'cover', border: `3px solid ${theme.primary}` }}
        />
        <div style={{ marginTop: '12px', color: theme.text, fontWeight: 700 }}>{formState.name}</div>
        <div style={{ color: theme.textMuted, fontSize: '0.85rem' }}>{formState.location}</div>
      </div>

      {/* Basic info form */}
      <div style={sectionStyle}>
        <h3 style={{ margin: '0 0 16px', color: theme.text }}>Edit Profile</h3>

        <div style={{ marginBottom: '12px' }}>
          <label style={labelStyle}>Display Name</label>
          <input
            value={formState.name ?? ''}
            onChange={e => handleFieldChange('name', e.target.value)}
            style={inputStyle}
            maxLength={50}
          />
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={labelStyle}>Bio ({(formState.bio ?? '').length}/300)</label>
          <textarea
            value={formState.bio ?? ''}
            onChange={e => handleFieldChange('bio', e.target.value)}
            rows={4}
            maxLength={300}
            style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
          />
        </div>

        <div>
          <label style={labelStyle}>Interests</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {AVAILABLE_INTERESTS.map(interest => {
              const selected = formState.interests?.includes(interest);
              return (
                <button
                  key={interest}
                  onClick={() => handleInterestToggle(interest)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    border: `1.5px solid ${selected ? theme.primary : theme.border}`,
                    background: selected ? `${theme.primary}22` : 'transparent',
                    color: selected ? theme.primary : theme.textMuted,
                    cursor: 'pointer',
                    fontSize: '0.82rem',
                    fontWeight: selected ? 700 : 400,
                    fontFamily: 'inherit',
                  }}
                >
                  {interest}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Preferences */}
      <div style={sectionStyle}>
        <h3 style={{ margin: '0 0 16px', color: theme.text }}>Preferences</h3>

        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>
            Age Range: {formState.preferences?.ageMin ?? 18} – {formState.preferences?.ageMax ?? 40}
          </label>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <input type="range" min={18} max={60}
              value={formState.preferences?.ageMin ?? 18}
              onChange={e => handlePrefChange('ageMin', Number(e.target.value))}
              style={{ flex: 1, accentColor: theme.primary }}
            />
            <input type="range" min={18} max={60}
              value={formState.preferences?.ageMax ?? 40}
              onChange={e => handlePrefChange('ageMax', Number(e.target.value))}
              style={{ flex: 1, accentColor: theme.primary }}
            />
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>
            Max Distance: {formState.preferences?.maxDistance ?? 25} miles
          </label>
          <input type="range" min={1} max={100}
            value={formState.preferences?.maxDistance ?? 25}
            onChange={e => handlePrefChange('maxDistance', Number(e.target.value))}
            style={{ width: '100%', accentColor: theme.primary }}
          />
        </div>

        <div>
          <label style={labelStyle}>Looking For</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['relationship', 'casual', 'friendship'].map(opt => (
              <button
                key={opt}
                onClick={() => handlePrefChange('lookingFor', opt)}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '10px',
                  border: `1.5px solid ${formState.preferences?.lookingFor === opt ? theme.primary : theme.border}`,
                  background: formState.preferences?.lookingFor === opt ? `${theme.primary}22` : 'transparent',
                  color: formState.preferences?.lookingFor === opt ? theme.primary : theme.textMuted,
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  fontWeight: formState.preferences?.lookingFor === opt ? 700 : 400,
                  fontFamily: 'inherit',
                  textTransform: 'capitalize',
                }}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Save/Reset buttons */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          onClick={handleReset}
          style={{
            flex: 1, padding: '14px',
            borderRadius: '12px',
            border: `1.5px solid ${theme.border}`,
            background: 'transparent', color: theme.textMuted,
            cursor: 'pointer', fontSize: '0.95rem', fontFamily: 'inherit',
          }}
        >
          Reset
        </button>
        <button
          onClick={handleSave}
          style={{
            flex: 2, padding: '14px',
            borderRadius: '12px',
            border: 'none',
            background: saveStatus ? '#10b981' : theme.gradient,
            color: '#fff',
            cursor: 'pointer', fontSize: '0.95rem', fontWeight: 700, fontFamily: 'inherit',
            transition: 'background 0.3s',
          }}
        >
          {saveStatus ?? 'Save Changes'}
        </button>
      </div>

      {savedDraft && (
        <div style={{ marginTop: '8px', color: theme.textMuted, fontSize: '0.75rem', textAlign: 'center' }}>
          Draft auto-saved (via useLocalStorage)
        </div>
      )}
    </div>
  );
}
