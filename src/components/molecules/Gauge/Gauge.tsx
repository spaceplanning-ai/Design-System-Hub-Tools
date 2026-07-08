import { cx } from '@/utils/cx';
import { toDataAttrs } from '@core/defineComponent';
import { donutArc, seriesColor } from '@/utils/chart';
import { gaugeMeta } from './Gauge.meta';
import './Gauge.css';

export type GaugeType = 'A' | 'B';

export interface GaugeProps {
  value: number;
  /** Scale minimum. */
  min?: number;
  /** Scale maximum. */
  max?: number;
  /** Caption below the value. */
  label?: string;
  format?: (value: number) => string;
  /** Categorical series slot 1–6. */
  color?: '1' | '2' | '3' | '4' | '5' | '6';
  /** A: 180° semicircle · B: 270° arc. */
  type?: GaugeType;
  /** Gauge diameter in px. */
  size?: number;
  ariaLabel?: string;
  className?: string;
}

/** Angular range per type: [startAngle, sweep] in degrees (0 = 12 o'clock, clockwise). */
const RANGE: Record<GaugeType, { start: number; sweep: number }> = {
  A: { start: -90, sweep: 180 },
  B: { start: -135, sweep: 270 },
};

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

export function Gauge({
  value,
  min = 0,
  max = 100,
  label,
  format = (v) => String(v),
  color = '1',
  type = 'A',
  size = 180,
  ariaLabel,
  className,
}: GaugeProps) {
  const fill = seriesColor(Number(color) - 1);
  const span = max - min || 1;
  const ratio = clamp01((value - min) / span);

  const { start, sweep } = RANGE[type];
  const valueEnd = start + sweep * ratio;

  const pad = size * 0.06;
  const cxc = size / 2;
  const stroke = Math.round(size * 0.12);
  const rOuter = size / 2 - pad;
  const rInner = rOuter - stroke;
  const cy = rOuter + pad;

  // Vertical extent below the center: semicircle ends on the center line (A),
  // the 270° arc dips to sin(45°)·r below it (B).
  const belowCenter = type === 'A' ? 0 : rOuter * Math.SQRT1_2;
  const valueY = cy + size * (type === 'A' ? -0.04 : 0.02);
  const labelY = cy + belowCenter + pad + size * 0.02;
  const height = labelY + pad;

  const trackPath = donutArc(cxc, cy, rOuter, rInner, start, start + sweep);
  const valuePath = donutArc(cxc, cy, rOuter, rInner, start, valueEnd);

  const summary = ariaLabel ?? `${label ? `${label} ` : ''}${format(value)} / ${format(max)}`;

  return (
    <div
      className={cx('tds-gauge', className)}
      role="meter"
      aria-valuenow={value}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-label={summary}
      style={{ '--gauge-width': `${size}px`, '--gauge-fill': fill } as React.CSSProperties}
      {...toDataAttrs(gaugeMeta, { type, color })}
    >
      <svg viewBox={`0 0 ${size} ${height}`} width="100%" aria-hidden="true">
        <path className="tds-gauge__track" d={trackPath} />
        {ratio > 0 && <path className="tds-gauge__value" d={valuePath} />}
        <text className="tds-gauge__readout" x={cxc} y={valueY} textAnchor="middle">
          {format(value)}
        </text>
        {label && (
          <text className="tds-gauge__label" x={cxc} y={labelY} textAnchor="middle">
            {label}
          </text>
        )}
      </svg>
    </div>
  );
}
