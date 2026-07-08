import { forwardRef } from 'react';
import type { ReactNode, SelectHTMLAttributes } from 'react';
import { cx } from '@/utils/cx';
import { toDataAttrs } from '@core/defineComponent';
import { Icon } from '../../atoms/Icon';
import { selectMeta } from './Select.meta';
import './Select.css';

export type SelectVariant = 'outline' | 'filled';
export type SelectSize = 'sm' | 'md' | 'lg';
export type SelectStatus = 'default' | 'error' | 'success';

export interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  variant?: SelectVariant;
  size?: SelectSize;
  status?: SelectStatus;
  placeholder?: string;
  options?: SelectOption[];
  /** Leading icon slot (e.g. a `globe` for a country picker). */
  iconStart?: ReactNode;
  /** Auto-render a status icon for error/success. Defaults to `true`. */
  statusIcon?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { variant = 'outline', size = 'md', status = 'default', placeholder, options, iconStart, statusIcon = true, disabled, className, children, defaultValue, value, ...rest },
  ref,
) {
  const state = disabled ? 'disabled' : status !== 'default' ? status : 'default';
  const showPlaceholder = placeholder && value === undefined && defaultValue === undefined;
  const showStatus = statusIcon && (status === 'error' || status === 'success');

  return (
    <div
      className={cx('tds-select', className)}
      data-state={state}
      data-has-leading={iconStart ? '' : undefined}
      data-has-status={showStatus ? '' : undefined}
      {...toDataAttrs(selectMeta, { variant, size })}
    >
      {iconStart && <span className="tds-select__leading" aria-hidden="true">{iconStart}</span>}
      <select
        ref={ref}
        className="tds-select__control"
        disabled={disabled}
        aria-invalid={status === 'error' || undefined}
        defaultValue={showPlaceholder ? '' : defaultValue}
        value={value}
        {...rest}
      >
        {placeholder && (
          <option value="" disabled hidden>
            {placeholder}
          </option>
        )}
        {options
          ? options.map((o) => (
              <option key={o.value} value={o.value} disabled={o.disabled}>
                {o.label}
              </option>
            ))
          : children}
      </select>
      {showStatus && (
        <span className="tds-select__status" data-status={status} aria-hidden="true">
          <Icon name={status === 'error' ? 'alert-circle' : 'check-circle'} size="sm" />
        </span>
      )}
      <Icon className="tds-select__chevron" name="chevron-down" size="sm" aria-hidden />
    </div>
  );
});
