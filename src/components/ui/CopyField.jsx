import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export default function CopyField({ value, mask = false }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className="copy-field">
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
        {mask ? value.replace(/.(?=.{4})/g, '•') : value}
      </span>
      <button type="button" className="btn btn-ghost btn-sm btn-icon" onClick={copy} aria-label="Copy">
        {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
      </button>
    </div>
  );
}
