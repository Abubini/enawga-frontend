import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Lock, ShieldAlert } from 'lucide-react';
import ChatWindow from '../../components/chat/ChatWindow';
import { HostedAPI } from '../../lib/api';
import { useChatStream } from '../../hooks/useChatStream';
import { apiErrorMessage } from '../../lib/http';
import Logo from '../../components/ui/Logo';
import ThemeToggle from '../../components/ui/ThemeToggle';
import { PageLoader } from '../../components/ui/Primitives';

import { RefreshCcw } from 'lucide-react';

const tokenKey = (id) => `enawga_bot_token_${id}`;

// A stable anonymous ID per browser, so rate limits apply per visitor instead of per shared IP
function getVisitorId() {
  try {
    let id = localStorage.getItem('enawga_visitor_id');
    if (!id) {
      id = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem('enawga_visitor_id', id);
    }
    return id;
  } catch {
    return 'anon';
  }
}

export default function PublicBotChat() {
  // This param is the slug from the shared link (/bot/<slug>)
  const { botId } = useParams();

  const [info, setInfo] = useState(null);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [botToken, setBotToken] = useState(() => sessionStorage.getItem(tokenKey(botId)));
  const [password, setPassword] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [passwordError, setPasswordError] = useState(null);
  const [visitorId] = useState(getVisitorId);

  // Load the public settings (theme, welcome text, password flag)
  useEffect(() => {
    let cancelled = false;
    setLoadingInfo(true);
    setNotFound(false);
    HostedAPI.publicInfo(botId)
      .then(({ data }) => { if (!cancelled) setInfo(data); })
      .catch(() => { if (!cancelled) setNotFound(true); })
      .finally(() => { if (!cancelled) setLoadingInfo(false); });
    return () => { cancelled = true; };
  }, [botId]);

  const chat = useChatStream({
    url: HostedAPI.chatStreamUrl(botId),
    headers: botToken ? { Authorization: `Bot ${botToken}` } : {},
    buildBody: (message, history) => ({ message, session_id: `v-${visitorId}`, history }),
    storageKey: info ? `enawga_bot_chat_${info.bot_id}` : null,
    ttlMs: 24 * 60 * 60 * 1000, // conversation is kept for 24h after the last message
  });

  // If the saved token expired / was rejected, ask for the password again
  useEffect(() => {
    if (chat.error && /password/i.test(chat.error) && botToken) {
      sessionStorage.removeItem(tokenKey(botId));
      setBotToken(null);
    }
  }, [chat.error, botToken, botId]);

  const locked = !!info?.requires_password && !botToken;

  const handleVerifyPassword = async (e) => {
    e.preventDefault();
    setVerifying(true);
    setPasswordError(null);
    try {
      const { data } = await HostedAPI.verifyPassword(botId, password);
      sessionStorage.setItem(tokenKey(botId), data.token);
      setBotToken(data.token);
      setPassword('');
    } catch (err) {
      setPasswordError(apiErrorMessage(err, 'Incorrect password.'));
    } finally {
      setVerifying(false);
    }
  };

  if (loadingInfo) return <PageLoader label="Loading chatbot…" />;

  if (notFound || !info) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg)' }}>
        <div className="card card-pad text-center" style={{ maxWidth: 380 }}>
          <h2 style={{ fontSize: 16, marginBottom: 6 }}>Chatbot not found</h2>
          <p style={{ fontSize: 13.5 }}>This link may be wrong, or the chatbot is no longer available.</p>
        </div>
      </div>
    );
  }

  // Apply the owner's theme color to everything inside this page
  const color = info.theme_color || '#4F46E5';
  const themeVars = {
    '--color-primary': color,
    '--color-primary-lt': `color-mix(in srgb, ${color} 14%, transparent)`,
    '--color-primary-md': `color-mix(in srgb, ${color} 40%, transparent)`,
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--color-bg)', ...themeVars }}>
      <header className="flex items-center justify-between" style={{ padding: '16px 24px', borderBottom: '1px solid var(--color-border-soft)' }}>
        <div className="flex items-center gap-2">
          {!locked && chat.messages.length > 0 && (
            <button className="btn btn-ghost btn-sm" onClick={chat.reset}>
              <RefreshCcw size={14} /> New chat
            </button>
          )}
          <ThemeToggle />
        </div>
      </header>

      <div className="container" style={{ flex: 1, display: 'flex', padding: '24px', maxWidth: 720 }}>
        {locked ? (
          <div className="card card-pad" style={{ margin: 'auto', maxWidth: 380, width: '100%' }}>
            <div className="flex items-center gap-2 mb-4">
              <Lock size={18} className="text-primary" />
              <h2 style={{ fontSize: 16 }}>This chatbot is password protected</h2>
            </div>
            <form onSubmit={handleVerifyPassword}>
              <div className="field">
                <label>Password</label>
                <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoFocus />
              </div>
              {passwordError && <div className="alert alert-danger mb-4"><ShieldAlert size={16} /> {passwordError}</div>}
              <button type="submit" className="btn btn-primary btn-block" disabled={verifying}>
                {verifying ? 'Checking…' : 'Unlock chat'}
              </button>
            </form>
          </div>
        ) : (
          <div style={{ flex: 1, minHeight: 560 }}>
            <ChatWindow
              messages={chat.messages}
              onSend={chat.send}
              sending={chat.sending}
              emptyTitle={info.name}
              welcomeMessage={info.welcome_message}
              botLabel={info.name}
            />
          </div>
        )}
      </div>

      <footer className="text-center" style={{ padding: 16, fontSize: 12, color: 'var(--color-slate)' }}>
        Powered by <a href="/" style={{ fontWeight: 700, color: 'var(--color-primary)' }}>Enawga</a>
      </footer>
    </div>
  );
}