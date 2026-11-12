import { Inbox, Loader2 } from 'lucide-react';

export function Spinner({ size = 'md' }) {
  return <span className={`spinner ${size === 'lg' ? 'spinner-lg' : ''}`} role="status" aria-label="Loading" />;
}

export function PageLoader({ label = 'Loading…' }) {
  return (
    <div className="page-loader flex-col items-center gap-3">
      <Spinner size="lg" />
      <p style={{ fontSize: 13 }}>{label}</p>
    </div>
  );
}

export function InlineLoader({ label }) {
  return (
    <span className="flex items-center gap-2" style={{ color: 'var(--color-slate)', fontSize: 13 }}>
      <Loader2 size={14} className="spin-icon" style={{ animation: 'spin 0.8s linear infinite' }} />
      {label}
    </span>
  );
}

export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon || <Inbox size={24} />}</div>
      <h3 style={{ fontSize: 16, marginBottom: 6 }}>{title}</h3>
      {description && <p style={{ maxWidth: 380, margin: '0 auto' }}>{description}</p>}
      {action && <div style={{ marginTop: 18 }}>{action}</div>}
    </div>
  );
}

const STATUS_STYLES = {
  ready: { cls: 'badge-success', label: 'Ready' },
  active: { cls: 'badge-success', label: 'Active' },
  done: { cls: 'badge-success', label: 'Done' },
  success: { cls: 'badge-success', label: 'Success' },
  paid: { cls: 'badge-success', label: 'Paid' },
  processing: { cls: 'badge-warning', label: 'Processing' },
  pending: { cls: 'badge-warning', label: 'Pending' },
  trialing: { cls: 'badge-warning', label: 'Trialing' },
  past_due: { cls: 'badge-warning', label: 'Past due' },
  failed: { cls: 'badge-danger', label: 'Failed' },
  error: { cls: 'badge-danger', label: 'Error' },
  cancelled: { cls: 'badge-neutral', label: 'Cancelled' },
  expired: { cls: 'badge-neutral', label: 'Expired' },
};

export function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || { cls: 'badge-neutral', label: status || 'Unknown' };
  return (
    <span className={`badge ${s.cls}`}>
      <span className="badge-dot" />
      {s.label}
    </span>
  );
}

const PLAN_STYLES = {
  free: 'badge-neutral',
  pro: 'badge-gold',
  enterprise: 'badge-primary',
};

export function PlanBadge({ plan }) {
  return <span className={`badge ${PLAN_STYLES[plan] || 'badge-neutral'}`}>{(plan || 'free').toUpperCase()}</span>;
}
