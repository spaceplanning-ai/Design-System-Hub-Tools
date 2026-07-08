import { useMemo, useRef, useState, useId } from 'react';
import { cx } from '@/utils/cx';
import { useControllableState, useOnClickOutside, useKeyDown } from '@/hooks';
import { Input } from '../../atoms/Input';
import type { InputVariant, InputSize } from '../../atoms/Input';
import { IconButton } from '../../atoms/IconButton';
import { Icon } from '../../atoms/Icon';
import {
  WEEKDAYS_KO,
  buildMonth,
  compareDay,
  isDisabled,
  isSameDay,
  parseISO,
  toISO,
} from './date-utils';
import './DatePicker.css';

export interface DatePickerProps {
  /** Selected date as ISO `YYYY-MM-DD` (controlled). */
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  variant?: InputVariant;
  size?: InputSize;
  placeholder?: string;
  /** Earliest / latest selectable ISO date. */
  min?: string;
  max?: string;
  disabled?: boolean;
  status?: 'default' | 'error' | 'success';
  className?: string;
  /** Field wiring — usually injected by FormField. */
  id?: string;
  'aria-describedby'?: string;
}

export function DatePicker({
  value,
  defaultValue = '',
  onValueChange,
  variant = 'outline',
  size = 'md',
  placeholder = 'YYYY-MM-DD',
  min,
  max,
  disabled = false,
  status = 'default',
  className,
  id,
  'aria-describedby': ariaDescribedby,
}: DatePickerProps) {
  const dialogId = useId();
  const [iso, setIso] = useControllableState({ value, defaultValue, onChange: onValueChange });
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = useMemo(() => parseISO(iso), [iso]);
  const minDate = useMemo(() => parseISO(min), [min]);
  const maxDate = useMemo(() => parseISO(max), [max]);

  // Which month the calendar shows. Initialised near the selection, else this month.
  const initial = selected ?? new Date();
  const [view, setView] = useState({ year: initial.getFullYear(), month: initial.getMonth() });
  const today = useMemo(() => new Date(), []);

  useOnClickOutside(containerRef, () => setOpen(false), open);
  useKeyDown('Escape', () => setOpen(false), open);

  const openCalendar = () => {
    if (disabled) return;
    const base = parseISO(iso) ?? new Date();
    setView({ year: base.getFullYear(), month: base.getMonth() });
    setOpen(true);
  };

  const weeks = useMemo(() => buildMonth(view.year, view.month), [view]);

  const shiftMonth = (delta: number) => {
    setView(({ year, month }) => {
      const d = new Date(year, month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  };

  const pick = (date: Date) => {
    if (isDisabled(date, minDate, maxDate)) return;
    setIso(toISO(date));
    setOpen(false);
  };

  const monthLabel = `${view.year}년 ${view.month + 1}월`;

  return (
    <div ref={containerRef} className={cx('tds-datepicker', className)}>
      <Input
        variant={variant}
        size={size}
        status={status}
        id={id}
        aria-describedby={ariaDescribedby}
        disabled={disabled}
        placeholder={placeholder}
        value={iso}
        role="combobox"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? dialogId : undefined}
        onChange={(e) => setIso(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            openCalendar();
          }
        }}
        iconEnd={
          <button
            type="button"
            className="tds-datepicker__trigger"
            aria-label="달력 열기"
            tabIndex={-1}
            disabled={disabled}
            onClick={() => (open ? setOpen(false) : openCalendar())}
          >
            <Icon name="calendar" size="sm" aria-hidden />
          </button>
        }
      />

      {open && (
        <div
          id={dialogId}
          role="dialog"
          aria-label="날짜 선택"
          aria-modal="false"
          className="tds-datepicker__calendar"
        >
          <div className="tds-datepicker__header">
            <IconButton
              size="sm"
              variant="ghost"
              label="이전 달"
              icon={<Icon name="chevron-left" size="sm" />}
              onClick={() => shiftMonth(-1)}
            />
            <span className="tds-datepicker__month" aria-live="polite">
              {monthLabel}
            </span>
            <IconButton
              size="sm"
              variant="ghost"
              label="다음 달"
              icon={<Icon name="chevron-right" size="sm" />}
              onClick={() => shiftMonth(1)}
            />
          </div>

          <div role="grid" className="tds-datepicker__grid">
            <div role="row" className="tds-datepicker__weekdays">
              {WEEKDAYS_KO.map((w, i) => (
                <span
                  key={w}
                  role="columnheader"
                  className="tds-datepicker__weekday"
                  data-weekend={i === 0 || i === 6 || undefined}
                >
                  {w}
                </span>
              ))}
            </div>
            {weeks.map((row, r) => (
              <div role="row" className="tds-datepicker__week" key={r}>
                {row.map(({ date, inMonth }) => {
                  const off = isDisabled(date, minDate, maxDate);
                  const isSel = selected != null && isSameDay(date, selected);
                  const isToday = compareDay(date, today) === 0;
                  return (
                    <button
                      key={toISO(date)}
                      type="button"
                      role="gridcell"
                      aria-selected={isSel}
                      aria-disabled={off || undefined}
                      aria-current={isToday ? 'date' : undefined}
                      className="tds-datepicker__day"
                      data-outside={!inMonth || undefined}
                      data-today={isToday || undefined}
                      data-selected={isSel || undefined}
                      disabled={off}
                      onClick={() => pick(date)}
                    >
                      {date.getDate()}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
