import { forwardRef, useId, useState } from 'react';
import type { FocusEvent, ReactNode } from 'react';
import { cx } from '@/utils/cx';
import { toDataAttrs } from '@core/defineComponent';
import { Icon } from '../../atoms/Icon';
import { Label } from '../../atoms/Label';
import { Input } from '../../atoms/Input';
import type { InputProps } from '../../atoms/Input';
import { textFieldMeta } from './TextField.meta';
import './TextField.css';

/** Field layout presets. A: stacked · B: floating label · C: inline (label left). */
export type TextFieldType = 'A' | 'B' | 'C';
export type TextFieldSize = 'sm' | 'md' | 'lg';
export type TextFieldStatus = 'default' | 'error' | 'success';

export interface TextFieldProps extends Omit<InputProps, 'size' | 'status' | 'type'> {
  /** Layout preset — A (stacked) · B (floating) · C (inline). */
  type?: TextFieldType;
  /** HTML input type forwarded to the underlying Input (e.g. "password", "email"). */
  inputType?: InputProps['type'];
  size?: TextFieldSize;
  status?: TextFieldStatus;
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  /** Positive confirmation message (shown when there's no error). */
  success?: ReactNode;
  required?: boolean;
  /** Append a muted "(optional)" hint to the label. */
  optional?: boolean;
  /** Help tooltip text rendered as a help-circle icon on the label. */
  labelHint?: string;
  /** Field id (auto-generated when omitted). */
  id?: string;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  {
    type = 'A',
    inputType,
    size = 'md',
    status = 'default',
    label,
    hint,
    error,
    success,
    required = false,
    optional = false,
    labelHint,
    disabled,
    readOnly,
    placeholder,
    value,
    defaultValue,
    id,
    className,
    onFocus,
    onBlur,
    onChange,
    ...rest
  },
  ref,
) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const hintId = hint && !error && !success ? `${fieldId}-hint` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;
  const successId = success && !error ? `${fieldId}-success` : undefined;
  const describedBy = [hintId, errorId, successId].filter(Boolean).join(' ') || undefined;

  const effectiveStatus: TextFieldStatus = error ? 'error' : success ? 'success' : status;
  const state = disabled ? 'disabled' : readOnly ? 'readonly' : effectiveStatus !== 'default' ? effectiveStatus : 'default';
  const hasLeading = rest.iconStart != null;

  // Track focus + filled so the Type B floating label can animate.
  const [focused, setFocused] = useState(false);
  const [uncontrolledFilled, setUncontrolledFilled] = useState(Boolean(defaultValue));
  const filled = value !== undefined ? String(value).length > 0 : uncontrolledFilled;
  const floated = type === 'B' ? focused || filled : true;

  const handleFocus = (e: FocusEvent<HTMLInputElement>) => {
    setFocused(true);
    onFocus?.(e);
  };
  const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
    setFocused(false);
    onBlur?.(e);
  };

  const labelNode = (
    <Label
      htmlFor={fieldId}
      required={required}
      optional={optional}
      hint={labelHint}
      disabled={disabled}
      size={size}
      className="tds-text-field__label"
    >
      {label}
    </Label>
  );

  const message = error ? (
    <p id={errorId} className="tds-text-field__error" role="alert">
      <Icon name="alert-circle" size={14} aria-hidden />
      {error}
    </p>
  ) : success ? (
    <p id={successId} className="tds-text-field__success">
      <Icon name="check-circle" size={14} aria-hidden />
      {success}
    </p>
  ) : hint ? (
    <p id={hintId} className="tds-text-field__hint">
      {hint}
    </p>
  ) : null;

  const input = (
    <Input
      ref={ref}
      id={fieldId}
      type={inputType}
      size={size}
      status={effectiveStatus}
      disabled={disabled}
      readOnly={readOnly}
      required={required}
      aria-describedby={describedBy}
      // Type B keeps the placeholder hidden until the label floats up.
      placeholder={type === 'B' && !floated ? '' : placeholder}
      value={value}
      defaultValue={defaultValue}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onChange={(e) => {
        if (value === undefined) setUncontrolledFilled(e.target.value.length > 0);
        onChange?.(e);
      }}
      {...rest}
    />
  );

  return (
    <div
      className={cx('tds-text-field', className)}
      data-state={state}
      data-float={type === 'B' ? (floated ? 'up' : 'rest') : undefined}
      data-has-leading={hasLeading ? '' : undefined}
      {...toDataAttrs(textFieldMeta, { type, size })}
    >
      {type === 'C' ? (
        <>
          {labelNode}
          <div className="tds-text-field__control">
            {input}
            {message}
          </div>
        </>
      ) : (
        <>
          {type === 'A' && labelNode}
          <div className="tds-text-field__control">
            {input}
            {type === 'B' && labelNode}
          </div>
          {message}
        </>
      )}
    </div>
  );
});
