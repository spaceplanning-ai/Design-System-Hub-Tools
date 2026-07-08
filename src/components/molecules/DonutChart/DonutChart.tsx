import { useId, useState } from 'react';
import { cx } from '@/utils/cx';
import { toDataAttrs } from '@core/defineComponent';
import { donutArc, seriesColor } from '@/utils/chart';
import { donutChartMeta } from './DonutChart.meta';
import './DonutChart.css';

export type DonutChartType = 'A' | 'B';

export interface DonutDatum {
  label: string;
  value: number;
}

export interface DonutChartProps {
  data: DonutDatum[];
  /** A: donut · B: pie. */
  type?: DonutChartType;
  /** Center label (donut only). Defaults to the summed total. */
  total?: string;
  showLegend?: boolean;
  format?: (value: number) => string;
  /** Fired when a slice (or its legend row) is clicked. */
  onSelect?: (datum: DonutDatum, index: number) => void;
  /** Show a chart ↔ table view toggle (accessibility fallback). */
  withTableToggle?: boolean;
  ariaLabel?: string;
  className?: string;
}

const SIZE = 160;
const C = SIZE / 2;
const R = 74;

export function DonutChart({
  data,
  type = 'A',
  total,
  showLegend = true,
  format = (v) => String(v),
  onSelect,
  withTableToggle = false,
  ariaLabel,
  className,
}: DonutChartProps) {
  const titleId = useId();
  const [hover, setHover] = useState<number | null>(null);
  const [view, setView] = useState<'chart' | 'table'>('chart');
  const sum = data.reduce((a, d) => a + d.value, 0) || 1;
  const rInner = type === 'B' ? 0 : 46;
  const donut = type === 'A';

  let angle = 0;
  const segments = data.map((d, i) => {
    const start = angle;
    const sweep = (d.value / sum) * 360;
    angle += sweep;
    return {
      d,
      i,
      path: donutArc(C, C, R, rInner, start, start + sweep),
      pct: (d.value / sum) * 100,
    };
  });

  const summary =
    ariaLabel ?? `도넛 차트: ${data.map((d) => `${d.label} ${format(d.value)}`).join(', ')}`;
  const active = hover != null ? segments[hover] : null;

  return (
    <div
      className={cx('tds-donut', className)}
      role="img"
      aria-labelledby={titleId}
      {...toDataAttrs(donutChartMeta, { type })}
    >
      <span id={titleId} className="tds-sr-only">
        {summary}
      </span>
      {withTableToggle && (
        <div className="tds-chart-toolbar">
          <div className="tds-chart-toggle" role="group" aria-label="보기 전환">
            <button type="button" aria-pressed={view === 'chart'} onClick={() => setView('chart')}>
              차트
            </button>
            <button type="button" aria-pressed={view === 'table'} onClick={() => setView('table')}>
              표
            </button>
          </div>
        </div>
      )}
      {view === 'table' ? (
        <table className="tds-chart-table">
          <thead>
            <tr>
              <th>항목</th>
              <th className="num">값</th>
              <th className="num">비율</th>
            </tr>
          </thead>
          <tbody>
            {segments.map((s) => (
              <tr key={s.d.label}>
                <td>{s.d.label}</td>
                <td className="num">{format(s.d.value)}</td>
                <td className="num">{s.pct.toFixed(0)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="tds-donut__body">
          <div className="tds-donut__plot">
            <svg viewBox={`0 0 ${SIZE} ${SIZE}`} width="100%" aria-hidden="true">
              {segments.map((s) => (
                <path
                  key={s.d.label}
                  className="tds-donut__seg"
                  d={s.path}
                  data-dim={hover != null && hover !== s.i ? true : undefined}
                  onMouseEnter={() => setHover(s.i)}
                  onMouseLeave={() => setHover(null)}
                  onClick={onSelect ? () => onSelect(s.d, s.i) : undefined}
                  style={{ fill: seriesColor(s.i), cursor: onSelect ? 'pointer' : 'default' }}
                >
                  <title>{`${s.d.label}: ${format(s.d.value)} (${s.pct.toFixed(0)}%)`}</title>
                </path>
              ))}
              {donut && (
                <>
                  <text
                    className="tds-donut__center"
                    x={C}
                    y={active ? C - 2 : C + 5}
                    textAnchor="middle"
                  >
                    {active ? format(active.d.value) : (total ?? format(sum))}
                  </text>
                  {active && (
                    <text className="tds-donut__center-sub" x={C} y={C + 16} textAnchor="middle">
                      {active.d.label} · {active.pct.toFixed(0)}%
                    </text>
                  )}
                </>
              )}
            </svg>
          </div>
          {showLegend && (
            <ul className="tds-donut__legend">
              {segments.map((s) => (
                <li
                  key={s.d.label}
                  data-active={hover === s.i || undefined}
                  onMouseEnter={() => setHover(s.i)}
                  onMouseLeave={() => setHover(null)}
                  onClick={onSelect ? () => onSelect(s.d, s.i) : undefined}
                  style={onSelect ? { cursor: 'pointer' } : undefined}
                >
                  <span
                    className="tds-donut__swatch"
                    style={{ background: seriesColor(s.i) }}
                    aria-hidden="true"
                  />
                  <span className="tds-donut__legend-label">{s.d.label}</span>
                  <span className="tds-donut__legend-value">
                    {format(s.d.value)} · {s.pct.toFixed(0)}%
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
