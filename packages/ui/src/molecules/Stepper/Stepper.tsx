// Stepper — 진행 단계 표시기 (molecule · contracts/Stepper.contract.json@1.0.0)
//
// 비대화형이다 — 단계를 누를 수 없고 흐름을 바꾸지도 않는다. 흐름을 보여 주기만 한다.
//
// [흐름 밖 종료는 담지 않는다] steps 에 없는 current(반려·실주 같은 이탈 종료)가 오면
// currentIndex 가 -1 이 되어 아무 단계도 채우지 않는다. 그 사실은 호출부가 danger 배너/배지로
// 따로 알린다 — 두 출처 구현(ReturnStatusStepper·PipelineStepper)이 이미 그렇게 갈라 두었다.
//
// [번호는 장식이다] 점 안의 번호와 연결선은 aria-hidden 이고, 순서는 <ol> 이 전달한다.
// 번호를 읽히면 라벨마다 숫자가 덧붙어 목록이 두 배로 길어진다.
//
// [aria-current="step"] 현재 단계를 비시각 사용자에게 전하는 유일한 신호다. 색과 굵기는
// 시각 채널뿐이라 이것이 없으면 '어디까지 왔는가' 가 전달되지 않는다 (WCAG 1.4.1).
import type { StepperProps } from '../../../generated/types/Stepper.types';
import './Stepper.css';

export function Stepper({ steps, current, ariaLabel }: StepperProps) {
  const currentIndex = steps.findIndex((step) => step.id === current);

  return (
    <ol className="tds-stepper" aria-label={ariaLabel}>
      {steps.map((step, index) => {
        // currentIndex 가 -1(흐름 밖 종료)이면 done 이 전부 false 라 아무것도 채워지지 않는다
        const done = currentIndex >= 0 && index <= currentIndex;
        const isCurrent = index === currentIndex;
        return (
          <li
            key={step.id}
            className="tds-stepper__step"
            data-done={done}
            data-current={isCurrent}
            {...(isCurrent ? { 'aria-current': 'step' as const } : {})}
          >
            {index > 0 && <span className="tds-stepper__connector" aria-hidden="true" />}
            <span className="tds-stepper__dot" aria-hidden="true">
              {index + 1}
            </span>
            <span className="tds-stepper__label">{step.label}</span>
          </li>
        );
      })}
    </ol>
  );
}
