import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Trash2, Plus, Code2, KeyRound, FileText, RefreshCcw, MessageSquareCode } from 'lucide-react';
import { PluginAPI, DocumentsAPI } from '../../lib/api';
import { PageLoader, StatusBadge, EmptyState } from '../../components/ui/Primitives';
import { ConfirmDialog, Modal } from '../../components/ui/Modal';
import CopyField from '../../components/ui/CopyField';
import FileDropzone from '../../components/ui/FileDropzone';
import ChatWindow from '../../components/chat/ChatWindow';
import { useChatStream } from '../../hooks/useChatStream';
import { useToast } from '../../context/ToastContext';
import { apiErrorMessage } from '../../lib/http';
import { formatBytes, formatDateTime } from '../../lib/format';
import './Dashboard.css';

import ProjectUsageCard from '../../components/dashboard/ProjectUsageCard';

const TABS = ['Documents', 'API Keys', 'Embed Widget', 'Console'];

export default function ApiDetail() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [status, setStatus] = useState(null);
  const [keys, setKeys] = useState([]);
  const [embedScript, setEmbedScript] = useState('');
  const [tab, setTab] = useState('Documents');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [keyModalOpen, setKeyModalOpen] = useState(false);
  const [keyLabel, setKeyLabel] = useState('');
  const [creatingKey, setCreatingKey] = useState(false);
  const [newKey, setNewKey] = useState(null);
  const [testApiKey, setTestApiKey] = useState('');
  const [confirmRotate, setConfirmRotate] = useState(false);
  const [rotating, setRotating] = useState(false);
  const publicKey = keys.find((k) => k.is_public)?.key || '';

  const chat = useChatStream({
    url: PluginAPI.chatStreamUrl(projectId),
    headers: testApiKey ? { 'X-API-Key': testApiKey } : {},
    buildBody: (message, history) => ({ message, session_id: `console-${projectId}`, history }),
  });

  const load = async () => {
    setLoading(true);
    try {
      const [s, k] = await Promise.all([PluginAPI.status(projectId), PluginAPI.listKeys(projectId)]);
      setStatus(s.data);
      setKeys(k.data);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not load this project.'));
      navigate('/app/api');
      setLoading(false);
      return;
    }

    try {
      const script = await PluginAPI.embedScript(projectId);
      setEmbedScript(typeof script.data === 'string' ? script.data : JSON.stringify(script.data));
    } catch (err) {
      setEmbedScript('');
      toast.error(apiErrorMessage(err, 'Could not generate the embed snippet.'));
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [projectId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleUpload = async (files) => {
    setUploading(true);
    try {
      await PluginAPI.upload(projectId, files);
      toast.success(`${files.length} file(s) queued for ingestion.`);
      const s = await PluginAPI.status(projectId);
      setStatus(s.data);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Upload failed.'));
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDoc = async (docId) => {
    try {
      await DocumentsAPI.remove(docId);
      const s = await PluginAPI.status(projectId);
      setStatus(s.data);
      toast.success('Document removed.');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not remove document.'));
    }
  };

  const handleReIngest = async (docId) => {
    try {
      await DocumentsAPI.reIngest(docId);
      toast.success('Re-ingestion queued.');
      const s = await PluginAPI.status(projectId);
      setStatus(s.data);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not re-ingest.'));
    }
  };

  const handleCreateKey = async (e) => {
    e.preventDefault();
    setCreatingKey(true);
    try {
      const { data } = await PluginAPI.createKey(projectId, keyLabel);
      setNewKey(data.key);
      const k = await PluginAPI.listKeys(projectId);
      setKeys(k.data);
      setKeyLabel('');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not create key.'));
    } finally {
      setCreatingKey(false);
    }
  };

  const handleRevokeKey = async (keyId) => {
    try {
      await PluginAPI.revokeKey(projectId, keyId);
      setKeys((k) => k.filter((x) => x.id !== keyId));
      toast.success('Key revoked.');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not revoke key.'));
    }
  };

    const handleRotatePublicKey = async () => {
    setRotating(true);
    try {
      await PluginAPI.rotatePublicKey(projectId);
      const [k, script] = await Promise.all([PluginAPI.listKeys(projectId), PluginAPI.embedScript(projectId)]);
      setKeys(k.data);
      setEmbedScript(typeof script.data === 'string' ? script.data : JSON.stringify(script.data));
      setConfirmRotate(false);
      toast.success('New public key generated. Update the snippet on your website.');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not rotate the key.'));
    } finally {
      setRotating(false);
    }
  };

  const copyText = async (text, message) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(message);
    } catch {
      toast.error('Could not copy.');
    }
  };

  const openTestPage = () => {
    const html =
      '<!doctype html><html><head><meta charset="utf-8"><title>Widget test</title></head>' +
      '<body style="font-family:sans-serif;padding:40px"><h1>My website</h1>' +
      '<p>The chat bubble should appear in the corner.</p>' + embedScript + '</body></html>';
    window.open(URL.createObjectURL(new Blob([html], { type: 'text/html' })), '_blank');
  };

  const handleDeleteProject = async () => {
    setDeleting(true);
    try {
      await PluginAPI.remove(projectId);
      toast.success('Project deleted.');
      navigate('/app/api');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not delete project.'));
      setDeleting(false);
    }
  };

  if (loading) return <PageLoader label="Loading project…" />;
  if (!status) return null;

  return (
    <div>
      <button className="btn btn-ghost btn-sm mb-4" onClick={() => navigate('/app/api')}>
        <ArrowLeft size={14} /> Back to API projects
      </button>

      <div className="page-header">
        <div>
          <h1>Project</h1>
          <div className="flex items-center gap-2 mt-2">
            <StatusBadge status={status.status} />
            <span style={{ fontSize: 12.5, color: 'var(--color-slate)' }}>ID: {status.project_id}</span>
          </div>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-danger btn-sm" onClick={() => setConfirmDelete(true)}>
            <Trash2 size={14} /> Delete project
          </button>
        </div>
      </div>

      <ProjectUsageCard projectId={projectId} />

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
          {!status.documents?.length ? (
            <EmptyState icon={<FileText size={20} />} title="No documents yet" description="Upload documents to ground this project's answers." />
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead><tr><th>File</th><th>Chunks</th><th>Status</th><th></th></tr></thead>
                <tbody>
                  {status.documents.map((d) => (
                    <tr key={d.id}>
                      <td>{d.filename}</td>
                      <td>{d.chunk_count ?? '—'}</td>
                      <td><StatusBadge status={d.status} /></td>
                      <td>
                        <div className="flex gap-2">
                          <button className="btn btn-ghost btn-sm btn-icon" onClick={() => handleReIngest(d.id)} title="Re-ingest"><RefreshCcw size={14} /></button>
                          <button className="btn btn-ghost btn-sm btn-icon" onClick={() => handleDeleteDoc(d.id)} title="Delete"><Trash2 size={14} className="text-danger" /></button>
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

      

      {tab === 'API Keys' && (
        <div className="flex flex-col gap-6">
          <div className="card card-pad" style={{ maxWidth: 720 }}>
            <div className="section-title">
              <h2 style={{ fontSize: 15.5 }}>Public embed key</h2>
              <button className="btn btn-outline btn-sm" onClick={() => setConfirmRotate(true)}>
                <RefreshCcw size={14} /> Rotate
              </button>
            </div>
            <p style={{ fontSize: 13, marginBottom: 12 }}>
              Safe to place in your website's HTML. It can only be used to chat with this project (never to
              manage it). Use it in the Embed Widget snippet.
            </p>
            {publicKey ? <CopyField value={publicKey} /> : <p style={{ fontSize: 13 }}>Loading…</p>}
          </div>

          <div>
            <div className="section-title">
              <h2 style={{ fontSize: 15.5 }}>Secret keys</h2>
              <button className="btn btn-primary btn-sm" onClick={() => { setNewKey(null); setKeyModalOpen(true); }}>
                <Plus size={14} /> New key
              </button>
            </div>
            <p style={{ fontSize: 13, marginBottom: 12 }}>
              For your own server only. Never put a secret key in website code.
            </p>
            {keys.filter((k) => !k.is_public).length === 0 ? (
              <EmptyState icon={<KeyRound size={20} />} title="No secret keys" />
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead><tr><th>Label</th><th>Prefix</th><th>Last used</th><th></th></tr></thead>
                  <tbody>
                    {keys.filter((k) => !k.is_public).map((k) => (
                      <tr key={k.id}>
                        <td>{k.label}</td>
                        <td><code>{k.key_prefix}…</code></td>
                        <td>{k.last_used_at ? formatDateTime(k.last_used_at) : 'Never'}</td>
                        <td>
                          <button className="btn btn-ghost btn-sm btn-icon" onClick={() => handleRevokeKey(k.id)} title="Revoke">
                            <Trash2 size={14} className="text-danger" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'Embed Widget' && (
        <div className="card card-pad" style={{ maxWidth: 720 }}>
          <div className="flex items-center gap-3 mb-4">
            <Code2 size={18} className="text-primary" />
            <h3 style={{ fontSize: 15.5 }}>Embed script</h3>
          </div>
          <p style={{ fontSize: 13, marginBottom: 14 }}>
            Paste this snippet before the closing <code>&lt;/body&gt;</code> tag of any page to add a floating
            chat widget backed by this project. It already contains your public key. You can change
            <code> data-title</code>, <code>data-welcome</code>, <code>data-color</code> and <code>data-position</code>
            (<code>bottom-right</code> or <code>bottom-left</code>).
          </p>
          <pre>{embedScript}</pre>
          <div className="flex gap-2 mt-4">
            <button className="btn btn-primary btn-sm" onClick={() => copyText(embedScript, 'Snippet copied.')}>
              Copy snippet
            </button>
            <button className="btn btn-outline btn-sm" onClick={openTestPage}>
              Open test page
            </button>
          </div>
        </div>
      )}

      {tab === 'Console' && (
        <div>
          <div className="card card-pad mb-4" style={{ maxWidth: 640 }}>
            <div className="flex items-center gap-2 mb-3">
              <MessageSquareCode size={16} className="text-primary" />
              <h3 style={{ fontSize: 14.5 }}>Developer console</h3>
            </div>
            <p style={{ fontSize: 12.5, marginBottom: 10 }}>
              Paste a secret or public key to test <code>POST /v1/chat/{'{projectId}'}</code> live. Secret keys are
              only shown once at creation; the public key is always available.
            </p>
            <input
              className="input"
              placeholder="sk_live_… or pk_live_…"
              value={testApiKey}
              onChange={(e) => setTestApiKey(e.target.value)}
            />
            {publicKey && (
              <button type="button" className="btn btn-outline btn-sm mt-2" onClick={() => setTestApiKey(publicKey)}>
                Use the public key
              </button>
            )}
          </div>
          <div style={{ height: 480 }}>
            <ChatWindow
              messages={chat.messages}
              onSend={chat.send}
              sending={chat.sending}
              disabled={!testApiKey}
              disabledHint="Paste an API key above (or use the public key) to test this project"
              emptyTitle="Test your integration"
              emptyDescription="Messages here call the same endpoint your production app will use."
            />
          </div>
        </div>
      )}

      <Modal
        open={keyModalOpen}
        onClose={() => setKeyModalOpen(false)}
        title={newKey ? 'Save your new key' : 'Create API key'}
        footer={
          newKey ? (
            <button className="btn btn-primary" onClick={() => setKeyModalOpen(false)}>Done</button>
          ) : (
            <>
              <button className="btn btn-outline" onClick={() => setKeyModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreateKey} disabled={creatingKey || !keyLabel.trim()}>
                {creatingKey ? 'Creating…' : 'Create key'}
              </button>
            </>
          )
        }
      >
        {newKey ? (
          <div>
            <div className="alert alert-warning mb-4">This key is shown once — store it securely.</div>
            <CopyField value={newKey} />
          </div>
        ) : (
          <div className="field">
            <label>Key label</label>
            <input className="input" value={keyLabel} onChange={(e) => setKeyLabel(e.target.value)} placeholder="production" />
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDeleteProject}
        title="Delete this project?"
        message="This permanently deletes the project, its documents, keys, and vector index. This cannot be undone."
        confirmLabel="Delete project"
        loading={deleting}
      />

      <ConfirmDialog
        open={confirmRotate}
        onClose={() => setConfirmRotate(false)}
        onConfirm={handleRotatePublicKey}
        title={status?.source ? 'Disable the API?' : 'Delete this project?'}
        message={status?.source
          ? 'This removes all API keys and stops the embedded widget. Your GitHub repository and its indexed documentation are not affected.'
          : 'This permanently deletes the project, its documents, keys, and vector index. This cannot be undone.'}
        confirmLabel={status?.source ? 'Disable API' : 'Delete project'}
        loading={rotating}
      />
    </div>
  );
}
