import { forwardRef } from 'react';
import type { CSSProperties, InputHTMLAttributes } from 'react';
import { cx } from '@/utils/cx';
import { useControllableState } from '@/hooks';
import { toDataAttrs } from '@core/defineComponent';
import { sliderMeta } from './Slider.meta';
import './Slider.css';

export type SliderSize = 'sm' | 'md' | 'lg';
export type SliderTone = 'brand' | 'neutral' | 'success' | 'warning' | 'danger';

export interface SliderProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'size' | 'value' | 'defaultValue' | 'onChange' | 'type'
> {
  size?: SliderSize;
  tone?: SliderTone;
  min?: number;
  max?: number;
  step?: number;
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  /** Show the live value readout to the right of the track. */
  showValue?: boolean;
}

export const Slider = forwardRef<HTMLInputElement, SliderProps>(function Slider(
  {
    size = 'md',
    tone = 'brand',
    min = 0,
    max = 100,
    step = 1,
    value,
    defaultValue = min,
    onValueChange,
    showValue = false,
    disabled,
    className,
    ...rest
  },
  ref,
) {
  const [val, setVal] = useControllableState<number>({
    value,
    defaultValue,
    onChange: onValueChange,
  });
  const pct = max > min ? ((val - min) / (max - min)) * 100 : 0;
  const dataAttrs = toDataAttrs(sliderMeta, { size, tone });

  return (
    <span
      className={cx('tds-slider', className)}
      data-state={disabled ? 'disabled' : 'default'}
      style={{ '--tds-slider-pct': `${pct}%` } as CSSProperties}
      {...dataAttrs}
    >
      <input
        ref={ref}
        type="range"
        className="tds-slider__input"
        min={min}
        max={max}
        step={step}
        value={val}
        disabled={disabled}
        onChange={(e) => setVal(Number(e.target.value))}
        {...rest}
      />
      {showValue && <output className="tds-slider__value">{val}</output>}
    </span>
  );
});
