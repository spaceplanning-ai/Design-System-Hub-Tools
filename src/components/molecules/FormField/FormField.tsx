import { cloneElement, isValidElement, useId } from 'react';
import type { HTMLAttributes, ReactElement, ReactNode } from 'react';
import { cx } from '@/utils/cx';
import { toDataAttrs } from '@core/defineComponent';
import { Icon } from '../../atoms/Icon';
import { Label } from '../../atoms/Label';
import { formFieldMeta } from './FormField.meta';
import './FormField.css';

export type FormFieldLayout = 'vertical' | 'horizontal';
export type FormFieldSize = 'sm' | 'md' | 'lg';

export interface FieldRenderProps {
  id: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
  disabled?: boolean;
  /** Validation status forwarded to the control so it paints error/success itself. */
  status?: 'error' | 'success';
}

export interface FormFieldProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  /** Positive confirmation message (shown when there's no error). */
  success?: ReactNode;
  required?: boolean;
  /** Append a muted "(optional)" hint to the label. */
  optional?: boolean;
  /** Help tooltip text rendered as a help-circle icon on the label. */
  labelHint?: string;
  disabled?: boolean;
  layout?: FormFieldLayout;
  size?: FormFieldSize;
  htmlFor?: string;
  /** Control element (cloned with a11y props) or a render function. */
  children: ReactElement | ((field: FieldRenderProps) => ReactNode);
}

export function FormField({
  label,
  hint,
  error,
  success,
  required = false,
  optional = false,
  labelHint,
  disabled = false,
  layout = 'vertical',
  size = 'md',
  htmlFor,
  className,
  children,
  ...rest
}: FormFieldProps) {
  const autoId = useId();
  const id = htmlFor ?? autoId;
  const hintId = hint && !error && !success ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const successId = success && !error ? `${id}-success` : undefined;
  const describedBy = [hintId, errorId, successId].filter(Boolean).join(' ') || undefined;
  const state = error ? 'error' : success ? 'success' : disabled ? 'disabled' : 'default';

  const field: FieldRenderProps = {
    id,
    'aria-describedby': describedBy,
    'aria-invalid': error ? true : undefined,
    disabled: disabled || undefined,
    status: error ? 'error' : success ? 'success' : undefined,
  };

  const control =
    typeof children === 'function'
      ? children(field)
      : isValidElement(children)
        ? cloneElement(
            children as ReactElement<Record<string, unknown>>,
            field as unknown as Record<string, unknown>,
          )
        : children;

  return (
    <div
      className={cx('tds-form-field', className)}
      data-state={state}
      {...toDataAttrs(formFieldMeta, { layout, size })}
      {...rest}
    >
      {label && (
        <Label
          htmlFor={id}
          required={required}
          optional={optional}
          hint={labelHint}
          disabled={disabled}
          size={size}
          className="tds-form-field__label"
        >
          {label}
        </Label>
      )}
      <div className="tds-form-field__control">
        {control}
        {error ? (
          <p id={errorId} className="tds-form-field__error" role="alert">
            <Icon name="alert-circle" size={14} aria-hidden />
            {error}
          </p>
        ) : success ? (
          <p id={successId} className="tds-form-field__success">
            <Icon name="check-circle" size={14} aria-hidden />
            {success}
          </p>
        ) : hint ? (
          <p id={hintId} className="tds-form-field__hint">
            {hint}
          </p>
        ) : null}
      </div>
    </div>
  );
}
