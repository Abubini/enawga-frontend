import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { API_URL } from '../../lib/http';
import { PageLoader } from '../../components/ui/Primitives';

/**
 * Google's OAuth redirect_uri is configured on the backend as
 * `${FRONTEND_URL}/auth/google/callback` (see app/core/auth/oauth.py), so Google
 * sends the browser here with ?code=&state=. This page's only job is to hand
 * those params to the backend's own /auth/google/callback route via a full
 * page navigation, so the backend can exchange the code, set the refresh
 * cookie, and redirect on to /auth/callback#token=... .
 */
export default function GoogleCallbackBridge() {
  const [params] = useSearchParams();

  useEffect(() => {
    const code = params.get('code');
    const state = params.get('state');
    if (!code || !state) {
      window.location.href = '/login';
      return;
    }
    window.location.href = `${API_URL}/auth/google/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`;
  }, [params]);

  return <PageLoader label="Connecting your Google account…" />;
}
