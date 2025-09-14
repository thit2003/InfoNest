import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { BACKEND_API_BASE } from '../config';

const GoogleSignIn = ({ onSuccess, onError, buttonText = 'Continue with Google' }) => {
  const loadedRef = useRef(false);
  const [loading, setLoading] = useState(false);

  const log = (...a) => console.log('[GoogleSignIn]', ...a);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    log('Runtime client ID:', process.env.REACT_APP_GOOGLE_CLIENT_ID);

    if (!process.env.REACT_APP_GOOGLE_CLIENT_ID) {
      onError && onError('Google Client ID missing. Check .env and restart dev server.');
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (!window.google) {
        onError && onError('Google script failed to expose window.google');
        return;
      }
      try {
        window.google.accounts.id.initialize({
          client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
          callback: async (resp) => {
            log('Credential callback fired:', !!resp.credential);
            if (!resp.credential) {
              onError && onError('No credential returned from Google.');
              return;
            }
            try {
              setLoading(true);
              const r = await axios.post(`${BACKEND_API_BASE}/auth/google`, { idToken: resp.credential });
              log('Backend /auth/google response:', r.data);
              if (r.data?.success) {
                onSuccess && onSuccess(r.data);
              } else {
                onError && onError(r.data.error || 'Google auth failed.');
              }
            } catch (e) {
              log('Network error posting to backend', e);
              onError && onError('Network error during Google auth.');
            } finally {
              setLoading(false);
            }
          }
        });

        window.google.accounts.id.renderButton(
          document.getElementById('gsi-btn-slot'),
          { theme: 'outline', size: 'large', width: 250 }
        );

      } catch (err) {
        log('Initialization exception', err);
        onError && onError('Failed to initialize Google Identity.');
      }
    };
    script.onerror = () => onError && onError('Failed to load Google script.');
    document.head.appendChild(script);
    return () => script.remove();
  }, [onSuccess, onError]);

  return (
    <div style={{ marginTop: 10 }}>
      <div id="gsi-btn-slot" style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }} />
      <button
        type="button"
        disabled={loading}
        onClick={() => window.google && window.google.accounts.id.prompt()}
        style={{
            width: '100%', padding: '10px',
            backgroundColor: '#fff', border: '1px solid #4285F4',
            color: '#4285F4', fontWeight: 'bold',
            borderRadius: '4px', cursor: 'pointer'
        }}
      >
        {loading ? 'Authenticating...' : buttonText}
      </button>
    </div>
  );
};

export default GoogleSignIn;