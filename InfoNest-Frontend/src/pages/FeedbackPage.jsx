import React, { useEffect, useState } from 'react';
import { getMyFeedback } from '../api/feedback';
import { useNavigate } from 'react-router-dom';
import '../styles/Feedback.css';
import { Link } from 'react-router-dom';

export default function FeedbackPage() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');
  const token = localStorage.getItem('token');

  useEffect(() => {
    (async () => {
      try {
        const res = await getMyFeedback(token);
        setItems(res.data || []);
      } catch (e) {
        setError('Failed to load your feedback.');
      }
    })();
  }, [token]);

  if (error) return <div style={{ padding: 16 }}>{error}</div>;
  if (items === null) return <div style={{ padding: 16 }}>Loading…</div>;

  return (
    <div className="feedback-page">
      <Link
        to="/home"
        className="feedback-close-btn"
        aria-label="Close and go back to Home"
        title="Close"
      >
        ×
      </Link>
      <div style={{ padding: 16}}>
      <h2>My Feedback</h2>
      {items.length === 0 && <p>No feedback yet.</p>}
      <ul style={{ listStyle: 'none', padding: 0}}>
        {items.map((f) => (
          <li key={f._id} style={{ border: '1px solid #eee', borderRadius: 8, padding: 12, marginBottom: 8 }}>
            <div style={{ fontSize: 12, color: '#666' }}>
              {new Date(f.createdAt).toLocaleString()} • {f.rating || 'neutral'} {f.category ? `• ${f.category}` : ''}
            </div>
            {f.comment && <div style={{ marginTop: 6 }}>{f.comment}</div>}
            {f.history && (
              <div style={{ marginTop: 6, fontSize: 12, color: '#888' }}>
                Chat item: {f.history}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
    </div>
  );
}