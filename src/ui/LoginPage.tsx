/**
 * Login Page UI Component
 * 
 * Color scheme:
 * - Deep Burgundy: #4B0908
 * - Soft Gray: #E7EBF3
 * - White: #FFFFFF
 * - Black: #000000
 */

import React, { useState } from 'react';

export const LoginPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    backgroundColor: '#E7EBF3', // Soft Gray background
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: '#FFFFFF', // White card
    padding: '2rem',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    width: '100%',
    maxWidth: '400px',
  };

  const titleStyle: React.CSSProperties = {
    color: '#4B0908', // Deep Burgundy
    fontSize: '2rem',
    fontWeight: 'bold',
    marginBottom: '1.5rem',
    textAlign: 'center',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.75rem',
    marginBottom: '1rem',
    border: '1px solid #E7EBF3',
    borderRadius: '4px',
    fontSize: '1rem',
    color: '#000000', // Black text
    boxSizing: 'border-box',
  };

  const buttonStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.75rem',
    backgroundColor: '#4B0908', // Deep Burgundy
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '4px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    marginBottom: '1rem',
  };

  const toggleStyle: React.CSSProperties = {
    textAlign: 'center',
    color: '#000000', // Black text
    fontSize: '0.9rem',
  };

  const linkStyle: React.CSSProperties = {
    color: '#4B0908', // Deep Burgundy
    cursor: 'pointer',
    textDecoration: 'underline',
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <h1 style={titleStyle}>Nexus</h1>
        <form onSubmit={(e) => e.preventDefault()}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={inputStyle}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
          />
          <button
            type="submit"
            style={buttonStyle}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#5A1A19';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#4B0908';
            }}
          >
            {isLogin ? 'Login' : 'Register'}
          </button>
        </form>
        <div style={toggleStyle}>
          {isLogin ? (
            <>
              Don't have an account?{' '}
              <span
                style={linkStyle}
                onClick={() => setIsLogin(false)}
              >
                Register
              </span>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <span
                style={linkStyle}
                onClick={() => setIsLogin(true)}
              >
                Login
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

