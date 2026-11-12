import { useEffect, useRef, useState } from 'react';
import { Clock, RefreshCcw, Trash2, FileText } from 'lucide-react';
import ChatWindow from '../chat/ChatWindow';
import FileDropzone, { FileChip } from '../ui/FileDropzone';
import { StatusBadge } from '../ui/Primitives';
import { InstantAPI } from '../../lib/api';
import { useChatStream } from '../../hooks/useChatStream';
import { useToast } from '../../context/ToastContext';
import { apiErrorMessage } from '../../lib/http';
import '../../pages/chat/InstantChat.css';

import { UsersAPI } from '../../lib/api';
import { getAccessToken } from '../../lib/http';

const POLL_MS = 2500;
const SESSION_KEY = 'enawga_instant_session';
const SESSION_TTL_MS = 2 * 60 * 60 * 1000; // matches the backend's 2h session
const chatKey = (id) => `enawga_instant_chat_${id}`;

function readSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    const s = raw ? JSON.parse(raw) : null;
    return s?.sessionId ? s : null;
  } catch {
    return null;
  }
}
function saveSession(s) {
  try { localStorage.setItem(SESSION_KEY, JSON.stringify(s)); } catch { /* ignore */ }
}
function clearSession(id) {
  try {
    localStorage.removeItem(SESSION_KEY);
    if (id) localStorage.removeItem(chatKey(id));
  } catch { /* ignore */ }
}

export default function InstantChatPanel({ embedded = false }) {
  const [file, setFile] = useState(null); // { name, size }
  const [sessionId, setSessionId] = useState(null);
  const [status, setStatus] = useState(null); // processing | ready | failed
  const [progress, setProgress] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [restoring, setRestoring] = useState(() => !!readSession());
  const pollRef = useRef(null);
  const toast = useToast();

  const chat = useChatStream({
    url: InstantAPI.chatStreamUrl(),
    buildBody: (message, history) => ({ session_id: sessionId, message, history }),
    storageKey: sessionId ? chatKey(sessionId) : null,
    ttlMs: SESSION_TTL_MS,
  });

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  useEffect(() => stopPolling, []);

  const resetUi = (id) => {
    stopPolling();
    clearSession(id);
    setSessionId(null);
    setStatus(null);
    setProgress(null);
    setFile(null);
    chat.reset();
  };

  const startPolling = (id) => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const { data } = await InstantAPI.status(id);
        setStatus(data.status);
        setProgress(data.progress_pct);
        if (data.status === 'ready' || data.status === 'failed') stopPolling();
      } catch (err) {
        if (err?.response?.status === 404) {
          resetUi(id);
          toast.info('Your Instant Chat session expired. Upload a document to start a new one.');
        } else {
          stopPolling();
          setStatus('failed');
        }
      }
    }, POLL_MS);
  };

  // Restore the previous session after a refresh / page change / re-login
  useEffect(() => {
    const saved = readSession();
    if (!saved) return;
    let cancelled = false;

    (async () => {
      try {
        const { data } = await InstantAPI.status(saved.sessionId);
        if (cancelled) return;
        setFile({ name: saved.name, size: saved.size });
        setSessionId(saved.sessionId);
        setStatus(data.status);
        setProgress(data.progress_pct);
        if (data.status === 'processing') startPolling(saved.sessionId);
      } catch (err) {
        if (cancelled) return;
        if (err?.response?.status === 404) {
          clearSession(saved.sessionId);
          toast.info('Your previous Instant Chat session expired. Upload a document to start a new one.');
        } else {
          toast.error('Could not reach the server to restore your session. Refresh to try again.');
        }
      } finally {
        if (!cancelled) setRestoring(false);
      }
    })();

    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // If the server says the session is gone while chatting, reset cleanly
  useEffect(() => {
    if (sessionId && chat.error && /session not found|expired/i.test(chat.error)) {
      resetUi(sessionId);
      toast.info('Your Instant Chat session expired. Upload a document to start a new one.');
    }
  }, [chat.error]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFiles = async (files) => {
    const f = files[0];
    setFile({ name: f.name, size: f.size });
    setUploading(true);
    try {
            // In the dashboard: make sure the login token is fresh so this session is counted in your usage
      if (embedded && getAccessToken()) await UsersAPI.me().catch(() => {});
      const { data } = await InstantAPI.upload([f]);
      setSessionId(data.session_id);
      setStatus(data.status || 'processing');
      saveSession({ sessionId: data.session_id, name: f.name, size: f.size });
      startPolling(data.session_id);
      toast.success('File uploaded — indexing your document now.');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Upload failed.'));
      setFile(null);
    } finally {
      setUploading(false);
    }
  };

  const handleReset = async () => {
    const id = sessionId;
    if (id) {
      try {
        await InstantAPI.deleteSession(id);
      } catch {
        /* best effort */
      }
    }
    resetUi(id);
  };

  const ready = status === 'ready';

  return (
    <div className={`instant-shell ${embedded ? 'embedded' : ''}`}>
      <div className="instant-side">
        <div className="card card-pad">
          <h3 style={{ fontSize: 15.5, marginBottom: 4 }}>Instant Chat session</h3>
          <p style={{ fontSize: 13, marginBottom: 16 }}>
            Free tier: 1 file, up to 5MB, PDF / DOCX / TXT / MD / RST. Your session stays active for 2
            hours after your last message — refresh or come back later and pick up where you left off.
          </p>

          {restoring ? (
            <p style={{ fontSize: 13 }}>Restoring your previous session…</p>
          ) : !file ? (
            <FileDropzone multiple={false} onFilesSelected={handleFiles} />
          ) : (
            <div className="flex flex-col gap-3">
              <FileChip file={file} status={<StatusBadge status={status || 'processing'} />} />
              {status === 'processing' && (
                <div className="alert alert-info">
                  <Clock size={16} />
                  <div>
                    Indexing your document{progress ? ` — ${progress}%` : '…'}
                    <div style={{ fontSize: 11.5, marginTop: 2 }}>
                      Parsing → chunking → language detection → embedding → vector storage.
                    </div>
                  </div>
                </div>
              )}
              {status === 'failed' && (
                <div className="alert alert-danger">Indexing failed. Please try a different file.</div>
              )}
              {ready && (
                <div className="alert alert-success">
                  <FileText size={16} /> Ready — ask anything about this document.
                </div>
              )}
              <button className="btn btn-outline btn-sm" onClick={handleReset}>
                <RefreshCcw size={14} /> Start a new session
              </button>
            </div>
          )}

          {uploading && <p className="mt-4" style={{ fontSize: 12.5 }}>Uploading…</p>}
        </div>

        {sessionId && (
          <button className="btn btn-ghost btn-sm" onClick={handleReset} style={{ alignSelf: 'flex-start' }}>
            <Trash2 size={14} /> Delete session
          </button>
        )}
      </div>

      <ChatWindow
        messages={chat.messages}
        onSend={chat.send}
        sending={chat.sending}
        disabled={!ready}
        disabledHint={file ? 'Waiting for your document to finish indexing…' : 'Upload a document to start chatting'}
        emptyTitle="Upload a document to begin"
        emptyDescription="Once indexing finishes, ask questions in any language — Amharic and Oromifaa included."
      />
    </div>
  );
}