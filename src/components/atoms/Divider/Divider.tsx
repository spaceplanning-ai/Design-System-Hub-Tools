import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '@/utils/cx';
import { toDataAttrs } from '@core/defineComponent';
import { dividerMeta } from './Divider.meta';
import './Divider.css';

export type DividerOrientation = 'horizontal' | 'vertical';
export type DividerVariant = 'solid' | 'dashed';
export type DividerTone = 'subtle' | 'default' | 'strong';
export type DividerLabelPosition = 'start' | 'center' | 'end';

export interface DividerProps extends Omit<HTMLAttributes<HTMLDivElement>, 'role'> {
  orientation?: DividerOrientation;
  variant?: DividerVariant;
  tone?: DividerTone;
  /** Optional inline label (horizontal dividers only). */
  label?: ReactNode;
  /** Where the label sits along the rule. */
  labelPosition?: DividerLabelPosition;
}

export function Divider({
  orientation = 'horizontal',
  variant = 'solid',
  tone = 'default',
  label,
  labelPosition = 'center',
  className,
  ...rest
}: DividerProps) {
  const dataAttrs = toDataAttrs(dividerMeta, { orientation, variant, tone });

  if (label && orientation === 'horizontal') {
    return (
      <div
        className={cx('tds-divider', 'tds-divider--labelled', className)}
        role="separator"
        aria-orientation="horizontal"
        aria-label={typeof label === 'string' ? label : undefined}
        data-label-position={labelPosition}
        {...dataAttrs}
        {...rest}
      >
        <span className="tds-divider__line" aria-hidden="true" />
        <span className="tds-divider__label">{label}</span>
        <span className="tds-divider__line" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div
      className={cx('tds-divider', className)}
      role="separator"
      aria-orientation={orientation}
      {...dataAttrs}
      {...rest}
    />
  );
}
