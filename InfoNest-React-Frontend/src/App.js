// src/App.js

import React from 'react';
// --- ADD 'Link' HERE ---
import { Routes, Route, Navigate, Link } from 'react-router-dom';

// Import your page components
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';

const App = () => {
  return (
    <Routes>
      {/* Default route redirects to /login */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      {/* Protected route - HomePage component handles the token check internally */}
      <Route path="/home" element={<HomePage />} />
      {/* Fallback for any unmatched routes */}
      <Route path="*" element={
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          minHeight: '100vh', backgroundColor: '#e6f4ea', fontSize: '24px', color: '#333'
        }}>
          <h1>404 - Page Not Found</h1>
          <p>The page you are looking for does not exist.</p>
          {/* This is the Link component that needed importing */}
          <Link to="/login" style={{ color: '#4CAF50', textDecoration: 'none', marginTop: '20px' }}>Go to Login</Link>
        </div>
      } />
    </Routes>
  );
};

export default App;