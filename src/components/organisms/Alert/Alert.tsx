import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '@/utils/cx';
import { toDataAttrs } from '@core/defineComponent';
import { Icon } from '../../atoms/Icon';
import type { IconName } from '../../atoms/Icon';
import { alertMeta } from './Alert.meta';
import './Alert.css';

/** Layout preset — A: inline · B: banner (full-width) · C: prominent (accent bar). */
export type AlertType = 'A' | 'B' | 'C';
export type AlertVariant = 'subtle' | 'solid' | 'outline';
export type AlertTone = 'info' | 'success' | 'warning' | 'danger' | 'neutral';

const TONE_ICON: Record<AlertTone, IconName> = {
  info: 'info',
  success: 'check-circle',
  warning: 'alert-triangle',
  danger: 'alert-circle',
  neutral: 'info',
};

export interface AlertProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Layout preset. A: inline · B: banner · C: prominent (accent bar). */
  type?: AlertType;
  variant?: AlertVariant;
  tone?: AlertTone;
  title?: ReactNode;
  showIcon?: boolean;
  closable?: boolean;
  onClose?: () => void;
  action?: ReactNode;
  icon?: ReactNode;
}

export function Alert({
  type = 'A',
  variant = 'subtle',
  tone = 'info',
  title,
  showIcon = true,
  closable = false,
  onClose,
  action,
  icon,
  className,
  children,
  ...rest
}: AlertProps) {
  return (
    <div
      className={cx('tds-alert', 'tds-tone', className)}
      role="alert"
      {...toDataAttrs(alertMeta, { type, variant, tone })}
      {...rest}
    >
      {showIcon && (
        <span className="tds-alert__icon" aria-hidden="true">
          {icon ?? <Icon name={TONE_ICON[tone]} size="sm" />}
        </span>
      )}
      <div className="tds-alert__content">
        {title && <p className="tds-alert__title">{title}</p>}
        {children && <div className="tds-alert__body">{children}</div>}
        {action && <div className="tds-alert__action">{action}</div>}
      </div>
      {closable && (
        <button type="button" className="tds-alert__close" aria-label="Dismiss" onClick={onClose}>
          <Icon name="close" size="sm" />
        </button>
      )}
    </div>
  );
}
