import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '@/utils/cx';
import { toDataAttrs } from '@core/defineComponent';
import { Icon } from '../../atoms/Icon';
import { IconButton } from '../../atoms/IconButton';
import { headerMeta } from './Header.meta';
import './Header.css';

/** Layout preset — A: standard · B: centered brand + nav below · C: compact (nav hidden). */
export type HeaderType = 'A' | 'B' | 'C';
export type HeaderVariant = 'surface' | 'transparent' | 'elevated';
export type HeaderSize = 'sm' | 'md' | 'lg';

export interface HeaderProps extends HTMLAttributes<HTMLElement> {
  /** Layout preset. A: standard · B: centered brand · C: compact. */
  type?: HeaderType;
  variant?: HeaderVariant;
  size?: HeaderSize;
  sticky?: boolean;
  /** Brand / logo slot (leading). */
  brand?: ReactNode;
  /** Primary navigation. */
  nav?: ReactNode;
  /** Search slot (rendered between nav and actions). */
  search?: ReactNode;
  /** Action slot (trailing). */
  actions?: ReactNode;
  /** When set, renders a mobile hamburger button that calls this on click. */
  onMenuToggle?: () => void;
  /** Reflects the mobile menu open state on the hamburger (aria-expanded). */
  menuOpen?: boolean;
}

export function Header({
  type = 'A',
  variant = 'surface',
  size = 'md',
  sticky = false,
  brand,
  nav,
  search,
  actions,
  onMenuToggle,
  menuOpen = false,
  className,
  children,
  ...rest
}: HeaderProps) {
  const navBar = nav && (
    <nav className="tds-header__nav" aria-label="Primary">
      {nav}
    </nav>
  );

  return (
    <header
      className={cx('tds-header', className)}
      role="banner"
      data-sticky={sticky || undefined}
      {...toDataAttrs(headerMeta, { type, variant, size, sticky: String(sticky) })}
      {...rest}
    >
      <div className="tds-header__inner">
        {onMenuToggle && (
          <span className="tds-header__menu">
            <IconButton
              label={menuOpen ? 'Close menu' : 'Open menu'}
              icon={<Icon name={menuOpen ? 'close' : 'menu'} />}
              variant="ghost"
              aria-expanded={menuOpen}
              onClick={onMenuToggle}
            />
          </span>
        )}
        {brand && <div className="tds-header__brand">{brand}</div>}
        {/* Type B renders the nav on its own row below; A renders it inline. */}
        {type !== 'B' && navBar}
        {search && <div className="tds-header__search">{search}</div>}
        {children}
        {actions && <div className="tds-header__actions">{actions}</div>}
      </div>
      {type === 'B' && navBar && <div className="tds-header__navrow">{navBar}</div>}
    </header>
  );
}
