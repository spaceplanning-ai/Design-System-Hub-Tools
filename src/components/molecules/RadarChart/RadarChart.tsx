import { useId, useState } from 'react';
import { cx } from '@/utils/cx';
import { toDataAttrs } from '@core/defineComponent';
import { niceMax, linePath, seriesColor, type Point } from '@/utils/chart';
import { radarChartMeta } from './RadarChart.meta';
import './RadarChart.css';

export type RadarChartType = 'A' | 'B';

export interface RadarSeries {
  name: string;
  /** One value per axis; length must match `axes`. */
  values: number[];
}

export interface RadarChartProps {
  /** Axis labels, one per spoke (shared across series). */
  axes: string[];
  series: RadarSeries[];
  /** A: filled polygons · B: line-only outlines. */
  type?: RadarChartType;
  /** Shared axis maximum. Defaults to a "nice" bound over all values. */
  max?: number;
  /** Square plot size in px (viewBox). */
  size?: number;
  format?: (value: number) => string;
  ariaLabel?: string;
  className?: string;
}

/** Number of concentric grid rings. */
const RINGS = 4;

export function RadarChart({
  axes,
  series,
  type = 'A',
  max,
  size = 220,
  format = (v) => String(v),
  ariaLabel,
  className,
}: RadarChartProps) {
  const titleId = useId();
  const [hover, setHover] = useState<number | null>(null);

  const n = axes.length;
  const C = size / 2;
  // Leave room around the plot for the vertex labels.
  const R = C - 34;
  const bound = max ?? niceMax(Math.max(1, ...series.flatMap((s) => s.values)));

  // Spoke i sits at angle i·(360/n), starting at 12 o'clock, going clockwise.
  const point = (i: number, r: number): Point => {
    const a = ((i / n) * 360 - 90) * (Math.PI / 180);
    return { x: C + r * Math.cos(a), y: C + r * Math.sin(a) };
  };

  const rings = Array.from({ length: RINGS }, (_, r) => {
    const level = (r + 1) / RINGS;
    return linePath(axes.map((_, i) => point(i, R * level))) + ' Z';
  });

  const spokes = axes.map((_, i) => point(i, R));
  const labels = axes.map((label, i) => ({ label, p: point(i, R + 16) }));

  const shapes = series.map((s, si) => {
    const pts = s.values.map((v, i) => point(i, R * Math.min(1, v / bound)));
    return { s, si, color: seriesColor(si), pts, path: linePath(pts) + ' Z' };
  });

  const active = hover != null ? { label: axes[hover], p: point(hover, R) } : null;

  const summary =
    ariaLabel ??
    `방사형 차트: ${series
      .map((s) => `${s.name} (${axes.map((ax, i) => `${ax} ${format(s.values[i])}`).join(', ')})`)
      .join('; ')}`;

  return (
    <div
      className={cx('tds-radarchart', className)}
      role="img"
      aria-labelledby={titleId}
      {...toDataAttrs(radarChartMeta, { type })}
    >
      <span id={titleId} className="tds-sr-only">
        {summary}
      </span>
      {series.length > 1 && (
        <ul className="tds-radarchart__legend" aria-hidden="true">
          {series.map((s, i) => (
            <li key={s.name}>
              <span className="tds-radarchart__swatch" style={{ background: seriesColor(i) }} />
              {s.name}
            </li>
          ))}
        </ul>
      )}
      <div className="tds-radarchart__plot">
        <svg viewBox={`0 0 ${size} ${size}`} width="100%" aria-hidden="true">
          {rings.map((d, i) => (
            <path key={i} className="tds-radarchart__ring" d={d} />
          ))}
          {spokes.map((p, i) => (
            <line key={i} className="tds-radarchart__spoke" x1={C} y1={C} x2={p.x} y2={p.y} />
          ))}
          {shapes.map(({ s, color, pts, path }) => (
            <g
              key={s.name}
              className="tds-radarchart__series"
              style={{ '--series-color': color } as React.CSSProperties}
              data-line-only={type === 'B' || undefined}
            >
              <path className="tds-radarchart__area" d={path} />
              <path className="tds-radarchart__line" d={path} />
              {pts.map((p, i) => (
                <circle
                  key={i}
                  className="tds-radarchart__dot"
                  cx={p.x}
                  cy={p.y}
                  r={2.5}
                  data-active={hover === i || undefined}
                />
              ))}
            </g>
          ))}
          {labels.map(({ label, p }, i) => (
            <text
              key={label + i}
              className="tds-radarchart__axis-label"
              x={p.x}
              y={p.y}
              textAnchor={p.x > C + 1 ? 'start' : p.x < C - 1 ? 'end' : 'middle'}
              dominantBaseline={p.y > C + 1 ? 'hanging' : p.y < C - 1 ? 'auto' : 'middle'}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            >
              {label}
            </text>
          ))}
        </svg>
        {active && (
          <div
            className="tds-chart-tooltip"
            style={{ left: `${(active.p.x / size) * 100}%`, top: `${(active.p.y / size) * 100}%` }}
          >
            <div className="tds-chart-tooltip__title">{active.label}</div>
            {series.map((s, i) => (
              <div key={s.name} className="tds-chart-tooltip__row">
                <span
                  className="tds-chart-tooltip__swatch"
                  style={{ background: seriesColor(i) }}
                />
                {s.name}
                <span className="tds-chart-tooltip__val">{format(s.values[hover as number])}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
