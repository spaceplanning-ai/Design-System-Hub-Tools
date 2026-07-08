import { forwardRef, useLayoutEffect, useRef, useState } from 'react';
import type { TextareaHTMLAttributes } from 'react';
import { cx } from '@/utils/cx';
import { toDataAttrs } from '@core/defineComponent';
import { Icon } from '../Icon';
import { textareaMeta } from './Textarea.meta';
import './Textarea.css';

export type TextareaVariant = 'outline' | 'filled';
export type TextareaSize = 'sm' | 'md' | 'lg';
export type TextareaResize = 'none' | 'vertical' | 'both';
export type TextareaStatus = 'default' | 'error' | 'success';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  variant?: TextareaVariant;
  size?: TextareaSize;
  resize?: TextareaResize;
  status?: TextareaStatus;
  /** Show a live character counter (uses `maxLength` when set). */
  showCount?: boolean;
  /** Grow the field to fit its content (disables manual resize). */
  autoResize?: boolean;
  /** Auto-render a status icon for error/success. Defaults to `true`. */
  statusIcon?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  {
    variant = 'outline',
    size = 'md',
    resize = 'vertical',
    status = 'default',
    showCount = false,
    autoResize = false,
    statusIcon = true,
    maxLength,
    value,
    defaultValue,
    onChange,
    disabled,
    readOnly,
    rows = 4,
    className,
    ...rest
  },
  ref,
) {
  const state = disabled ? 'disabled' : readOnly ? 'readonly' : status !== 'default' ? status : 'default';
  const isControlled = value !== undefined;
  const [internal, setInternal] = useState<string>((defaultValue as string) ?? '');
  const current = isControlled ? String(value ?? '') : internal;
  const showStatus = statusIcon && (status === 'error' || status === 'success');

  const innerRef = useRef<HTMLTextAreaElement | null>(null);
  const setRefs = (node: HTMLTextAreaElement | null) => {
    innerRef.current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref) (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = node;
  };

  const fit = () => {
    const el = innerRef.current;
    if (!el || !autoResize) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  };
  useLayoutEffect(fit, [current, autoResize]);

  return (
    <div className={cx('tds-textarea-wrap', className)}>
      <textarea
        ref={setRefs}
        rows={rows}
        maxLength={maxLength}
        value={isControlled ? value : undefined}
        defaultValue={isControlled ? undefined : defaultValue}
        disabled={disabled}
        readOnly={readOnly}
        aria-invalid={status === 'error' || undefined}
        className="tds-textarea"
        data-state={state}
        data-autoresize={autoResize || undefined}
        {...toDataAttrs(textareaMeta, { variant, size, resize: autoResize ? 'none' : resize })}
        onChange={(e) => {
          if (!isControlled) setInternal(e.target.value);
          onChange?.(e);
        }}
        {...rest}
      />
      {showStatus && (
        <span className="tds-textarea__status" data-status={status} aria-hidden="true">
          <Icon name={status === 'error' ? 'alert-circle' : 'check-circle'} size={18} />
        </span>
      )}
      {showCount && (
        <div className="tds-textarea__footer">
          <span
            className="tds-textarea__count"
            data-limit={maxLength != null && current.length >= maxLength ? 'reached' : undefined}
            aria-live="polite"
          >
            {current.length}
            {maxLength != null ? ` / ${maxLength}` : ''}
          </span>
        </div>
      )}
    </div>
  );
});
