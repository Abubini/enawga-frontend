import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, RefreshCcw, Trash2, Save, FileCode2, GitBranch, Bot, Plug } from 'lucide-react';
import { GitHubAPI, HostedAPI, PluginAPI  } from '../../lib/api';
import { PageLoader, StatusBadge, EmptyState } from '../../components/ui/Primitives';
import { ConfirmDialog, Modal } from '../../components/ui/Modal';
import { useToast } from '../../context/ToastContext';
import { apiErrorMessage } from '../../lib/http';
import { formatDateTime } from '../../lib/format';
import './Dashboard.css';

import CopyField from '../../components/ui/CopyField';

import ProjectUsageCard from '../../components/dashboard/ProjectUsageCard';

export default function GitHubDetail() {
  const { repoId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resyncing, setResyncing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [pollInterval, setPollInterval] = useState(3600);
  const [notifyUrl, setNotifyUrl] = useState('');
  const [saving, setSaving] = useState(false);

    // Publishing this repository as a hosted chatbot and/or a Plug & Play API
  const [publish, setPublish] = useState(null);
  const [publishing, setPublishing] = useState(null); // 'hosted' | 'api'
  const [botModal, setBotModal] = useState(false);
  const [botName, setBotName] = useState('');
  const [botWelcome, setBotWelcome] = useState('Hi! Ask me anything about our documentation.');
  const [apiKeyModal, setApiKeyModal] = useState(null); // { key, projectId }

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await GitHubAPI.status(repoId);
      setStatus(data);
      GitHubAPI.publishStatus(repoId).then((r) => setPublish(r.data)).catch(() => setPublish(null));
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not load this repository.'));
      navigate('/app/github');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [repoId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleResync = async () => {
    setResyncing(true);
    try {
      const { data } = await GitHubAPI.resync(repoId);
      toast.success(`Re-sync started — ${data.doc_files_found} doc file(s) found.`);
      await load();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not start re-sync.'));
    } finally {
      setResyncing(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {};
      if (pollInterval) payload.poll_interval = Number(pollInterval);
      if (notifyUrl) payload.notification_webhook_url = notifyUrl;
      await GitHubAPI.updateSettings(repoId, payload);
      toast.success('Settings updated.');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not update settings.'));
    } finally {
      setSaving(false);
    }
  };

  const handleCreateBot = async () => {
    setPublishing('hosted');
    try {
      const { data } = await HostedAPI.create({
        name: botName.trim(),
        welcome_message: botWelcome,
        github_repo_id: repoId,
      });
      toast.success('Hosted chatbot created from this repository.');
      setBotModal(false);
      navigate(`/app/hosted/${data.bot_id}`);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not create the chatbot.'));
    } finally {
      setPublishing(null);
    }
  };

  const handleEnableApi = async () => {
    setPublishing('api');
    try {
      const { data } = await PluginAPI.createProject({ name: 'GitHub documentation', github_repo_id: repoId });
      setApiKeyModal({ key: data.api_key, projectId: data.id });
      GitHubAPI.publishStatus(repoId).then((r) => setPublish(r.data)).catch(() => {});
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not enable the API.'));
    } finally {
      setPublishing(null);
    }
  };

  const closeApiKeyModal = () => {
    const id = apiKeyModal?.projectId;
    setApiKeyModal(null);
    if (id) navigate(`/app/api/${id}`);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await GitHubAPI.remove(repoId);
      toast.success('Repository disconnected.');
      navigate('/app/github');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not disconnect.'));
      setDeleting(false);
    }
  };

  if (loading) return <PageLoader label="Loading repository…" />;
  if (!status) return null;

  return (
    <div>
      <button className="btn btn-ghost btn-sm mb-4" onClick={() => navigate('/app/github')}>
        <ArrowLeft size={14} /> Back to repositories
      </button>

      <div className="page-header">
        <div>
          <h1 className="flex items-center gap-2"><GitBranch size={20} /> Repository sync</h1>
          <div className="flex items-center gap-2 mt-2">
            <StatusBadge status={status.status} />
            <span className="badge badge-neutral">{status.tracking_mode}</span>
            {status.last_commit_sha && <span style={{ fontSize: 12, color: 'var(--color-slate)' }}>SHA {status.last_commit_sha.slice(0, 10)}</span>}
          </div>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-outline btn-sm" onClick={handleResync} disabled={resyncing}>
            <RefreshCcw size={14} /> {resyncing ? 'Re-syncing…' : 'Force full re-sync'}
          </button>
          <button className="btn btn-danger btn-sm" onClick={() => setConfirmDelete(true)}>
            <Trash2 size={14} /> Disconnect
          </button>
        </div>
      </div>

      {publish?.project_id && <ProjectUsageCard projectId={publish.project_id} />}

      <div className="section-title"><h2 style={{ fontSize: 15.5 }}>Indexed documentation files</h2></div>
      {!status.doc_files?.length ? (
        <div className="card mb-6"><EmptyState icon={<FileCode2 size={20} />} title="No documentation files indexed yet" description="Documentation discovery runs automatically after connecting; give it a moment." /></div>
      ) : (
        <div className="table-wrap mb-6">
          <table className="data-table">
            <thead><tr><th>Path</th><th>Chunks</th><th>Last indexed</th></tr></thead>
            <tbody>
              {status.doc_files.map((f) => (
                <tr key={f.path}>
                  <td><code>{f.path}</code></td>
                  <td>{f.chunk_count ?? '—'}</td>
                  <td>{f.last_indexed_at ? formatDateTime(f.last_indexed_at) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="section-title"><h2 style={{ fontSize: 15.5 }}>Publish this documentation</h2></div>
      <p style={{ fontSize: 13.5, marginBottom: 14, maxWidth: 640 }}>
        Let other people talk to your documentation. Both options use the files indexed above and stay in sync with
        every change you push. Each one counts toward your plan's chatbot / API limits.
      </p>
      <div className="resource-grid mb-6">
        <div className="card resource-card">
          <div className="resource-card-top">
            <h3 className="flex items-center gap-2"><Bot size={16} /> Hosted chatbot</h3>
            {publish?.hosted && <span className="badge badge-success">Live</span>}
          </div>
          <div className="resource-meta">
            <span>A public page anyone can open, with your colors and welcome message.</span>
          </div>
          <div className="resource-card-actions">
            {publish?.hosted ? (
              <Link to={`/app/hosted/${publish.hosted.bot_id}`} className="btn btn-outline btn-sm w-full">Manage chatbot</Link>
            ) : (
              <button className="btn btn-primary btn-sm w-full" onClick={() => setBotModal(true)} disabled={!publish}>
                Create hosted chatbot
              </button>
            )}
          </div>
        </div>

        <div className="card resource-card">
          <div className="resource-card-top">
            <h3 className="flex items-center gap-2"><Plug size={16} /> Plug &amp; Play API</h3>
            {publish?.api?.enabled && <span className="badge badge-success">Enabled</span>}
          </div>
          <div className="resource-meta">
            <span>API keys and an embeddable chat widget for your own website or app.</span>
          </div>
          <div className="resource-card-actions">
            {publish?.api?.enabled ? (
              <Link to={`/app/api/${publish.project_id}`} className="btn btn-outline btn-sm w-full">Manage API</Link>
            ) : (
              <button className="btn btn-primary btn-sm w-full" onClick={handleEnableApi} disabled={!publish || publishing === 'api'}>
                {publishing === 'api' ? 'Enabling…' : 'Enable Plug & Play API'}
              </button>
            )}
          </div>
        </div>
      </div>

      <form className="card card-pad" style={{ maxWidth: 480 }} onSubmit={handleSaveSettings}>
        <h3 style={{ fontSize: 15, marginBottom: 14 }}>Sync settings</h3>
        <div className="field">
          <label>Poll interval (seconds)</label>
          <input className="input" type="number" min={300} max={86400} value={pollInterval} onChange={(e) => setPollInterval(e.target.value)} />
          <span className="hint">Only used in polling mode. 300–86,400 seconds.</span>
        </div>
        <div className="field">
          <label>Notification webhook URL</label>
          <input className="input" placeholder="https://yourapp.com/webhooks/enawga" value={notifyUrl} onChange={(e) => setNotifyUrl(e.target.value)} />
        </div>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          <Save size={15} /> {saving ? 'Saving…' : 'Save settings'}
        </button>
      </form>

      <Modal
        open={botModal}
        onClose={() => setBotModal(false)}
        title="Create a hosted chatbot"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setBotModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleCreateBot} disabled={publishing === 'hosted' || !botName.trim()}>
              {publishing === 'hosted' ? 'Creating…' : 'Create chatbot'}
            </button>
          </>
        }
      >
        <div className="field">
          <label>Chatbot name</label>
          <input className="input" value={botName} onChange={(e) => setBotName(e.target.value)} placeholder="Product Docs Assistant" />
        </div>
        <div className="field">
          <label>Welcome message</label>
          <textarea className="textarea" rows={2} value={botWelcome} onChange={(e) => setBotWelcome(e.target.value)} />
        </div>
        <span className="hint">You can change the colors, logo and password afterwards.</span>
      </Modal>

      <Modal
        open={!!apiKeyModal}
        onClose={closeApiKeyModal}
        title="Save your secret key"
        footer={<button className="btn btn-primary" onClick={closeApiKeyModal}>Done — go to the API</button>}
      >
        <div className="alert alert-warning mb-4">
          This secret key is shown once. Keep it on your server only. Your public key and the website embed
          snippet are on the next page.
        </div>
        {apiKeyModal && <CopyField value={apiKeyModal.key} />}
      </Modal>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        title="Disconnect this repository?"
        message="This removes the GitHub webhook, deletes all indexed chunks and stops future syncing. Any hosted chatbot or Plug & Play API built on this repository is removed too."
        confirmLabel="Disconnect"
        loading={deleting}
      />
    </div>
  );
}
