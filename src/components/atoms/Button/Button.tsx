import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cx } from '@/utils/cx';
import { toDataAttrs } from '@core/defineComponent';
import { buttonMeta } from './Button.meta';
import './Button.css';

/** Content layout preset — A: label only · B: icon + label · C: icon only (square). */
export type ButtonType = 'A' | 'B' | 'C';
export type ButtonVariant = 'solid' | 'outline' | 'ghost' | 'soft' | 'link';
export type ButtonTone = 'brand' | 'neutral' | 'success' | 'warning' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';
export type ButtonShape = 'rounded' | 'pill' | 'square';

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'color' | 'type'> {
  /** Content layout preset. A: label · B: icon + label · C: icon only. */
  type?: ButtonType;
  variant?: ButtonVariant;
  tone?: ButtonTone;
  size?: ButtonSize;
  shape?: ButtonShape;
  /** Native button `type` attribute. */
  nativeType?: 'button' | 'submit' | 'reset';
  /** Show a spinner and block interaction. */
  loading?: boolean;
  /** Stretch to fill the container width. */
  fullWidth?: boolean;
  /** Leading icon slot. */
  iconStart?: ReactNode;
  /** Trailing icon slot. */
  iconEnd?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    type = 'A',
    variant = 'solid',
    tone = 'brand',
    size = 'md',
    shape = 'rounded',
    nativeType = 'button',
    loading = false,
    fullWidth = false,
    iconStart,
    iconEnd,
    disabled,
    className,
    children,
    'aria-label': ariaLabel,
    ...rest
  },
  ref,
) {
  const iconOnly = type === 'C';
  const dataAttrs = toDataAttrs(buttonMeta, { type, variant, tone, size, shape });

  // Icon-only buttons need an accessible name; fall back to string children.
  const resolvedAriaLabel =
    ariaLabel ?? (iconOnly && typeof children === 'string' ? children : undefined);

  return (
    <button
      ref={ref}
      type={nativeType}
      className={cx('tds-button', fullWidth && 'tds-button--full', className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      aria-label={resolvedAriaLabel}
      data-loading={loading || undefined}
      {...dataAttrs}
      {...rest}
    >
      {loading && <span className="tds-button__spinner" aria-hidden="true" />}
      <span className="tds-button__content">
        {iconOnly ? (
          <span className="tds-button__icon">{iconStart ?? children}</span>
        ) : (
          <>
            {iconStart && <span className="tds-button__icon">{iconStart}</span>}
            {children != null && <span className="tds-button__label">{children}</span>}
            {iconEnd && <span className="tds-button__icon">{iconEnd}</span>}
          </>
        )}
      </span>
    </button>
  );
});
