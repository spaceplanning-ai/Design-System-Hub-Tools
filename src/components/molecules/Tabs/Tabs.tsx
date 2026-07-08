import { createContext, useContext, useId, useRef } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '@/utils/cx';
import { useControllableState } from '@/hooks';
import { toDataAttrs } from '@core/defineComponent';
import { tabsMeta } from './Tabs.meta';
import './Tabs.css';

/** Orientation preset — A: top · B: left (vertical) · C: bottom. */
export type TabsType = 'A' | 'B' | 'C';
export type TabsVariant = 'line' | 'solid' | 'pill';
export type TabsSize = 'sm' | 'md' | 'lg';
export type TabsAlign = 'start' | 'center' | 'stretch';

interface TabsContextValue {
  value: string;
  setValue: (v: string) => void;
  baseId: string;
  variant: TabsVariant;
  size: TabsSize;
}
const TabsContext = createContext<TabsContextValue | null>(null);
const useTabs = () => {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error('Tabs subcomponents must be used within <Tabs>');
  return ctx;
};

export interface TabsProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Orientation preset. A: top · B: left (vertical) · C: bottom. */
  type?: TabsType;
  variant?: TabsVariant;
  size?: TabsSize;
  align?: TabsAlign;
  children: ReactNode;
}

export function Tabs({
  value,
  defaultValue = '',
  onValueChange,
  type = 'A',
  variant = 'line',
  size = 'md',
  align = 'start',
  className,
  children,
  ...rest
}: TabsProps) {
  const [current, setCurrent] = useControllableState({
    value,
    defaultValue,
    onChange: onValueChange,
  });
  const baseId = useId();

  return (
    <TabsContext.Provider value={{ value: current, setValue: setCurrent, baseId, variant, size }}>
      <div
        className={cx('tds-tabs', className)}
        {...toDataAttrs(tabsMeta, { type, variant, size, align })}
        {...rest}
      >
        {children}
      </div>
    </TabsContext.Provider>
  );
}

export interface TabsListProps extends HTMLAttributes<HTMLDivElement> {
  'aria-label'?: string;
}

function TabsList({ className, children, ...rest }: TabsListProps) {
  const listRef = useRef<HTMLDivElement>(null);

  const onKeyDown = (e: React.KeyboardEvent) => {
    const tabs = Array.from(
      listRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]:not(:disabled)') ?? [],
    );
    const idx = tabs.indexOf(document.activeElement as HTMLButtonElement);
    if (idx < 0) return;
    let next = idx;
    if (e.key === 'ArrowRight') next = (idx + 1) % tabs.length;
    else if (e.key === 'ArrowLeft') next = (idx - 1 + tabs.length) % tabs.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = tabs.length - 1;
    else return;
    e.preventDefault();
    tabs[next]?.focus();
    tabs[next]?.click();
  };

  return (
    <div
      ref={listRef}
      role="tablist"
      className={cx('tds-tabs__list', className)}
      onKeyDown={onKeyDown}
      {...rest}
    >
      {children}
    </div>
  );
}

export interface TabProps extends Omit<HTMLAttributes<HTMLButtonElement>, 'value'> {
  value: string;
  disabled?: boolean;
  /** Leading icon slot. */
  icon?: ReactNode;
  /** Trailing count/badge slot. */
  badge?: ReactNode;
  children: ReactNode;
}

function Tab({ value, disabled = false, icon, badge, className, children, ...rest }: TabProps) {
  const { value: current, setValue, baseId } = useTabs();
  const selected = current === value;
  return (
    <button
      type="button"
      role="tab"
      id={`${baseId}-tab-${value}`}
      aria-selected={selected}
      aria-controls={`${baseId}-panel-${value}`}
      tabIndex={selected ? 0 : -1}
      disabled={disabled}
      className={cx('tds-tabs__tab', className)}
      data-selected={selected || undefined}
      onClick={() => setValue(value)}
      {...rest}
    >
      {icon && (
        <span className="tds-tabs__tab-icon" aria-hidden="true">
          {icon}
        </span>
      )}
      <span className="tds-tabs__tab-label">{children}</span>
      {badge != null && <span className="tds-tabs__tab-badge">{badge}</span>}
    </button>
  );
}

export interface TabPanelProps extends HTMLAttributes<HTMLDivElement> {
  value: string;
}

function TabPanel({ value, className, children, ...rest }: TabPanelProps) {
  const { value: current, baseId } = useTabs();
  if (current !== value) return null;
  return (
    <div
      role="tabpanel"
      id={`${baseId}-panel-${value}`}
      aria-labelledby={`${baseId}-tab-${value}`}
      tabIndex={0}
      className={cx('tds-tabs__panel', className)}
      {...rest}
    >
      {children}
    </div>
  );
}

Tabs.List = TabsList;
Tabs.Tab = Tab;
Tabs.Panel = TabPanel;
