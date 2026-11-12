import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, XCircle, Clock, ArrowRight } from 'lucide-react';
import { BillingAPI } from '../../lib/api';
import { PageLoader } from '../../components/ui/Primitives';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import { apiErrorMessage } from '../../lib/http';

const POLL_MS = 3000;
const MAX_POLLS = 40; // ~2 minutes

/**
 * Note: the Enawga backend does not currently expose a per-order status
 * lookup (no GET /billing/orders/{outTradeNo}/status route), only
 * GET /billing/subscription (latest active/pending subscription) and
 * GET /billing/history. So this page polls /billing/subscription and
 * treats an "active" status as payment confirmation.
 */
export default function BillingSuccess() {
  const { refreshUser, isAuthenticated } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [error, setError] = useState(null);
  const [attempts, setAttempts] = useState(0);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    let cancelled = false;
    let interval;

    const poll = async () => {
      try {
        const { data } = await BillingAPI.subscription();
        if (cancelled) return;
        setSubscription(data);
        if (data && data.status === 'active') {
          clearInterval(interval);
          await refreshUser();
          localStorage.removeItem('enawga_last_order');
        }
      } catch (err) {
        if (!cancelled) {
          setError(apiErrorMessage(err, 'Could not check subscription status.'));
          clearInterval(interval);
        }
      } finally {
        if (!cancelled) setAttempts((a) => a + 1);
      }
    };

    poll();
    interval = setInterval(poll, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  useEffect(() => {
    if (attempts >= MAX_POLLS && subscription?.status !== 'active') {
      setTimedOut(true);
    }
  }, [attempts, subscription]);

  const content = () => {
    if (!isAuthenticated) {
      return (
        <StatusBlock
          icon={<Clock size={40} className="text-warning" />}
          title="Log in to confirm your payment"
          desc="Log back in to your Enawga account and we'll confirm your Telebirr payment automatically."
        />
      );
    }
    if (error) {
      return <StatusBlock icon={<XCircle size={40} className="text-danger" />} title="Something went wrong" desc={error} />;
    }
    if (subscription?.status === 'active') {
      return (
        <StatusBlock
          icon={<CheckCircle2 size={40} className="text-success" />}
          title="Payment confirmed"
          desc={`Your ${subscription.plan} plan is now active. Welcome aboard!`}
        />
      );
    }
    if (timedOut) {
      return (
        <StatusBlock
          icon={<Clock size={40} className="text-warning" />}
          title="Still processing"
          desc="Telebirr confirmations can occasionally take a little longer. Check the billing page in a minute — it'll update as soon as we hear back."
        />
      );
    }
    return (
      <StatusBlock
        icon={<Clock size={40} className="text-warning" />}
        title="Waiting for Telebirr confirmation"
        desc="This usually takes a few seconds. Keep this page open — we'll update automatically."
        loading
      />
    );
  };

  return (
    <div>
      <Navbar />
      <div className="container" style={{ padding: '80px 24px', display: 'flex', justifyContent: 'center' }}>
        <div className="card card-pad text-center" style={{ maxWidth: 460, width: '100%' }}>
          {isAuthenticated && !subscription && !error ? <PageLoader label="Confirming your payment with Telebirr…" /> : content()}
          <Link to={isAuthenticated ? '/app/billing' : '/login'} className="btn btn-primary btn-block mt-6">
            {isAuthenticated ? 'Go to billing' : 'Log in'} <ArrowRight size={15} />
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}

function StatusBlock({ icon, title, desc, loading }) {
  return (
    <div>
      <div className="flex" style={{ justifyContent: 'center', marginBottom: 16 }}>{loading ? <span className="spinner spinner-lg" /> : icon}</div>
      <h2 style={{ fontSize: 20, marginBottom: 8 }}>{title}</h2>
      <p>{desc}</p>
    </div>
  );
}
