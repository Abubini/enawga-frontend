import { useEffect, useState } from 'react';
import { Database, RefreshCcw, CheckCircle2, XCircle } from 'lucide-react';
import { AdminAPI } from '../../lib/adminApi';
import { apiErrorMessage } from '../../lib/http';
import '../dashboard/Dashboard.css';

export default function AdminHealth() {
  const [result, setResult] = useState(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState(null);

  const check = async () => {
    setChecking(true);
    setError(null);
    try {
      const { data } = await AdminAPI.dbHealth();
      setResult(data);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not reach the health endpoint.'));
      setResult(null);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => { check(); }, []);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>System health</h1>
          <p>Checks the backend's database connection via <code>GET /admin/health/db</code>.</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-outline btn-sm" onClick={check} disabled={checking}>
            <RefreshCcw size={14} /> {checking ? 'Checking…' : 'Re-check'}
          </button>
        </div>
      </div>

      <div className="card card-pad" style={{ maxWidth: 460 }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="stat-icon" style={{ marginBottom: 0 }}><Database size={18} /></div>
          <h3 style={{ fontSize: 15.5 }}>PostgreSQL connection</h3>
        </div>

        {error ? (
          <div className="alert alert-danger"><XCircle size={16} /> {error}</div>
        ) : result?.status === 'ok' ? (
          <div className="alert alert-success"><CheckCircle2 size={16} /> Database is reachable and responding.</div>
        ) : result ? (
          <div className="alert alert-danger"><XCircle size={16} /> {result.detail || 'Database check failed.'}</div>
        ) : (
          <p style={{ fontSize: 13.5 }}>Checking…</p>
        )}
      </div>
    </div>
  );
}