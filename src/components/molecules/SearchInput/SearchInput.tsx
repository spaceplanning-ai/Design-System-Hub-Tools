import { forwardRef } from 'react';
import { cx } from '@/utils/cx';
import { useControllableState } from '@/hooks';
import { Input } from '../../atoms/Input';
import type { InputProps } from '../../atoms/Input';
import { Icon } from '../../atoms/Icon';
import { Spinner } from '../../atoms/Spinner';
import './SearchInput.css';

export interface SearchInputProps extends Omit<InputProps, 'iconStart' | 'iconEnd' | 'onChange' | 'value' | 'defaultValue'> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  onSearch?: (value: string) => void;
  loading?: boolean;
  clearable?: boolean;
  /** Show a trailing filter/scope button; called when it's pressed. */
  onFilter?: () => void;
  /** Highlight the filter button as active. */
  filterActive?: boolean;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(function SearchInput(
  { value, defaultValue = '', onValueChange, onSearch, loading = false, clearable = true, onFilter, filterActive = false, variant = 'outline', size = 'md', className, disabled, ...rest },
  ref,
) {
  const [val, setVal] = useControllableState({ value, defaultValue, onChange: onValueChange });
  const isize = size === 'lg' ? 16 : 14;

  const clear = loading ? (
    <Spinner size="sm" tone="neutral" />
  ) : clearable && val ? (
    <button
      type="button"
      className="tds-search-input__clear"
      aria-label="Clear search"
      onClick={() => {
        setVal('');
        onSearch?.('');
      }}
    >
      <Icon name="close" size={isize} />
    </button>
  ) : null;

  const filter = onFilter ? (
    <button
      type="button"
      className="tds-search-input__filter"
      aria-label="Filters"
      aria-pressed={filterActive}
      data-active={filterActive || undefined}
      onClick={onFilter}
    >
      <Icon name="sliders" size={isize} />
    </button>
  ) : null;

  return (
    <Input
      ref={ref}
      type="search"
      role="searchbox"
      variant={variant}
      size={size}
      disabled={disabled}
      className={cx('tds-search-input', className)}
      value={val}
      onChange={(e) => setVal(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onSearch?.(val);
        if (e.key === 'Escape' && val) {
          setVal('');
          onSearch?.('');
        }
      }}
      iconStart={<Icon name="search" size="sm" />}
      iconEnd={
        clear || filter ? (
          <span className="tds-search-input__actions">
            {clear}
            {filter}
          </span>
        ) : undefined
      }
      {...rest}
    />
  );
});
