import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '@/utils/cx';
import { toDataAttrs } from '@core/defineComponent';
import { Text } from '../../atoms/Text';
import { cardMeta } from './Card.meta';
import './Card.css';

/** Layout preset — A: vertical · B: horizontal · C: overlay (media background). */
export type CardType = 'A' | 'B' | 'C';
export type CardVariant = 'elevated' | 'outlined' | 'filled';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';
export type CardRadius = 'md' | 'lg' | 'xl';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Layout preset. A: vertical · B: horizontal · C: overlay. */
  type?: CardType;
  variant?: CardVariant;
  padding?: CardPadding;
  radius?: CardRadius;
  interactive?: boolean;
  /** Selected state (ring/border accent) — for selectable card grids. */
  selected?: boolean;
}

export function Card({
  type = 'A',
  variant = 'elevated',
  padding = 'md',
  radius = 'lg',
  interactive = false,
  selected = false,
  className,
  children,
  onClick,
  ...rest
}: CardProps) {
  return (
    <div
      className={cx('tds-card', className)}
      data-interactive={interactive || undefined}
      data-selected={selected || undefined}
      role={interactive ? 'button' : undefined}
      aria-pressed={interactive ? selected : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                (e.currentTarget as HTMLDivElement).click();
              }
            }
          : undefined
      }
      {...toDataAttrs(cardMeta, { type, variant, padding, radius })}
      {...rest}
    >
      {children}
    </div>
  );
}

export interface CardHeaderProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: ReactNode;
  subtitle?: ReactNode;
  /** Leading media/avatar/icon. */
  media?: ReactNode;
  /** Trailing actions. */
  action?: ReactNode;
}

function CardHeader({ title, subtitle, media, action, className, children, ...rest }: CardHeaderProps) {
  return (
    <div className={cx('tds-card__header', className)} {...rest}>
      {media && <div className="tds-card__header-media">{media}</div>}
      <div className="tds-card__header-text">
        {title && (
          <Text variant="h4" className="tds-card__title">
            {title}
          </Text>
        )}
        {subtitle && (
          <Text variant="bodySm" tone="muted">
            {subtitle}
          </Text>
        )}
        {children}
      </div>
      {action && <div className="tds-card__header-action">{action}</div>}
    </div>
  );
}

function CardBody({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cx('tds-card__body', className)} {...rest}>
      {children}
    </div>
  );
}

export type CardFooterJustify = 'start' | 'between' | 'end';
export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  /** Horizontal distribution of footer content. */
  justify?: CardFooterJustify;
}

function CardFooter({ justify = 'start', className, children, ...rest }: CardFooterProps) {
  return (
    <div className={cx('tds-card__footer', className)} data-justify={justify} {...rest}>
      {children}
    </div>
  );
}

export type CardMediaRatio = 'auto' | 'square' | '4:3' | '16:9' | '3:2';
export interface CardMediaProps extends HTMLAttributes<HTMLDivElement> {
  /** Constrain the media box to an aspect ratio. */
  ratio?: CardMediaRatio;
}

function CardMedia({ ratio = 'auto', className, children, ...rest }: CardMediaProps) {
  return (
    <div className={cx('tds-card__media', className)} data-ratio={ratio} {...rest}>
      {children}
    </div>
  );
}

Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;
Card.Media = CardMedia;
