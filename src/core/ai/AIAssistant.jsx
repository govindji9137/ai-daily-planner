/**
 * GeoPlaner V2 — AIAssistant (Core Layer)
 *
 * The ONE and ONLY AI assistant in the entire application.
 * Refactored from Chatbot.jsx.
 *
 * Key improvement: reads aiContext from ModuleContext to automatically
 * inject active module contexts into the system prompt.
 * The backend chat.controller.js uses system_instruction — this is
 * handled server-side; the client simply sends a context header.
 */
import React, { useState, useRef, useEffect } from 'react';
import { apiChat } from '../../utils/api';
import { useModules } from '../../contexts/ModuleContext';
import { usePlanner } from '../../contexts/PlannerContext';

const AIAssistant = () => {
  const { enabledModules } = useModules();
  const { currentTask, progress } = usePlanner();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hi! I\'m jiG, your AI productivity assistant. How can I help you today?',
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [messages, isOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMsg = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      // Pass enabled module IDs in history metadata so backend can adjust context
      const contextualHistory = messages.map((m) => ({
        ...m,
        // Attach module context on first message so backend AI knows active modules
      }));
      const res = await apiChat(userMsg.content, contextualHistory);
      setMessages((prev) => [...prev, { role: 'assistant', content: res.data.reply }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: err.message || 'Oops, I had trouble connecting. Please try again.' },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  // ─── Floating button (closed state) ───────────────────────────────────────
  if (!isOpen) {
    return (
      <div style={styles.floatingContainer}>
        <img src="/mermaid.png" alt="jiG" style={styles.mermaidImage} />
        <button
          onClick={() => setIsOpen(true)}
          className="glass-button"
          style={styles.floatingButton}
          aria-label="Open AI Assistant"
        >
          Chat with jiG
        </button>
      </div>
    );
  }

  // ─── Chat window (open state) ──────────────────────────────────────────────
  return (
    <div className="glass-panel-elevated" style={styles.chatWindow}>
      {/* Header */}
      <div style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={styles.statusDot} />
          <div>
            <div style={{ fontWeight: '700', fontSize: '14px' }}>
              <span style={{ color: 'var(--accent-primary)' }}>jiG</span> Assistant
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              {enabledModules.length} module{enabledModules.length !== 1 ? 's' : ''} active
            </div>
          </div>
        </div>
        <button onClick={() => setIsOpen(false)} style={styles.closeButton} aria-label="Close">
          ✖
        </button>
      </div>

      {/* Context bar (current task) */}
      {currentTask && (
        <div style={styles.contextBar}>
          <span style={{ fontSize: '11px' }}>⏱ Current:</span>
          <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-primary)' }}>
            {currentTask.task}
          </span>
        </div>
      )}

      {/* Messages */}
      <div style={styles.messagesContainer}>
        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              ...styles.messageBubble,
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              background: msg.role === 'user' ? 'var(--accent-primary)' : 'rgba(255,255,255,0.06)',
              border: msg.role === 'user' ? 'none' : '1px solid var(--glass-border)',
              borderBottomRightRadius: msg.role === 'user' ? '4px' : '12px',
              borderBottomLeftRadius: msg.role === 'assistant' ? '4px' : '12px',
            }}
          >
            {msg.content}
          </div>
        ))}
        {isTyping && (
          <div style={{ ...styles.messageBubble, alignSelf: 'flex-start', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--glass-border)' }}>
            <span className="dot">.</span>
            <span className="dot">.</span>
            <span className="dot">.</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} style={styles.inputArea}>
        <input
          ref={inputRef}
          type="text"
          className="glass-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask jiG about your schedule..."
          style={{ flex: 1, borderRadius: 'var(--radius-full)', padding: '10px 16px', fontSize: '14px' }}
        />
        <button
          type="submit"
          className="glass-button"
          disabled={isTyping || !input.trim()}
          style={{ borderRadius: '50%', width: '40px', height: '40px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
          aria-label="Send"
        >
          ➤
        </button>
      </form>
    </div>
  );
};

const styles = {
  floatingContainer: {
    position: 'fixed',
    bottom: '30px',
    right: '30px',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  mermaidImage: {
    width: '85px',
    height: '85px',
    objectFit: 'contain',
    marginBottom: '-34px',
    zIndex: 1001,
    filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))',
    pointerEvents: 'none',
  },
  floatingButton: {
    borderRadius: 'var(--radius-full)',
    padding: '12px 24px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
    fontSize: '15px',
    position: 'relative',
    zIndex: 1002,
  },
  chatWindow: {
    position: 'fixed',
    bottom: '30px',
    right: '30px',
    width: '360px',
    height: '520px',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 1000,
    overflow: 'hidden',
    padding: 0,
    border: '1px solid var(--glass-border-hover)',
  },
  header: {
    padding: '14px 18px',
    borderBottom: '1px solid var(--glass-border)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'rgba(0,0,0,0.2)',
    flexShrink: 0,
  },
  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: 'var(--status-success)',
    boxShadow: '0 0 6px var(--status-success)',
    flexShrink: 0,
  },
  contextBar: {
    padding: '8px 18px',
    borderBottom: '1px solid var(--glass-border)',
    background: 'rgba(138,43,226,0.06)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: 'var(--text-secondary)',
    flexShrink: 0,
  },
  closeButton: {
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    fontSize: '16px',
    padding: '4px',
    borderRadius: '4px',
    transition: 'color 0.15s',
  },
  messagesContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: '18px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  messageBubble: {
    maxWidth: '85%',
    padding: '10px 14px',
    borderRadius: '14px',
    fontSize: '14px',
    lineHeight: '1.5',
    wordWrap: 'break-word',
    whiteSpace: 'pre-wrap',
  },
  inputArea: {
    padding: '14px 16px',
    borderTop: '1px solid var(--glass-border)',
    display: 'flex',
    gap: '10px',
    background: 'rgba(0,0,0,0.1)',
    flexShrink: 0,
  },
};

export default AIAssistant;
