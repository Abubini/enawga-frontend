import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Zap, Bot, Plug, Gauge, Layers, Target, Users, TrendingUp, TrendingDown, Plus, AlertTriangle,
  Lightbulb, MessageSquare, Languages, CalendarDays, ArrowRight,
} from 'lucide-react';
import { DashboardAPI } from '../../lib/api';
import GithubMark from '../../components/ui/GithubMark';
import { BarChart, HBarList, Meter } from '../../components/dashboard/Charts';
import { useAuth } from '../../context/AuthContext';
import { PlanBadge, StatusBadge, PageLoader, EmptyState } from '../../components/ui/Primitives';
import { formatNumber, timeAgo } from '../../lib/format';

import FaqExport from '../../components/dashboard/FaqExport';
import './Dashboard.css';

import { LangTag, RecentConversations } from '../../components/dashboard/QuestionBits';

const RANGES = [7, 30, 90];
const METRICS = [
  { key: 'queries', label: 'Conversations' },
  { key: 'tokens', label: 'Tokens' },
  { key: 'visitors', label: 'Visitors' },
];
const KIND_LABEL = { github: 'GitHub sync', hosted: 'Chatbot', api: 'API' };
const KIND_ICON = { github: GithubMark, hosted: Bot, api: Plug };

const manageLink = (row, kind) => {
  if (kind === 'github') return `/app/github/${row.repo_id}`;
  if (kind === 'hosted') return `/app/hosted/${row.id}`;
  return `/app/api/${row.id}`;
};

function languageName(code) {
  if (!code || code === 'unknown') return 'Unknown';
  try {
    return new Intl.DisplayNames(['en'], { type: 'language' }).of(code) || code;
  } catch {
    return code;
  }
}

function Trend({ current, previous }) {
  if (!previous) return <span className="trend trend-flat">No earlier data to compare</span>;
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct === 0) return <span className="trend trend-flat">Same as the previous period</span>;
  const Up = pct > 0;
  const Icon = Up ? TrendingUp : TrendingDown;
  return (
    <span className={`trend ${Up ? 'trend-up' : 'trend-down'}`}>
      <Icon size={13} /> {Math.abs(pct)}% vs previous period
    </span>
  );
}

export default function Overview() {
  const { user } = useAuth();
  const [days, setDays] = useState(30);
  const [metric, setMetric] = useState('queries');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async (range, first = false) => {
    if (first) setLoading(true); else setRefreshing(true);
    try {
      const res = await DashboardAPI.overview(range);
      setData(res.data);
      setError(null);
    } catch {
      setError('Could not load your dashboard. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(days, data === null); }, [days]); // eslint-disable-line react-hooks/exhaustive-deps

  const projection = useMemo(() => {
    if (!data) return null;
    const { tokens, token_limit: limit } = data.usage;
    const now = new Date();
    const day = now.getUTCDate();
    const daysInMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0)).getUTCDate();
    const projected = day > 0 ? Math.round((tokens / day) * daysInMonth) : 0;
    return { projected, over: !!limit && projected > limit };
  }, [data]);

  if (loading) return <PageLoader label="Loading your dashboard…" />;
  if (!data) {
    return (
      <div className="card"><EmptyState title="Dashboard unavailable" description={error || 'Please try again.'}
        action={<button className="btn btn-primary btn-sm" onClick={() => load(days, true)}>Retry</button>} /></div>
    );
  }

  const { usage, projects, timeline, totals, quality, monthly, languages, alerts } = data;
  const tokenPct = usage.token_limit ? Math.min(100, Math.round((usage.tokens / usage.token_limit) * 100)) : 0;
  const tokenTone = tokenPct >= 100 ? 'danger' : tokenPct >= 80 ? 'warning' : 'ok';
  const hasActivity = totals.queries > 0;

  return (
    <div className="dash">
      <div className="page-header">
        <div>
          <h1>Welcome back, {user?.name?.split(' ')[0]}</h1>
          <p>Everything happening across your Enawga workspace, in one place.</p>
        </div>
        <div className="page-header-actions">
          <PlanBadge plan={user?.plan} />
          {user?.plan === 'free' && <Link to="/app/billing" className="btn btn-primary btn-sm">Upgrade plan</Link>}
        </div>
      </div>

      <div className="quick-actions">
        <Link to="/app/hosted" className="btn btn-outline btn-sm"><Plus size={14} /> Hosted chatbot</Link>
        <Link to="/app/api" className="btn btn-outline btn-sm"><Plus size={14} /> Plug &amp; Play API</Link>
        <Link to="/app/github" className="btn btn-outline btn-sm"><Plus size={14} /> Connect GitHub repo</Link>
        <Link to="/app/instant" className="btn btn-ghost btn-sm"><Zap size={14} /> Instant chat</Link>
      </div>

      {alerts.length > 0 && (
        <div className="dash-alerts">
          {alerts.map((a, i) => (
            <div key={i} className={`alert alert-${a.level === 'danger' ? 'danger' : a.level === 'warning' ? 'warning' : 'info'}`}>
              {a.level === 'info' ? <Lightbulb size={16} /> : <AlertTriangle size={16} />}
              <div className="dash-alert-body">
                <strong>{a.title}</strong>
                {a.message && <span>{a.message}</span>}
              </div>
              {a.link && a.action && <Link to={a.link} className="dash-alert-action">{a.action} <ArrowRight size={13} /></Link>}
            </div>
          ))}
        </div>
      )}

      <div className="stat-grid">
        <div className="card stat-card">
          <div className="stat-icon"><Gauge size={18} /></div>
          <div className="stat-label">Tokens this month</div>
          <div className="stat-value">{formatNumber(usage.tokens)}</div>
          <div className="progress-bar mt-2"><div className={`progress-bar-fill meter-${tokenTone}`} style={{ width: `${usage.token_limit ? Math.max(tokenPct, usage.tokens ? 2 : 0) : 4}%` }} /></div>
          <div className="stat-sub">
            {usage.token_limit ? `${formatNumber(Math.max(usage.token_limit - usage.tokens, 0))} of ${formatNumber(usage.token_limit)} left` : 'Unlimited'}
          </div>
          {projection && usage.tokens > 0 && (
            <div className={`stat-sub ${projection.over ? 'text-danger' : ''}`}>
              On pace for ~{formatNumber(projection.projected)} by month end
            </div>
          )}
        </div>

        <div className="card stat-card">
          <div className="stat-icon"><MessageSquare size={18} /></div>
          <div className="stat-label">Conversations · last {days} days</div>
          <div className="stat-value">{formatNumber(totals.queries)}</div>
          <div className="stat-sub"><Trend current={totals.queries} previous={totals.prev_queries} /></div>
          <div className="stat-sub"><Users size={12} /> {formatNumber(quality.visitors || 0)} unique visitors</div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon"><Layers size={18} /></div>
          <div className="stat-label">Total projects</div>
          <div className="stat-value">{projects.total}</div>
          <div className="stat-chips">
            <span className="chip chip-static"><GithubMark size={11} /> {projects.counts.github} GitHub</span>
            <span className="chip chip-static"><Bot size={11} /> {projects.counts.hosted} chatbots</span>
            <span className="chip chip-static"><Plug size={11} /> {projects.counts.api} APIs</span>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon"><Target size={18} /></div>
          <div className="stat-label">Questions answered well</div>
          <div className="stat-value">{quality.answered_pct == null ? '—' : `${quality.answered_pct}%`}</div>
          <div className="stat-sub">
            {quality.low_confidence ? `${quality.low_confidence} need better documentation` : 'No gaps found'}
          </div>
          <div className="stat-sub">{quality.cache_hit_pct == null ? '' : `${quality.cache_hit_pct}% served instantly from cache`}</div>
        </div>
      </div>

      <div className="dash-row dash-row-main">
        <div className="card card-pad">
          <div className="card-head">
            <h3>Activity</h3>
            <div className="card-head-tools">
              <div className="seg">
                {METRICS.map((m) => (
                  <button key={m.key} className={metric === m.key ? 'active' : ''} onClick={() => setMetric(m.key)}>{m.label}</button>
                ))}
              </div>
              <div className="seg">
                {RANGES.map((r) => (
                  <button key={r} className={days === r ? 'active' : ''} onClick={() => setDays(r)}>{r}d</button>
                ))}
              </div>
            </div>
          </div>
          {hasActivity ? (
            <div className={refreshing ? 'is-refreshing' : ''}>
              <BarChart data={timeline} valueKey={metric} />
            </div>
          ) : (
            <div className="chart-empty">
              <CalendarDays size={22} />
              <p>No conversations in the last {days} days. Once people start chatting with your chatbots or API, you'll see the trend here.</p>
            </div>
          )}
        </div>

        <div className="card card-pad">
          <div className="card-head"><h3>Plan usage</h3><PlanBadge plan={data.plan} /></div>
          <div className="meters">
            <Meter label="Tokens this month" used={usage.tokens} limit={usage.token_limit} />
            {projects.meters.map((m) => <Meter key={m.key} label={m.label} used={m.used} limit={m.limit} />)}
          </div>
          {data.plan !== 'enterprise' && <Link to="/app/billing" className="btn btn-outline btn-sm w-full mt-4">See plans &amp; limits</Link>}
        </div>
      </div>

      <div className="section-title">
        <h2>Your projects</h2>
        <span className="hint">Performance in the last {days} days</span>
      </div>
      {projects.rows.length === 0 ? (
        <div className="card">
          <EmptyState
            title="No projects yet"
            description="Create a hosted chatbot, a Plug & Play API, or connect a GitHub repository to get started."
            action={
              <div className="flex gap-3" style={{ justifyContent: 'center' }}>
                <Link to="/app/hosted" className="btn btn-primary btn-sm">Create hosted chatbot</Link>
                <Link to="/app/github" className="btn btn-outline btn-sm">Connect GitHub</Link>
              </div>
            }
          />
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Project</th><th>Published as</th><th>Status</th><th>Conversations</th><th>Tokens · {days}d</th><th>Tokens · this month</th><th>Match quality</th><th>Last active</th>
              </tr>
            </thead>
            <tbody>
              {projects.rows.map((r) => (
                <tr key={r.id}>
                  <td>
                    <Link to={`/app/projects/${r.id}`} className="project-name project-link">{r.name}</Link>
                    <div className="hint">
                      {r.source === 'github' ? 'GitHub repository' : 'Uploaded documents'} · {formatNumber(r.documents)} file{r.documents === 1 ? '' : 's'}
                      {r.failed_documents > 0 && <span className="text-danger"> · {r.failed_documents} failed</span>}
                    </div>
                  </td>
                  <td>
                    <div className="chips">
                      {r.kinds.map((k) => {
                        const Icon = KIND_ICON[k];
                        return <Link key={k} to={manageLink(r, k)} className="chip"><Icon size={12} /> {KIND_LABEL[k]}</Link>;
                      })}
                    </div>
                  </td>
                  <td><StatusBadge status={r.status} /></td>
                  <td>{formatNumber(r.queries)}</td>
                  <td>{formatNumber(r.tokens)}</td>
                  <td>{formatNumber(r.tokens_month)}</td>
                  <td>{r.avg_score == null ? '—' : `${Math.round(r.avg_score * 100)}%`}</td>
                  <td>{r.last_activity ? timeAgo(r.last_activity) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="dash-row dash-row-even mt-6">
        <div className="card card-pad">
          <div className="card-head"><h3><MessageSquare size={16} /> Knowledge gaps</h3><FaqExport /></div>
          <p className="hint mb-2">Questions your assistants couldn't answer confidently. Add or update documentation to cover them.</p>
          {data.knowledge_gaps.length === 0 ? (
            <p className="empty-note">Nothing here. Your assistants are answering everything with confidence.</p>
          ) : (
            <ul className="q-list">
              {data.knowledge_gaps.map((g, i) => (
                <li key={i}>
                  <div className="q-text">{g.question}</div>
                  <div className="q-meta">
                    <span className="badge badge-warning">asked {g.count}×</span>
                    <span>{g.project}</span>
                    <LangTag code={g.language} />
                    <span>{timeAgo(g.last_asked)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card card-pad">
          <div className="card-head"><h3><MessageSquare size={16} /> Most asked questions</h3></div>
          {data.top_questions.length === 0 ? (
            <p className="empty-note">Popular questions will appear here once people start asking.</p>
          ) : (
            <ul className="q-list">
              {data.top_questions.map((q, i) => (
                <li key={i}>
                  <div className="q-text">{q.question}</div>
                  <div className="q-meta"><span className="badge badge-primary">{q.count}×</span><span>{q.project}</span><LangTag code={q.language} /></div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="dash-row dash-row-even mt-6">
        <div className="card card-pad">
          <div className="card-head"><h3><Languages size={16} /> Languages</h3></div>
          {languages.length === 0
            ? <p className="empty-note">No conversations yet.</p>
            : <HBarList items={languages} labelOf={(l) => languageName(l.language)} />}
        </div>
        <div className="card card-pad">
          <div className="card-head"><h3><CalendarDays size={16} /> Monthly token usage</h3></div>
          <BarChart data={monthly} valueKey="tokens" xKey="month" height={150} />
        </div>
      </div>

      <div className="card card-pad mt-6">
        <div className="card-head"><h3>Recent conversations</h3></div>
        <RecentConversations items={data.recent} showProject />
      </div>
    </div>
  );
}