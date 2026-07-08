import { cx } from '@/utils/cx';
import { toDataAttrs } from '@core/defineComponent';
import { linePath, seriesColor } from '@/utils/chart';
import { sparklineMeta } from './Sparkline.meta';
import './Sparkline.css';

export type SparklineType = 'A' | 'B';

export interface SparklineProps {
  data: number[];
  /** A: line · B: bars. */
  type?: SparklineType;
  color?: '1' | '2' | '3' | '4' | '5' | '6';
  width?: number;
  height?: number;
  /** Emphasize the last point (line type). */
  endDot?: boolean;
  ariaLabel?: string;
  className?: string;
}

export function Sparkline({
  data,
  type = 'A',
  color = '1',
  width = 96,
  height = 28,
  endDot = true,
  ariaLabel,
  className,
}: SparklineProps) {
  const stroke = seriesColor(Number(color) - 1);
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pad = 3;
  const n = data.length;
  const xAt = (i: number) => pad + (n <= 1 ? 0 : (i / (n - 1)) * (width - pad * 2));
  const yAt = (v: number) => height - pad - ((v - min) / span) * (height - pad * 2);
  const pts = data.map((v, i) => ({ x: xAt(i), y: yAt(v) }));
  const last = pts[pts.length - 1];

  return (
    <span
      className={cx('tds-sparkline', className)}
      role="img"
      aria-label={ariaLabel ?? `추세: ${data.join(', ')}`}
      style={{ '--spark-color': stroke, width, height } as React.CSSProperties}
      {...toDataAttrs(sparklineMeta, { type, color })}
    >
      <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} aria-hidden="true">
        {type === 'B' ? (
          data.map((v, i) => {
            const bw = Math.max(1.5, (width - pad * 2) / n - 1.5);
            const x = xAt(i) - bw / 2;
            const y = yAt(v);
            return (
              <rect
                key={i}
                className="tds-sparkline__bar"
                x={x}
                y={y}
                width={bw}
                height={height - pad - y}
                rx={1}
              />
            );
          })
        ) : (
          <path className="tds-sparkline__line" d={linePath(pts)} />
        )}
        {type === 'A' && endDot && last && (
          <circle className="tds-sparkline__dot" cx={last.x} cy={last.y} r={2.5} />
        )}
      </svg>
    </span>
  );
}
