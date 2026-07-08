import { useEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '@/utils/cx';
import { useFocusTrap, useKeyDown } from '@/hooks';
import { toDataAttrs } from '@core/defineComponent';
import { IconButton } from '../../atoms/IconButton';
import { Icon } from '../../atoms/Icon';
import { drawerMeta } from './Drawer.meta';
import './Drawer.css';

export type DrawerSide = 'right' | 'left' | 'top' | 'bottom';
export type DrawerSize = 'sm' | 'md' | 'lg';
/** Form-factor preset — A: flush · B: floating (inset) · C: full (fills cross axis). */
export type DrawerType = 'A' | 'B' | 'C';

export interface DrawerProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  open: boolean;
  onClose?: () => void;
  /** Form-factor preset. A: flush · B: floating · C: full. */
  type?: DrawerType;
  side?: DrawerSide;
  size?: DrawerSize;
  title?: ReactNode;
  footer?: ReactNode;
  closable?: boolean;
  dismissable?: boolean;
}

export function Drawer({
  open,
  onClose,
  type = 'A',
  side = 'right',
  size = 'md',
  title,
  footer,
  closable = true,
  dismissable = true,
  className,
  children,
  ...rest
}: DrawerProps) {
  const trapRef = useFocusTrap(open);
  const titleId = useId();

  useKeyDown('Escape', () => closable && onClose?.(), open);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      className="tds-drawer-overlay"
      onMouseDown={(e) => {
        if (dismissable && e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        ref={trapRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        className={cx('tds-drawer', className)}
        {...toDataAttrs(drawerMeta, { type, side, size })}
        {...rest}
      >
        {(title || closable) && (
          <header className="tds-drawer__header">
            {title && (
              <h2 id={titleId} className="tds-drawer__title">
                {title}
              </h2>
            )}
            {closable && (
              <IconButton
                label="Close panel"
                icon={<Icon name="close" size="sm" />}
                onClick={onClose}
              />
            )}
          </header>
        )}
        <div className="tds-drawer__body">{children}</div>
        {footer && <footer className="tds-drawer__footer">{footer}</footer>}
      </div>
    </div>,
    document.body,
  );
}
