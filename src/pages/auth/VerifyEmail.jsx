import { useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import AuthLayout from './AuthLayout';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { apiErrorMessage } from '../../lib/http';
import { AuthAPI } from '../../lib/api';

export default function VerifyEmail() {
  const location = useLocation();
  const navigate = useNavigate();
  const { verifyEmail } = useAuth();
  const toast = useToast();

  const [userId, setUserId] = useState(location.state?.userId || '');
  const email = location.state?.email;
  const [digits, setDigits] = useState(Array(6).fill(''));
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const inputsRef = useRef([]);

  const otp = digits.join('');

  const handleDigit = (i, value) => {
    const v = value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[i] = v;
    setDigits(next);
    if (v && i < 5) inputsRef.current[i + 1]?.focus();
  };

  const handlePaste = (e) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!text) return;
    e.preventDefault();
    setDigits(text.padEnd(6, '').split('').slice(0, 6));
  };

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) inputsRef.current[i - 1]?.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId) {
      toast.error('Missing user reference — please register again.');
      return;
    }
    if (otp.length !== 6) {
      toast.error('Enter the 6-digit code sent to your email.');
      return;
    }
    setLoading(true);
    try {
      await verifyEmail(userId, otp);
      toast.success('Email verified — welcome to Enawga!');
      navigate('/app', { replace: true });
    } catch (err) {
      toast.error(apiErrorMessage(err, 'That code is invalid or expired.'));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!userId) {
      toast.error('Missing user reference — please register again.');
      return;
    }
    setResending(true);
    try {
      await AuthAPI.resendVerify(userId);
      toast.success('Verification code resent.');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not resend the code.'));
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthLayout
      title="Verify your email"
      subtitle={email ? `Enter the 6-digit code we sent to ${email}.` : 'Enter the 6-digit code we emailed you.'}
    >
      {!userId && (
        <div className="alert alert-warning mb-4">
          We couldn't find your registration session. Paste your user ID below if you have it, or
          register again.
          <input
            className="input mt-2"
            placeholder="User ID"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          />
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="otp-input" onPaste={handlePaste}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => (inputsRef.current[i] = el)}
              className="input"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={(e) => handleDigit(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
            />
          ))}
        </div>

        <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
          {loading ? 'Verifying…' : (<><ShieldCheck size={16} /> Verify email</>)}
        </button>
      </form>

      <p className="text-center mt-4" style={{ fontSize: 13.5 }}>
        Didn't get a code?{' '}
        <button className="btn btn-ghost btn-sm" onClick={handleResend} disabled={resending} style={{ padding: '2px 8px' }}>
          {resending ? 'Sending…' : 'Resend code'}
        </button>
      </p>
    </AuthLayout>
  );
}
