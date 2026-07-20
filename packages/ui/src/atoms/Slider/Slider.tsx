// Slider — 값 표시가 옆에 붙은 범위 입력 (atom · contracts/Slider.contract.json@1.0.0)
//
// Props 타입은 계약에서 생성된 generated/types/Slider.types 를 그대로 import 한다 (수동 선언 금지 — G6).
//
// [네이티브 <input type="range"> 를 쓰는 이유] 손으로 만든 트랙+썸은 키보드(←/→/Home/End)·터치·
// 스크린리더 지원을 전부 다시 구현해야 한다. 네이티브는 그것을 공짜로 준다 — role=slider 와
// aria-valuemin/max/now 도 브라우저가 소유한다. 우리는 accent-color 로 트랙 색만 토큰에 맞춘다.
//
// [값 표시는 장식이다] 옆 span 은 aria-hidden — 같은 값을 네이티브가 이미 aria-valuenow 로 알린다.
// 시각 값은 전부 semantic 토큰 CSS 변수 — 하드코딩 hex/px 0건 (상태는 :disabled 선택자가 소유).
import type { SliderProps } from '../../../generated/types/Slider.types';
import './Slider.css';

export function Slider({
  value,
  min,
  max,
  step = 1,
  label,
  unit = '',
  id = '',
  disabled = false,
  onChange,
}: SliderProps) {
  return (
    <div className={disabled ? 'tds-slider tds-slider--disabled' : 'tds-slider'}>
      <input
        type="range"
        className="tds-slider__input"
        // 빈 문자열 id 를 그대로 흘리면 `id=""` 라는 무의미한 속성이 DOM 에 남는다 — 아예 렌더하지 않는다
        {...(id === '' ? {} : { id })}
        aria-label={label}
        value={value}
        min={min}
        max={max}
        step={step}
        // 계약 events.onChange.blockedWhen — disabled 에서는 네이티브가 change 자체를 막는다
        disabled={disabled}
        onChange={(event) => {
          const next = Number.parseInt(event.target.value, 10);
          if (Number.isNaN(next)) return;
          onChange?.(next);
        }}
      />
      <span className="tds-slider__value" aria-hidden="true">
        {value}
        {unit}
      </span>
    </div>
  );
}
