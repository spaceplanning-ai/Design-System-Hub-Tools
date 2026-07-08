import { forwardRef, useRef, useState } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import { cx } from '@/utils/cx';
import { toDataAttrs } from '@core/defineComponent';
import { Icon } from '../Icon';
import { inputMeta } from './Input.meta';
import './Input.css';

export type InputVariant = 'outline' | 'filled' | 'underline';
export type InputSize = 'sm' | 'md' | 'lg';
export type InputStatus = 'default' | 'error' | 'success';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  variant?: InputVariant;
  size?: InputSize;
  /** Validation status. */
  status?: InputStatus;
  /** Leading adornment (icon/prefix). */
  iconStart?: ReactNode;
  /** Trailing adornment (icon/suffix/action). */
  iconEnd?: ReactNode;
  /** Show a clear (×) button while the field has a value. */
  clearable?: boolean;
  /** Called when the clear button is pressed. */
  onClear?: () => void;
  /** For `type="password"`: render an eye/eye-off reveal toggle. */
  revealable?: boolean;
  /** Show a trailing spinner (async validation/lookup); blocks the clear/reveal actions. */
  loading?: boolean;
  /** Auto-render a status icon for error/success. Defaults to `true`. */
  statusIcon?: boolean;
}

function resolveState(status: InputStatus, disabled?: boolean, readOnly?: boolean): string {
  if (disabled) return 'disabled';
  if (readOnly) return 'readonly';
  if (status !== 'default') return status;
  return 'default';
}

const ICON_SIZE: Record<InputSize, number> = { sm: 16, md: 18, lg: 20 };

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    variant = 'outline',
    size = 'md',
    status = 'default',
    iconStart,
    iconEnd,
    clearable = false,
    onClear,
    revealable = false,
    loading = false,
    statusIcon = true,
    type = 'text',
    value,
    defaultValue,
    onChange,
    disabled,
    readOnly,
    className,
    ...rest
  },
  ref,
) {
  const state = resolveState(status, disabled, readOnly);
  const isControlled = value !== undefined;
  const [internal, setInternal] = useState<string>((defaultValue as string) ?? '');
  const current = isControlled ? String(value ?? '') : internal;
  const hasValue = current.length > 0;

  const [revealed, setRevealed] = useState(false);
  const isPassword = type === 'password';
  const resolvedType = isPassword && revealed ? 'text' : type;

  const innerRef = useRef<HTMLInputElement | null>(null);
  const setRefs = (node: HTMLInputElement | null) => {
    innerRef.current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref) (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
  };

  const isize = ICON_SIZE[size];
  const showClear = clearable && hasValue && !disabled && !readOnly && !loading;
  const showReveal = revealable && isPassword && !disabled && !loading;
  const showStatus = statusIcon && (status === 'error' || status === 'success') && !loading;

  const handleClear = () => {
    if (!isControlled) setInternal('');
    onClear?.();
    innerRef.current?.focus();
  };

  return (
    <div
      className={cx('tds-input', className)}
      data-state={state}
      {...toDataAttrs(inputMeta, { variant, size })}
    >
      {iconStart && <span className="tds-input__adornment">{iconStart}</span>}
      <input
        ref={setRefs}
        className="tds-input__control"
        type={resolvedType}
        value={isControlled ? value : undefined}
        defaultValue={isControlled ? undefined : defaultValue}
        disabled={disabled}
        readOnly={readOnly}
        aria-invalid={status === 'error' || undefined}
        onChange={(e) => {
          if (!isControlled) setInternal(e.target.value);
          onChange?.(e);
        }}
        {...rest}
      />

      {(showStatus || loading || showClear || showReveal || iconEnd) && (
        <span className="tds-input__trailing">
          {loading && (
            <span className="tds-input__adornment">
              <Icon name="loader" size={isize} spin title="Loading" />
            </span>
          )}
          {showStatus && (
            <span
              className="tds-input__status"
              data-status={status}
            >
              <Icon name={status === 'error' ? 'alert-circle' : 'check-circle'} size={isize} />
            </span>
          )}
          {showClear && (
            <button
              type="button"
              className="tds-input__action"
              aria-label="Clear"
              tabIndex={-1}
              onClick={handleClear}
            >
              <Icon name="close" size={isize} />
            </button>
          )}
          {showReveal && (
            <button
              type="button"
              className="tds-input__action"
              aria-label={revealed ? 'Hide password' : 'Show password'}
              aria-pressed={revealed}
              onClick={() => setRevealed((v) => !v)}
            >
              <Icon name={revealed ? 'eye-off' : 'eye'} size={isize} />
            </button>
          )}
          {iconEnd && <span className="tds-input__adornment">{iconEnd}</span>}
        </span>
      )}
    </div>
  );
});
