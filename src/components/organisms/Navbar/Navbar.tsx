import type { ReactNode } from 'react';
import { cx } from '@/utils/cx';
import { useDisclosure } from '@/hooks';
import { toDataAttrs } from '@core/defineComponent';
import { IconButton } from '../../atoms/IconButton';
import { Icon } from '../../atoms/Icon';
import { navbarMeta } from './Navbar.meta';
import './Navbar.css';

/** Layout preset — A: single inline row · B: brand+actions row with nav below. */
export type NavbarType = 'A' | 'B';
export type NavbarVariant = 'surface' | 'transparent' | 'elevated';
export type NavbarSize = 'sm' | 'md' | 'lg';
export type NavbarAlign = 'start' | 'center' | 'end';

export interface NavItem {
  label: ReactNode;
  href?: string;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

export interface NavbarProps {
  items: NavItem[];
  brand?: ReactNode;
  actions?: ReactNode;
  /** Layout preset. A: single inline row · B: brand+actions row with nav below. */
  type?: NavbarType;
  variant?: NavbarVariant;
  size?: NavbarSize;
  align?: NavbarAlign;
  sticky?: boolean;
  /** Accessible label for the nav landmark. */
  ariaLabel?: string;
  className?: string;
}

function NavLinks({ items, onNavigate }: { items: NavItem[]; onNavigate?: () => void }) {
  return (
    <>
      {items.map((item, i) => {
        const common = {
          className: 'tds-navbar__link',
          'data-active': item.active || undefined,
          'aria-current': item.active ? ('page' as const) : undefined,
          'aria-disabled': item.disabled || undefined,
          onClick: () => {
            if (item.disabled) return;
            item.onClick?.();
            onNavigate?.();
          },
        };
        return item.href && !item.disabled ? (
          <a key={i} href={item.href} {...common}>
            {item.label}
          </a>
        ) : (
          <button key={i} type="button" disabled={item.disabled} {...common}>
            {item.label}
          </button>
        );
      })}
    </>
  );
}

export function Navbar({
  items,
  brand,
  actions,
  type = 'A',
  variant = 'surface',
  size = 'md',
  align = 'start',
  sticky = false,
  ariaLabel = '주요 내비게이션',
  className,
}: NavbarProps) {
  const { isOpen, toggle, close } = useDisclosure(false);

  const inlineNav = (
    <div className="tds-navbar__nav" data-align={align}>
      <NavLinks items={items} />
    </div>
  );

  return (
    <nav
      aria-label={ariaLabel}
      className={cx('tds-navbar', className)}
      data-sticky={sticky || undefined}
      data-menu-open={isOpen || undefined}
      {...toDataAttrs(navbarMeta, { type, variant, size, align })}
    >
      <div className="tds-navbar__bar">
        {brand && <div className="tds-navbar__brand">{brand}</div>}

        {/* Type A keeps the nav inline; Type B moves it to its own row below. */}
        {type !== 'B' && inlineNav}

        {actions && <div className="tds-navbar__actions">{actions}</div>}

        <IconButton
          className="tds-navbar__toggle"
          size={size === 'lg' ? 'md' : 'sm'}
          variant="ghost"
          label={isOpen ? '메뉴 닫기' : '메뉴 열기'}
          aria-expanded={isOpen}
          pressed={isOpen}
          icon={<Icon name={isOpen ? 'close' : 'menu'} size="sm" />}
          onClick={toggle}
        />
      </div>

      {type === 'B' && <div className="tds-navbar__navrow">{inlineNav}</div>}

      {isOpen && (
        <div className="tds-navbar__panel">
          <NavLinks items={items} onNavigate={close} />
        </div>
      )}
    </nav>
  );
}
