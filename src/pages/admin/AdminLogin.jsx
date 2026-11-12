import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, KeyRound } from 'lucide-react';
import Logo from '../../components/ui/Logo';
import ThemeToggle from '../../components/ui/ThemeToggle';
import { useAdmin } from '../../context/AdminContext';
import { apiErrorMessage } from '../../lib/http';
import '../auth/Auth.css';

export default function AdminLogin() {
  const [key, setKey] = useState('');
  const [error, setError] = useState(null);
  const { login, verifying } = useAdmin();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await login(key);
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(apiErrorMessage(err, 'That admin key was rejected by the backend.'));
    }
  };

  return (
    <div className="auth-shell" style={{ gridTemplateColumns: '1fr' }}>
      <div className="auth-panel" style={{ margin: '0 auto' }}>
        <div className="auth-panel-top">
          <Logo />
          <ThemeToggle />
        </div>
        <div className="auth-form-wrap fade-in-up">
          <h1 className="auth-title">Enawga Admin</h1>
          <p className="auth-subtitle">
            This is a separate, internal area. It's protected by the backend's{' '}
            <code>X-Admin-Key</code> header (your API server's <code>SECRET_KEY</code> env
            variable) — not by a normal user login.
          </p>

          <div className="alert alert-warning mb-4">
            <ShieldAlert size={16} />
            <div>Only enter this on a trusted machine — the key is kept in this tab's session storage and sent on every admin request.</div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="adminKey">Admin key (SECRET_KEY)</label>
              <input
                id="adminKey"
                type="password"
                className="input"
                placeholder="Paste the backend SECRET_KEY"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                required
                autoFocus
              />
            </div>
            {error && <div className="alert alert-danger mb-4">{error}</div>}
            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={verifying || !key}>
              {verifying ? 'Verifying…' : (<><KeyRound size={16} /> Enter admin console</>)}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}