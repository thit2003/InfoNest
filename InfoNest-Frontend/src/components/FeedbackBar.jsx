import React, { useState } from 'react';
import { submitFeedback } from '../api/feedback';
import '../styles/Feedback.css';

export default function FeedbackBar({ historyId }) {
  const [submitted, setSubmitted] = useState(false);
  const [openComment, setOpenComment] = useState(false);
  const [comment, setComment] = useState('');
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
    if (sending || submitted || !comment.trim()) return;
    try {
      setSending(true);
      await submitFeedback({ token, historyId, rating: 'neutral', comment: comment.trim() });
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
          <textarea
            placeholder="Tell us what went wrong or how to improve..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={1000}
          />
          <div className="fbk-actions">
            <button className="fbk-cancel" onClick={() => setOpenComment(false)} disabled={sending}>Cancel</button>
            <button className="fbk-submit" onClick={handleSubmitComment} disabled={sending || !comment.trim()}>Submit</button>
          </div>
        </div>
      )}
    </div>
  );
}