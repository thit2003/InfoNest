// Add a category select alongside comment submission

import React, { useState } from 'react';
import { submitFeedback } from '../api/feedback';
import '../styles/Feedback.css';

const CATEGORIES = [
  { value: '', label: 'No category' },
  { value: 'incorrect', label: 'Incorrect' },
  { value: 'incomplete', label: 'Incomplete' },
  { value: 'offensive', label: 'Offensive' },
  { value: 'bug', label: 'Bug' },
  { value: 'other', label: 'Other' },
];

export default function FeedbackBar({ historyId }) {
  const [submitted, setSubmitted] = useState(false);
  const [openComment, setOpenComment] = useState(false);
  const [comment, setComment] = useState('');
  const [category, setCategory] = useState('');
  const [sending, setSending] = useState(false);

  const token = localStorage.getItem('token');

  const handleRate = async (rating) => {
    if (sending || submitted) return;
    try {
      setSending(true);
      await submitFeedback({ token, historyId, rating });
      setSubmitted(true);
    } catch (e) {
      alert('Could not submit feedback. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleSubmitComment = async () => {
    if (sending || submitted || (!comment.trim() && !category)) return;
    try {
      setSending(true);
      await submitFeedback({
        token,
        historyId,
        rating: 'neutral',
        category,
        comment: comment.trim(),
      });
      setSubmitted(true);
      setOpenComment(false);
      setComment('');
    } catch (e) {
      alert('Could not submit feedback. Please try again.');
    } finally {
      setSending(false);
    }
  };

  if (submitted) {
    return <div className="fbk-bar fbk-thanks">Thanks for your feedback!</div>;
  }

  return (
    <div className="fbk-bar">
      <span className="fbk-label">Was this helpful?</span>
      <button className="fbk-chip up" onClick={() => handleRate('up')} disabled={sending}>👍 Yes</button>
      <button className="fbk-chip down" onClick={() => handleRate('down')} disabled={sending}>👎 No</button>
      <button className="fbk-chip comment" onClick={() => setOpenComment(true)} disabled={sending}>✍️ Comment</button>

      {openComment && (
        <div className="fbk-comment">
          <label style={{ display: 'block', fontSize: 12, color: '#666', marginBottom: 4 }}>Category (optional)</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{ marginBottom: 8, padding: '6px 8px', borderRadius: 8, border: '1px solid #e3e3e3' }}
          >
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>

          <textarea
            placeholder="Tell us what went wrong or how to improve..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={1000}
          />
          <div className="fbk-actions">
            <button className="fbk-cancel" onClick={() => setOpenComment(false)} disabled={sending}>Cancel</button>
            <button className="fbk-submit" onClick={handleSubmitComment} disabled={sending || (!comment.trim() && !category)}>Submit</button>
          </div>
        </div>
      )}
    </div>
  );
}