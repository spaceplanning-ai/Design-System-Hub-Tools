import { useId, useState } from 'react';
import { cx } from '@/utils/cx';
import { toDataAttrs } from '@core/defineComponent';
import { niceMax, ticks, yScale, seriesColor } from '@/utils/chart';
import { scatterChartMeta } from './ScatterChart.meta';
import './ScatterChart.css';

export type ScatterChartType = 'A' | 'B';

export interface ScatterPoint {
  x: number;
  y: number;
}

export interface ScatterSeries {
  name: string;
  points: ScatterPoint[];
}

export interface ScatterChartProps {
  series: ScatterSeries[];
  xLabel?: string;
  yLabel?: string;
  /** A: points · B: points + linear trend line. */
  type?: ScatterChartType;
  height?: number;
  format?: (value: number) => string;
  ariaLabel?: string;
  className?: string;
}

/** viewBox width. */
const W = 320;
/** Inner plot insets (viewBox units): room for y-caption + x-caption/ticks. */
const LEFT = 34;
const RIGHT = 10;
const TOP = 12;
const BOTTOM_GAP = 34;

interface Plotted {
  si: number;
  pi: number;
  d: ScatterPoint;
  cx: number;
  cy: number;
}

/** Least-squares slope/intercept for a series; null when it can't be fit. */
function regression(points: ScatterPoint[]): { m: number; b: number } | null {
  const n = points.length;
  if (n < 2) return null;
  let sx = 0;
  let sy = 0;
  let sxy = 0;
  let sxx = 0;
  for (const p of points) {
    sx += p.x;
    sy += p.y;
    sxy += p.x * p.y;
    sxx += p.x * p.x;
  }
  const denom = n * sxx - sx * sx;
  if (denom === 0) return null;
  const m = (n * sxy - sx * sy) / denom;
  const b = (sy - m * sx) / n;
  return { m, b };
}

export function ScatterChart({
  series,
  xLabel,
  yLabel,
  type = 'A',
  height = 220,
  format = (v) => String(v),
  ariaLabel,
  className,
}: ScatterChartProps) {
  const titleId = useId();
  const [hover, setHover] = useState<{ si: number; pi: number } | null>(null);
  const withTrend = type === 'B';

  const allX = series.flatMap((s) => s.points.map((p) => p.x));
  const allY = series.flatMap((s) => s.points.map((p) => p.y));

  const rawMinX = allX.length ? Math.min(...allX) : 0;
  const rawMaxX = allX.length ? Math.max(...allX) : 1;
  // Pad a flat x-range so points don't collapse onto the axis edge.
  const spanX = rawMaxX - rawMinX || Math.abs(rawMaxX) || 1;
  const minX = rawMinX - spanX * 0.04;
  const maxX = rawMaxX + spanX * 0.04;
  const maxY = niceMax(Math.max(1, ...allY));

  const right = W - RIGHT;
  const bottom = height - BOTTOM_GAP;
  const plotW = right - LEFT;
  const plotH = bottom - TOP;

  const xAt = (x: number) => LEFT + ((x - minX) / (maxX - minX)) * plotW;
  const yAt = (y: number) => yScale(y, maxY, TOP, plotH);

  const gridY = ticks(maxY);
  const xTicks = [rawMinX, (rawMinX + rawMaxX) / 2, rawMaxX];

  const plotted: Plotted[] = series.flatMap((s, si) =>
    s.points.map((d, pi) => ({ si, pi, d, cx: xAt(d.x), cy: yAt(d.y) })),
  );

  const active = hover ? plotted.find((p) => p.si === hover.si && p.pi === hover.pi) : undefined;

  const summary =
    ariaLabel ??
    `산점도: ${series
      .map((s) => `${s.name} (${s.points.map((p) => `${format(p.x)},${format(p.y)}`).join(' / ')})`)
      .join('; ')}`;

  return (
    <div
      className={cx('tds-scatterchart', className)}
      role="img"
      aria-labelledby={titleId}
      {...toDataAttrs(scatterChartMeta, { type })}
    >
      <span id={titleId} className="tds-sr-only">
        {summary}
      </span>
      {series.length > 1 && (
        <ul className="tds-scatterchart__legend" aria-hidden="true">
          {series.map((s, i) => (
            <li key={s.name}>
              <span className="tds-scatterchart__swatch" style={{ background: seriesColor(i) }} />
              {s.name}
            </li>
          ))}
        </ul>
      )}
      <div className="tds-scatterchart__plot">
        <svg viewBox={`0 0 ${W} ${height}`} width="100%" aria-hidden="true">
          {gridY.map((t, i) => {
            const y = yAt(t);
            return (
              <g key={i}>
                <line className="tds-scatterchart__grid" x1={LEFT} x2={right} y1={y} y2={y} />
                <text className="tds-scatterchart__tick" x={LEFT - 6} y={y + 3} textAnchor="end">
                  {format(t)}
                </text>
              </g>
            );
          })}

          {xTicks.map((t, i) => (
            <text
              key={i}
              className="tds-scatterchart__tick"
              x={xAt(t)}
              y={bottom + 14}
              textAnchor={i === 0 ? 'start' : i === xTicks.length - 1 ? 'end' : 'middle'}
            >
              {format(t)}
            </text>
          ))}

          {withTrend &&
            series.map((s, si) => {
              const fit = regression(s.points);
              if (!fit) return null;
              return (
                <line
                  key={s.name}
                  className="tds-scatterchart__trend"
                  x1={xAt(minX)}
                  y1={yAt(fit.m * minX + fit.b)}
                  x2={xAt(maxX)}
                  y2={yAt(fit.m * maxX + fit.b)}
                  style={{ '--dot-color': seriesColor(si) } as React.CSSProperties}
                />
              );
            })}

          {plotted.map((p) => (
            <circle
              key={`${p.si}-${p.pi}`}
              className="tds-scatterchart__dot"
              cx={p.cx}
              cy={p.cy}
              r={4}
              style={{ '--dot-color': seriesColor(p.si) } as React.CSSProperties}
              data-active={hover?.si === p.si && hover?.pi === p.pi ? '' : undefined}
              onMouseEnter={() => setHover({ si: p.si, pi: p.pi })}
              onMouseLeave={() => setHover(null)}
            />
          ))}

          {xLabel && (
            <text className="tds-scatterchart__axislabel" x={LEFT + plotW / 2} y={height - 4}>
              {xLabel}
            </text>
          )}
          {yLabel && (
            <text
              className="tds-scatterchart__axislabel"
              x={0}
              y={0}
              transform={`translate(10 ${TOP + plotH / 2}) rotate(-90)`}
            >
              {yLabel}
            </text>
          )}
        </svg>

        {active && (
          <div
            className="tds-chart-tooltip"
            style={{ left: `${(active.cx / W) * 100}%`, top: `${(active.cy / height) * 100}%` }}
          >
            <div className="tds-chart-tooltip__title">{series[active.si].name}</div>
            <div className="tds-chart-tooltip__row">
              <span
                className="tds-chart-tooltip__swatch"
                style={{ background: seriesColor(active.si) }}
              />
              {xLabel ?? 'x'}
              <span className="tds-chart-tooltip__val">{format(active.d.x)}</span>
            </div>
            <div className="tds-chart-tooltip__row">
              <span
                className="tds-chart-tooltip__swatch"
                style={{ background: seriesColor(active.si) }}
              />
              {yLabel ?? 'y'}
              <span className="tds-chart-tooltip__val">{format(active.d.y)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
