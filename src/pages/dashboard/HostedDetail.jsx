import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, ExternalLink, Trash2, Upload, Save, Lock, FileText, RefreshCcw,
} from 'lucide-react';
import { HostedAPI, DocumentsAPI } from '../../lib/api';
import { PageLoader, StatusBadge, EmptyState } from '../../components/ui/Primitives';
import { ConfirmDialog } from '../../components/ui/Modal';
import CopyField from '../../components/ui/CopyField';
import FileDropzone, { FileChip } from '../../components/ui/FileDropzone';
import ChatWindow from '../../components/chat/ChatWindow';
import { useChatStream } from '../../hooks/useChatStream';
import { useToast } from '../../context/ToastContext';
import { apiErrorMessage } from '../../lib/http';
import { formatBytes } from '../../lib/format';
import './Dashboard.css';

import { getAccessToken } from '../../lib/http';

import ProjectUsageCard from '../../components/dashboard/ProjectUsageCard';



const TABS = ['Documents', 'Preview', 'Settings'];

export default function HostedDetail() {
  const { botId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [config, setConfig] = useState(null);
  const source = config?.source; // set when the knowledge comes from a GitHub repository
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('Documents');
  const [uploading, setUploading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({ name: '', welcome_message: '', theme_color: '#8B1E3F', password: '' });

  const token = getAccessToken();
  const chat = useChatStream({
    url: HostedAPI.chatStreamUrl(botId),
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    buildBody: (message, history) => ({ message, session_id: `preview-${botId}`, history }),
  });

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await HostedAPI.config(botId);
      setConfig(data);
      setForm({ name: data.name, welcome_message: data.welcome_message, theme_color: data.theme_color, password: '' });
      const docsRes = await DocumentsAPI.listForProject(botId);
      setDocs(docsRes.data);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not load this chatbot.'));
      navigate('/app/hosted');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [botId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleUpload = async (files) => {
    setUploading(true);
    try {
      await HostedAPI.upload(botId, files);
      toast.success(`${files.length} file(s) queued for ingestion.`);
      const docsRes = await DocumentsAPI.listForProject(botId);
      setDocs(docsRes.data);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Upload failed.'));
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDoc = async (docId) => {
    try {
      await DocumentsAPI.remove(docId);
      setDocs((d) => d.filter((x) => x.id !== docId));
      toast.success('Document removed.');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not remove document.'));
    }
  };

  const handleReIngest = async (docId) => {
    try {
      await DocumentsAPI.reIngest(docId);
      toast.success('Re-ingestion queued.');
      const docsRes = await DocumentsAPI.listForProject(botId);
      setDocs(docsRes.data);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not re-ingest document.'));
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { name: form.name, welcome_message: form.welcome_message, theme_color: form.theme_color };
      if (form.password) payload.password = form.password;
      const { data } = await HostedAPI.updateSettings(botId, payload);
      setConfig(data);
      toast.success('Settings saved.');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not save settings.'));
    } finally {
      setSaving(false);
    }
  };
  const handleRemovePassword = async () => {
    setSaving(true);
    try {
      const { data } = await HostedAPI.updateSettings(botId, { password: '' });
      setConfig(data);
      toast.success('Password removed.');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not remove password.'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await HostedAPI.remove(botId);
      toast.success('Chatbot deleted.');
      navigate('/app/hosted');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not delete chatbot.'));
      setDeleting(false);
    }
  };

  if (loading) return <PageLoader label="Loading chatbot…" />;
  if (!config) return null;

  return (
    <div>
      <button className="btn btn-ghost btn-sm mb-4" onClick={() => navigate('/app/hosted')}>
        <ArrowLeft size={14} /> Back to chatbots
      </button>

      <div className="page-header">
        <div>
          <h1>{config.name}</h1>
          <div className="flex items-center gap-2 mt-2">
            <StatusBadge status={config.is_active ? 'active' : 'cancelled'} />
              {config.has_password && (
              <span className="badge badge-neutral"><Lock size={11} /> Password protected</span>
            )}
          </div>
        </div>
        <div className="page-header-actions">
          <a href={config.public_url} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">
            <ExternalLink size={14} /> View public page
          </a>
          <button className="btn btn-danger btn-sm" onClick={() => setConfirmDelete(true)}>
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </div>

      <div className="card card-pad mb-6">
        <p style={{ fontSize: 12.5, marginBottom: 6, fontWeight: 600, color: 'var(--color-navy)' }}>Public URL</p>
        <CopyField value={config.public_url} />
      </div>

      <ProjectUsageCard projectId={botId} />

      <div className="flex gap-2 mb-6" style={{ borderBottom: '1px solid var(--color-border-soft)' }}>
        {TABS.map((t) => (
          <button
            key={t}
            className="btn btn-ghost btn-sm"
            style={{
              borderRadius: 0,
              borderBottom: tab === t ? '2px solid var(--color-primary)' : '2px solid transparent',
              color: tab === t ? 'var(--color-primary)' : 'var(--color-slate)',
            }}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Documents' && (
        <div className="flex flex-col gap-4">
          <FileDropzone multiple onFilesSelected={handleUpload} />
          {uploading && <p style={{ fontSize: 13 }}>Uploading…</p>}
          {docs.length === 0 ? (
            <EmptyState icon={<FileText size={20} />} title="No documents yet" description="Upload documents to ground this chatbot's answers." />
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead><tr><th>File</th><th>Size</th><th>Chunks</th><th>Status</th><th></th></tr></thead>
                <tbody>
                  {docs.map((d) => (
                    <tr key={d.id}>
                      <td>{d.filename}</td>
                      <td>{formatBytes(d.file_size)}</td>
                      <td>{d.chunk_count ?? '—'}</td>
                      <td><StatusBadge status={d.status} /></td>
                      <td>
                        <div className="flex gap-2">
                          <button className="btn btn-ghost btn-sm btn-icon" onClick={() => handleReIngest(d.id)} title="Re-ingest">
                            <RefreshCcw size={14} />
                          </button>
                          <button className="btn btn-ghost btn-sm btn-icon" onClick={() => handleDeleteDoc(d.id)} title="Delete">
                            <Trash2 size={14} className="text-danger" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'Preview' && (
        <div style={{ height: 560 }}>
          <ChatWindow
            messages={chat.messages}
            onSend={chat.send}
            sending={chat.sending}
            welcomeMessage={config.welcome_message}
            emptyTitle="Preview your chatbot"
            emptyDescription={config.welcome_message}
          />
        </div>
      )}

      {tab === 'Settings' && (
        <form className="card card-pad" style={{ maxWidth: 520 }} onSubmit={handleSaveSettings}>
          <div className="field">
            <label>Bot name</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="field">
            <label>Welcome message</label>
            <textarea className="textarea" rows={2} value={form.welcome_message} onChange={(e) => setForm({ ...form, welcome_message: e.target.value })} />
          </div>
          <div className="field">
            <label>Theme color</label>
            <div className="flex items-center gap-3">
              <input type="color" value={form.theme_color} onChange={(e) => setForm({ ...form, theme_color: e.target.value })} style={{ width: 44, height: 40, border: 'none', background: 'none', cursor: 'pointer' }} />
              <input className="input" value={form.theme_color} onChange={(e) => setForm({ ...form, theme_color: e.target.value })} />
            </div>
          </div>
          <div className="field">
            <label>Access password <span className="hint">(leave blank to keep unchanged, set empty to remove)</span></label>
            <input className="input" type="password" placeholder="Optional bot password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            {config.has_password && (
              <button type="button" className="btn btn-outline btn-sm mt-2" onClick={handleRemovePassword} disabled={saving}>
                Remove password
              </button>
            )}
          </div>

          <button type="submit" className="btn btn-primary" disabled={saving}>
            <Save size={15} /> {saving ? 'Saving…' : 'Save settings'}
          </button>
        </form>
      )}

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        title="Delete this chatbot?"
        message={source
          ? 'This removes the chatbot and its public link. Your GitHub repository and its indexed documentation are not affected.'
          : 'This permanently deletes the bot, its documents, and its vector index. This cannot be undone.'}
        confirmLabel="Delete chatbot"
        loading={deleting}
      />
    </div>
  );
}
