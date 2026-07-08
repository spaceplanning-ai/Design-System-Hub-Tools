import { cloneElement, isValidElement, useId, useRef } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { cx } from '@/utils/cx';
import { useControllableState, useOnClickOutside, useKeyDown } from '@/hooks';
import { toDataAttrs } from '@core/defineComponent';
import { popoverMeta } from './Popover.meta';
import './Popover.css';

export type PopoverSide = 'top' | 'right' | 'bottom' | 'left';
export type PopoverAlign = 'start' | 'center' | 'end';
export type PopoverSize = 'sm' | 'md';

export interface PopoverProps {
  /** Element that toggles the popover. Cloned to receive ARIA + click wiring. */
  trigger: ReactElement;
  /** Panel content. */
  children: ReactNode;
  side?: PopoverSide;
  align?: PopoverAlign;
  size?: PopoverSize;
  /** Show the pointer arrow. */
  arrow?: boolean;
  /** Optional header title. */
  title?: ReactNode;
  /** Controlled open state. */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Close on Escape (default true). */
  closeOnEsc?: boolean;
  /** Close on outside click (default true). */
  dismissOnOutside?: boolean;
  className?: string;
}

export function Popover({
  trigger,
  children,
  side = 'bottom',
  align = 'center',
  size = 'md',
  arrow = true,
  title,
  open,
  defaultOpen = false,
  onOpenChange,
  closeOnEsc = true,
  dismissOnOutside = true,
  className,
}: PopoverProps) {
  const id = useId();
  const [isOpen, setOpen] = useControllableState({
    value: open,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  });
  const containerRef = useRef<HTMLDivElement>(null);

  useOnClickOutside(containerRef, () => setOpen(false), isOpen && dismissOnOutside);
  useKeyDown('Escape', () => setOpen(false), isOpen && closeOnEsc);

  const triggerEl = isValidElement(trigger)
    ? cloneElement(trigger as ReactElement<Record<string, unknown>>, {
        'aria-haspopup': 'dialog',
        'aria-expanded': isOpen,
        'aria-controls': isOpen ? id : undefined,
        onClick: (e: React.MouseEvent) => {
          (trigger.props as { onClick?: (e: React.MouseEvent) => void }).onClick?.(e);
          setOpen(!isOpen);
        },
      })
    : trigger;

  return (
    <div ref={containerRef} className={cx('tds-popover', className)}>
      {triggerEl}
      {isOpen && (
        <div
          id={id}
          role="dialog"
          aria-label={typeof title === 'string' ? title : undefined}
          className="tds-popover__panel"
          data-arrow={arrow || undefined}
          {...toDataAttrs(popoverMeta, { side, align, size })}
        >
          {title != null && <div className="tds-popover__title">{title}</div>}
          <div className="tds-popover__body">{children}</div>
          {arrow && <span className="tds-popover__arrow" aria-hidden="true" />}
        </div>
      )}
    </div>
  );
}
