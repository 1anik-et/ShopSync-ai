import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ChatInterface from '../components/ChatInterface';
import { Sparkles, TrendingUp, Zap, Search } from 'lucide-react';
import './Stylist.css';

const Stylist = () => {
  const [lastAIResponse, setLastAIResponse] = useState('');
  const [context, setContext] = useState({ theme: 'General', profile: 'Not set' });
  const navigate = useNavigate();

  const handleAIResponse = (responseText) => {
    setLastAIResponse(responseText);

    // Try to detect context from AI response
    const lower = responseText.toLowerCase();
    if (lower.includes('wedding')) setContext(prev => ({ ...prev, theme: 'Wedding Attire' }));
    else if (lower.includes('summer')) setContext(prev => ({ ...prev, theme: 'Summer Style' }));
    else if (lower.includes('casual')) setContext(prev => ({ ...prev, theme: 'Casual Everyday' }));
    else if (lower.includes('formal') || lower.includes('business')) setContext(prev => ({ ...prev, theme: 'Formal / Business' }));
    else if (lower.includes('date')) setContext(prev => ({ ...prev, theme: 'Date Night' }));
    else if (lower.includes('winter')) setContext(prev => ({ ...prev, theme: 'Winter Essentials' }));
    else if (lower.includes('athletic') || lower.includes('gym')) setContext(prev => ({ ...prev, theme: 'Athletic Wear' }));
    else if (lower.includes('sneaker') || lower.includes('shoe')) setContext(prev => ({ ...prev, theme: 'Footwear' }));
  };

  // Extract product recommendations from AI response
  const extractRecommendations = () => {
    if (!lastAIResponse) return [];
    const lines = lastAIResponse.split('\n');
    return lines
      .filter(line => line.trim().startsWith('•') || line.trim().startsWith('-'))
      .map((line, i) => {
        const text = line.replace(/^[•\-]\s*/, '').replace(/\*\*/g, '').trim();
        // Try to extract a searchable term from the recommendation
        const searchTerm = text.split(/[—\-:,]/)[0].trim().toLowerCase();
        return { id: i, text, searchTerm };
      })
      .filter(r => r.text.length > 0)
      .slice(0, 6);
  };

  const recommendations = extractRecommendations();

  const quickPrompts = [
    { label: '👔 Formal Outfit', prompt: 'Suggest a formal outfit for a business meeting' },
    { label: '☀️ Summer Style', prompt: 'What should I wear in Indian summer?' },
    { label: '👟 Best Sneakers', prompt: 'Recommend the best sneakers under Rs. 5000' },
    { label: '💪 Gym Wear', prompt: 'What are the best gym outfits for men?' },
  ];

  return (
    <div className="stylist-page animate-enter">
      <header className="mb-4">
        <div className="stylist-title-row">
          <div>
            <h1 className="text-gradient">
              <Sparkles size={28} style={{display: 'inline', verticalAlign: 'middle', marginRight: '8px'}} />
              AI Stylist
            </h1>
            <p className="text-secondary mt-2">Your personal fashion consultant powered by AI. Ask anything about style, sizing, or trends.</p>
          </div>
        </div>
      </header>

      <div className="stylist-layout mt-8">
        <div className="stylist-chat-container">
          <ChatInterface onAIResponse={handleAIResponse} />
        </div>
        
        <div className="stylist-suggestions">
          {/* Context Panel */}
          <div className="glass-panel p-6 context-panel">
            <h3 className="mb-4 flex-center" style={{justifyContent: 'flex-start', gap: '8px'}}>
              <Zap size={18} className="text-gradient" /> Current Context
            </h3>
            
            <div className="context-card mb-4">
              <span className="text-muted text-sm">Theme</span>
              <p className="font-semibold">{context.theme}</p>
            </div>
            
            <div className="context-card">
              <span className="text-muted text-sm">Status</span>
              <p className="flex-center text-gradient mt-1 gap-1" style={{justifyContent: 'flex-start'}}>
                <span>{lastAIResponse ? '🟢 Active Session' : '⏳ Waiting for input'}</span>
              </p>
            </div>
          </div>

          {/* Quick Prompts */}
          {!lastAIResponse && (
            <div className="glass-panel p-6 mt-4 quick-prompts-panel">
              <h3 className="mb-4 flex-center" style={{justifyContent: 'flex-start', gap: '8px'}}>
                <TrendingUp size={18} /> Quick Start
              </h3>
              <div className="quick-prompts-grid">
                {quickPrompts.map((qp, i) => (
                  <button
                    key={i}
                    className="quick-prompt-btn"
                    onClick={() => {
                      // This dispatches a custom event that ChatInterface can listen to
                      window.dispatchEvent(new CustomEvent('chat-quick-prompt', { detail: qp.prompt }));
                    }}
                  >
                    {qp.label}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Live Recommendations */}
          <div className="glass-panel p-6 mt-4 suggestion-products">
            <h3 className="mb-4 flex-center" style={{justifyContent: 'flex-start', gap: '8px'}}>
              <Search size={18} /> Live Recommendations
            </h3>
            {recommendations.length > 0 ? (
              <div className="recommendation-list">
                {recommendations.map(rec => (
                  <div 
                    key={rec.id} 
                    className="recommendation-item glass-panel" 
                    onClick={() => {
                      if (rec.searchTerm.length > 2) {
                        navigate(`/compare?q=${encodeURIComponent(rec.searchTerm)}`);
                      }
                    }}
                  >
                    <span className="rec-text">{rec.text}</span>
                    {rec.searchTerm.length > 2 && (
                      <span className="rec-search-icon">
                        <Search size={12} />
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state text-muted text-center pt-8 pb-8">
                Chat with the stylist to see recommendations appear here.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Stylist;
