import { useEffect, useState } from 'react';
import { Users, FolderKanban, FileText, CreditCard, RefreshCcw } from 'lucide-react';
import { AdminAPI } from '../../lib/adminApi';
import { PageLoader } from '../../components/ui/Primitives';
import { useToast } from '../../context/ToastContext';
import { apiErrorMessage } from '../../lib/http';
import { formatNumber, formatDateTime } from '../../lib/format';
import '../dashboard/Dashboard.css';

export default function AdminOverview() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const toast = useToast();

  const load = async (silent = false) => {
    silent ? setRefreshing(true) : setLoading(true);
    try {
      const { data } = await AdminAPI.stats();
      setStats(data);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not load platform stats.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <PageLoader label="Loading platform stats…" />;
  if (!stats) return null;

  const planEntries = Object.entries(stats.plan_distribution || {});
  const maxPlanCount = Math.max(1, ...planEntries.map(([, c]) => c));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Platform overview</h1>
          <p>Live counts straight from the database via <code>GET /admin/stats</code>.</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-outline btn-sm" onClick={() => load(true)} disabled={refreshing}>
            <RefreshCcw size={14} /> {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      <div className="stat-grid">
        <div className="card stat-card">
          <div className="stat-icon"><Users size={18} /></div>
          <div className="stat-label">Total users</div>
          <div className="stat-value">{formatNumber(stats.users)}</div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon"><FolderKanban size={18} /></div>
          <div className="stat-label">Total projects</div>
          <div className="stat-value">{formatNumber(stats.projects)}</div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon"><FileText size={18} /></div>
          <div className="stat-label">Total documents</div>
          <div className="stat-value">{formatNumber(stats.documents)}</div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon"><CreditCard size={18} /></div>
          <div className="stat-label">Active subscriptions</div>
          <div className="stat-value">{formatNumber(stats.active_subscriptions)}</div>
        </div>
      </div>

      <div className="card card-pad">
        <h3 style={{ fontSize: 15.5, marginBottom: 16 }}>Plan distribution</h3>
        {planEntries.length === 0 ? (
          <p style={{ fontSize: 13.5 }}>No users yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {planEntries.map(([plan, count]) => (
              <div key={plan}>
                <div className="flex justify-between mb-2" style={{ fontSize: 13 }}>
                  <span style={{ textTransform: 'capitalize', fontWeight: 600, color: 'var(--color-navy)' }}>{plan}</span>
                  <span className="text-slate">{formatNumber(count)}</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-bar-fill" style={{ width: `${(count / maxPlanCount) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
        <p style={{ fontSize: 11.5, marginTop: 16 }}>Snapshot taken {formatDateTime(stats.timestamp)}</p>
      </div>
    </div>
  );
}