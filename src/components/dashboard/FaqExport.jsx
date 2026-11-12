import { useState } from 'react';
import { Download } from 'lucide-react';
import { DashboardAPI } from '../../lib/api';
import { Modal } from '../ui/Modal';
import { useToast } from '../../context/ToastContext';

const MIN_OPTIONS = [10, 25, 50, 100];
const PERIODS = [
  { days: 30, label: 'Last 30 days' },
  { days: 90, label: 'Last 90 days' },
  { days: 365, label: 'Last 12 months' },
];

// Number of data rows in a CSV text (handles quoted cells that contain line breaks)
function countCsvRows(text) {
  let rows = 0;
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === '"') quoted = !quoted;
    else if (ch === '\n' && !quoted) rows += 1;
  }
  return Math.max(0, rows - 1); // minus the header line
}

/** "Export FAQ (CSV)" button with a small dialog. Without projectId it exports every project. */
export default function FaqExport({ projectId, projectName, initialMin = 25 }) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [minCount, setMinCount] = useState(initialMin);
  const [days, setDays] = useState(90);
  const [busy, setBusy] = useState(false);

  const download = async () => {
    setBusy(true);
    try {
      const res = await DashboardAPI.exportFaq({ projectId, days, minCount });
      const text = await res.data.text();
      const rows = countCsvRows(text.replace(/^\uFEFF/, ''));
      if (rows === 0) {
        toast.info(`No question was asked at least ${minCount} times in that period, so there's nothing to export yet. Try a lower minimum or a longer period.`);
        return;
      }
      const slug = (projectName || 'all-projects').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'project';
      const url = URL.createObjectURL(new Blob([res.data], { type: 'text/csv;charset=utf-8' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `faq-${slug}-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${rows} frequently asked question${rows === 1 ? '' : 's'}.`);
      setOpen(false);
    } catch (err) {
      let message = 'Could not export. Please try again.';
      if (err?.response?.status === 429) message = 'Too many exports. Please wait a minute.';
      else if (err?.response?.data?.text) {
        try { message = JSON.parse(await err.response.data.text()).detail || message; } catch { /* keep default */ }
      }
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button className="btn btn-outline btn-sm" onClick={() => setOpen(true)}>
        <Download size={14} /> Export FAQ (CSV)
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Export frequently asked questions"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={download} disabled={busy}>{busy ? 'Preparing…' : 'Download CSV'}</button>
          </>
        }
      >
        <p style={{ fontSize: 13.5, marginBottom: 16 }}>
          Only questions that people asked <strong>many times</strong> are included. Differences in capital letters,
          punctuation and spacing are merged, and greetings like "hello" are left out.
        </p>
        <div className="field">
          <label>Asked at least</label>
          <div className="seg">
            {MIN_OPTIONS.map((n) => (
              <button key={n} type="button" className={minCount === n ? 'active' : ''} onClick={() => setMinCount(n)}>{n}×</button>
            ))}
          </div>
        </div>
        <div className="field">
          <label>Period</label>
          <div className="seg">
            {PERIODS.map((p) => (
              <button key={p.days} type="button" className={days === p.days ? 'active' : ''} onClick={() => setDays(p.days)}>{p.label}</button>
            ))}
          </div>
        </div>
        <span className="hint">
          {projectName ? `Project: ${projectName}.` : 'All of your projects.'} The file opens in Excel and Google Sheets
          and includes how often, by how many visitors, and how well each question was answered.
        </span>
      </Modal>
    </>
  );
}