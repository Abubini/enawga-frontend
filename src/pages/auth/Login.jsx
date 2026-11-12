import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import AuthLayout from './AuthLayout';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { apiErrorMessage } from '../../lib/http';
import { AuthAPI } from '../../lib/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [needsVerify, setNeedsVerify] = useState(false);

  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setNeedsVerify(false);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      const dest = location.state?.from?.pathname || '/app';
      navigate(dest, { replace: true });
    } catch (err) {
      const detail = err?.response?.data?.detail;
      if (detail === 'Email not verified') setNeedsVerify(true);
      toast.error(apiErrorMessage(err, 'Could not log you in.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to manage your bots, API projects, and GitHub sync."
      footer={
        <>
          Don't have an account? <Link to="/register">Create one free</Link>
        </>
      }
    >
      {needsVerify && (
        <div className="alert alert-warning mb-4">
          Your email isn't verified yet.{' '}
          <Link to="/verify-email" state={{ email }} style={{ fontWeight: 700 }}>
            Verify it now
          </Link>
          .
        </div>
      )}

      <a href={AuthAPI.googleLoginUrl()} className="btn btn-outline btn-block">
        <GoogleIcon /> Continue with Google
      </a>
      <div className="auth-divider">or log in with email</div>

      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="email">Email address</label>
          <input
            id="email"
            type="email"
            className="input"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>

        <div className="field">
          <div className="flex justify-between">
            <label htmlFor="password">Password</label>
            <Link to="/forgot-password" style={{ fontSize: 12.5, color: 'var(--color-primary)', fontWeight: 600 }}>
              Forgot password?
            </Link>
          </div>
          <div className="input-group">
            <input
              id="password"
              type={showPw ? 'text' : 'password'}
              className="input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
            <button type="button" className="input-icon-btn" onClick={() => setShowPw((s) => !s)} tabIndex={-1}>
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
          {loading ? 'Logging in…' : (<><LogIn size={16} /> Log in</>)}
        </button>
      </form>
    </AuthLayout>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.4 0 10.3-1.8 14.1-5l-6.5-5.5C29.5 35.4 26.9 36 24 36c-5.3 0-9.7-3.4-11.3-8l-6.5 5C9.6 39.6 16.3 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.5l6.5 5.5C41.5 35.6 44 30.2 44 24c0-1.3-.1-2.7-.4-3.5z" />
    </svg>
  );
}
