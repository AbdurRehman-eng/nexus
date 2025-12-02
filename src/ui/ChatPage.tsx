/**
 * Chat Page UI Component
 * 
 * Color scheme:
 * - Deep Burgundy: #4B0908
 * - Soft Gray: #E7EBF3
 * - White: #FFFFFF
 * - Black: #000000
 */

import React, { useState } from 'react';

export const ChatPage: React.FC = () => {
  const [message, setMessage] = useState('');

  const containerStyle: React.CSSProperties = {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#E7EBF3', // Soft Gray background
    fontFamily: 'system-ui, -apple-system, sans-serif',
  };

  const headerStyle: React.CSSProperties = {
    backgroundColor: '#4B0908', // Deep Burgundy
    color: '#FFFFFF',
    padding: '1rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };

  const channelNameStyle: React.CSSProperties = {
    fontSize: '1.25rem',
    fontWeight: '600',
  };

  const mainStyle: React.CSSProperties = {
    flex: 1,
    overflowY: 'auto',
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  };

  const messageCardStyle: React.CSSProperties = {
    backgroundColor: '#FFFFFF', // White card
    padding: '1rem',
    borderRadius: '4px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  };

  const messageHeaderStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '0.5rem',
    fontSize: '0.9rem',
  };

  const usernameStyle: React.CSSProperties = {
    fontWeight: '600',
    color: '#4B0908', // Deep Burgundy
  };

  const timestampStyle: React.CSSProperties = {
    color: '#666',
    fontSize: '0.85rem',
  };

  const messageContentStyle: React.CSSProperties = {
    color: '#000000', // Black text
    lineHeight: '1.5',
  };

  const inputAreaStyle: React.CSSProperties = {
    backgroundColor: '#FFFFFF', // White
    padding: '1rem',
    borderTop: '1px solid #E7EBF3',
    display: 'flex',
    gap: '0.5rem',
  };

  const inputStyle: React.CSSProperties = {
    flex: 1,
    padding: '0.75rem',
    border: '1px solid #E7EBF3',
    borderRadius: '4px',
    fontSize: '1rem',
    color: '#000000', // Black text
  };

  const sendButtonStyle: React.CSSProperties = {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#4B0908', // Deep Burgundy
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '4px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
  };

  // Placeholder messages
  const placeholderMessages = [
    { id: '1', username: 'Alice', content: 'Hello, everyone!', timestamp: '10:00 AM' },
    { id: '2', username: 'Bob', content: 'Hi Alice! How are you?', timestamp: '10:02 AM' },
    { id: '3', username: 'Alice', content: 'I\'m doing great, thanks!', timestamp: '10:03 AM' },
  ];

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <div style={channelNameStyle}># general</div>
        <div>Nexus</div>
      </div>
      <div style={mainStyle}>
        {placeholderMessages.map((msg) => (
          <div key={msg.id} style={messageCardStyle}>
            <div style={messageHeaderStyle}>
              <span style={usernameStyle}>{msg.username}</span>
              <span style={timestampStyle}>{msg.timestamp}</span>
            </div>
            <div style={messageContentStyle}>{msg.content}</div>
          </div>
        ))}
      </div>
      <div style={inputAreaStyle}>
        <input
          type="text"
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          style={inputStyle}
        />
        <button
          style={sendButtonStyle}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#5A1A19';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = '#4B0908';
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
};

