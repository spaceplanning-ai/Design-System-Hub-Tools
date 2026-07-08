import { useId, useState } from 'react';
import { cx } from '@/utils/cx';
import { toDataAttrs } from '@core/defineComponent';
import { heatmapMeta } from './Heatmap.meta';
import './Heatmap.css';

export type HeatmapType = 'A' | 'B';

export interface HeatmapProps {
  /** Row-major value matrix (`data[r][c]`). */
  data: number[][];
  /** Row labels, aligned to `data` rows. */
  rows: string[];
  /** Column labels, aligned to `data` columns. */
  cols: string[];
  /** A: square cells · B: value labels shown in cells. */
  type?: HeatmapType;
  format?: (value: number) => string;
  ariaLabel?: string;
  className?: string;
}

/** Sequential single-hue ramp: 0 → light surface, 1 → full `--chart-1`. */
const RAMP_FLOOR = 8;
const rampColor = (t: number) =>
  `color-mix(in srgb, var(--chart-1) ${Math.round(RAMP_FLOOR + t * (100 - RAMP_FLOOR))}%, var(--chart-surface))`;

export function Heatmap({
  data,
  rows,
  cols,
  type = 'A',
  format = (v) => String(v),
  ariaLabel,
  className,
}: HeatmapProps) {
  const titleId = useId();
  const [hover, setHover] = useState<{ r: number; c: number } | null>(null);

  const flat = data.flat();
  const min = flat.length ? Math.min(...flat) : 0;
  const max = flat.length ? Math.max(...flat) : 1;
  const span = max - min || 1;
  const norm = (v: number) => (v - min) / span;

  const showValues = type === 'B';

  const summary =
    ariaLabel ??
    `히트맵: ${rows.length}행 × ${cols.length}열, 값 범위 ${format(min)}–${format(max)}.`;

  return (
    <div
      className={cx('tds-heatmap', className)}
      role="img"
      aria-labelledby={titleId}
      {...toDataAttrs(heatmapMeta, { type })}
    >
      <span id={titleId} className="tds-sr-only">
        {summary}
      </span>

      <div
        className="tds-heatmap__grid"
        style={{ gridTemplateColumns: `auto repeat(${cols.length}, minmax(0, 1fr))` }}
      >
        <div className="tds-heatmap__corner" aria-hidden="true" />
        {cols.map((col) => (
          <div key={`col-${col}`} className="tds-heatmap__col-label">
            {col}
          </div>
        ))}

        {rows.map((row, r) => (
          <div key={`row-${row}`} className="tds-heatmap__row">
            <div className="tds-heatmap__row-label">{row}</div>
            {cols.map((col, c) => {
              const value = data[r]?.[c] ?? 0;
              const t = norm(value);
              const active = hover?.r === r && hover?.c === c;
              return (
                <div
                  key={`cell-${row}-${col}`}
                  className="tds-heatmap__cell"
                  style={{ background: rampColor(t) }}
                  data-active={active || undefined}
                  onMouseEnter={() => setHover({ r, c })}
                  onMouseLeave={() => setHover(null)}
                >
                  {showValues && (
                    <span
                      className="tds-heatmap__value"
                      style={{
                        color: t > 0.55 ? 'var(--chart-surface)' : 'var(--tds-color-fg-default)',
                      }}
                    >
                      {format(value)}
                    </span>
                  )}
                  {active && (
                    <div className="tds-chart-tooltip tds-heatmap__tooltip">
                      <div className="tds-chart-tooltip__title">
                        {row} · {col}
                      </div>
                      <div className="tds-chart-tooltip__row">
                        <span
                          className="tds-chart-tooltip__swatch"
                          style={{ background: rampColor(t) }}
                        />
                        <span className="tds-chart-tooltip__val">{format(value)}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className="tds-heatmap__legend" aria-hidden="true">
        <span className="tds-heatmap__legend-label">{format(min)}</span>
        <span
          className="tds-heatmap__legend-bar"
          style={{
            background: `linear-gradient(to right, ${rampColor(0)}, ${rampColor(1)})`,
          }}
        />
        <span className="tds-heatmap__legend-label">{format(max)}</span>
      </div>
    </div>
  );
}
