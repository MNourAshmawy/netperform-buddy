import React, { useState } from 'react';
import './App.css'; // Create this file for basic styling

function App() {
  const [input, setInput] = useState('');
  const [conversation, setConversation] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    setIsLoading(true);
    setError(null);
    
    try {
      // Add user message first
      setConversation(prev => [...prev, { speaker: 'USER', text: input }]);
      
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: input })
      });

      if (!response.ok) throw new Error('Network response was not ok');
      
      const data = await response.json();
      setConversation(prev => [...prev, { speaker: 'BOT', text: data.answer }]);
    } catch (err) {
      console.error('API Error:', err);
      setError('Failed to get response. Please try again.');
      setConversation(prev => [...prev, { 
        speaker: 'BOT', 
        text: 'Error: Unable to connect to server.' 
      }]);
    } finally {
      setIsLoading(false);
      setInput('');
    }
  };

  return (
    <div className="app-container">
      <h1>NetPerform Buddy</h1>
      
      <div className="chat-window">
        {conversation.map((msg, index) => (
          <div key={index} className={`message ${msg.speaker.toLowerCase()}`}>
            <strong>{msg.speaker}:</strong> {msg.text}
          </div>
        ))}
        {isLoading && <div className="message bot">BOT: Thinking...</div>}
      </div>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit} className="input-form">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask me something..."
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  );
}

export default App;
