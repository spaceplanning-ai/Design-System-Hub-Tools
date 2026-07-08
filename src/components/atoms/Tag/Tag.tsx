import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '@/utils/cx';
import { toDataAttrs } from '@core/defineComponent';
import { Icon } from '../Icon';
import { tagMeta } from './Tag.meta';
import './Tag.css';

export type TagVariant = 'soft' | 'outline' | 'solid';
export type TagTone = 'brand' | 'neutral' | 'success' | 'warning' | 'danger' | 'info';
export type TagSize = 'sm' | 'md';
export type TagShape = 'rounded' | 'pill';

export interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: TagVariant;
  tone?: TagTone;
  size?: TagSize;
  shape?: TagShape;
  closable?: boolean;
  onClose?: () => void;
  /** Leading icon or status dot slot. */
  icon?: ReactNode;
  /** Dim the tag and disable the dismiss control. */
  disabled?: boolean;
  children?: ReactNode;
}

export function Tag({
  variant = 'outline',
  tone = 'neutral',
  size = 'md',
  shape = 'rounded',
  closable = false,
  onClose,
  icon,
  disabled = false,
  className,
  children,
  ...rest
}: TagProps) {
  return (
    <span
      className={cx('tds-tag', 'tds-tone', className)}
      data-disabled={disabled || undefined}
      {...toDataAttrs(tagMeta, { variant, tone, size, shape })}
      {...rest}
    >
      {icon && <span className="tds-tag__icon" aria-hidden="true">{icon}</span>}
      {children}
      {closable && (
        <button
          type="button"
          className="tds-tag__close"
          aria-label="Remove"
          disabled={disabled}
          onClick={onClose}
        >
          <Icon name="close" size={12} strokeWidth={2.5} />
        </button>
      )}
    </span>
  );
}
