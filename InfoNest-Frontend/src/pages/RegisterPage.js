// src/pages/RegisterPage.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BACKEND_API_BASE } from '../config';

const infoNestLogo = '/logo.png';

const RegisterPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState(''); // For success/error messages
  const navigate = useNavigate(); // Hook for navigation

  const [showPassword, setShowPassword] = useState(false);

  const handleRegister = async (event) => {
    event.preventDefault(); // Prevent default form submission

    setMessage(''); // Clear previous messages

    try {
      const response = await axios.post(`${BACKEND_API_BASE}/register`, { username, password });

      if (response.status === 201) { // 201 Created is expected for successful registration
        setMessage('Registration successful! You can now log in.');
        // Optionally, auto-navigate to login after a delay
        setTimeout(() => {
          navigate('/login');
        }, 1500);
      } else {
        setMessage(response.data.error || 'Registration failed. Please try again.');
      }
    } catch (error) {
      console.error('Registration error:', error);
      if (error.response) {
        // Server responded with a status other than 2xx (e.g., 400)
        setMessage(error.response.data.error || 'Registration failed: Invalid input.');
      } else if (error.request) {
        // Request was made but no response received (e.g., server down, network issue)
        setMessage('Network error. Server might be down or unreachable.');
      } else {
        // Something else happened in setting up the request
        setMessage('An unexpected error occurred during registration.');
      }
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="register-page-container" style={{
        fontFamily: 'Arial, sans-serif', margin: 0, backgroundColor: '#e6f4ea',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh'
    }}>
      <header className="header" style={{
          display: 'flex', alignItems: 'center', gap: '10px', padding: '20px',
          position: 'absolute', top: 0, left: 0, width: '100%', boxSizing: 'border-box'
      }}>
        <img src={infoNestLogo} alt="InfoNest Logo" className="circle-logo" style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover' }}/>
        <h1 className="page-title" style={{ fontSize: '24px', fontWeight: 'bold', color: '#1a202c' }}>InfoNest Register</h1>
      </header>

      <main className="form-container" style={{
          display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1
      }}>
        <div className="form-box" style={{
            background: '#d4f5d3', padding: '30px', borderRadius: '20px', width: '300px',
            boxShadow: '0 0 10px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Create Account</h2>
          <form onSubmit={handleRegister}>
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
                type={showPassword ? 'text' : 'password'} // Dynamically change type
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                    width: '100%', // Input takes full width of its container
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

            <button type="submit" style={{
                width: '100%', padding: '10px', backgroundColor: '#2f855a',
                color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer'
            }}>Register</button>
          </form>
          {message && <p style={{ color: message.includes('successful') ? 'green' : 'red', textAlign: 'center', marginTop: '15px' }}>{message}</p>}
          <p className="switch-link" style={{ marginTop: '15px', textAlign: 'center', fontSize: '14px' }}>
            Already have an account? <Link to="/login" style={{ color: '#4CAF50', textDecoration: 'none' }}>Login</Link>
          </p>
        </div>
      </main>
    </div>
  );
};

export default RegisterPage;