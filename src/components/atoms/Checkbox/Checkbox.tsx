import { forwardRef, useEffect, useRef } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import { cx } from '@/utils/cx';
import { mergeRefs } from '@/utils';
import { toDataAttrs } from '@core/defineComponent';
import { Icon } from '../Icon';
import { checkboxMeta } from './Checkbox.meta';
import './Checkbox.css';

export type CheckboxSize = 'sm' | 'md' | 'lg';
export type CheckboxTone = 'brand' | 'success' | 'danger';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'> {
  size?: CheckboxSize;
  tone?: CheckboxTone;
  /** Renders the indeterminate (mixed) state. */
  indeterminate?: boolean;
  /** Invalid/error styling. */
  invalid?: boolean;
  /** Secondary helper line under the label. */
  description?: ReactNode;
  children?: ReactNode;
}

const CHECK_SIZE: Record<CheckboxSize, number> = { sm: 12, md: 14, lg: 16 };

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { size = 'md', tone = 'brand', indeterminate = false, invalid = false, disabled, className, description, children, ...rest },
  ref,
) {
  const innerRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (innerRef.current) innerRef.current.indeterminate = indeterminate;
  }, [indeterminate]);

  return (
    <label
      className={cx('tds-checkbox', disabled && 'tds-checkbox--disabled', description && 'tds-checkbox--with-description', className)}
      data-state={invalid ? 'error' : 'default'}
      {...toDataAttrs(checkboxMeta, { size, tone })}
    >
      <input
        ref={mergeRefs(ref, innerRef)}
        type="checkbox"
        className="tds-checkbox__input tds-sr-only"
        disabled={disabled}
        aria-invalid={invalid || undefined}
        {...rest}
      />
      <span className="tds-checkbox__box" aria-hidden="true">
        <Icon className="tds-checkbox__check" name={indeterminate ? 'minus' : 'check'} size={CHECK_SIZE[size]} strokeWidth={3} />
      </span>
      {(children != null || description != null) && (
        <span className="tds-checkbox__text">
          {children != null && <span className="tds-checkbox__label">{children}</span>}
          {description != null && <span className="tds-checkbox__description">{description}</span>}
        </span>
      )}
    </label>
  );
});
