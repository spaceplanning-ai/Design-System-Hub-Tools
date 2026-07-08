import { forwardRef } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import { cx } from '@/utils/cx';
import { toDataAttrs } from '@core/defineComponent';
import { Icon } from '../Icon';
import { switchMeta } from './Switch.meta';
import './Switch.css';

export type SwitchSize = 'sm' | 'md' | 'lg';
export type SwitchTone = 'brand' | 'success' | 'danger';
export type SwitchLabelPosition = 'start' | 'end';

export interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'> {
  size?: SwitchSize;
  tone?: SwitchTone;
  labelPosition?: SwitchLabelPosition;
  /** Render check/close glyphs inside the thumb. */
  showIcons?: boolean;
  /** Invalid/error styling. */
  invalid?: boolean;
  children?: ReactNode;
}

const THUMB_ICON: Record<SwitchSize, number> = { sm: 10, md: 12, lg: 14 };

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(function Switch(
  { size = 'md', tone = 'brand', labelPosition = 'end', showIcons = false, invalid = false, disabled, className, children, ...rest },
  ref,
) {
  return (
    <label
      className={cx('tds-switch', disabled && 'tds-switch--disabled', className)}
      data-state={invalid ? 'error' : 'default'}
      {...toDataAttrs(switchMeta, { size, tone, labelPosition })}
    >
      <input
        ref={ref}
        type="checkbox"
        role="switch"
        className="tds-switch__input tds-sr-only"
        disabled={disabled}
        aria-invalid={invalid || undefined}
        {...rest}
      />
      <span className="tds-switch__track" aria-hidden="true">
        <span className="tds-switch__thumb">
          {showIcons && (
            <>
              <Icon className="tds-switch__icon tds-switch__icon--on" name="check" size={THUMB_ICON[size]} strokeWidth={3} />
              <Icon className="tds-switch__icon tds-switch__icon--off" name="close" size={THUMB_ICON[size]} strokeWidth={3} />
            </>
          )}
        </span>
      </span>
      {children != null && <span className="tds-switch__label">{children}</span>}
    </label>
  );
});
