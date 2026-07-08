import type { LabelHTMLAttributes, ReactNode } from 'react';
import { cx } from '@/utils/cx';
import { toDataAttrs } from '@core/defineComponent';
import { Icon } from '../Icon';
import { labelMeta } from './Label.meta';
import './Label.css';

export type LabelSize = 'sm' | 'md' | 'lg';

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  size?: LabelSize;
  required?: boolean;
  /** Show a muted "(optional)" hint (ignored when `required`). */
  optional?: boolean;
  /** Trailing help affordance — renders a help-circle icon with this text as its accessible label. */
  hint?: string;
  disabled?: boolean;
  children?: ReactNode;
}

const HINT_ICON: Record<LabelSize, number> = { sm: 13, md: 14, lg: 16 };

export function Label({
  size = 'md',
  required = false,
  optional = false,
  hint,
  disabled = false,
  className,
  children,
  ...rest
}: LabelProps) {
  return (
    <label
      className={cx('tds-label', className)}
      data-disabled={disabled || undefined}
      {...toDataAttrs(labelMeta, { size })}
      {...rest}
    >
      {children}
      {required && (
        <>
          <span className="tds-label__required" aria-hidden="true">*</span>
          <span className="tds-sr-only">(required)</span>
        </>
      )}
      {optional && !required && <span className="tds-label__optional">(optional)</span>}
      {hint && (
        <span className="tds-label__hint">
          <Icon name="help-circle" size={HINT_ICON[size]} title={hint} />
        </span>
      )}
    </label>
  );
}
