import React from 'react';
import { Link } from 'react-router-dom';

export default function HelpFab({ hidden = false }) {
  if (hidden) return null;
  return (
    <Link
      to="/feedback"
      className="help-fab"
      aria-label="Feedback & Help"
      title="Feedback & Help"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22"
           viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <circle cx="12" cy="12" r="10" strokeWidth="1.8" />
        <path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 1.8-2.5 2-2.5 3.5"
              strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="12" cy="17" r="1" fill="currentColor" />
      </svg>
    </Link>
  );
}