import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import { cx } from '@/utils/cx';
import { toDataAttrs } from '@core/defineComponent';
import { progressMeta } from './Progress.meta';
import './Progress.css';

export type ProgressTone = 'brand' | 'success' | 'warning' | 'danger';
export type ProgressSize = 'sm' | 'md' | 'lg';
export type ProgressShape = 'pill' | 'square';
export type ProgressVariant = 'linear' | 'circular';

export interface ProgressProps extends Omit<HTMLAttributes<HTMLDivElement>, 'role'> {
  value?: number;
  max?: number;
  indeterminate?: boolean;
  tone?: ProgressTone;
  size?: ProgressSize;
  shape?: ProgressShape;
  variant?: ProgressVariant;
  /** Accessible label / header text. */
  label?: string;
  /** Render the percentage (linear: right of the header; circular: centered). */
  showValue?: boolean;
  /** Custom accessible value description, e.g. "3 of 10 steps". */
  valueText?: string;
}

const CIRCLE_GEOM: Record<ProgressSize, { box: number; stroke: number }> = {
  sm: { box: 36, stroke: 4 },
  md: { box: 48, stroke: 5 },
  lg: { box: 64, stroke: 6 },
};

export const Progress = forwardRef<HTMLDivElement, ProgressProps>(function Progress(
  {
    value = 0,
    max = 100,
    indeterminate = false,
    tone = 'brand',
    size = 'md',
    shape = 'pill',
    variant = 'linear',
    label,
    showValue = false,
    valueText,
    className,
    ...rest
  },
  ref,
) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const rounded = Math.round(pct);
  const aria = {
    role: 'progressbar' as const,
    'aria-valuenow': indeterminate ? undefined : Math.round(value),
    'aria-valuemin': 0,
    'aria-valuemax': max,
    'aria-valuetext': valueText,
    'aria-label': label,
  };

  if (variant === 'circular') {
    const { box, stroke } = CIRCLE_GEOM[size];
    const r = (box - stroke) / 2;
    const circ = 2 * Math.PI * r;
    const offset = indeterminate ? circ * 0.7 : circ * (1 - pct / 100);
    return (
      <div
        ref={ref}
        className={cx('tds-progress-circle', className)}
        data-indeterminate={indeterminate || undefined}
        {...aria}
        {...toDataAttrs(progressMeta, { tone, size, shape })}
        {...rest}
      >
        <svg className="tds-progress-circle__svg" width={box} height={box} viewBox={`0 0 ${box} ${box}`}>
          <circle className="tds-progress-circle__track" cx={box / 2} cy={box / 2} r={r} strokeWidth={stroke} fill="none" />
          <circle
            className="tds-progress-circle__indicator"
            cx={box / 2}
            cy={box / 2}
            r={r}
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
          />
        </svg>
        {showValue && !indeterminate && <span className="tds-progress-circle__value">{rounded}%</span>}
      </div>
    );
  }

  if (label || showValue) {
    return (
      <div className={cx('tds-progress-field', className)} {...rest}>
        <div className="tds-progress__header">
          {label && <span className="tds-progress__label">{label}</span>}
          {showValue && !indeterminate && <span className="tds-progress__value">{rounded}%</span>}
        </div>
        <div
          ref={ref}
          className="tds-progress"
          {...aria}
          data-indeterminate={indeterminate || undefined}
          {...toDataAttrs(progressMeta, { tone, size, shape })}
        >
          <div className="tds-progress__bar" style={indeterminate ? undefined : { width: `${pct}%` }} />
        </div>
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className={cx('tds-progress', className)}
      {...aria}
      data-indeterminate={indeterminate || undefined}
      {...toDataAttrs(progressMeta, { tone, size, shape })}
      {...rest}
    >
      <div className="tds-progress__bar" style={indeterminate ? undefined : { width: `${pct}%` }} />
    </div>
  );
});
