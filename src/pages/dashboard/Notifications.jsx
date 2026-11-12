import { useEffect, useState } from 'react';
import { Bell, Check, CheckCheck, Trash2, GitPullRequestArrow, CreditCard, Bot as BotIcon, Info } from 'lucide-react';
import { NotificationsAPI } from '../../lib/api';
import { PageLoader, EmptyState } from '../../components/ui/Primitives';
import { useToast } from '../../context/ToastContext';
import { apiErrorMessage } from '../../lib/http';
import { timeAgo } from '../../lib/format';
import './Dashboard.css';

const TYPE_ICON = {
  code_change_without_docs_update: GitPullRequestArrow,
  billing: CreditCard,
  bot: BotIcon,
};

export default function Notifications() {
  const [items, setItems] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const toast = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await NotificationsAPI.list({ unread_only: filter === 'unread', limit: 100 });
      setItems(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filter]); // eslint-disable-line react-hooks/exhaustive-deps

  const markRead = async (id) => {
    try {
      await NotificationsAPI.markRead(id);
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  const markAllRead = async () => {
    try {
      await NotificationsAPI.markAllRead();
      setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
      toast.success('All notifications marked as read.');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  const remove = async (id) => {
    try {
      await NotificationsAPI.remove(id);
      setItems((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  if (loading) return <PageLoader label="Loading notifications…" />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Notifications</h1>
          <p>Alerts for doc-sync events, billing updates, and account activity.</p>
        </div>
        <div className="page-header-actions">
          <div className="flex gap-2">
            <button className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilter('all')}>All</button>
            <button className={`btn btn-sm ${filter === 'unread' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilter('unread')}>Unread</button>
          </div>
          <button className="btn btn-outline btn-sm" onClick={markAllRead}><CheckCheck size={14} /> Mark all read</button>
        </div>
      </div>

      {!items?.length ? (
        <div className="card"><EmptyState icon={<Bell size={22} />} title="You're all caught up" description="New notifications about your bots, repos, and billing will appear here." /></div>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((n) => {
            const Icon = TYPE_ICON[n.type] || Info;
            return (
              <div key={n.id} className="card card-pad flex items-start gap-4" style={{ opacity: n.is_read ? 0.7 : 1, borderLeft: n.is_read ? undefined : '3px solid var(--color-primary)' }}>
                <div className="stat-icon" style={{ marginBottom: 0, flexShrink: 0 }}><Icon size={18} /></div>
                <div style={{ flex: 1 }}>
                  <div className="flex items-center gap-2">
                    <h3 style={{ fontSize: 14.5 }}>{n.title}</h3>
                    {!n.is_read && <span className="badge-dot" style={{ background: 'var(--color-primary)', width: 6, height: 6, borderRadius: '50%' }} />}
                  </div>
                  <p style={{ fontSize: 13, marginTop: 4 }}>{n.body}</p>
                  <p style={{ fontSize: 11.5, marginTop: 6, color: 'var(--color-slate)' }}>{timeAgo(n.created_at)}</p>
                </div>
                <div className="flex gap-2">
                  {!n.is_read && (
                    <button className="btn btn-ghost btn-sm btn-icon" onClick={() => markRead(n.id)} title="Mark as read"><Check size={14} /></button>
                  )}
                  <button className="btn btn-ghost btn-sm btn-icon" onClick={() => remove(n.id)} title="Delete"><Trash2 size={14} className="text-danger" /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
