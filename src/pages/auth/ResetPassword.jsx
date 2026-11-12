import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { KeyRound } from 'lucide-react';
import AuthLayout from './AuthLayout';
import { AuthAPI } from '../../lib/api';
import { apiErrorMessage } from '../../lib/http';
import { useToast } from '../../context/ToastContext';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      toast.error('Missing or invalid reset link.');
      return;
    }
    if (password !== confirm) {
      toast.error('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await AuthAPI.resetPassword({ token, new_password: password });
      toast.success('Password reset — please log in.');
      navigate('/login');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'This reset link is invalid or expired.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Choose a new password"
      subtitle="Make it at least 8 characters."
      footer={<Link to="/login">Back to login</Link>}
    >
      {!token && <div className="alert alert-danger mb-4">This link is missing a reset token. Request a new one from the forgot-password page.</div>}
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="password">New password</label>
          <input
            id="password"
            type="password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="confirm">Confirm password</label>
          <input
            id="confirm"
            type="password"
            className="input"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            minLength={8}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
          {loading ? 'Resetting…' : (<><KeyRound size={16} /> Reset password</>)}
        </button>
      </form>
    </AuthLayout>
  );
}
