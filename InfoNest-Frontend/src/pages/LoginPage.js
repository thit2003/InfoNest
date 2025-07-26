// src/pages/LoginPage.js

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const infoNestLogo = '/logo.png';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState(''); // For success/error messages
  const navigate = useNavigate(); // Hook for navigation

  const [showPassword, setShowPassword] = useState(false);

  const API_BASE_URL = 'http://localhost:8000/api';

  const handleLogin = async (event) => {
    event.preventDefault();

    setMessage('');

    try {
      const response = await axios.post(`${API_BASE_URL}/login`, { username, password });

      if (response.status === 200 && response.data.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('username', username);
        setMessage('Login successful! Redirecting...');
        navigate('/home'); 
      } else {
        setMessage(response.data.error || 'Login failed. Please try again.');
      }
    } catch (error) {
      console.error('Login error:', error);
      if (error.response) {
        setMessage(error.response.data.error || 'Login failed: Invalid credentials.');
      } else if (error.request) {
        setMessage('Network error. Server might be down or unreachable.');
      } else {
        setMessage('An unexpected error occurred. Please try again.');
      }
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="login-page-container" style={{
        fontFamily: 'Arial, sans-serif', margin: 0, backgroundColor: '#e6f4ea',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh'
    }}>
      <header className="header" style={{
          display: 'flex', alignItems: 'center', gap: '10px', padding: '20px',
          position: 'absolute', top: 0, left: 0, width: '100%', boxSizing: 'border-box'
      }}>
        <img src={infoNestLogo} alt="InfoNest Logo" className="circle-logo" style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover' }}/>
        <h1 className="page-title" style={{ fontSize: '24px', fontWeight: 'bold', color: '#1a202c' }}>InfoNest Login</h1>
      </header>

      <main className="form-container" style={{
          display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1
      }}>
        <div className="form-box" style={{
            background: '#d4f5d3', padding: '30px', borderRadius: '20px', width: '300px',
            boxShadow: '0 0 10px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Welcome Back</h2>
          <form onSubmit={handleLogin}>
            <input
              type="text" 
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={{
                  width: '100%', padding: '10px', marginBottom: '15px',
                  border: '1px solid #ccc', borderRadius: '8px', boxSizing: 'border-box'
              }}
            />
        
            <div style={{ position: 'relative', width: '100%' }}>
              <input
                type={showPassword ? 'text' : 'password'} 
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                    width: '100%', 
                    padding: '10px',
                    marginBottom: '15px',
                    border: '1px solid #ccc',
                    borderRadius: '8px',
                    boxSizing: 'border-box'
                }}
              />
        
              <button
                type="button"
                onClick={togglePasswordVisibility}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-90%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1.1em',
                  color: '#4CAF50' 
                }}
              >
                {showPassword ? '🙈' : '🤫'}
              </button>
            </div>

            <div className="extras" style={{ textAlign: 'right', marginBottom: '15px' }}>
              <Link to="#" style={{ color: '#4CAF50', textDecoration: 'none' }}>Forgot Password?</Link>
            </div>
            <button type="submit" style={{
                width: '100%', padding: '10px', backgroundColor: '#2f855a',
                color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer'
            }}>Log in</button>
          </form>
          {message && <p style={{ color: message.includes('successful') ? 'green' : 'red', textAlign: 'center', marginTop: '15px' }}>{message}</p>}
          <p className="switch-link" style={{ marginTop: '15px', textAlign: 'center', fontSize: '14px' }}>
            Don’t have an account? <Link to="/register" style={{ color: '#4CAF50', textDecoration: 'none' }}>Register</Link>
          </p>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;