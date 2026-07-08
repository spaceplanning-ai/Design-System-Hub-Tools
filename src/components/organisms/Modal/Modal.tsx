import { useEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '@/utils/cx';
import { useFocusTrap, useKeyDown } from '@/hooks';
import { toDataAttrs } from '@core/defineComponent';
import { IconButton } from '../../atoms/IconButton';
import { Icon } from '../../atoms/Icon';
import { modalMeta } from './Modal.meta';
import './Modal.css';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';
export type ModalPlacement = 'center' | 'top';
/** Presentation preset — A: centered dialog · B: bottom sheet · C: fullscreen. */
export type ModalType = 'A' | 'B' | 'C';

export interface ModalProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  open: boolean;
  onClose?: () => void;
  /** Presentation preset. A: dialog · B: bottom sheet · C: fullscreen. */
  type?: ModalType;
  size?: ModalSize;
  placement?: ModalPlacement;
  title?: ReactNode;
  description?: ReactNode;
  footer?: ReactNode;
  closable?: boolean;
  /** Close when clicking the scrim. */
  dismissable?: boolean;
}

export function Modal({
  open,
  onClose,
  type = 'A',
  size = 'md',
  placement = 'center',
  title,
  description,
  footer,
  closable = true,
  dismissable = true,
  className,
  children,
  ...rest
}: ModalProps) {
  const trapRef = useFocusTrap(open);
  const titleId = useId();
  const descId = useId();

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
      className="tds-modal-overlay"
      data-placement={placement}
      data-type={type}
      onMouseDown={(e) => {
        if (dismissable && e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        ref={trapRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={cx('tds-modal', className)}
        {...toDataAttrs(modalMeta, { type, size, placement })}
        {...rest}
      >
        {(title || closable) && (
          <header className="tds-modal__header">
            <div className="tds-modal__heading">
              {title && (
                <h2 id={titleId} className="tds-modal__title">
                  {title}
                </h2>
              )}
              {description && (
                <p id={descId} className="tds-modal__description">
                  {description}
                </p>
              )}
            </div>
            {closable && (
              <IconButton
                className="tds-modal__close"
                label="Close dialog"
                icon={<Icon name="close" size="sm" />}
                onClick={onClose}
              />
            )}
          </header>
        )}
        <div className="tds-modal__body">{children}</div>
        {footer && <footer className="tds-modal__footer">{footer}</footer>}
      </div>
    </div>,
    document.body,
  );
}
