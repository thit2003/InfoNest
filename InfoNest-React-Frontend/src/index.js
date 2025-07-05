// src/index.js

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { BrowserRouter } from 'react-router-dom'; // Import BrowserRouter

// If you had a default index.css, you might want to keep it or remove it.
// For now, if you copied your CSS directly into component styles, you might not need this.
// import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter> {/* Wrap App with BrowserRouter to enable routing */}
      <App />
    </BrowserRouter>
  </React.StrictMode>
);