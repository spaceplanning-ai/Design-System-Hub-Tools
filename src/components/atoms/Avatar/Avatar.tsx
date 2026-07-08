import { useState } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '@/utils/cx';
import { toDataAttrs } from '@core/defineComponent';
import { Icon } from '../Icon';
import { avatarMeta } from './Avatar.meta';
import './Avatar.css';

const STATUS_LABEL: Record<Exclude<AvatarStatus, 'none'>, string> = {
  online: 'online',
  offline: 'offline',
  busy: 'busy',
  away: 'away',
};

const FALLBACK_ICON_SIZE: Record<AvatarSize, number> = { xs: 14, sm: 18, md: 22, lg: 26, xl: 34 };

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type AvatarShape = 'circle' | 'rounded';
export type AvatarStatus = 'none' | 'online' | 'offline' | 'busy' | 'away';

export interface AvatarProps extends HTMLAttributes<HTMLSpanElement> {
  src?: string;
  /** Name for initials + accessible label. */
  name?: string;
  size?: AvatarSize;
  shape?: AvatarShape;
  status?: AvatarStatus;
  /** Custom fallback (e.g. an Icon) when no image/name. */
  fallback?: ReactNode;
}

function initials(name?: string): string {
  if (!name) return '';
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

export function Avatar({
  src,
  name,
  size = 'md',
  shape = 'circle',
  status = 'none',
  fallback,
  className,
  ...rest
}: AvatarProps) {
  const [errored, setErrored] = useState(false);
  const showImage = src && !errored;
  const chars = initials(name);
  const accessibleLabel =
    status !== 'none' && name ? `${name}, ${STATUS_LABEL[status]}` : name;

  return (
    <span
      className={cx('tds-avatar', className)}
      role="img"
      aria-label={accessibleLabel}
      {...toDataAttrs(avatarMeta, { size, shape, status })}
      {...rest}
    >
      {showImage ? (
        <img className="tds-avatar__img" src={src} alt={name ?? ''} onError={() => setErrored(true)} />
      ) : (
        <span className="tds-avatar__fallback" aria-hidden="true">
          {chars || fallback || <Icon name="user" size={FALLBACK_ICON_SIZE[size]} />}
        </span>
      )}
      {status !== 'none' && <span className="tds-avatar__status" aria-hidden="true" />}
    </span>
  );
}
