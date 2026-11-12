import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, RefreshCcw, Trash2 } from 'lucide-react';
import GithubMark from '../../components/ui/GithubMark';
import { GitHubAPI } from '../../lib/api';
import { Modal, ConfirmDialog } from '../../components/ui/Modal';
import { EmptyState, PageLoader, StatusBadge } from '../../components/ui/Primitives';
import { useToast } from '../../context/ToastContext';
import { apiErrorMessage } from '../../lib/http';
import { formatDate, formatNumber } from '../../lib/format';
import { useAuth } from '../../context/AuthContext';
import './Dashboard.css';


export default function GitHubList() {
  const [repos, setRepos] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ repo_url: '', github_token: '', tracking_mode: 'webhook', notification_webhook_url: '' });
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await GitHubAPI.list();
      setRepos(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleConnect = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const payload = { ...form };
      if (!payload.notification_webhook_url) delete payload.notification_webhook_url;
      const { data } = await GitHubAPI.connect(payload);
      toast.success(`Connected — found ${data.doc_files_found} doc file(s), indexing now.`);
      if (data.notice) toast.info(data.notice);
      setModalOpen(false);
      navigate(`/app/github/${data.repo_id}`);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not connect this repository.'));
    } finally {
      setCreating(false);
    }
  };

  const handleResync = async (repoId) => {
    try {
      await GitHubAPI.resync(repoId);
      toast.success('Re-sync started.');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not start re-sync.'));
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await GitHubAPI.remove(pendingDelete);
      setRepos((r) => r.filter((x) => x.id !== pendingDelete));
      toast.success('Repository disconnected.');
      setPendingDelete(null);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not disconnect repository.'));
    } finally {
      setDeleting(false);
    }
  };

  const limitReached = user?.plan === 'pro' && repos && repos.length >= 3;

  if (loading) return <PageLoader label="Loading connected repos…" />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>GitHub Ingestion</h1>
          <p>Connect a repo to index its documentation and keep it synchronized as commits land.</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => setModalOpen(true)} disabled={limitReached}>
            <Plus size={16} /> Connect repo
          </button>
        </div>
      </div>

      {limitReached && (
        <div className="alert alert-warning mb-4">
          You've reached your Pro plan limit of 3 GitHub repos. <Link to="/app/billing">Upgrade to Enterprise</Link> for unlimited repos.
        </div>
      )}

      {!repos?.length ? (
        <div className="card">
          <EmptyState
            icon={<GithubMark size={22} />}
            title="No repositories connected"
            description="Connect a GitHub repo to keep your support chatbot in sync with your documentation."
            action={<button className="btn btn-primary btn-sm" onClick={() => setModalOpen(true)}>Connect repository</button>}
          />
        </div>
      ) : (
        <div className="resource-grid">
          {repos.map((r) => (
            <div key={r.id} className="card resource-card">
              <div className="resource-card-top">
                <h3>{r.owner}/{r.repo_name}</h3>
                <span className={`badge ${r.tracking_mode === 'webhook' ? 'badge-teal' : 'badge-gold'}`}>{r.tracking_mode}</span>
              </div>
              {(r.hosted || r.api) && (
                <div className="flex gap-2 mb-2">
                  {r.hosted && <span className="badge badge-success">Chatbot</span>}
                  {r.api && <span className="badge badge-success">API</span>}
                </div>
              )}
              <div className="resource-meta">
                <span>Connected {formatDate(r.created_at)}</span>
                <span className="card-tokens">{formatNumber(r.tokens_month || 0)} tokens this month</span>
                {r.last_commit_sha && <span>SHA {r.last_commit_sha.slice(0, 7)}</span>}
              </div>
              <div className="resource-card-actions">
                <Link to={`/app/github/${r.id}`} className="btn btn-outline btn-sm w-full">Manage</Link>
                <button className="btn btn-ghost btn-sm btn-icon" onClick={() => handleResync(r.id)} title="Re-sync"><RefreshCcw size={14} /></button>
                <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setPendingDelete(r.id)} title="Disconnect"><Trash2 size={14} className="text-danger" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Connect a GitHub repository"
        width={520}
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleConnect} disabled={creating || !form.repo_url || !form.github_token}>
              {creating ? 'Connecting…' : 'Connect repository'}
            </button>
          </>
        }
      >
        <form onSubmit={handleConnect}>
          <div className="field">
            <label>Repository URL</label>
            <input className="input" placeholder="https://github.com/owner/repo" value={form.repo_url} onChange={(e) => setForm({ ...form, repo_url: e.target.value })} required />
          </div>
          <div className="field">
            <label>GitHub token</label>
            <input className="input" type="password" placeholder="ghp_…" value={form.github_token} onChange={(e) => setForm({ ...form, github_token: e.target.value })} required />
            <span className="hint">
              Fine-grained token (recommended): Contents → Read-only, plus Webhooks → Read and write for instant
              updates. Classic token: <code>repo</code> scope (<code>public_repo</code> for public repositories), plus
              <code> admin:repo_hook</code> for instant updates. Without webhook access, changes are still picked up
              about every minute.
            </span>
          </div>
          <div className="field">
            <label>Tracking mode</label>
            <select className="select" value={form.tracking_mode} onChange={(e) => setForm({ ...form, tracking_mode: e.target.value })}>
              <option value="webhook">Webhook (instant — needs a public https server)</option>
              <option value="polling">Polling (checks about every minute — works everywhere)</option>
            </select>
          </div>
          <div className="field">
            <label>Notification webhook URL <span className="hint">(optional)</span></label>
            <input className="input" placeholder="https://yourapp.com/webhooks/enawga" value={form.notification_webhook_url} onChange={(e) => setForm({ ...form, notification_webhook_url: e.target.value })} />
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={handleDelete}
        title="Disconnect this repository?"
        message="This removes the GitHub webhook, deletes all indexed chunks, and stops future syncing."
        confirmLabel="Disconnect"
        loading={deleting}
      />
    </div>
  );
}
