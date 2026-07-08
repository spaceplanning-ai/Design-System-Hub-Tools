import { useId, useRef, useState } from 'react';
import { cx } from '@/utils/cx';
import { toDataAttrs } from '@core/defineComponent';
import { niceMax, ticks, yScale, linePath, areaPath, seriesColor } from '@/utils/chart';
import { lineChartMeta } from './LineChart.meta';
import './LineChart.css';

export type LineChartType = 'A' | 'B';

export interface LineSeries {
  name: string;
  points: number[];
}

export interface LineChartProps {
  /** X-axis category labels (shared across series). */
  labels: string[];
  series: LineSeries[];
  /** A: line · B: filled area. */
  type?: LineChartType;
  height?: number;
  showDots?: boolean;
  format?: (value: number) => string;
  /** Show a chart ↔ table view toggle (accessibility fallback). */
  withTableToggle?: boolean;
  ariaLabel?: string;
  className?: string;
}

const W = 320;

export function LineChart({
  labels,
  series,
  type = 'A',
  height = 200,
  showDots = false,
  format = (v) => String(v),
  withTableToggle = false,
  ariaLabel,
  className,
}: LineChartProps) {
  const titleId = useId();
  const svgRef = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [view, setView] = useState<'chart' | 'table'>('chart');
  const area = type === 'B';
  const max = niceMax(Math.max(1, ...series.flatMap((s) => s.points)));
  const left = 4;
  const right = W - 44; // room for end-labels
  const top = 12;
  const bottom = height - 22;
  const plotW = right - left;
  const plotH = bottom - top;
  const n = labels.length;
  const xAt = (i: number) => left + (n <= 1 ? 0 : (i / (n - 1)) * plotW);
  const yOf = (v: number) => yScale(v, max, top, plotH);

  const onMove = (e: React.MouseEvent) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect || n <= 1) return;
    const xVu = ((e.clientX - rect.left) / rect.width) * W;
    const idx = Math.round(((xVu - left) / plotW) * (n - 1));
    setHover(Math.max(0, Math.min(n - 1, idx)));
  };

  const summary =
    ariaLabel ??
    `선 차트: ${series.map((s) => `${s.name} (${s.points.map(format).join(', ')})`).join('; ')}`;

  const hoverY = hover != null ? Math.min(...series.map((s) => yOf(s.points[hover]))) : 0;

  return (
    <div
      className={cx('tds-linechart', className)}
      role="img"
      aria-labelledby={titleId}
      {...toDataAttrs(lineChartMeta, { type })}
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
              <th>구분</th>
              {series.map((s) => (
                <th key={s.name} className="num">
                  {s.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {labels.map((lb, i) => (
              <tr key={lb + i}>
                <td>{lb}</td>
                {series.map((s) => (
                  <td key={s.name} className="num">
                    {format(s.points[i])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <>
          {series.length > 1 && (
            <ul className="tds-linechart__legend" aria-hidden="true">
              {series.map((s, i) => (
                <li key={s.name}>
                  <span className="tds-linechart__swatch" style={{ background: seriesColor(i) }} />
                  {s.name}
                </li>
              ))}
            </ul>
          )}
          <div className="tds-linechart__plot">
            <svg
              ref={svgRef}
              viewBox={`0 0 ${W} ${height}`}
              width="100%"
              aria-hidden="true"
              onMouseMove={onMove}
              onMouseLeave={() => setHover(null)}
            >
              {ticks(max).map((t, i) => {
                const y = yOf(t);
                return (
                  <line
                    key={i}
                    className="tds-linechart__grid"
                    x1={left}
                    x2={right}
                    y1={y}
                    y2={y}
                  />
                );
              })}
              {labels.map((lb, i) => (
                <text
                  key={lb + i}
                  className="tds-linechart__cat"
                  x={xAt(i)}
                  y={height - 7}
                  textAnchor="middle"
                >
                  {lb}
                </text>
              ))}
              {hover != null && (
                <line
                  className="tds-linechart__crosshair"
                  x1={xAt(hover)}
                  x2={xAt(hover)}
                  y1={top}
                  y2={bottom}
                />
              )}
              {series.map((s, si) => {
                const color = seriesColor(si);
                const pts = s.points.map((v, i) => ({ x: xAt(i), y: yOf(v) }));
                const last = pts[pts.length - 1];
                return (
                  <g key={s.name} style={{ '--line-color': color } as React.CSSProperties}>
                    {area && <path className="tds-linechart__area" d={areaPath(pts, bottom)} />}
                    <path className="tds-linechart__line" d={linePath(pts)} />
                    {showDots &&
                      pts.map((p, i) => (
                        <circle key={i} className="tds-linechart__dot" cx={p.x} cy={p.y} r={3} />
                      ))}
                    {hover != null && (
                      <circle
                        className="tds-linechart__hoverdot"
                        cx={xAt(hover)}
                        cy={yOf(s.points[hover])}
                        r={3.5}
                      />
                    )}
                    {last && (
                      <text className="tds-linechart__endlabel" x={last.x + 6} y={last.y + 4}>
                        {format(s.points[s.points.length - 1])}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
            {hover != null && (
              <div
                className="tds-chart-tooltip"
                style={{ left: `${(xAt(hover) / W) * 100}%`, top: `${(hoverY / height) * 100}%` }}
              >
                <div className="tds-chart-tooltip__title">{labels[hover]}</div>
                {series.map((s, i) => (
                  <div key={s.name} className="tds-chart-tooltip__row">
                    <span
                      className="tds-chart-tooltip__swatch"
                      style={{ background: seriesColor(i) }}
                    />
                    {s.name}
                    <span className="tds-chart-tooltip__val">{format(s.points[hover])}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
