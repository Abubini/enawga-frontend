import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { PageLoader } from '../../components/ui/Primitives';

export default function OAuthCallback() {
  const { setTokenFromOAuth } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    const hash = window.location.hash.replace('#', '');
    const params = new URLSearchParams(hash);
    const token = params.get('token');

    if (!token) {
      toast.error('Google sign-in did not return a token.');
      navigate('/login', { replace: true });
      return;
    }

    setTokenFromOAuth(token)
      .then(() => {
        toast.success('Signed in with Google.');
        navigate('/app', { replace: true });
      })
      .catch(() => {
        toast.error('Could not complete Google sign-in.');
        navigate('/login', { replace: true });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <PageLoader label="Finishing sign-in…" />;
}
