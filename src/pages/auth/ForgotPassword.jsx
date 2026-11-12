import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import AuthLayout from './AuthLayout';
import { AuthAPI } from '../../lib/api';
import { apiErrorMessage } from '../../lib/http';
import { useToast } from '../../context/ToastContext';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await AuthAPI.forgotPassword({ email });
      setSent(true);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not process your request.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="We'll email you a link to reset your password."
      footer={
        <>
          Remembered it? <Link to="/login">Back to login</Link>
        </>
      }
    >
      {sent ? (
        <div className="alert alert-success">
          If that email is registered, a reset link is on its way. Check your inbox (and spam
          folder).
        </div>
      ) : (
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
            />
          </div>
          <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
            {loading ? 'Sending…' : (<><Mail size={16} /> Send reset link</>)}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
