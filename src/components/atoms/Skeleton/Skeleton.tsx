import { forwardRef } from 'react';
import type { CSSProperties, HTMLAttributes } from 'react';
import { cx } from '@/utils/cx';
import { toDataAttrs } from '@core/defineComponent';
import { skeletonMeta } from './Skeleton.meta';
import './Skeleton.css';

export type SkeletonShape = 'text' | 'circle' | 'rect' | 'rounded';
export type SkeletonAnimation = 'shimmer' | 'pulse' | 'none';

export interface SkeletonProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  shape?: SkeletonShape;
  animation?: SkeletonAnimation;
  /** CSS width, e.g. `100%`, `240px`. */
  width?: number | string;
  /** CSS height, e.g. `1em`, `48px`. */
  height?: number | string;
  /** Number of stacked lines for `shape="text"`. The last line is shortened. */
  lines?: number;
}

const dim = (v: number | string | undefined) => (typeof v === 'number' ? `${v}px` : v);

export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(function Skeleton(
  { shape = 'text', animation = 'shimmer', width, height, lines = 1, className, style, ...rest },
  ref,
) {
  const dataAttrs = toDataAttrs(skeletonMeta, { shape, animation });

  // Multi-line text: render a stack of bones, last one shortened for realism.
  if (shape === 'text' && lines > 1) {
    return (
      <div
        ref={ref}
        className={cx('tds-skeleton-group', className)}
        role="status"
        aria-busy="true"
        style={{ width: dim(width), ...style }}
        {...rest}
      >
        <span className="tds-sr-only">Loading…</span>
        {Array.from({ length: lines }).map((_, i) => (
          <span
            key={i}
            className="tds-skeleton"
            aria-hidden="true"
            data-shape="text"
            data-animation={animation}
            style={i === lines - 1 ? { width: '60%' } : undefined}
          />
        ))}
      </div>
    );
  }

  const bone: CSSProperties = { width: dim(width), height: dim(height), ...style };

  return (
    <div
      ref={ref}
      className={cx('tds-skeleton-wrap', className)}
      role="status"
      aria-busy="true"
      {...rest}
    >
      <span className="tds-sr-only">Loading…</span>
      <span className={cx('tds-skeleton')} aria-hidden="true" style={bone} {...dataAttrs} />
    </div>
  );
});
