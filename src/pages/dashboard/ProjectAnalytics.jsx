import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Bot, Plug, Gauge, MessageSquare, Target, Zap, Users, TrendingUp, TrendingDown, Lightbulb,
  Languages, CalendarDays, ExternalLink, HelpCircle, FileText,
} from 'lucide-react';
import { DashboardAPI } from '../../lib/api';
import GithubMark from '../../components/ui/GithubMark';
import { BarChart, HBarList } from '../../components/dashboard/Charts';
import FaqExport from '../../components/dashboard/FaqExport';
import { StatusBadge, PageLoader, EmptyState, PlanBadge } from '../../components/ui/Primitives';
import { formatNumber, timeAgo, formatDate } from '../../lib/format';
import './Dashboard.css';

import { LangTag, RecentConversations } from '../../components/dashboard/QuestionBits';

const RANGES = [7, 30, 90];
const FAQ_MINS = [10, 25, 50, 100];
const METRICS = [
  { key: 'queries', label: 'Conversations' },
  { key: 'tokens', label: 'Tokens' },
  { key: 'visitors', label: 'Visitors' },
];
const KIND_LABEL = { github: 'GitHub sync', hosted: 'Chatbot', api: 'API' };
const KIND_ICON = { github: GithubMark, hosted: Bot, api: Plug };

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
  const Icon = pct > 0 ? TrendingUp : TrendingDown;
  return (
    <span className={`trend ${pct > 0 ? 'trend-up' : 'trend-down'}`}>
      <Icon size={13} /> {Math.abs(pct)}% vs previous period
    </span>
  );
}

export default function ProjectAnalytics() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [days, setDays] = useState(30);
  const [faqMin, setFaqMin] = useState(25);
  const [metric, setMetric] = useState('queries');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async (first) => {
    if (first) setLoading(true); else setRefreshing(true);
    try {
      const res = await DashboardAPI.project(projectId, days, faqMin);
      setData(res.data);
      setNotFound(false);
    } catch (err) {
      if (err?.response?.status === 404) setNotFound(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [projectId, days, faqMin]);

  useEffect(() => { load(data === null); }, [load]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <PageLoader label="Loading project analytics…" />;
  if (notFound || !data) {
    return (
      <div className="card">
        <EmptyState
          title="Project not found"
          description="It may have been deleted, or it belongs to another account."
          action={<button className="btn btn-primary btn-sm" onClick={() => navigate('/app')}>Back to dashboard</button>}
        />
      </div>
    );
  }

  const { project, publishing, usage, totals, quality, timeline, faq } = data;
  const manage = { github: publishing.github ? `/app/github/${publishing.github.repo_id}` : null, hosted: `/app/hosted/${project.id}`, api: `/app/api/${project.id}` };
  const hasActivity = totals.queries > 0;

  return (
    <div className="dash">
      <button className="btn btn-ghost btn-sm mb-4" onClick={() => navigate('/app')}>
        <ArrowLeft size={14} /> Back to dashboard
      </button>

      <div className="page-header">
        <div>
          <h1>{project.name}</h1>
          <div className="flex items-center gap-2 mt-2" style={{ flexWrap: 'wrap' }}>
            <StatusBadge status={project.status} />
            <div className="chips">
              {project.kinds.map((k) => {
                const Icon = KIND_ICON[k];
                return <Link key={k} to={manage[k]} className="chip"><Icon size={12} /> {KIND_LABEL[k]}</Link>;
              })}
            </div>
            <span className="hint">
              {project.source === 'github' ? 'GitHub repository' : 'Uploaded documents'} · {formatNumber(project.documents)} file{project.documents === 1 ? '' : 's'} · created {formatDate(project.created_at)}
            </span>
          </div>
        </div>
        <div className="page-header-actions">
          {publishing.hosted && (
            <a href={publishing.hosted.public_url} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">
              <ExternalLink size={14} /> View chatbot
            </a>
          )}
          <FaqExport projectId={project.id} projectName={project.name} initialMin={faqMin} />
        </div>
      </div>

      <div className="stat-grid">
        <div className="card stat-card">
          <div className="stat-icon"><Gauge size={18} /></div>
          <div className="stat-label">Tokens this month</div>
          <div className="stat-value">{formatNumber(usage.tokens_month)}</div>
          <div className="stat-sub">
            {usage.plan_share_pct != null ? `${usage.plan_share_pct}% of your plan's ${formatNumber(usage.token_limit)} tokens` : 'Unlimited plan'}
          </div>
          <div className="stat-sub">{formatNumber(usage.tokens_total)} tokens all time</div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon"><MessageSquare size={18} /></div>
          <div className="stat-label">Conversations · last {days} days</div>
          <div className="stat-value">{formatNumber(totals.queries)}</div>
          <div className="stat-sub"><Trend current={totals.queries} previous={totals.prev_queries} /></div>
          <div className="stat-sub"><Users size={12} /> {formatNumber(quality.visitors || 0)} unique visitors</div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon"><Target size={18} /></div>
          <div className="stat-label">Questions answered well</div>
          <div className="stat-value">{quality.answered_pct == null ? '—' : `${quality.answered_pct}%`}</div>
          <div className="stat-sub">{quality.low_confidence ? `${quality.low_confidence} need better documentation` : 'No gaps found'}</div>
          <div className="stat-sub">Match quality {project.avg_score == null ? '—' : `${Math.round(project.avg_score * 100)}%`}</div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon"><Zap size={18} /></div>
          <div className="stat-label">Saved by the answer cache</div>
          <div className="stat-value">{quality.cache_hit_pct == null ? '—' : `${quality.cache_hit_pct}%`}</div>
          <div className="stat-sub">
            {quality.cache_hits ? `${formatNumber(quality.cache_hits)} instant answers` : 'No cached answers yet'}
          </div>
          <div className="stat-sub">
            {quality.tokens_saved_by_cache ? `≈ ${formatNumber(quality.tokens_saved_by_cache)} tokens saved` : ''}
          </div>
        </div>
      </div>

      <div className="card card-pad mb-6">
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
          <div className={refreshing ? 'is-refreshing' : ''}><BarChart data={timeline} valueKey={metric} /></div>
        ) : (
          <div className="chart-empty">
            <CalendarDays size={22} />
            <p>No conversations in the last {days} days for this project.</p>
          </div>
        )}
      </div>

      <div className="dash-row dash-row-even">
        <div className="card card-pad">
          <div className="card-head">
            <h3><HelpCircle size={16} /> Frequently asked questions</h3>
            <div className="seg" title="How many times a question must be asked">
              {FAQ_MINS.map((n) => (
                <button key={n} className={faqMin === n ? 'active' : ''} onClick={() => setFaqMin(n)}>{n}×+</button>
              ))}
            </div>
          </div>
          <p className="hint mb-2">
            Questions asked at least {faq.min_count} times in the last {faq.days} days — real repeat questions, not one-offs.
          </p>
          {faq.items.length === 0 ? (
            <p className="empty-note">
              No question has been asked {faq.min_count}+ times yet. This list fills up as your project gets used; choose a
              lower minimum to see the most-asked questions so far.
            </p>
          ) : (
            <ul className="q-list">
              {faq.items.map((q, i) => (
                <li key={i}>
                  <div className="q-text">{q.question}</div>
                  <div className="q-meta">
                    <span className="badge badge-primary">{formatNumber(q.times_asked)}×</span>
                    <span>{formatNumber(q.unique_visitors)} visitor{q.unique_visitors === 1 ? '' : 's'}</span>
                    <span className={`badge ${q.answered_pct >= 80 ? 'badge-success' : 'badge-warning'}`}>
                      {q.answered_pct}% answered
                    </span>
                    <span>last {timeAgo(q.last_asked)}</span>
                    <LangTag code={q.language} />
                  </div>
                </li>
              ))}
            </ul>
          )}
          {faq.total > faq.items.length && <p className="hint mt-2">Showing {faq.items.length} of {faq.total}. Export the CSV for the full list.</p>}
        </div>

        <div className="card card-pad">
          <div className="card-head"><h3><Lightbulb size={16} /> Knowledge gaps</h3></div>
          <p className="hint mb-2">Questions this project couldn't answer confidently. Add or update documentation to cover them.</p>
          {data.knowledge_gaps.length === 0 ? (
            <p className="empty-note">Nothing here. This project is answering everything with confidence.</p>
          ) : (
            <ul className="q-list">
              {data.knowledge_gaps.map((g, i) => (
                <li key={i}>
                  <div className="q-text">{g.question}</div>
                  <div className="q-meta">
                    <span className="badge badge-warning">asked {g.count}×</span>
                    <span>{timeAgo(g.last_asked)}</span>
                    <LangTag code={g.language} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="dash-row dash-row-even mt-6">
        <div className="card card-pad">
          <div className="card-head"><h3><MessageSquare size={16} /> Most asked in the last {days} days</h3></div>
          {data.top_questions.length === 0 ? (
            <p className="empty-note">Popular questions will appear here once people start asking.</p>
          ) : (
            <ul className="q-list">
              {data.top_questions.map((q, i) => (
                <li key={i}>
                  <div className="q-text">{q.question}</div>
                  <div className="q-meta"><span className="badge badge-primary">{q.count}×</span><LangTag code={q.language} /></div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card card-pad">
          <div className="card-head"><h3><Languages size={16} /> Languages</h3></div>
          {data.languages.length === 0
            ? <p className="empty-note">No conversations yet.</p>
            : <HBarList items={data.languages} labelOf={(l) => languageName(l.language)} />}
          {publishing.github && (
            <div className="source-note">
              <FileText size={14} />
              <span>
                Source: <a href={publishing.github.repo_url} target="_blank" rel="noreferrer">{publishing.github.repo}</a>
                {' '}· {publishing.github.tracking_mode === 'webhook' ? 'instant updates' : 'checked every minute'}
                {publishing.github.last_commit_sha ? ` · commit ${publishing.github.last_commit_sha.slice(0, 7)}` : ''}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="card card-pad mt-6">
        <div className="card-head"><h3>Recent conversations</h3><PlanBadge plan={data.plan} /></div>
        <RecentConversations items={data.recent} />
      </div>
    </div>
  );
}