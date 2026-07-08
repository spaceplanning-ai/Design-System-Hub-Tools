import { cloneElement, isValidElement, useId, useRef, useState } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { cx } from '@/utils/cx';
import { toDataAttrs } from '@core/defineComponent';
import { tooltipMeta } from './Tooltip.meta';
import './Tooltip.css';

export type TooltipPlacement = 'top' | 'right' | 'bottom' | 'left';
export type TooltipTone = 'inverse' | 'default';

export interface TooltipProps {
  content: ReactNode;
  placement?: TooltipPlacement;
  tone?: TooltipTone;
  /** Show delay in ms. */
  delay?: number;
  /** Hide delay in ms — lets the pointer briefly leave without flicker. */
  closeDelay?: number;
  children: ReactElement;
  className?: string;
}

type Handler = ((e: never) => void) | undefined;
const compose =
  (own: (e: never) => void, theirs: Handler) =>
  (e: never) => {
    theirs?.(e);
    own(e);
  };

export function Tooltip({
  content,
  placement = 'top',
  tone = 'inverse',
  delay = 150,
  closeDelay = 0,
  children,
  className,
}: TooltipProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const show = () => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(true), delay);
  };
  const hide = () => {
    clearTimeout(timer.current);
    if (closeDelay > 0) timer.current = setTimeout(() => setOpen(false), closeDelay);
    else setOpen(false);
  };

  // Empty content → render the trigger untouched.
  if (content == null || content === '') return children;

  const childProps = (isValidElement(children) ? (children.props as Record<string, unknown>) : {}) as {
    onMouseEnter?: Handler;
    onMouseLeave?: Handler;
    onFocus?: Handler;
    onBlur?: Handler;
    onKeyDown?: ((e: React.KeyboardEvent) => void) | undefined;
  };

  const trigger = isValidElement(children)
    ? cloneElement(children as ReactElement<Record<string, unknown>>, {
        'aria-describedby': open ? id : undefined,
        onMouseEnter: compose(show, childProps.onMouseEnter),
        onMouseLeave: compose(hide, childProps.onMouseLeave),
        onFocus: compose(show, childProps.onFocus),
        onBlur: compose(hide, childProps.onBlur),
        onKeyDown: (e: React.KeyboardEvent) => {
          childProps.onKeyDown?.(e);
          if (e.key === 'Escape') hide();
        },
      })
    : children;

  return (
    <span className={cx('tds-tooltip', className)} onMouseEnter={show} onMouseLeave={hide}>
      {trigger}
      <span
        id={id}
        role="tooltip"
        className="tds-tooltip__bubble"
        data-open={open || undefined}
        {...toDataAttrs(tooltipMeta, { placement, tone })}
      >
        {content}
        <span className="tds-tooltip__arrow" aria-hidden="true" />
      </span>
    </span>
  );
}
