import { useRef, useState } from 'react';
import { UploadCloud, FileText, X } from 'lucide-react';

const ACCEPT = '.pdf,.docx,.txt,.md,.mdx,.rst';

export default function FileDropzone({ multiple = false, onFilesSelected, hint }) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const handleFiles = (fileList) => {
    const files = Array.from(fileList);
    if (!files.length) return;
    onFilesSelected(multiple ? files : [files[0]]);
  };

  return (
    <div
      className="dropzone"
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        handleFiles(e.dataTransfer.files);
      }}
      onClick={() => inputRef.current?.click()}
      style={{
        border: `2px dashed ${dragOver ? 'var(--color-primary)' : 'var(--color-border-soft)'}`,
        borderRadius: 'var(--radius-lg)',
        padding: '32px 20px',
        textAlign: 'center',
        cursor: 'pointer',
        background: dragOver ? 'var(--color-primary-lt)' : 'var(--color-bg)',
        transition: 'all 160ms ease',
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple={multiple}
        hidden
        onChange={(e) => { handleFiles(e.target.files); e.target.value = ''; }}
      />
      <div className="empty-icon" style={{ margin: '0 auto 14px' }}>
        <UploadCloud size={22} />
      </div>
      <p style={{ fontWeight: 600, color: 'var(--color-navy)', marginBottom: 4 }}>
        Drag &amp; drop {multiple ? 'files' : 'a file'} here, or click to browse
      </p>
      <p style={{ fontSize: 12.5 }}>{hint || 'PDF, DOCX, TXT, MD, MDX, or RST'}</p>
    </div>
  );
}

export function FileChip({ file, onRemove, status }) {
  return (
    <div className="flex items-center gap-3" style={{
      padding: '10px 14px',
      border: '1px solid var(--color-border-soft)',
      borderRadius: 'var(--radius-md)',
      background: 'var(--color-surface)',
    }}>
      <FileText size={16} className="text-primary" />
      <span style={{ fontSize: 13.5, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {file.name}
      </span>
      {status}
      {onRemove && (
        <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={onRemove} aria-label="Remove">
          <X size={14} />
        </button>
      )}
    </div>
  );
}
