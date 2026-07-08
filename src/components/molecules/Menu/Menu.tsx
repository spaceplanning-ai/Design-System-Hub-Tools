import { cloneElement, createContext, isValidElement, useContext, useRef } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { cx } from '@/utils/cx';
import { useDisclosure, useOnClickOutside, useKeyDown } from '@/hooks';
import { toDataAttrs } from '@core/defineComponent';
import { menuMeta } from './Menu.meta';
import './Menu.css';

export type MenuPlacement = 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end';
export type MenuSize = 'sm' | 'md';

interface MenuContextValue {
  close: () => void;
}
const MenuContext = createContext<MenuContextValue>({ close: () => {} });

export interface MenuProps {
  trigger: ReactElement;
  children: ReactNode;
  placement?: MenuPlacement;
  size?: MenuSize;
  className?: string;
}

export function Menu({
  trigger,
  children,
  placement = 'bottom-start',
  size = 'md',
  className,
}: MenuProps) {
  const { isOpen, toggle, close } = useDisclosure(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useOnClickOutside(containerRef, close, isOpen);
  useKeyDown('Escape', close, isOpen);

  const focusItem = (dir: 1 | -1) => {
    const nodes = Array.from(
      menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not(:disabled)') ??
        [],
    );
    if (!nodes.length) return;
    const idx = nodes.indexOf(document.activeElement as HTMLButtonElement);
    const next =
      idx < 0 ? (dir === 1 ? 0 : nodes.length - 1) : (idx + dir + nodes.length) % nodes.length;
    nodes[next]?.focus();
  };

  const triggerEl = isValidElement(trigger)
    ? cloneElement(trigger as ReactElement<Record<string, unknown>>, {
        'aria-haspopup': 'menu',
        'aria-expanded': isOpen,
        onClick: (e: React.MouseEvent) => {
          (trigger.props as { onClick?: (e: React.MouseEvent) => void }).onClick?.(e);
          toggle();
        },
        onKeyDown: (e: React.KeyboardEvent) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (!isOpen) toggle();
            requestAnimationFrame(() => focusItem(1));
          }
        },
      })
    : trigger;

  return (
    <div ref={containerRef} className={cx('tds-menu', className)}>
      {triggerEl}
      {isOpen && (
        <div
          ref={menuRef}
          role="menu"
          className="tds-menu__list"
          {...toDataAttrs(menuMeta, { placement, size })}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              focusItem(1);
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              focusItem(-1);
            } else if (e.key === 'Tab') {
              close();
            }
          }}
        >
          <MenuContext.Provider value={{ close }}>{children}</MenuContext.Provider>
        </div>
      )}
    </div>
  );
}

export interface MenuItemProps {
  children: ReactNode;
  icon?: ReactNode;
  /** Keyboard shortcut hint, e.g. `⌘K`. */
  shortcut?: string;
  disabled?: boolean;
  danger?: boolean;
  onSelect?: () => void;
}

export function MenuItem({ children, icon, shortcut, disabled, danger, onSelect }: MenuItemProps) {
  const { close } = useContext(MenuContext);
  return (
    <button
      type="button"
      role="menuitem"
      className="tds-menu__item"
      data-danger={danger || undefined}
      disabled={disabled}
      onClick={() => {
        onSelect?.();
        close();
      }}
    >
      {icon && <span className="tds-menu__item-icon">{icon}</span>}
      <span className="tds-menu__item-label">{children}</span>
      {shortcut && <kbd className="tds-menu__item-shortcut">{shortcut}</kbd>}
    </button>
  );
}

export function MenuSeparator() {
  return <div role="separator" className="tds-menu__separator" />;
}

export function MenuLabel({ children }: { children: ReactNode }) {
  return (
    <div role="presentation" className="tds-menu__group-label">
      {children}
    </div>
  );
}
