import { useMemo, useRef, useState, useId } from 'react';
import { cx } from '@/utils/cx';
import { useControllableState, useOnClickOutside } from '@/hooks';
import { Input } from '../../atoms/Input';
import type { InputVariant, InputSize } from '../../atoms/Input';
import './Autocomplete.css';

export interface AutocompleteOption {
  label: string;
  value: string;
}

export interface AutocompleteProps {
  /** Suggestions to offer. Strings are treated as both label and value. */
  suggestions: (AutocompleteOption | string)[];
  /** Input text (controlled). */
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Fired when a suggestion is chosen (vs. free typing). */
  onSelect?: (option: AutocompleteOption) => void;
  /**
   * Custom filter. Return the suggestions to show for the current query.
   * Defaults to a case-insensitive substring match. Pass `(s) => s` for async
   * results already filtered by the server.
   */
  filter?: (suggestions: AutocompleteOption[], query: string) => AutocompleteOption[];
  variant?: InputVariant;
  size?: InputSize;
  placeholder?: string;
  emptyText?: string;
  /** Characters typed before the list opens. */
  minChars?: number;
  loading?: boolean;
  disabled?: boolean;
  status?: 'default' | 'error' | 'success';
  className?: string;
  /** Field wiring — usually injected by FormField. */
  id?: string;
  'aria-describedby'?: string;
}

const norm = (s: AutocompleteOption | string): AutocompleteOption =>
  typeof s === 'string' ? { label: s, value: s } : s;

const defaultFilter = (opts: AutocompleteOption[], q: string) =>
  opts.filter((o) => o.label.toLowerCase().includes(q.toLowerCase()));

export function Autocomplete({
  suggestions,
  value,
  defaultValue = '',
  onValueChange,
  onSelect,
  filter = defaultFilter,
  variant = 'outline',
  size = 'md',
  placeholder = '입력해 검색',
  emptyText = '제안이 없습니다',
  minChars = 1,
  loading = false,
  disabled = false,
  status = 'default',
  className,
  id,
  'aria-describedby': ariaDescribedby,
}: AutocompleteProps) {
  const listId = useId();
  const optId = (i: number) => `${listId}-opt-${i}`;

  const [text, setText] = useControllableState({ value, defaultValue, onChange: onValueChange });
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useOnClickOutside(containerRef, () => setOpen(false), open);

  const options = useMemo(() => suggestions.map(norm), [suggestions]);
  const filtered = useMemo(
    () => (text.trim().length >= minChars ? filter(options, text.trim()) : []),
    [options, text, minChars, filter],
  );
  const canOpen = open && (loading || filtered.length > 0 || text.trim().length >= minChars);

  const choose = (opt?: AutocompleteOption) => {
    if (!opt) return;
    setText(opt.value);
    onSelect?.(opt);
    setOpen(false);
  };

  const move = (dir: 1 | -1) => {
    if (!filtered.length) return;
    setActive((cur) => (cur + dir + filtered.length) % filtered.length);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!open) setOpen(true);
        else move(1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        move(-1);
        break;
      case 'Enter':
        if (open && filtered[active]) {
          e.preventDefault();
          choose(filtered[active]);
        }
        break;
      case 'Escape':
        if (open) {
          e.preventDefault();
          setOpen(false);
        }
        break;
    }
  };

  return (
    <div ref={containerRef} className={cx('tds-autocomplete', className)}>
      <Input
        variant={variant}
        size={size}
        status={status}
        id={id}
        aria-describedby={ariaDescribedby}
        disabled={disabled}
        loading={loading}
        clearable={!loading}
        placeholder={placeholder}
        value={text}
        onClear={() => setText('')}
        role="combobox"
        aria-expanded={canOpen}
        aria-controls={canOpen ? listId : undefined}
        aria-autocomplete="list"
        aria-activedescendant={canOpen && filtered[active] ? optId(active) : undefined}
        onChange={(e) => {
          setText(e.target.value);
          setOpen(true);
          setActive(0);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
      />

      {canOpen && (
        <ul id={listId} role="listbox" className="tds-autocomplete__list" data-size={size}>
          {loading ? (
            <li className="tds-autocomplete__hint" role="presentation">
              불러오는 중…
            </li>
          ) : filtered.length === 0 ? (
            <li className="tds-autocomplete__hint" role="presentation">
              {emptyText}
            </li>
          ) : (
            filtered.map((o, i) => (
              <li
                key={`${o.value}-${i}`}
                id={optId(i)}
                role="option"
                aria-selected={i === active}
                className="tds-autocomplete__option"
                data-active={i === active || undefined}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  choose(o);
                }}
              >
                {o.label}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
