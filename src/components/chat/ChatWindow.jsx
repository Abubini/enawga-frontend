import { useEffect, useRef, useState } from 'react';
import { Send, Sparkles, MessageCircleMore } from 'lucide-react';
import './ChatWindow.css';

export default function ChatWindow({
  messages,
  onSend,
  sending,
  disabled,
  disabledHint,
  placeholder = 'Ask a question…',
  welcomeMessage,
  emptyTitle = 'Ask me anything',
  emptyDescription = 'Answers are grounded only in the documents you provided.',
  botLabel = 'AI',
  userLabel = 'You',
}) {
  const [draft, setDraft] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const submit = (e) => {
    e.preventDefault();
    if (!draft.trim() || disabled || sending) return;
    onSend(draft.trim());
    setDraft('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit(e);
    }
  };

  return (
    <div className="chat-window">
      <div className="chat-messages" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="chat-empty">
            <div className="empty-icon"><MessageCircleMore size={22} /></div>
            <h3 style={{ fontSize: 15.5, marginBottom: 6 }}>{emptyTitle}</h3>
            <p style={{ maxWidth: 320, fontSize: 13.5 }}>{welcomeMessage || emptyDescription}</p>
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={`chat-bubble-row ${m.role}`}>
              <div className={`chat-avatar ${m.role}`}>
                {m.role === 'user' ? userLabel.charAt(0).toUpperCase() : <Sparkles size={14} />}
              </div>
              <div className={`chat-bubble ${m.failed ? 'failed' : ''} ${m.role === 'assistant' && !m.content && sending && i === messages.length - 1 ? 'empty' : ''}`}>
                {m.content || (m.failed ? (m.error || 'Something went wrong sending this message.') : '')}
              </div>
            </div>
          ))
        )}
      </div>

      <form className="chat-input-row" onSubmit={submit}>
        <textarea
          className="textarea"
          rows={1}
          placeholder={disabled ? disabledHint || 'Chat is not available yet…' : placeholder}
          value={draft}
          disabled={disabled}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={2000}
        />
        <button type="submit" className="btn btn-primary btn-icon" disabled={disabled || sending || !draft.trim()} aria-label="Send">
          <Send size={17} />
        </button>
      </form>
    </div>
  );
}
