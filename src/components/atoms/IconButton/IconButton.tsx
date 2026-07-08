import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cx } from '@/utils/cx';
import { toDataAttrs } from '@core/defineComponent';
import { iconButtonMeta } from './IconButton.meta';
import './IconButton.css';

export type IconButtonVariant = 'solid' | 'outline' | 'ghost' | 'soft';
export type IconButtonTone = 'brand' | 'neutral' | 'success' | 'warning' | 'danger';
export type IconButtonSize = 'sm' | 'md' | 'lg';
export type IconButtonShape = 'rounded' | 'pill' | 'square';
export type IconButtonIndicatorTone = 'brand' | 'success' | 'warning' | 'danger';

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'color'> {
  /** Required accessible label. */
  label: string;
  icon: ReactNode;
  variant?: IconButtonVariant;
  tone?: IconButtonTone;
  size?: IconButtonSize;
  shape?: IconButtonShape;
  loading?: boolean;
  /** Toggle button — reflects `aria-pressed` and a selected style. */
  pressed?: boolean;
  /** Show a small notification dot in the top-right corner. */
  indicator?: boolean;
  /** Color of the notification dot. */
  indicatorTone?: IconButtonIndicatorTone;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  {
    label,
    icon,
    variant = 'ghost',
    tone = 'neutral',
    size = 'md',
    shape = 'rounded',
    loading = false,
    pressed,
    indicator = false,
    indicatorTone = 'danger',
    disabled,
    className,
    type = 'button',
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      className={cx('tds-icon-button', 'tds-tone', className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      data-loading={loading || undefined}
      data-pressed={pressed || undefined}
      {...toDataAttrs(iconButtonMeta, { variant, tone, size, shape })}
      {...rest}
    >
      {loading ? <span className="tds-icon-button__spinner" aria-hidden="true" /> : icon}
      {indicator && !loading && (
        <span className="tds-icon-button__indicator" data-tone={indicatorTone} aria-hidden="true" />
      )}
    </button>
  );
});
