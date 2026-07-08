import { cloneElement, isValidElement, useRef } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { cx } from '@/utils/cx';
import { useDisclosure, useOnClickOutside, useKeyDown } from '@/hooks';
import { toDataAttrs } from '@core/defineComponent';
import { Icon } from '../../atoms/Icon';
import { dropdownMeta } from './Dropdown.meta';
import './Dropdown.css';

export type DropdownPlacement = 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end';
export type DropdownSize = 'sm' | 'md';

export interface DropdownItem {
  label?: ReactNode;
  icon?: ReactNode;
  onSelect?: () => void;
  danger?: boolean;
  disabled?: boolean;
  divider?: boolean;
  /** Renders a non-interactive section heading (uses `label`). */
  header?: boolean;
  /** Marks the item as selected — renders a trailing check. */
  selected?: boolean;
  /** Secondary description line under the label. */
  description?: ReactNode;
  /** Right-aligned content (shortcut hint, badge…). */
  trailing?: ReactNode;
}

export interface DropdownProps {
  trigger: ReactElement;
  items: DropdownItem[];
  placement?: DropdownPlacement;
  size?: DropdownSize;
  className?: string;
}

export function Dropdown({ trigger, items, placement = 'bottom-start', size = 'md', className }: DropdownProps) {
  const { isOpen, toggle, close } = useDisclosure(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useOnClickOutside(containerRef, close, isOpen);
  useKeyDown('Escape', close, isOpen);

  const focusItem = (dir: 1 | -1) => {
    const nodes = Array.from(menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not(:disabled)') ?? []);
    if (!nodes.length) return;
    const idx = nodes.indexOf(document.activeElement as HTMLButtonElement);
    const next = idx < 0 ? (dir === 1 ? 0 : nodes.length - 1) : (idx + dir + nodes.length) % nodes.length;
    nodes[next]?.focus();
  };

  const triggerEl = isValidElement(trigger)
    ? cloneElement(trigger as ReactElement<Record<string, unknown>>, {
        'aria-haspopup': 'menu',
        'aria-expanded': isOpen,
        onClick: toggle,
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
    <div ref={containerRef} className={cx('tds-dropdown', className)}>
      {triggerEl}
      {isOpen && (
        <div
          ref={menuRef}
          role="menu"
          className="tds-dropdown__menu"
          {...toDataAttrs(dropdownMeta, { placement, size })}
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
          {items.map((item, i) => {
            if (item.divider) return <div key={i} className="tds-dropdown__divider" role="separator" />;
            if (item.header)
              return (
                <div key={i} className="tds-dropdown__header" role="presentation">
                  {item.label}
                </div>
              );
            return (
              <button
                key={i}
                type="button"
                role={item.selected !== undefined ? 'menuitemradio' : 'menuitem'}
                aria-checked={item.selected !== undefined ? Boolean(item.selected) : undefined}
                className="tds-dropdown__item"
                data-danger={item.danger || undefined}
                data-selected={item.selected || undefined}
                disabled={item.disabled}
                onClick={() => {
                  item.onSelect?.();
                  close();
                }}
              >
                {item.icon && <span className="tds-dropdown__item-icon">{item.icon}</span>}
                <span className="tds-dropdown__item-body">
                  <span className="tds-dropdown__item-label">{item.label}</span>
                  {item.description != null && <span className="tds-dropdown__item-desc">{item.description}</span>}
                </span>
                {item.trailing != null && <span className="tds-dropdown__item-trailing">{item.trailing}</span>}
                {item.selected && <Icon className="tds-dropdown__item-check" name="check" size={16} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
