import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Plug } from 'lucide-react';
import { UsersAPI, PluginAPI, GitHubAPI } from '../../lib/api';
import { Modal } from '../../components/ui/Modal';
import { EmptyState, PageLoader } from '../../components/ui/Primitives';
import CopyField from '../../components/ui/CopyField';
import { useToast } from '../../context/ToastContext';
import { apiErrorMessage } from '../../lib/http';
import { formatDate, formatNumber } from '../../lib/format';
import { useAuth } from '../../context/AuthContext';
import './Dashboard.css';





export default function ApiList() {
  const [projects, setProjects] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState(null);
  const toast = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [repos, setRepos] = useState([]);
  const [source, setSource] = useState('upload'); // 'upload' or a connected GitHub repo id

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await UsersAPI.projects();
      setProjects(data.filter((p) => p.has_api));   // upload-based projects + GitHub repos with the API enabled
      GitHubAPI.list().then((r) => setRepos(r.data)).catch(() => {});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const { data } = await PluginAPI.createProject({
        name,
        description: description || undefined,
        ...(source !== 'upload' ? { github_repo_id: source } : {}),
      });
      toast.success('API project created.');
      setNewKey({ key: data.api_key, projectId: data.id });
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not create the project.'));
    } finally {
      setCreating(false);
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setName('');
    setDescription('');
    setSource('upload');
    if (newKey) {
      const id = newKey.projectId;
      setNewKey(null);
      navigate(`/app/api/${id}`);
    }
  };

  const limitReached = user?.plan === 'pro' && projects && projects.length >= 5;

  if (loading) return <PageLoader label="Loading your API projects…" />;
  const availableRepos = repos.filter((r) => !r.api); // one API per repository

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Plug &amp; Play API</h1>
          <p>Developer-facing REST API and embeddable widget. Stateless chat, API-key authenticated.</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => setModalOpen(true)} disabled={limitReached}>
            <Plus size={16} /> New project
          </button>
        </div>
      </div>

      {limitReached && (
        <div className="alert alert-warning mb-4">
          You've reached your Pro plan limit of 5 API projects. <Link to="/app/billing">Upgrade to Enterprise</Link> for unlimited projects.
        </div>
      )}

      {!projects?.length ? (
        <div className="card">
          <EmptyState
            icon={<Plug size={22} />}
            title="No API projects yet"
            description="Create a project to get an API key and start building support into your own app."
            action={<button className="btn btn-primary btn-sm" onClick={() => setModalOpen(true)}>Create API project</button>}
          />
        </div>
      ) : (
        <div className="resource-grid">
          {projects.map((p) => (
            <div key={p.id} className="card resource-card">
              <div className="resource-card-top">
                <h3>{p.name}</h3>
                <span className={`badge ${p.status === 'ready' ? 'badge-success' : 'badge-warning'}`}>{p.status}</span>
              </div>
              <div className="resource-meta">
                {p.type === 'github' && <span className="badge badge-neutral">GitHub</span>}
                <span>Created {formatDate(p.created_at)}</span>
                <span className="card-tokens">{formatNumber(p.tokens_month || 0)} tokens this month</span>
              </div>
              <div className="resource-card-actions">
                <Link to={`/app/api/${p.id}`} className="btn btn-outline btn-sm w-full">Manage</Link>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={newKey ? 'Save your API key' : 'Create an API project'}
        footer={
          newKey ? (
            <button className="btn btn-primary" onClick={closeModal}>Done — go to project</button>
          ) : (
            <>
              <button className="btn btn-outline" onClick={closeModal}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreate} disabled={creating || !name.trim()}>
                {creating ? 'Creating…' : 'Create project'}
              </button>
            </>
          )
        }
      >
        {newKey ? (
          <div>
            <div className="alert alert-warning mb-4">
              This secret key is shown once. Store it securely — you won't be able to see it again.
            </div>
            <CopyField value={newKey.key} />
          </div>
        ) : (
          <form onSubmit={handleCreate}>
            <div className="field">
              <label>Knowledge source</label>
              <select
                className="input"
                value={source}
                onChange={(e) => {
                  const value = e.target.value;
                  setSource(value);
                  const repo = repos.find((r) => r.id === value);
                  if (repo && !name.trim()) setName(`${repo.repo_name} docs`);
                }}
              >
                <option value="upload">Upload documents</option>
                {availableRepos.map((r) => (
                  <option key={r.id} value={r.id}>GitHub: {r.owner}/{r.repo_name}</option>
                ))}
              </select>
              <span className="hint">
                {source === 'upload'
                  ? 'You will upload your files after creating the project.'
                  : 'Uses the documentation already indexed from this repository and stays in sync with it.'}
              </span>
            </div>
            <div className="field">
              <label>Project name</label>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Website Support Widget" required />
            </div>
            <div className="field">
              <label>Description <span className="hint">(optional)</span></label>
              <textarea className="textarea" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
