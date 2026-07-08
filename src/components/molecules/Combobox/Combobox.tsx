import { useMemo, useRef, useState, useId } from 'react';
import { cx } from '@/utils/cx';
import { useControllableState, useOnClickOutside } from '@/hooks';
import { Input } from '../../atoms/Input';
import type { InputVariant, InputSize } from '../../atoms/Input';
import { Icon } from '../../atoms/Icon';
import './Combobox.css';

export interface ComboboxOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export interface ComboboxProps {
  options: ComboboxOption[];
  /** Selected option value (controlled). */
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  variant?: InputVariant;
  size?: InputSize;
  placeholder?: string;
  emptyText?: string;
  clearable?: boolean;
  disabled?: boolean;
  /** Validation status → error styling on the field. */
  status?: 'default' | 'error' | 'success';
  className?: string;
  /** Field wiring — usually injected by FormField. */
  id?: string;
  'aria-describedby'?: string;
}

export function Combobox({
  options,
  value,
  defaultValue = '',
  onValueChange,
  variant = 'outline',
  size = 'md',
  placeholder = '검색 또는 선택',
  emptyText = '결과가 없습니다',
  clearable = true,
  disabled = false,
  status = 'default',
  className,
  id,
  'aria-describedby': ariaDescribedby,
}: ComboboxProps) {
  const listId = useId();
  const optId = (i: number) => `${listId}-opt-${i}`;

  const [selected, setSelected] = useControllableState({
    value,
    defaultValue,
    onChange: onValueChange,
  });
  const selectedLabel = useMemo(
    () => options.find((o) => o.value === selected)?.label ?? '',
    [options, selected],
  );

  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useOnClickOutside(
    containerRef,
    () => {
      setOpen(false);
      setQuery('');
    },
    open,
  );

  // When closed, the field shows the selected label; when open, the live query.
  const display = open ? query : selectedLabel;
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!open || q === '') return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query, open]);

  const openList = () => {
    if (disabled) return;
    setOpen(true);
    const idx = filtered.findIndex((o) => o.value === selected);
    setActive(idx >= 0 ? idx : 0);
  };

  const commit = (opt?: ComboboxOption) => {
    if (!opt || opt.disabled) return;
    setSelected(opt.value);
    setQuery('');
    setOpen(false);
  };

  const move = (dir: 1 | -1) => {
    if (!filtered.length) return;
    setActive((cur) => {
      let next = cur;
      for (let i = 0; i < filtered.length; i++) {
        next = (next + dir + filtered.length) % filtered.length;
        if (!filtered[next]?.disabled) break;
      }
      return next;
    });
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!open) openList();
        else move(1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (!open) openList();
        else move(-1);
        break;
      case 'Enter':
        if (open) {
          e.preventDefault();
          commit(filtered[active]);
        }
        break;
      case 'Escape':
        if (open) {
          e.preventDefault();
          setOpen(false);
          setQuery('');
        }
        break;
      case 'Home':
        if (open) {
          e.preventDefault();
          setActive(0);
        }
        break;
      case 'End':
        if (open) {
          e.preventDefault();
          setActive(filtered.length - 1);
        }
        break;
    }
  };

  return (
    <div ref={containerRef} className={cx('tds-combobox', className)}>
      <Input
        variant={variant}
        size={size}
        status={status}
        id={id}
        aria-describedby={ariaDescribedby}
        disabled={disabled}
        placeholder={placeholder}
        value={display}
        clearable={clearable && !!selected && !open}
        onClear={() => {
          setSelected('');
          setQuery('');
        }}
        role="combobox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-autocomplete="list"
        aria-activedescendant={open && filtered[active] ? optId(active) : undefined}
        onChange={(e) => {
          setQuery(e.target.value);
          if (!open) setOpen(true);
          setActive(0);
        }}
        onFocus={openList}
        onKeyDown={onKeyDown}
        iconEnd={
          <Icon
            className="tds-combobox__chevron"
            name="chevron-down"
            size="sm"
            data-open={open || undefined}
            aria-hidden
          />
        }
      />

      {open && (
        <ul id={listId} role="listbox" className="tds-combobox__list" data-size={size}>
          {filtered.length === 0 ? (
            <li className="tds-combobox__empty" role="presentation">
              {emptyText}
            </li>
          ) : (
            filtered.map((o, i) => (
              <li
                key={o.value}
                id={optId(i)}
                role="option"
                aria-selected={o.value === selected}
                aria-disabled={o.disabled || undefined}
                className="tds-combobox__option"
                data-active={i === active || undefined}
                data-disabled={o.disabled || undefined}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => {
                  e.preventDefault(); // keep focus in the input
                  commit(o);
                }}
              >
                <span className="tds-combobox__option-label">{o.label}</span>
                {o.value === selected && <Icon name="check" size="sm" aria-hidden />}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
