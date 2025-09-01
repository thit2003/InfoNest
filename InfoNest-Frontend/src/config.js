// Central API base. In production this is baked in at build time.
// REACT_APP_BACKEND_URL should be like: https://infonest-sgyi.onrender.com
const RAW_BASE = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

// Include /api here so components can just append endpoints like /login
export const BACKEND_API_BASE = `${RAW_BASE.replace(/\/$/, '')}/api`;

export default BACKEND_API_BASE;