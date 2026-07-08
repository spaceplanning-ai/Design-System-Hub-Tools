import { useState } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '@/utils/cx';
import { toDataAttrs } from '@core/defineComponent';
import { Icon } from '../../atoms/Icon';
import { breadcrumbMeta } from './Breadcrumb.meta';
import './Breadcrumb.css';

export type BreadcrumbSize = 'sm' | 'md';
export type BreadcrumbSeparator = 'chevron' | 'slash' | 'dot';

export interface BreadcrumbItem {
  label: ReactNode;
  href?: string;
  current?: boolean;
  /** Leading icon (e.g. `<Icon name="home" />` for the root crumb). */
  icon?: ReactNode;
}

export interface BreadcrumbProps extends HTMLAttributes<HTMLElement> {
  items: BreadcrumbItem[];
  size?: BreadcrumbSize;
  separator?: BreadcrumbSeparator;
  /** Collapse the middle of the trail once there are more than this many items. */
  maxItems?: number;
}

function Sep({ type }: { type: BreadcrumbSeparator }) {
  if (type === 'chevron') return <Icon className="tds-breadcrumb__sep" name="chevron-right" size={14} aria-hidden />;
  return (
    <span className="tds-breadcrumb__sep" aria-hidden="true">
      {type === 'slash' ? '/' : '•'}
    </span>
  );
}

const ELLIPSIS = Symbol('ellipsis');
type Rendered = { item: BreadcrumbItem; index: number } | typeof ELLIPSIS;

export function Breadcrumb({ items, size = 'md', separator = 'chevron', maxItems, className, ...rest }: BreadcrumbProps) {
  const [expanded, setExpanded] = useState(false);
  const collapsible = maxItems != null && maxItems >= 2 && items.length > maxItems && !expanded;

  let rendered: Rendered[];
  if (collapsible) {
    const after = Math.max(1, maxItems - 1);
    rendered = [
      { item: items[0], index: 0 },
      ELLIPSIS,
      ...items.slice(items.length - after).map((item, k) => ({ item, index: items.length - after + k })),
    ];
  } else {
    rendered = items.map((item, index) => ({ item, index }));
  }

  return (
    <nav aria-label="Breadcrumb" className={cx('tds-breadcrumb', className)} {...toDataAttrs(breadcrumbMeta, { size, separator })} {...rest}>
      <ol className="tds-breadcrumb__list">
        {rendered.map((entry, pos) => {
          const isLastPos = pos === rendered.length - 1;
          if (entry === ELLIPSIS) {
            return (
              <li key="ellipsis" className="tds-breadcrumb__item">
                <button type="button" className="tds-breadcrumb__ellipsis" aria-label="Show hidden breadcrumbs" onClick={() => setExpanded(true)}>
                  <Icon name="more-horizontal" size={14} />
                </button>
                <Sep type={separator} />
              </li>
            );
          }
          const { item, index } = entry;
          const isLast = index === items.length - 1;
          const current = item.current ?? isLast;
          return (
            <li key={index} className="tds-breadcrumb__item">
              {current || !item.href ? (
                <span className="tds-breadcrumb__current" aria-current={current ? 'page' : undefined}>
                  {item.icon && <span className="tds-breadcrumb__item-icon" aria-hidden="true">{item.icon}</span>}
                  {item.label}
                </span>
              ) : (
                <a className="tds-breadcrumb__link" href={item.href}>
                  {item.icon && <span className="tds-breadcrumb__item-icon" aria-hidden="true">{item.icon}</span>}
                  {item.label}
                </a>
              )}
              {!isLastPos && <Sep type={separator} />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
