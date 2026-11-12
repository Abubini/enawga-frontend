import { useEffect, useState } from 'react';
import { Check, CreditCard, ExternalLink } from 'lucide-react';
import { BillingAPI } from '../../lib/api';
import { PLANS } from '../../lib/plans';
import { PageLoader, StatusBadge } from '../../components/ui/Primitives';
import { ConfirmDialog } from '../../components/ui/Modal';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { apiErrorMessage } from '../../lib/http';
import { formatDate, formatNumber } from '../../lib/format';
import '../public/Landing.css';
import './Dashboard.css';

export default function Billing() {
  const { user, refreshUser } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cycle, setCycle] = useState('monthly');
  const [checkingOut, setCheckingOut] = useState(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const toast = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const [sub, hist] = await Promise.all([BillingAPI.subscription(), BillingAPI.history()]);
      setSubscription(sub.data);
      setHistory(hist.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCheckout = async (plan) => {
    setCheckingOut(plan);
    try {
      const { data } = await BillingAPI.createPayment({ plan, billing_cycle: cycle === 'annual' ? 'annual' : 'monthly' });
      localStorage.setItem('enawga_last_order', data.out_trade_no);
      toast.info('Redirecting to Telebirr to complete payment…');
      window.location.href = data.to_pay_url;
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not start checkout.'));
      setCheckingOut(null);
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await BillingAPI.cancel();
      toast.success('Subscription will be cancelled at period end.');
      await load();
      await refreshUser();
      setConfirmCancel(false);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not cancel subscription.'));
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return <PageLoader label="Loading billing information…" />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Billing</h1>
          <p>Manage your Enawga plan and payment history. All charges are in ETB via Telebirr.</p>
        </div>
      </div>

      {subscription && (
        <div className="card card-pad mb-6">
          <div className="flex items-center justify-between" style={{ flexWrap: 'wrap', gap: 12 }}>
            <div>
              <p style={{ fontSize: 12, color: 'var(--color-slate)', marginBottom: 4 }}>Current subscription</p>
              <div className="flex items-center gap-2">
                <span className="badge badge-gold" style={{ fontSize: 14, padding: '4px 12px' }}>{subscription.plan.toUpperCase()}</span>
                <StatusBadge status={subscription.status} />
                {subscription.cancel_at_period_end && <span className="badge badge-warning">Cancels at period end</span>}
              </div>
            </div>
            <div className="text-center">
              <p style={{ fontSize: 12, color: 'var(--color-slate)' }}>Amount</p>
              <p style={{ fontWeight: 700, color: 'var(--color-navy)' }}>{formatNumber(subscription.amount_etb)} ETB</p>
            </div>
            <div className="text-center">
              <p style={{ fontSize: 12, color: 'var(--color-slate)' }}>Renews / expires</p>
              <p style={{ fontWeight: 700, color: 'var(--color-navy)' }}>{formatDate(subscription.expires_at)}</p>
            </div>
            {subscription.status === 'active' && !subscription.cancel_at_period_end && (
              <button className="btn btn-outline btn-sm" onClick={() => setConfirmCancel(true)}>Cancel plan</button>
            )}
          </div>
        </div>
      )}

      <div className="section-title">
        <h2 style={{ fontSize: 17 }}>Available plans</h2>
        <div className="flex gap-2">
          <button className={`btn btn-sm ${cycle === 'monthly' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setCycle('monthly')}>Monthly</button>
          <button className={`btn btn-sm ${cycle === 'annual' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setCycle('annual')}>Annual</button>
        </div>
      </div>

      <div className="pricing-grid mb-8">
        {PLANS.map((p) => {
          const price = cycle === 'annual' ? p.annualEtb : p.monthlyEtb;
          const isCurrent = user?.plan === p.id;
          return (
            <div key={p.id} className={`card price-card ${p.featured ? 'featured' : ''}`}>
              {p.featured && <span className="featured-tag">Most popular</span>}
              <h3>{p.name}</h3>
              <p className="price-sub">{p.tagline}</p>
              <div className="price-amount">
                {price === 0 ? 'Free' : `${price.toLocaleString()} ETB`}
                {price > 0 && <span>{cycle === 'annual' ? '/yr' : '/mo'}</span>}
              </div>
              <ul className="price-features">
                {p.features.map((f) => <li key={f}><Check size={15} /> {f}</li>)}
              </ul>
              {isCurrent ? (
                <button className="btn btn-outline btn-block" disabled>Current plan</button>
              ) : p.id === 'free' ? (
                <button className="btn btn-outline btn-block" disabled>Included</button>
              ) : (
                <button className="btn btn-primary btn-block" onClick={() => handleCheckout(p.id)} disabled={checkingOut === p.id}>
                  <CreditCard size={15} /> {checkingOut === p.id ? 'Redirecting…' : `Pay with Telebirr`}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="section-title"><h2 style={{ fontSize: 17 }}>Billing history</h2></div>
      {!history.length ? (
        <p style={{ fontSize: 13.5 }}>No billing history yet.</p>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Plan</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
            <tbody>
              {history.map((h) => (
                <tr key={h.id}>
                  <td style={{ textTransform: 'capitalize' }}>{h.plan}</td>
                  <td>{formatNumber(h.amount_etb)} ETB</td>
                  <td><StatusBadge status={h.status} /></td>
                  <td>{formatDate(h.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        onConfirm={handleCancel}
        title="Cancel your subscription?"
        message="You'll keep access until the end of the current billing period, then your account will move to the Free plan."
        confirmLabel="Cancel subscription"
        loading={cancelling}
      />
    </div>
  );
}
