import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '@/utils/cx';
import { toDataAttrs } from '@core/defineComponent';
import { badgeMeta } from './Badge.meta';
import './Badge.css';

export type BadgeVariant = 'solid' | 'soft' | 'outline';
export type BadgeTone = 'brand' | 'neutral' | 'success' | 'warning' | 'danger' | 'info';
export type BadgeSize = 'sm' | 'md';
export type BadgeShape = 'rounded' | 'pill';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  tone?: BadgeTone;
  size?: BadgeSize;
  shape?: BadgeShape;
  /** Show a leading status dot. */
  dot?: boolean;
  /** Leading icon slot (e.g. `<Icon name="check-circle" />`). */
  icon?: ReactNode;
  /** Numeric badge value; overrides children when set. */
  count?: number;
  /** Cap for `count` — values above render as `{max}+`. */
  max?: number;
  /** Render the badge even when `count` is 0. */
  showZero?: boolean;
  children?: ReactNode;
}

export function Badge({
  variant = 'soft',
  tone = 'neutral',
  size = 'md',
  shape = 'pill',
  dot = false,
  icon,
  count,
  max = 99,
  showZero = false,
  className,
  children,
  ...rest
}: BadgeProps) {
  const hasCount = count != null && (count > 0 || showZero);
  const content = hasCount ? (count! > max ? `${max}+` : count) : children;
  const isNumeric = hasCount && children == null;

  return (
    <span
      className={cx('tds-badge', 'tds-tone', className)}
      data-numeric={isNumeric || undefined}
      {...toDataAttrs(badgeMeta, { variant, tone, size, shape })}
      {...rest}
    >
      {dot && <span className="tds-badge__dot" aria-hidden="true" />}
      {icon && <span className="tds-badge__icon" aria-hidden="true">{icon}</span>}
      {content}
    </span>
  );
}
