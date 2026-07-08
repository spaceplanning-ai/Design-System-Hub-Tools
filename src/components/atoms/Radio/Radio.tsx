import { forwardRef } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import { cx } from '@/utils/cx';
import { toDataAttrs } from '@core/defineComponent';
import { radioMeta } from './Radio.meta';
import './Radio.css';

export type RadioSize = 'sm' | 'md' | 'lg';
export type RadioTone = 'brand' | 'success' | 'danger';

export interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'> {
  size?: RadioSize;
  tone?: RadioTone;
  invalid?: boolean;
  /** Secondary helper line under the label. */
  description?: ReactNode;
  children?: ReactNode;
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(function Radio(
  { size = 'md', tone = 'brand', invalid = false, disabled, className, description, children, ...rest },
  ref,
) {
  return (
    <label
      className={cx('tds-radio', disabled && 'tds-radio--disabled', description && 'tds-radio--with-description', className)}
      data-state={invalid ? 'error' : 'default'}
      {...toDataAttrs(radioMeta, { size, tone })}
    >
      <input
        ref={ref}
        type="radio"
        className="tds-radio__input tds-sr-only"
        disabled={disabled}
        aria-invalid={invalid || undefined}
        {...rest}
      />
      <span className="tds-radio__circle" aria-hidden="true" />
      {(children != null || description != null) && (
        <span className="tds-radio__text">
          {children != null && <span className="tds-radio__label">{children}</span>}
          {description != null && <span className="tds-radio__description">{description}</span>}
        </span>
      )}
    </label>
  );
});
