import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '@/utils/cx';
import { toDataAttrs } from '@core/defineComponent';
import { Icon } from '../Icon';
import { chipMeta } from './Chip.meta';
import './Chip.css';

export type ChipVariant = 'soft' | 'outline' | 'solid';
export type ChipTone = 'brand' | 'neutral' | 'success' | 'warning' | 'danger' | 'info';
export type ChipSize = 'sm' | 'md';

export interface ChipProps extends Omit<HTMLAttributes<HTMLElement>, 'onSelect'> {
  variant?: ChipVariant;
  tone?: ChipTone;
  size?: ChipSize;
  selected?: boolean;
  disabled?: boolean;
  /** Show a trailing remove button. */
  removable?: boolean;
  onRemove?: () => void;
  /** Leading icon/avatar slot. */
  icon?: ReactNode;
  children?: ReactNode;
}

export function Chip({
  variant = 'soft',
  tone = 'neutral',
  size = 'md',
  selected = false,
  disabled = false,
  removable = false,
  onRemove,
  icon,
  className,
  children,
  onClick,
  ...rest
}: ChipProps) {
  const interactive = Boolean(onClick);
  const leading = icon ?? (interactive && selected ? <Icon name="check" size={size === 'sm' ? 12 : 14} strokeWidth={3} /> : null);
  return (
    <span
      className={cx('tds-chip', 'tds-tone', className)}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive && !disabled ? 0 : undefined}
      aria-pressed={interactive ? selected : undefined}
      aria-disabled={disabled || undefined}
      data-selected={selected || undefined}
      data-disabled={disabled || undefined}
      data-interactive={interactive || undefined}
      onClick={disabled ? undefined : onClick}
      onKeyDown={
        interactive && !disabled
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.currentTarget.click();
              }
            }
          : undefined
      }
      {...toDataAttrs(chipMeta, { variant, tone, size })}
      {...rest}
    >
      {leading && <span className="tds-chip__icon">{leading}</span>}
      <span className="tds-chip__label">{children}</span>
      {removable && (
        <button
          type="button"
          className="tds-chip__remove"
          aria-label="Remove"
          disabled={disabled}
          onClick={(e) => {
            e.stopPropagation();
            onRemove?.();
          }}
        >
          <Icon name="close" size={12} strokeWidth={2.5} />
        </button>
      )}
    </span>
  );
}
