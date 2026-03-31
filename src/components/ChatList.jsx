// =============================================================================
// ChatList — Matches with messages (Messages tab)
//
// Hooks used:
//   - useState: selected conversation, message input
//   - useMemo: sorted/filtered conversations
//   - useCallback: stable handlers
//   - useRef: auto-scroll chat to bottom, textarea ref
//   - useEffect: scroll to bottom when messages change
//   - useIntersectionObserver (custom): mark messages as "read" when visible
// =============================================================================

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useMatches } from '../contexts/MatchContext';
import { useTheme } from '../contexts/ThemeContext';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';

// Sample messages — in a real app these come from an API/WebSocket
const INITIAL_MESSAGES = {
  4: [ // Morgan
    { id: 1, text: "Hey! How's your day going?", sender: 'them', time: '2:30 PM' },
    { id: 2, text: "Pretty good! Just got back from a design workshop. You?", sender: 'me', time: '2:32 PM' },
    { id: 3, text: "Nice! I've been working on a new series of illustrations 🎨", sender: 'them', time: '2:35 PM' },
  ],
  8: [ // Drew
    { id: 1, text: "That hike sounds amazing!", sender: 'them', time: '1:00 PM' },
    { id: 2, text: "It was! Mt. Tam at sunrise is incredible 🌅", sender: 'me', time: '1:05 PM' },
  ],
};

// Sub-component: marks itself "read" when visible using IntersectionObserver
function MessageBubble({ message, theme }) {
  const { ref, isIntersecting } = useIntersectionObserver({ threshold: 0.8 });
  const isMe = message.sender === 'me';

  return (
    <div
      ref={ref}
      style={{
        display: 'flex',
        justifyContent: isMe ? 'flex-end' : 'flex-start',
        marginBottom: '8px',
        // Fade in when message enters viewport (IntersectionObserver)
        opacity: isIntersecting ? 1 : 0.6,
        transition: 'opacity 0.3s',
      }}
    >
      <div style={{
        maxWidth: '75%',
        padding: '10px 14px',
        borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
        background: isMe ? theme.gradient : theme.surfaceAlt,
        color: isMe ? '#fff' : theme.text,
        fontSize: '0.9rem',
        lineHeight: 1.4,
      }}>
        {message.text}
        <div style={{ fontSize: '0.65rem', opacity: 0.7, marginTop: '4px', textAlign: 'right' }}>
          {message.time}
        </div>
      </div>
    </div>
  );
}

export default function ChatList() {
  const { theme } = useTheme();
  const { sortedMatches } = useMatches();

  const [selectedId, setSelectedId] = useState(null);
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');

  const chatEndRef = useRef(null); // useRef: DOM reference for auto-scroll
  const inputRef = useRef(null);   // useRef: focus input after sending

  // useMemo: only matches with messages appear in the chat list
  const conversations = useMemo(() => {
    return sortedMatches.filter(m => messages[m.id]?.length > 0 || m.lastMessage);
  }, [sortedMatches, messages]);

  const selectedMatch = useMemo(() =>
    sortedMatches.find(m => m.id === selectedId),
  [sortedMatches, selectedId]);

  const currentMessages = useMemo(() =>
    messages[selectedId] ?? [],
  [messages, selectedId]);

  // useEffect — auto-scroll to bottom when messages update
  // Runs after every render where currentMessages changes
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages]);

  // useCallback — stable reference for the send handler
  const handleSend = useCallback(() => {
    if (!inputText.trim() || !selectedId) return;
    const newMessage = {
      id: Date.now(),
      text: inputText.trim(),
      sender: 'me',
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => ({
      ...prev,
      [selectedId]: [...(prev[selectedId] ?? []), newMessage],
    }));
    setInputText('');
    inputRef.current?.focus();
  }, [inputText, selectedId]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  if (sortedMatches.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: theme.textMuted }}>
        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>💬</div>
        <h3 style={{ color: theme.text }}>No messages yet</h3>
        <p>Match with someone to start a conversation!</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '500px', borderRadius: '16px', overflow: 'hidden', border: `1px solid ${theme.border}` }}>
      {/* Conversation list */}
      <div style={{
        width: '240px', minWidth: '240px',
        background: theme.surface,
        borderRight: `1px solid ${theme.border}`,
        overflowY: 'auto',
      }}>
        <div style={{ padding: '12px', borderBottom: `1px solid ${theme.border}` }}>
          <h3 style={{ margin: 0, color: theme.text, fontSize: '1rem', fontWeight: 700 }}>Messages</h3>
        </div>
        {conversations.map(match => {
          const lastMsg = messages[match.id]?.slice(-1)[0];
          return (
            <button
              key={match.id}
              onClick={() => setSelectedId(match.id)}
              style={{
                width: '100%', textAlign: 'left',
                padding: '12px',
                background: selectedId === match.id ? theme.surfaceAlt : 'transparent',
                border: 'none',
                borderBottom: `1px solid ${theme.border}`,
                cursor: 'pointer',
                display: 'flex', gap: '10px', alignItems: 'center',
                color: theme.text, fontFamily: 'inherit',
              }}
            >
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <img
                  src={match.photos?.[0]}
                  alt={match.name}
                  style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }}
                />
                {match.isOnline && (
                  <div style={{
                    position: 'absolute', bottom: 1, right: 1,
                    width: 11, height: 11, borderRadius: '50%',
                    background: '#10b981', border: `2px solid ${theme.surface}`,
                  }} />
                )}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '2px' }}>{match.name}</div>
                <div style={{
                  color: theme.textMuted, fontSize: '0.75rem',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {lastMsg?.text ?? match.lastMessage ?? 'Say hello! 👋'}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Chat area */}
      {selectedMatch ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: theme.bg }}>
          {/* Chat header */}
          <div style={{
            padding: '12px 16px', borderBottom: `1px solid ${theme.border}`,
            background: theme.surface,
            display: 'flex', alignItems: 'center', gap: '12px',
          }}>
            <img src={selectedMatch.photos?.[0]} alt={selectedMatch.name}
              style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
            <div>
              <div style={{ fontWeight: 700, color: theme.text }}>{selectedMatch.name}</div>
              <div style={{ fontSize: '0.75rem', color: selectedMatch.isOnline ? '#10b981' : theme.textMuted }}>
                {selectedMatch.isOnline ? 'Online' : 'Offline'}
              </div>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
            {currentMessages.length === 0 ? (
              <div style={{ textAlign: 'center', color: theme.textMuted, marginTop: '40px' }}>
                <p>Say hi to {selectedMatch.name}! 👋</p>
              </div>
            ) : (
              currentMessages.map(msg => (
                <MessageBubble key={msg.id} message={msg} theme={theme} />
              ))
            )}
            {/* Scroll anchor — useRef target */}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div style={{
            padding: '12px', borderTop: `1px solid ${theme.border}`,
            background: theme.surface,
            display: 'flex', gap: '8px',
          }}>
            <input
              ref={inputRef}
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Message ${selectedMatch.name}...`}
              style={{
                flex: 1, padding: '10px 14px', borderRadius: '20px',
                border: `1px solid ${theme.border}`,
                background: theme.surfaceAlt, color: theme.text,
                fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit',
              }}
            />
            <button
              onClick={handleSend}
              disabled={!inputText.trim()}
              style={{
                padding: '10px 18px', borderRadius: '20px',
                background: inputText.trim() ? theme.gradient : theme.border,
                color: '#fff', border: 'none', cursor: inputText.trim() ? 'pointer' : 'not-allowed',
                fontSize: '0.9rem', fontWeight: 600,
              }}
            >
              Send
            </button>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.textMuted }}>
          Select a conversation
        </div>
      )}
    </div>
  );
}
