import React, { useState, useRef, useEffect } from 'react';
import { apiChat } from '../utils/api';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! I am jiG, your personal daily planner assistant. How can I help you manage your time today?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      // Pass previous context (excluding the very first greeting if preferred, but we can pass all)
      const res = await apiChat(userMsg.content, messages);
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Oops, I had trouble connecting to my brain. Please try again later.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  if (!isOpen) {
    return (
      <div style={styles.floatingContainer}>
        <img src="/mermaid.png" alt="Mermaid" style={styles.mermaidImage} />
        <button 
          onClick={() => setIsOpen(true)}
          className="glass-button"
          style={styles.floatingButton}
        >
          Chat with jiG
        </button>
      </div>
    );
  }

  return (
    <div className="glass-panel" style={styles.chatWindow}>
      <div style={styles.header}>
        <div style={{fontWeight: 'bold'}}>
          <span style={{color: 'var(--accent-primary)'}}>jiG</span> Assistant
        </div>
        <button 
          onClick={() => setIsOpen(false)}
          style={styles.closeButton}
        >
          ✖
        </button>
      </div>

      <div style={styles.messagesContainer}>
        {messages.map((msg, idx) => (
          <div key={idx} style={{
            ...styles.messageBubble,
            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
            background: msg.role === 'user' ? 'var(--accent-primary)' : 'rgba(255,255,255,0.05)',
            border: msg.role === 'user' ? 'none' : '1px solid var(--glass-border)',
            borderBottomRightRadius: msg.role === 'user' ? '4px' : '12px',
            borderBottomLeftRadius: msg.role === 'assistant' ? '4px' : '12px',
          }}>
            {msg.content}
          </div>
        ))}
        {isTyping && (
          <div style={{...styles.messageBubble, alignSelf: 'flex-start', background: 'rgba(255,255,255,0.05)'}}>
            <span style={styles.dot}>.</span><span style={styles.dot}>.</span><span style={styles.dot}>.</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} style={styles.inputArea}>
        <input 
          type="text"
          className="glass-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask jiG about your schedule..."
          style={{flex: 1, borderRadius: '20px', padding: '10px 15px'}}
        />
        <button 
          type="submit"
          className="glass-button"
          disabled={isTyping || !input.trim()}
          style={{borderRadius: '50%', width: '40px', height: '40px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'}}
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
    marginBottom: '-33.9px', /* Pulls it down so it sits perfectly on the button */
    zIndex: 1001,
    filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))',
    pointerEvents: 'none', /* Ensures you can still click the button if she overlaps it */
  },
  floatingButton: {
    borderRadius: '30px',
    padding: '12px 24px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
    fontSize: '15px',
    position: 'relative',
    zIndex: 1002
  },
  chatWindow: {
    position: 'fixed',
    bottom: '30px',
    right: '30px',
    width: '350px',
    height: '500px',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
    zIndex: 1000,
    overflow: 'hidden',
    padding: 0
  },
  header: {
    padding: '15px 20px',
    borderBottom: '1px solid var(--glass-border)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'rgba(0,0,0,0.2)'
  },
  closeButton: {
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    fontSize: '16px'
  },
  messagesContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  messageBubble: {
    maxWidth: '85%',
    padding: '10px 14px',
    borderRadius: '12px',
    fontSize: '14px',
    lineHeight: '1.4',
    wordWrap: 'break-word'
  },
  inputArea: {
    padding: '15px',
    borderTop: '1px solid var(--glass-border)',
    display: 'flex',
    gap: '10px',
    background: 'rgba(0,0,0,0.1)'
  },
  dot: {
    animation: 'blink 1.4s infinite both',
    fontSize: '20px',
    lineHeight: '10px'
  }
};

export default Chatbot;
