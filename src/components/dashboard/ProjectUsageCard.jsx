import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Gauge } from 'lucide-react';
import { DashboardAPI } from '../../lib/api';
import { formatNumber, timeAgo } from '../../lib/format';

/** Tokens and conversations used by ONE project. Shown at the top of every project page. */
export default function ProjectUsageCard({ projectId }) {
  const [usage, setUsage] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setUsage(null);
    DashboardAPI.projectUsage(projectId)
      .then((res) => { if (!cancelled) setUsage(res.data); })
      .catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; };
  }, [projectId]);

  if (failed) return null;

  return (
    <div className="card card-pad usage-card mb-6">
      <div className="usage-card-head">
        <div className="usage-card-title"><Gauge size={16} /> Usage of this project</div>
        <Link to={`/app/projects/${projectId}`} className="btn btn-outline btn-sm">
          Full analytics <ArrowRight size={13} />
        </Link>
      </div>

      {!usage ? (
        <div className="usage-grid"><div className="usage-skeleton" /><div className="usage-skeleton" /><div className="usage-skeleton" /><div className="usage-skeleton" /></div>
      ) : (
        <div className="usage-grid">
          <div>
            <div className="usage-label">Tokens this month</div>
            <div className="usage-value">{formatNumber(usage.tokens_month)}</div>
            <div className="usage-sub">
              {usage.plan_share_pct != null ? `${usage.plan_share_pct}% of your plan's tokens` : 'Unlimited plan'}
            </div>
          </div>
          <div>
            <div className="usage-label">Tokens · last 30 days</div>
            <div className="usage-value">{formatNumber(usage.tokens_30d)}</div>
            <div className="usage-sub">{formatNumber(usage.conversations_30d)} conversations</div>
          </div>
          <div>
            <div className="usage-label">Tokens · all time</div>
            <div className="usage-value">{formatNumber(usage.tokens_total)}</div>
            <div className="usage-sub">{formatNumber(usage.conversations_total)} conversations</div>
          </div>
          <div>
            <div className="usage-label">Conversations this month</div>
            <div className="usage-value">{formatNumber(usage.conversations_month)}</div>
            <div className="usage-sub">{usage.last_activity ? `Last active ${timeAgo(usage.last_activity)}` : 'No activity yet'}</div>
          </div>
        </div>
      )}
    </div>
  );
}