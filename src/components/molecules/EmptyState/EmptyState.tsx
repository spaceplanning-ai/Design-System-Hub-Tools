import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '@/utils/cx';
import { toDataAttrs } from '@core/defineComponent';
import { Icon } from '../../atoms/Icon';
import type { IconName } from '../../atoms/Icon';
import { Text } from '../../atoms/Text';
import { emptyStateMeta } from './EmptyState.meta';
import './EmptyState.css';

export type EmptyStateSize = 'sm' | 'md' | 'lg';
export type EmptyStateAlign = 'center' | 'start';
export type EmptyStateTone = 'neutral' | 'brand' | 'danger';

export interface EmptyStateProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: ReactNode;
  description?: ReactNode;
  /** Icon / illustration slot. Falls back to a tone-appropriate default glyph. */
  icon?: ReactNode;
  /** Primary action slot (e.g. a Button). */
  action?: ReactNode;
  /** Secondary action slot (e.g. a ghost Button / Link). */
  secondaryAction?: ReactNode;
  size?: EmptyStateSize;
  align?: EmptyStateAlign;
  tone?: EmptyStateTone;
}

const TONE_ICON: Record<EmptyStateTone, IconName> = {
  neutral: 'file-text',
  brand: 'plus-circle',
  danger: 'alert-circle',
};

export function EmptyState({
  title = '표시할 항목이 없습니다',
  description,
  icon,
  action,
  secondaryAction,
  size = 'md',
  align = 'center',
  tone = 'neutral',
  className,
  ...rest
}: EmptyStateProps) {
  const dataAttrs = toDataAttrs(emptyStateMeta, { size, align, tone });

  return (
    <div className={cx('tds-empty', className)} role="status" {...dataAttrs} {...rest}>
      <div className="tds-empty__medallion" aria-hidden="true">
        {icon ?? <Icon name={TONE_ICON[tone]} size={32} strokeWidth={1.5} />}
      </div>
      <div className="tds-empty__text">
        {title != null && (
          <Text variant="h4" as="p" className="tds-empty__title">
            {title}
          </Text>
        )}
        {description != null && (
          <Text variant="body" tone="muted" className="tds-empty__desc">
            {description}
          </Text>
        )}
      </div>
      {(action || secondaryAction) && (
        <div className="tds-empty__actions">
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  );
}
