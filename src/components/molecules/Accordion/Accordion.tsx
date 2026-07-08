import { createContext, useContext, useId } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '@/utils/cx';
import { useControllableState } from '@/hooks';
import { toDataAttrs } from '@core/defineComponent';
import { Icon } from '../../atoms/Icon';
import { accordionMeta } from './Accordion.meta';
import './Accordion.css';

/** Layout preset — A: divided rows · B: separated cards. */
export type AccordionType = 'A' | 'B';
export type AccordionVariant = 'separated' | 'contained' | 'ghost';
export type AccordionSize = 'sm' | 'md' | 'lg';
export type AccordionMode = 'single' | 'multiple';

interface AccordionContextValue {
  open: string[];
  toggle: (value: string) => void;
  baseId: string;
}
const AccordionContext = createContext<AccordionContextValue | null>(null);
const ItemContext = createContext<{ value: string; disabled: boolean } | null>(null);

const useAccordion = () => {
  const ctx = useContext(AccordionContext);
  if (!ctx) throw new Error('Accordion subcomponents must be used within <Accordion>');
  return ctx;
};
const useItem = () => {
  const ctx = useContext(ItemContext);
  if (!ctx) throw new Error('Accordion.Trigger/Content must be used within <Accordion.Item>');
  return ctx;
};

export interface AccordionProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'onChange' | 'defaultValue'
> {
  mode?: AccordionMode;
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
  /** Layout preset. A: divided rows · B: separated cards. */
  type?: AccordionType;
  variant?: AccordionVariant;
  size?: AccordionSize;
  children: ReactNode;
}

export function Accordion({
  mode = 'single',
  value,
  defaultValue = [],
  onValueChange,
  type = 'A',
  variant = 'separated',
  size = 'md',
  className,
  children,
  ...rest
}: AccordionProps) {
  const [open, setOpen] = useControllableState({ value, defaultValue, onChange: onValueChange });
  const baseId = useId();

  const toggle = (v: string) => {
    if (open.includes(v)) setOpen(open.filter((x) => x !== v));
    else setOpen(mode === 'single' ? [v] : [...open, v]);
  };

  return (
    <AccordionContext.Provider value={{ open, toggle, baseId }}>
      <div
        className={cx('tds-accordion', className)}
        {...toDataAttrs(accordionMeta, { type, variant, size, mode })}
        {...rest}
      >
        {children}
      </div>
    </AccordionContext.Provider>
  );
}

export interface AccordionItemProps extends HTMLAttributes<HTMLDivElement> {
  value: string;
  disabled?: boolean;
}

function Item({ value, disabled = false, className, children, ...rest }: AccordionItemProps) {
  const { open } = useAccordion();
  return (
    <ItemContext.Provider value={{ value, disabled }}>
      <div
        className={cx('tds-accordion__item', className)}
        data-open={open.includes(value) || undefined}
        data-disabled={disabled || undefined}
        {...rest}
      >
        {children}
      </div>
    </ItemContext.Provider>
  );
}

export interface AccordionTriggerProps extends HTMLAttributes<HTMLButtonElement> {
  /** Leading icon slot before the label. */
  icon?: ReactNode;
}

function Trigger({ className, children, icon, ...rest }: AccordionTriggerProps) {
  const { open, toggle, baseId } = useAccordion();
  const { value, disabled } = useItem();
  const isOpen = open.includes(value);
  return (
    <h3 className="tds-accordion__heading">
      <button
        type="button"
        id={`${baseId}-trigger-${value}`}
        className={cx('tds-accordion__trigger', className)}
        aria-expanded={isOpen}
        aria-controls={`${baseId}-content-${value}`}
        disabled={disabled}
        onClick={() => toggle(value)}
        {...rest}
      >
        {icon && (
          <span className="tds-accordion__trigger-icon" aria-hidden="true">
            {icon}
          </span>
        )}
        <span className="tds-accordion__trigger-label">{children}</span>
        <Icon className="tds-accordion__chevron" name="chevron-down" size="sm" aria-hidden />
      </button>
    </h3>
  );
}

function Content({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  const { open, baseId } = useAccordion();
  const { value } = useItem();
  const isOpen = open.includes(value);
  return (
    <div
      id={`${baseId}-content-${value}`}
      role="region"
      aria-labelledby={`${baseId}-trigger-${value}`}
      className={cx('tds-accordion__content', className)}
      data-open={isOpen || undefined}
      {...rest}
    >
      <div className="tds-accordion__content-inner">{children}</div>
    </div>
  );
}

Accordion.Item = Item;
Accordion.Trigger = Trigger;
Accordion.Content = Content;
