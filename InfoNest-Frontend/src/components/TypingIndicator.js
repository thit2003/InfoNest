import React from 'react';
import './TypingIndicator.css';

const TypingIndicator = ({ visible }) => {
  if (!visible) return null;
  return (
    <div
      className="typing-indicator"
      role="status"
      aria-live="polite"
      aria-label="InfoNest is thinking"
    >
      <div className="dots">
        <span className="dot dot1" />
        <span className="dot dot2" />
        <span className="dot dot3" />
      </div>
      <span className="typing-text">InfoNest is thinking…</span>
    </div>
  );
};

export default TypingIndicator;