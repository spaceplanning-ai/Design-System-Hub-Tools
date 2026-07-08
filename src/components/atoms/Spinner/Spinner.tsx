import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import { cx } from '@/utils/cx';
import { toDataAttrs } from '@core/defineComponent';
import { spinnerMeta } from './Spinner.meta';
import './Spinner.css';

export type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type SpinnerTone = 'brand' | 'neutral' | 'success' | 'warning' | 'danger';
export type SpinnerLabelPlacement = 'hidden' | 'end' | 'bottom';

export interface SpinnerProps extends HTMLAttributes<HTMLSpanElement> {
  size?: SpinnerSize;
  tone?: SpinnerTone;
  /** Accessible label announced to assistive tech (and shown when placed). */
  label?: string;
  /** Where to render the label: visually hidden (default), inline, or below. */
  labelPlacement?: SpinnerLabelPlacement;
}

export const Spinner = forwardRef<HTMLSpanElement, SpinnerProps>(function Spinner(
  { size = 'md', tone = 'brand', label = 'Loading', labelPlacement = 'hidden', className, ...rest },
  ref,
) {
  return (
    <span
      ref={ref}
      className={cx('tds-spinner', labelPlacement !== 'hidden' && 'tds-spinner--labeled', className)}
      role="status"
      data-label-placement={labelPlacement !== 'hidden' ? labelPlacement : undefined}
      {...toDataAttrs(spinnerMeta, { size, tone })}
      {...rest}
    >
      <span className="tds-spinner__ring" aria-hidden="true" />
      {labelPlacement === 'hidden' ? (
        <span className="tds-sr-only">{label}</span>
      ) : (
        <span className="tds-spinner__label">{label}</span>
      )}
    </span>
  );
});
