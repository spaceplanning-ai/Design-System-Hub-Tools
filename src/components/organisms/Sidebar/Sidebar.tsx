import { createContext, useContext } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '@/utils/cx';
import { toDataAttrs } from '@core/defineComponent';
import { Icon } from '../../atoms/Icon';
import { IconButton } from '../../atoms/IconButton';
import { sidebarMeta } from './Sidebar.meta';
import './Sidebar.css';

/** Density / grouping preset — A: standard · B: compact · C: boxed (sections in cards). */
export type SidebarType = 'A' | 'B' | 'C';
export type SidebarVariant = 'surface' | 'floating';
export type SidebarWidth = 'narrow' | 'default' | 'wide';

const CollapsedContext = createContext(false);

export interface SidebarProps extends HTMLAttributes<HTMLElement> {
  /** Density / grouping preset. A: standard · B: compact · C: boxed. */
  type?: SidebarType;
  variant?: SidebarVariant;
  width?: SidebarWidth;
  collapsed?: boolean;
  header?: ReactNode;
  footer?: ReactNode;
  /** When set, renders a collapse/expand toggle button in the header. */
  onCollapsedToggle?: () => void;
}

export function Sidebar({
  type = 'A',
  variant = 'surface',
  width = 'default',
  collapsed = false,
  header,
  footer,
  onCollapsedToggle,
  className,
  children,
  ...rest
}: SidebarProps) {
  return (
    <CollapsedContext.Provider value={collapsed}>
      <nav
        className={cx('tds-sidebar', className)}
        aria-label="Sidebar"
        data-collapsed={collapsed || undefined}
        {...toDataAttrs(sidebarMeta, { type, variant, width, collapsed: String(collapsed) })}
        {...rest}
      >
        {(header || onCollapsedToggle) && (
          <div className="tds-sidebar__header">
            {!collapsed && header}
            {onCollapsedToggle && (
              <IconButton
                className="tds-sidebar__collapse"
                label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                icon={<Icon name={collapsed ? 'chevron-right' : 'chevron-left'} size="sm" />}
                variant="ghost"
                size="sm"
                aria-expanded={!collapsed}
                onClick={onCollapsedToggle}
              />
            )}
          </div>
        )}
        <div className="tds-sidebar__body">{children}</div>
        {footer && <div className="tds-sidebar__footer">{footer}</div>}
      </nav>
    </CollapsedContext.Provider>
  );
}

export interface SidebarSectionProps extends HTMLAttributes<HTMLDivElement> {
  label?: ReactNode;
}

function Section({ label, className, children, ...rest }: SidebarSectionProps) {
  const collapsed = useContext(CollapsedContext);
  return (
    <div className={cx('tds-sidebar__section', className)} {...rest}>
      {label && !collapsed && <div className="tds-sidebar__section-label">{label}</div>}
      <div className="tds-sidebar__section-items">{children}</div>
    </div>
  );
}

export interface SidebarItemProps extends Omit<HTMLAttributes<HTMLAnchorElement>, 'href'> {
  icon?: ReactNode;
  label: ReactNode;
  href?: string;
  active?: boolean;
  badge?: ReactNode;
}

function Item({ icon, label, href, active = false, badge, className, ...rest }: SidebarItemProps) {
  const collapsed = useContext(CollapsedContext);
  return (
    <a
      href={href ?? '#'}
      className={cx('tds-sidebar__item', className)}
      aria-current={active ? 'page' : undefined}
      data-active={active || undefined}
      title={collapsed && typeof label === 'string' ? label : undefined}
      {...rest}
    >
      {icon && (
        <span className="tds-sidebar__item-icon">
          {icon}
          {collapsed && badge != null && (
            <span className="tds-sidebar__item-dot" aria-hidden="true" />
          )}
        </span>
      )}
      {!collapsed && <span className="tds-sidebar__item-label">{label}</span>}
      {!collapsed && badge != null && <span className="tds-sidebar__item-badge">{badge}</span>}
    </a>
  );
}

Sidebar.Section = Section;
Sidebar.Item = Item;
