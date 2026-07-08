import { useState } from 'react';
import type { ImgHTMLAttributes, ReactNode } from 'react';
import { cx } from '@/utils/cx';
import { toDataAttrs } from '@core/defineComponent';
import { Icon } from '../Icon';
import { imageMeta } from './Image.meta';
import './Image.css';

export type ImageFit = 'cover' | 'contain' | 'fill';
export type ImageRadius = 'none' | 'sm' | 'md' | 'lg' | 'full';
export type ImageRatio = 'auto' | 'square' | '4:3' | '16:9' | '3:2';

export interface ImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'className'> {
  fit?: ImageFit;
  radius?: ImageRadius;
  ratio?: ImageRatio;
  /** Custom node shown when the image is missing or fails to load. */
  fallback?: ReactNode;
  /** Caption rendered under the image inside a <figure>. */
  caption?: ReactNode;
  className?: string;
}

export function Image({ src, alt = '', fit = 'cover', radius = 'md', ratio = 'auto', fallback, caption, className, ...rest }: ImageProps) {
  const [state, setState] = useState<'loading' | 'default' | 'error'>(src ? 'loading' : 'error');

  const frame = (
    <span
      className={cx('tds-image', !caption && className)}
      data-state={state}
      {...toDataAttrs(imageMeta, { fit, radius, ratio })}
    >
      {state !== 'error' && (
        <img
          className="tds-image__img"
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={() => setState('default')}
          onError={() => setState('error')}
          {...rest}
        />
      )}
      {state === 'loading' && <span className="tds-image__skeleton" aria-hidden="true" />}
      {state === 'error' && (
        <span className="tds-image__fallback" aria-hidden="true">
          {fallback ?? <Icon name="image" size={32} />}
        </span>
      )}
    </span>
  );

  if (caption) {
    return (
      <figure className={cx('tds-image-figure', className)}>
        {frame}
        <figcaption className="tds-image__caption">{caption}</figcaption>
      </figure>
    );
  }
  return frame;
}
