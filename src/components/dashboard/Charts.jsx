import { formatNumber } from '../../lib/format';

const shortDate = (value) => {
  if (!value) return '';
  const d = new Date(value.length <= 7 ? `${value}-01T00:00:00Z` : `${value}T00:00:00Z`);
  return d.toLocaleDateString(undefined, value.length <= 7
    ? { month: 'short', year: '2-digit', timeZone: 'UTC' }
    : { month: 'short', day: 'numeric', timeZone: 'UTC' });
};

/** Simple responsive column chart (no chart library needed). Hover a bar to see its exact value. */
export function BarChart({ data, valueKey, xKey = 'date', format = formatNumber, height = 190 }) {
  if (!data?.length) return null;
  const values = data.map((d) => d[valueKey] || 0);
  const max = Math.max(...values, 0) || 1;
  const first = data[0];
  const middle = data[Math.floor(data.length / 2)];
  const last = data[data.length - 1];

  return (
    <div className="chart">
      <div className="chart-body" style={{ height }}>
        <div className="chart-axis">
          <span>{format(max)}</span>
          <span>{format(Math.round(max / 2))}</span>
          <span>0</span>
        </div>
        <div className="chart-bars">
          {data.map((d, i) => (
            <div key={d[xKey] || i} className="chart-col" title={`${shortDate(d[xKey])} — ${format(values[i])}`}>
              <div className="chart-bar" style={{ height: `${values[i] ? Math.max(3, (values[i] / max) * 100) : 0}%` }} />
            </div>
          ))}
        </div>
      </div>
      <div className="chart-x">
        <span>{shortDate(first[xKey])}</span>
        <span>{data.length > 2 ? shortDate(middle[xKey]) : ''}</span>
        <span>{shortDate(last[xKey])}</span>
      </div>
    </div>
  );
}

/** Horizontal bars with a label and a number, e.g. languages. */
export function HBarList({ items, labelOf, valueKey = 'count', format = formatNumber }) {
  if (!items?.length) return null;
  const max = Math.max(...items.map((i) => i[valueKey] || 0), 1);
  return (
    <div className="hbars">
      {items.map((item, i) => (
        <div key={i} className="hbar-row">
          <span className="hbar-label">{labelOf(item)}</span>
          <div className="hbar-track"><div className="hbar-fill" style={{ width: `${Math.max(3, ((item[valueKey] || 0) / max) * 100)}%` }} /></div>
          <span className="hbar-value">{format(item[valueKey] || 0)}</span>
        </div>
      ))}
    </div>
  );
}

/** A usage meter that turns amber / red as it fills. `limit === null` means unlimited. */
export function Meter({ label, used, limit, format = formatNumber, hint }) {
  const unlimited = limit === null || limit === undefined;
  const pct = unlimited || limit === 0 ? 0 : Math.min(100, Math.round((used / limit) * 100));
  const tone = pct >= 100 ? 'danger' : pct >= 80 ? 'warning' : 'ok';
  return (
    <div className="meter">
      <div className="meter-top">
        <span>{label}</span>
        <strong>{format(used)} <span className="meter-of">/ {unlimited ? 'unlimited' : format(limit)}</span></strong>
      </div>
      <div className="progress-bar"><div className={`progress-bar-fill meter-${tone}`} style={{ width: `${unlimited ? 4 : Math.max(pct, used ? 3 : 0)}%` }} /></div>
      {hint && <div className="meter-hint">{hint}</div>}
    </div>
  );
}