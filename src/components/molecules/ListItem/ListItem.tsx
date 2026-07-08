import { createElement } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '@/utils/cx';
import { toDataAttrs } from '@core/defineComponent';
import { Icon } from '../../atoms/Icon';
import { Text } from '../../atoms/Text';
import { listItemMeta } from './ListItem.meta';
import './ListItem.css';

export type ListItemVariant = 'default' | 'interactive';
export type ListItemSize = 'sm' | 'md' | 'lg';
export type ListItemType = 'A' | 'B';

export interface ListItemProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  title?: ReactNode;
  description?: ReactNode;
  leading?: ReactNode;
  trailing?: ReactNode;
  /** Layout preset — A: compact single row · B: comfortable two-line card. */
  type?: ListItemType;
  variant?: ListItemVariant;
  size?: ListItemSize;
  selected?: boolean;
  disabled?: boolean;
  /** Render a trailing chevron to signal navigation. */
  withChevron?: boolean;
  /** Render a leading drag handle (grip) for reorderable lists. */
  dragHandle?: boolean;
}

export function ListItem({
  title,
  description,
  leading,
  trailing,
  type = 'A',
  variant = 'default',
  size = 'md',
  selected = false,
  disabled = false,
  withChevron = false,
  dragHandle = false,
  className,
  children,
  onClick,
  ...rest
}: ListItemProps) {
  const interactive = variant === 'interactive' || Boolean(onClick);
  const Tag = interactive ? 'button' : 'div';

  return createElement(
    Tag,
    {
      className: cx('tds-list-item', className),
      type: interactive ? 'button' : undefined,
      'aria-current': selected ? 'true' : undefined,
      'aria-disabled': disabled || undefined,
      disabled: interactive ? disabled : undefined,
      'data-selected': selected || undefined,
      'data-disabled': disabled || undefined,
      'data-interactive': interactive || undefined,
      onClick: disabled ? undefined : onClick,
      ...toDataAttrs(listItemMeta, { type, variant, size }),
      ...rest,
    },
    <>
      {dragHandle && (
        <span className="tds-list-item__drag" aria-hidden="true">
          <Icon name="grip-vertical" size="sm" />
        </span>
      )}
      {leading && <span className="tds-list-item__leading">{leading}</span>}
      <span className="tds-list-item__content">
        {title && (
          <Text variant="label" className="tds-list-item__title" truncate>
            {title}
          </Text>
        )}
        {description && (
          <Text variant="caption" tone="muted" className="tds-list-item__description" truncate>
            {description}
          </Text>
        )}
        {children}
      </span>
      {trailing && <span className="tds-list-item__trailing">{trailing}</span>}
      {withChevron && (
        <span className="tds-list-item__chevron" aria-hidden="true">
          <Icon name="chevron-right" size="sm" />
        </span>
      )}
    </>,
  );
}
