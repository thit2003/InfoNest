import axios from 'axios';
import { BACKEND_API_BASE } from '../config';

export async function submitFeedback({ token, historyId, rating, category, comment, meta }) {
  const res = await axios.post(
    `${BACKEND_API_BASE}/feedback`,
    { historyId, rating, category, comment, meta },
    { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
  );
  return res.data;
}

export async function getMyFeedback(token) {
  const res = await axios.get(`${BACKEND_API_BASE}/feedback/mine`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}