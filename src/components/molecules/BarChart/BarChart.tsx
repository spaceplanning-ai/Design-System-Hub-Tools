import { useId, useState } from 'react';
import { cx } from '@/utils/cx';
import { toDataAttrs } from '@core/defineComponent';
import { niceMax, ticks, seriesColor } from '@/utils/chart';
import { barChartMeta } from './BarChart.meta';
import './BarChart.css';

export type BarChartType = 'A' | 'B';

export interface BarDatum {
  label: string;
  value: number;
}

export interface BarChartProps {
  data: BarDatum[];
  /** A: vertical columns · B: horizontal bars. */
  type?: BarChartType;
  /** Categorical series slot 1–6. */
  color?: '1' | '2' | '3' | '4' | '5' | '6';
  height?: number;
  showValues?: boolean;
  format?: (value: number) => string;
  /** Fired when a bar is clicked — for linked/cross-filter dashboards. */
  onSelect?: (datum: BarDatum, index: number) => void;
  /** Index of the currently selected bar (highlighted). */
  selectedIndex?: number | null;
  /** Show a chart ↔ table view toggle (accessibility fallback). */
  withTableToggle?: boolean;
  ariaLabel?: string;
  className?: string;
}

const W = 320;
const PAD = 4;

interface Bar {
  d: BarDatum;
  x: number;
  y: number;
  w: number;
  h: number;
  /** Tooltip anchor in viewBox units. */
  ax: number;
  ay: number;
}

export function BarChart({
  data,
  type = 'A',
  color = '1',
  height = 200,
  showValues = true,
  format = (v) => String(v),
  onSelect,
  selectedIndex,
  withTableToggle = false,
  ariaLabel,
  className,
}: BarChartProps) {
  const titleId = useId();
  const [hover, setHover] = useState<number | null>(null);
  const [view, setView] = useState<'chart' | 'table'>('chart');
  const max = niceMax(Math.max(1, ...data.map((d) => d.value)));
  const fill = seriesColor(Number(color) - 1);
  const vertical = type !== 'B';
  const H = vertical ? height : Math.max(height, data.length * 34 + 16);

  const gridY = vertical ? ticks(max).map((t) => H - 22 - (t / max) * (H - 22 - 18)) : [];

  const bars: Bar[] = data.map((d, i) => {
    if (vertical) {
      const top = 18;
      const bottom = H - 22;
      const plotH = bottom - top;
      const slot = (W - PAD * 2) / data.length;
      const w = slot * 0.6;
      const x = PAD + i * slot + (slot - w) / 2;
      const h = (d.value / max) * plotH;
      const y = bottom - h;
      return { d, x, y, w, h, ax: x + w / 2, ay: y };
    }
    const l = 72;
    const rgt = W - 40;
    const plotW = rgt - l;
    const slot = (H - 8) / data.length;
    const h = slot * 0.6;
    const y = 8 + i * slot + (slot - h) / 2;
    const w = (d.value / max) * plotW;
    return { d, x: l, y, w, h, ax: l + w, ay: y + h / 2 };
  });

  const summary =
    ariaLabel ?? `막대 차트: ${data.map((d) => `${d.label} ${format(d.value)}`).join(', ')}`;

  return (
    <div
      className={cx('tds-barchart', className)}
      role="img"
      aria-labelledby={titleId}
      {...toDataAttrs(barChartMeta, { type, color })}
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
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.label}>
                <td>{d.label}</td>
                <td className="num">{format(d.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="tds-barchart__plot">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            width="100%"
            aria-hidden="true"
            style={{ '--bar-fill': fill } as React.CSSProperties}
          >
            {gridY.map((y, i) => (
              <line key={i} className="tds-barchart__grid" x1={PAD} x2={W - PAD} y1={y} y2={y} />
            ))}
            {bars.map((b, i) => (
              <g
                key={b.d.label}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                onClick={onSelect ? () => onSelect(b.d, i) : undefined}
                style={onSelect ? { cursor: 'pointer' } : undefined}
              >
                <rect
                  className="tds-barchart__bar"
                  x={b.x}
                  y={b.y}
                  width={Math.max(b.w, 0)}
                  height={Math.max(b.h, 0)}
                  rx={4}
                  data-active={hover === i || undefined}
                  data-selected={selectedIndex === i || undefined}
                />
                {showValues &&
                  (vertical ? (
                    <text className="tds-barchart__value" x={b.ax} y={b.y - 5} textAnchor="middle">
                      {format(b.d.value)}
                    </text>
                  ) : (
                    <text
                      className="tds-barchart__value"
                      x={b.ax + 6}
                      y={b.ay + 4}
                      textAnchor="start"
                    >
                      {format(b.d.value)}
                    </text>
                  ))}
                {vertical ? (
                  <text className="tds-barchart__cat" x={b.ax} y={H - 7} textAnchor="middle">
                    {b.d.label}
                  </text>
                ) : (
                  <text className="tds-barchart__cat" x={b.x - 8} y={b.ay + 4} textAnchor="end">
                    {b.d.label}
                  </text>
                )}
              </g>
            ))}
          </svg>
          {hover != null && (
            <div
              className="tds-chart-tooltip"
              style={{
                left: `${(bars[hover].ax / W) * 100}%`,
                top: `${(bars[hover].ay / H) * 100}%`,
              }}
            >
              <div className="tds-chart-tooltip__title">{bars[hover].d.label}</div>
              <div className="tds-chart-tooltip__row">
                <span className="tds-chart-tooltip__swatch" style={{ background: fill }} />
                <span className="tds-chart-tooltip__val">{format(bars[hover].d.value)}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
