// RadioCardGroup — 설명이 붙은 카드형 라디오 그룹 (molecule · contracts/RadioCardGroup.contract.json@1.0.0)
//
// Props 타입은 계약에서 생성된 generated/types/RadioCardGroup.types 를 그대로 import 한다 (수동 선언 금지 — G6).
//
// [왜 SelectField 가 아닌가] 선택지가 적고 **각각의 결과가 서로 크게 다를 때**(누구나 들어온다 /
// 관리자만 들어온다) 선택지를 접어 두면 안 된다. 결과 설명을 고르기 전에 읽을 수 있어야 한다.
//
// [a11y] role="radiogroup" + aria-labelledby 로 그룹 이름을 준다. 안의 컨트롤은 **네이티브
// <input type="radio">** 다 — 같은 name 을 공유해 화살표 이동·단일 선택·aria-checked 를 브라우저가
// 공짜로 준다. 설명 문단은 aria-describedby 로 각 라디오에 잇는다: <label> 이 설명까지 감싸면
// 접근 가능한 이름이 '전체 공개 누구나 내 사이트에 접속할 수 있어요' 한 덩어리로 읽힌다.
//
// 시각 값은 전부 semantic 토큰 CSS 변수 — 하드코딩 hex/px 0건 (상태는 data-* / :disabled 선택자가 소유).
import type { RadioCardGroupProps } from '../../../generated/types/RadioCardGroup.types';
import './RadioCardGroup.css';

export function RadioCardGroup({
  name,
  legend,
  value,
  options,
  disabled = false,
  onChange,
}: RadioCardGroupProps) {
  const legendId = `${name}-legend`;

  return (
    <div className="tds-radiocard" role="radiogroup" aria-labelledby={legendId}>
      <span id={legendId} className="tds-radiocard__legend">
        {legend}
      </span>

      {options.map((option) => {
        const selected = option.value === value;
        const optionId = `${name}-${option.value}`;
        const descriptionId = `${optionId}-description`;

        return (
          // 카드는 <div> 이고 <label> 은 제목만 감싼다 — 이름과 설명을 분리하기 위해서다(위 머리말)
          <div
            key={option.value}
            className="tds-radiocard__option"
            data-selected={selected}
            data-disabled={disabled}
          >
            <input
              id={optionId}
              type="radio"
              name={name}
              className="tds-radiocard__radio"
              value={option.value}
              checked={selected}
              // 계약 events.onChange.blockedWhen — disabled 에서는 네이티브가 change 자체를 막는다
              disabled={disabled}
              aria-describedby={descriptionId}
              onChange={() => onChange?.(option.value)}
            />
            <span className="tds-radiocard__text">
              <label htmlFor={optionId} className="tds-radiocard__label">
                {option.label}
              </label>
              <span id={descriptionId} className="tds-radiocard__description">
                {option.description}
              </span>
            </span>
          </div>
        );
      })}
    </div>
  );
}
