import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Bot, ExternalLink } from 'lucide-react';
import { UsersAPI, HostedAPI, GitHubAPI } from '../../lib/api';
import { Modal } from '../../components/ui/Modal';
import { EmptyState, PageLoader } from '../../components/ui/Primitives';
import { useToast } from '../../context/ToastContext';
import { apiErrorMessage } from '../../lib/http';
import { formatDate, formatNumber } from '../../lib/format';
import { useAuth } from '../../context/AuthContext';
import './Dashboard.css';



export default function HostedList() {
  const [projects, setProjects] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [welcome, setWelcome] = useState('Hi! How can I help you?');
  const [color, setColor] = useState('#8B1E3F');
  const [creating, setCreating] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [repos, setRepos] = useState([]);
  const [source, setSource] = useState('upload'); // 'upload' or a connected GitHub repo id

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await UsersAPI.projects();
      setProjects(data.filter((p) => p.has_hosted_bot));   // upload-based bots + GitHub repos published as a chatbot
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
      const { data } = await HostedAPI.create({
        name: name,
        welcome_message: welcome,
        theme_color: color,
        ...(source !== 'upload' ? { github_repo_id: source } : {}),
      });
      toast.success('Hosted chatbot created.');
      setModalOpen(false);
      setName('');
      setSource('upload');
      navigate(`/app/hosted/${data.bot_id}`);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not create the chatbot.'));
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <PageLoader label="Loading your chatbots…" />;
  const availableRepos = repos.filter((r) => !r.hosted); // one chatbot per repository

  const limitReached = user?.plan === 'pro' && projects && projects.length >= 3;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Hosted Chatbots</h1>
          <p>Permanent, publicly shareable chatbots for your business, with theming and password protection.</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => setModalOpen(true)} disabled={limitReached}>
            <Plus size={16} /> New chatbot
          </button>
        </div>
      </div>

      {limitReached && (
        <div className="alert alert-warning mb-4">
          You've reached your Pro plan limit of 3 hosted bots. <Link to="/app/billing">Upgrade to Enterprise</Link> for unlimited bots.
        </div>
      )}

      {!projects?.length ? (
        <div className="card">
          <EmptyState
            icon={<Bot size={22} />}
            title="No hosted chatbots yet"
            description="Create your first permanent chatbot and get a shareable public URL."
            action={<button className="btn btn-primary btn-sm" onClick={() => setModalOpen(true)}>Create hosted chatbot</button>}
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
                <Link to={`/app/hosted/${p.id}`} className="btn btn-outline btn-sm w-full">Manage</Link>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create a hosted chatbot"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleCreate} disabled={creating || !name.trim()}>
              {creating ? 'Creating…' : 'Create chatbot'}
            </button>
          </>
        }
      >
        <form onSubmit={handleCreate}>
          <div className="field">
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
                ? 'You will upload your files after creating the chatbot.'
                : 'Uses the documentation already indexed from this repository and stays in sync with it.'}
            </span>
          </div>
            <label>Bot name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Support Assistant" required />
          </div>
          <div className="field">
            <label>Welcome message</label>
            <textarea className="textarea" value={welcome} onChange={(e) => setWelcome(e.target.value)} rows={2} />
          </div>
          <div className="field">
            <label>Theme color</label>
            <div className="flex items-center gap-3">
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} style={{ width: 44, height: 40, border: 'none', borderRadius: 8, cursor: 'pointer', background: 'none' }} />
              <input className="input" value={color} onChange={(e) => setColor(e.target.value)} />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
