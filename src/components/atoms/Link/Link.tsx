import { forwardRef } from 'react';
import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { cx } from '@/utils/cx';
import { toDataAttrs } from '@core/defineComponent';
import { Icon } from '../Icon';
import type { IconName } from '../Icon';
import { linkMeta } from './Link.meta';
import './Link.css';

export type LinkTone = 'brand' | 'neutral' | 'danger';
export type LinkUnderline = 'hover' | 'always' | 'none';
export type LinkSize = 'sm' | 'md' | 'lg';

export interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  tone?: LinkTone;
  underline?: LinkUnderline;
  size?: LinkSize;
  /** Marks the link as external (adds icon + safe rel/target). */
  external?: boolean;
  /** Leading icon (e.g. `download`, `chevron-left`). */
  leadingIcon?: IconName;
  /** Trailing icon (e.g. `arrow-right`, `chevron-right`). */
  trailingIcon?: IconName;
  /** Disable the link (removes href, blocks pointer + keyboard). */
  disabled?: boolean;
  children?: ReactNode;
}

const ICON_SIZE: Record<LinkSize, number> = { sm: 13, md: 14, lg: 16 };

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  { tone = 'brand', underline = 'hover', size = 'md', external = false, leadingIcon, trailingIcon, disabled = false, className, children, href, target, rel, ...rest },
  ref,
) {
  const isize = ICON_SIZE[size];
  return (
    <a
      ref={ref}
      className={cx('tds-link', className)}
      href={disabled ? undefined : href}
      aria-disabled={disabled || undefined}
      data-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : rest.tabIndex}
      target={external ? '_blank' : target}
      rel={external ? 'noopener noreferrer' : rel}
      {...toDataAttrs(linkMeta, { tone, underline, size })}
      {...rest}
    >
      {leadingIcon && <Icon className="tds-link__icon" name={leadingIcon} size={isize} aria-hidden />}
      {children}
      {trailingIcon && <Icon className="tds-link__icon" name={trailingIcon} size={isize} aria-hidden />}
      {external && (
        <>
          <Icon className="tds-link__external" name="external-link" size={isize} aria-hidden />
          <span className="tds-sr-only">(opens in new tab)</span>
        </>
      )}
    </a>
  );
});
