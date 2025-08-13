import React, { useState, useRef, useEffect } from 'react';
import './App.css';

function App() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { 
      speaker: 'BOT', 
      text: 'Hello! I\'m your Vodafone Assistant. How can I help you today?' 
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    setIsLoading(true);
    setMessages(prev => [...prev, { speaker: 'USER', text: input }]);
    
    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: input })
      });
      
      const data = await response.json();
      setMessages(prev => [...prev, { 
        speaker: 'BOT', 
        text: data.answer || "I couldn't find an answer. Please contact Vodafone support at 12345 for help."
      }]);
    } catch (err) {
      setMessages(prev => [...prev, { 
        speaker: 'BOT', 
        text: '⚠️ Network error. Please check your connection and try again.'
      }]);
    } finally {
      setIsLoading(false);
      setInput('');
    }
  };

  return (
    <div className="app">
      <header>
        <h1>Vodafone Buddy</h1>
      </header>

      <div className="chat-container">
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.speaker.toLowerCase()}`}>
            <strong>{msg.speaker}:</strong> {msg.text}
          </div>
        ))}
        {isLoading && (
          <div className="message bot">
            <strong>BOT:</strong> <span className="thinking">Connecting to Vodafone...</span>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about Vodafone services..."
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? '...' : 'Send'}
        </button>
      </form>
    </div>
  );
}

export default App;
