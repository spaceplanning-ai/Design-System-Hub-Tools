// 교환/반품 처리 상태 스텝퍼 (A41 소유 — apps/admin/src/pages/products/**)
//
// 정상 흐름(접수→수거중→검수중→완료)을 단계로 보여주고 현재 단계까지 채운다. 반려는 흐름 밖 종료라
// 스텝퍼 대신 호출부가 danger 배너로 알린다. 리뷰 상세 1곳만 쓰므로 페이지 전용으로 둔다(소비자 1개).
import type { CSSProperties } from 'react';

import { RETURN_FLOW, statusLabel } from '../types';
import type { ReturnStatus } from '../types';

const listStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--tds-space-1)',
  flexWrap: 'wrap',
  listStyleType: 'none',
  marginTop: 0,
  marginBottom: 0,
  marginLeft: 0,
  marginRight: 0,
  paddingTop: 0,
  paddingBottom: 0,
  paddingLeft: 0,
  paddingRight: 0,
};

const stepStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 'var(--tds-space-1)',
};

function dotStyle(done: boolean, current: boolean): CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 'var(--tds-space-5)',
    height: 'var(--tds-space-5)',
    borderRadius: 'var(--tds-radius-full)',
    borderStyle: 'solid',
    borderWidth: current ? 'var(--tds-border-width-medium)' : 'var(--tds-border-width-thin)',
    borderColor: done
      ? 'var(--tds-color-action-primary-default)'
      : 'var(--tds-color-border-default)',
    background: done
      ? 'var(--tds-color-action-primary-default)'
      : 'var(--tds-color-surface-default)',
    color: done ? 'var(--tds-color-surface-default)' : 'var(--tds-color-text-muted)',
    fontSize: 'var(--tds-typography-caption-md-font-size)',
    fontVariantNumeric: 'tabular-nums',
  };
}

function labelStyle(active: boolean): CSSProperties {
  return {
    color: active ? 'var(--tds-color-text-default)' : 'var(--tds-color-text-muted)',
    fontSize: 'var(--tds-typography-label-sm-font-size)',
    fontWeight: active
      ? 'var(--tds-primitive-typography-font-weight-bold)'
      : 'var(--tds-primitive-typography-font-weight-regular)',
  };
}

const connectorStyle: CSSProperties = {
  width: 'var(--tds-space-5)',
  height: 'var(--tds-border-width-thin)',
  background: 'var(--tds-color-border-default)',
};

interface ReturnStatusStepperProps {
  readonly status: ReturnStatus;
}

export function ReturnStatusStepper({ status }: ReturnStatusStepperProps) {
  const currentIndex = RETURN_FLOW.indexOf(status);

  return (
    <ol style={listStyle} aria-label="처리 진행 단계">
      {RETURN_FLOW.map((step, index) => {
        const done = currentIndex >= 0 && index <= currentIndex;
        const current = index === currentIndex;
        return (
          <li key={step} style={stepStyle}>
            {index > 0 && <span style={connectorStyle} aria-hidden="true" />}
            <span style={dotStyle(done, current)} aria-hidden="true">
              {index + 1}
            </span>
            <span style={labelStyle(done)}>{statusLabel(step)}</span>
          </li>
        );
      })}
    </ol>
  );
}
