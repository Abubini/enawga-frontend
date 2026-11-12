import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { timeAgo } from '../../lib/format';

function languageName(code) {
  if (!code || code === 'unknown') return '';
  try {
    return new Intl.DisplayNames(['en'], { type: 'language' }).of(code) || code;
  } catch {
    return code;
  }
}

/** Small grey text showing which language a question was asked in. */
export function LangTag({ code }) {
  const name = languageName(code);
  return name ? <span className="q-lang">{name}</span> : null;
}

const PREVIEW = 4;

/** Shows a few recent conversations; the rest are one click away. */
export function RecentConversations({ items, showProject = false }) {
  const [expanded, setExpanded] = useState(false);

  if (!items?.length) return <p className="empty-note">Conversations will show up here as they happen.</p>;
  const visible = expanded ? items : items.slice(0, PREVIEW);
  const hidden = items.length - PREVIEW;

  return (
    <>
      <ul className="q-list">
        {visible.map((c, i) => (
          <li key={i}>
            <div className="q-text">{c.question}</div>
            <div className="q-answer">{c.answer}</div>
            <div className="q-meta">
              {showProject && <span>{c.project}</span>}
              <span>{timeAgo(c.time)}</span>
              <LangTag code={c.language} />
              {c.answered === false && <span className="badge badge-warning">Couldn't answer</span>}
            </div>
          </li>
        ))}
      </ul>
      {hidden > 0 && (
        <button className="btn btn-ghost btn-sm q-toggle" onClick={() => setExpanded((v) => !v)} aria-expanded={expanded}>
          {expanded ? 'Show fewer' : `Show ${hidden} more`}
          <ChevronDown size={14} className={expanded ? 'open' : ''} />
        </button>
      )}
    </>
  );
}