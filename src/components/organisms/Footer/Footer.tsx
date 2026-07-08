import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '@/utils/cx';
import { toDataAttrs } from '@core/defineComponent';
import { Icon } from '../../atoms/Icon';
import { footerMeta } from './Footer.meta';
import './Footer.css';

/** Layout preset — A: multi-column · B: simple centered · C: minimal single row. */
export type FooterType = 'A' | 'B' | 'C';
export type FooterVariant = 'surface' | 'transparent';

export interface FooterLink {
  label: ReactNode;
  href?: string;
  /** Outbound link — appends an external-link icon + safe rel/target. */
  external?: boolean;
}
export interface FooterColumn {
  title: ReactNode;
  links: FooterLink[];
}

export interface FooterProps extends HTMLAttributes<HTMLElement> {
  type?: FooterType;
  variant?: FooterVariant;
  brand?: ReactNode;
  description?: ReactNode;
  /** Link groups (Type A). */
  columns?: FooterColumn[];
  /** Newsletter / subscribe slot (Type A). */
  newsletter?: ReactNode;
  /** Social icon row. */
  social?: ReactNode;
  copyright?: ReactNode;
  /** Legal / policy links. */
  legal?: ReactNode;
}

export function Footer({
  type = 'A',
  variant = 'surface',
  brand,
  description,
  columns = [],
  newsletter,
  social,
  copyright,
  legal,
  className,
  children,
  ...rest
}: FooterProps) {
  const brandBlock = (brand || description || (type === 'B' && social)) && (
    <div className="tds-footer__brandblock">
      {brand && <div className="tds-footer__brand">{brand}</div>}
      {description && <p className="tds-footer__desc">{description}</p>}
      {type === 'B' && social && <div className="tds-footer__social">{social}</div>}
    </div>
  );

  return (
    <footer
      className={cx('tds-footer', className)}
      role="contentinfo"
      {...toDataAttrs(footerMeta, { type, variant })}
      {...rest}
    >
      <div className="tds-footer__inner">
        {type !== 'C' && (
          <div className="tds-footer__top">
            {brandBlock}
            {type === 'A' && columns.length > 0 && (
              <div className="tds-footer__columns">
                {columns.map((col, i) => (
                  <nav key={i} className="tds-footer__col" aria-label={typeof col.title === 'string' ? col.title : undefined}>
                    <h4 className="tds-footer__col-title">{col.title}</h4>
                    <ul className="tds-footer__col-links" role="list">
                      {col.links.map((link, j) => (
                        <li key={j}>
                          <a
                            className="tds-footer__link"
                            href={link.href ?? '#'}
                            target={link.external ? '_blank' : undefined}
                            rel={link.external ? 'noopener noreferrer' : undefined}
                          >
                            {link.label}
                            {link.external && <Icon className="tds-footer__link-ext" name="external-link" size={12} aria-hidden />}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </nav>
                ))}
              </div>
            )}
            {type === 'A' && newsletter && <div className="tds-footer__newsletter">{newsletter}</div>}
          </div>
        )}

        {children}

        <div className="tds-footer__bottom">
          {copyright && <div className="tds-footer__copy">{copyright}</div>}
          {legal && (
            <nav className="tds-footer__legal" aria-label="Legal">
              {legal}
            </nav>
          )}
          {type !== 'B' && social && <div className="tds-footer__social">{social}</div>}
        </div>
      </div>
    </footer>
  );
}
