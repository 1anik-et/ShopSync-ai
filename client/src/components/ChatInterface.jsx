import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Sparkles, Loader, RotateCcw, Trash2 } from 'lucide-react';
import { fetchChatHistory, sendChatMessage, clearChatHistory } from '../services/api';
import './ChatInterface.css';

/**
 * Renders markdown-like text: **bold**, bullet points, and line breaks.
 */
function renderFormattedText(text) {
  if (!text) return null;

  const lines = text.split('\n');
  return lines.map((line, i) => {
    // Render bold text (**text**)
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    const rendered = parts.map((part, j) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={j}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });

    // Bullet points
    const trimmed = line.trim();
    if (trimmed.startsWith('•') || trimmed.startsWith('-')) {
      return (
        <div key={i} className="chat-bullet">
          <span className="bullet-dot">•</span>
          <span>{rendered.map((r, ri) => typeof r === 'string' ? r.replace(/^[•\-]\s*/, '') : r)}</span>
        </div>
      );
    }

    // Empty line → spacing
    if (trimmed === '') {
      return <div key={i} className="chat-spacer" />;
    }

    return <div key={i}>{rendered}</div>;
  });
}

const WELCOME_MESSAGE = {
  id: 'welcome',
  sender: 'ai',
  text: "Hey! 👋 I'm your **ShopSync Stylist** — an AI-powered fashion consultant. I can help you with:\n\n• **Outfit recommendations** for any occasion\n• **Size guidance** across different retailers\n• **Style trends** and seasonal picks\n• **Price comparisons** for the best deals\n\nWhat are you looking for today?",
};

const ChatInterface = ({ onAIResponse }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastError, setLastError] = useState(null);
  const messagesEndRef = useRef(null);
  const lastFailedMessage = useRef(null);

  // Load chat history on mount
  useEffect(() => {
    fetchChatHistory()
      .then(history => {
        if (history.length === 0) {
          setMessages([WELCOME_MESSAGE]);
        } else {
          setMessages(history);
        }
        setLoading(false);
      })
      .catch(() => {
        setMessages([WELCOME_MESSAGE]);
        setLoading(false);
      });
  }, []);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async (retryText) => {
    const textToSend = retryText || input.trim();
    if (!textToSend || isTyping) return;

    if (!retryText) setInput('');
    setLastError(null);

    // Optimistically add user message
    const tempUserMsg = { id: 'temp_' + Date.now(), sender: 'user', text: textToSend };
    setMessages(prev => {
      // Remove any previous error messages
      const filtered = prev.filter(m => !m.isError);
      return [...filtered, tempUserMsg];
    });
    setIsTyping(true);
    lastFailedMessage.current = textToSend;

    try {
      const { userMessage, aiMessage } = await sendChatMessage(textToSend);
      
      // Replace temp message with real ones
      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== tempUserMsg.id);
        return [...filtered, userMessage, aiMessage];
      });

      // Notify parent of AI response for recommendations panel
      if (onAIResponse) {
        onAIResponse(aiMessage.text);
      }

      lastFailedMessage.current = null;
    } catch (err) {
      setLastError(err.message);
      // Show error state with retry button
      setMessages(prev => [
        ...prev,
        { 
          id: 'err_' + Date.now(), 
          sender: 'ai', 
          text: "I'm having trouble connecting right now. Please try again in a moment.", 
          isError: true 
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleRetry = () => {
    if (lastFailedMessage.current) {
      // Remove the error message before retrying
      setMessages(prev => prev.filter(m => !m.isError));
      handleSend(lastFailedMessage.current);
    }
  };

  const handleClear = async () => {
    try {
      await clearChatHistory();
      setMessages([WELCOME_MESSAGE]);
    } catch {
      setMessages([WELCOME_MESSAGE]);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chat-interface glass-panel">
      <div className="chat-header">
        <div className="chat-header-left">
          <Sparkles className="chat-icon text-gradient" size={24} />
          <div>
            <h3>ShopSync Stylist</h3>
            <span className="online-indicator"><span className="dot"></span> AI Online</span>
          </div>
        </div>
        {messages.length > 1 && (
          <button className="btn-icon chat-clear-btn" onClick={handleClear} title="Clear chat history">
            <Trash2 size={16} />
          </button>
        )}
      </div>
      
      <div className="chat-messages">
        {loading ? (
          <div className="flex-center" style={{ padding: '3rem', gap: '0.5rem' }}>
            <Loader size={20} className="spin-animation" />
            <span className="text-muted">Loading conversation...</span>
          </div>
        ) : (
          messages.map(msg => (
            <div key={msg.id || msg._id} className={`chat-bubble-wrapper ${msg.sender === 'ai' ? 'ai' : 'user'} ${msg.isError ? 'error-msg' : ''}`}>
              <div className={`avatar ${msg.sender}`}>
                {msg.sender === 'ai' ? <Bot size={16} /> : <User size={16} />}
              </div>
              <div className={`chat-bubble ${msg.sender} ${msg.isError ? 'error-bubble' : ''}`}>
                {msg.sender === 'ai' ? renderFormattedText(msg.text) : msg.text}
                {msg.isError && (
                  <button className="retry-btn" onClick={handleRetry}>
                    <RotateCcw size={14} /> Try Again
                  </button>
                )}
              </div>
            </div>
          ))
        )}
        
        {isTyping && (
          <div className="chat-bubble-wrapper ai">
            <div className="avatar ai"><Bot size={16} /></div>
            <div className="chat-bubble ai typing-indicator">
              <span className="typing-dot"></span>
              <span className="typing-dot"></span>
              <span className="typing-dot"></span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      <div className="chat-input-area">
        <input 
          type="text" 
          placeholder="Ask about styles, sizes, or trends..." 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isTyping}
        />
        <button className="btn-icon send-btn" onClick={() => handleSend()} disabled={isTyping || !input.trim()}>
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};

export default ChatInterface;
