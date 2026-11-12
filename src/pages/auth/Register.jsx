import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, UserPlus } from 'lucide-react';
import AuthLayout from './AuthLayout';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { apiErrorMessage } from '../../lib/http';
import { AuthAPI } from '../../lib/api';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    try {
      const data = await register(email, password, name);
      toast.success('Account created — check your email for a verification code.');
      navigate('/verify-email', { state: { userId: data.user_id, email: data.email } });
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not create your account.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start free with Instant Chat, upgrade whenever you're ready."
      footer={
        <>
          Already have an account? <Link to="/login">Log in</Link>
        </>
      }
    >
      <a href={AuthAPI.googleLoginUrl()} className="btn btn-outline btn-block">
        Continue with Google
      </a>
      <div className="auth-divider">or sign up with email</div>

      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="name">Full name</label>
          <input
            id="name"
            className="input"
            placeholder="Abebe Bekele"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
          />
        </div>

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
          <label htmlFor="password">Password</label>
          <div className="input-group">
            <input
              id="password"
              type={showPw ? 'text' : 'password'}
              className="input"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
            <button type="button" className="input-icon-btn" onClick={() => setShowPw((s) => !s)} tabIndex={-1}>
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <span className="hint">Minimum 8 characters.</span>
        </div>

        <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
          {loading ? 'Creating account…' : (<><UserPlus size={16} /> Create account</>)}
        </button>

        <p style={{ fontSize: 12, marginTop: 16, textAlign: 'center' }}>
          By signing up you agree to Enawga's terms of service and privacy policy.
        </p>
      </form>
    </AuthLayout>
  );
}
