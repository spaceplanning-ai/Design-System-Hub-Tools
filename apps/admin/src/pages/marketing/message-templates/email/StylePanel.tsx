// 오른쪽 STYLE 탭 — 캔버스 전역 스타일 (EmailCanvasStyle)
//
// [첫 라벨이 프리셋에 따라 바뀐다] 빈 템플릿에서는 '바깥 배경색', 그 밖에는 '배경색' 이다. 목업이 그렇게 확정했다 — Blank 는 아직 '배경' 이라 부를 내용이 없어
// 캔버스 뒤판(backdrop)만 존재하기 때문이다. 값이 가리키는 곳은 둘 다 canvas.backdropColor 로 같다.
import { useId } from 'react';

import { ColorField, SelectField, Slider } from '@tds/ui';
import { CANVAS_RADIUS_MAX, FONT_FAMILIES } from './blocks';
import { FieldBox } from './controls/FieldBox';
import { PX_UNIT } from './controls/PaddingField';
import { panelFieldListStyle } from './styles';
import type { EmailCanvasStyle } from '../types';

interface StylePanelProps {
  readonly value: EmailCanvasStyle;
  /** Blank 프리셋인가 — 첫 라벨의 문구를 가른다(위 주석) */
  readonly blankPreset: boolean;
  readonly disabled?: boolean;
  readonly onChange: (next: EmailCanvasStyle) => void;
}

export function StylePanel({ value, blankPreset, disabled, onChange }: StylePanelProps) {
  const id = useId();
  const locked = disabled === true;

  return (
    <div style={panelFieldListStyle}>
      <FieldBox label={blankPreset ? '바깥 배경색' : '배경색'}>
        <ColorField
          id={`${id}-backdrop`}
          label={blankPreset ? '바깥 배경색' : '배경색'}
          value={value.backdropColor}
          disabled={locked}
          onChange={(next) => {
            onChange({ ...value, backdropColor: next });
          }}
        />
      </FieldBox>

      <FieldBox label="캔버스 색">
        <ColorField
          id={`${id}-canvas`}
          label="캔버스 색"
          value={value.canvasColor}
          disabled={locked}
          onChange={(next) => {
            onChange({ ...value, canvasColor: next });
          }}
        />
      </FieldBox>

      <FieldBox label="캔버스 테두리색">
        <ColorField
          id={`${id}-canvas-border`}
          label="캔버스 테두리색"
          value={value.canvasBorderColor}
          disabled={locked}
          onChange={(next) => {
            onChange({ ...value, canvasBorderColor: next });
          }}
        />
      </FieldBox>

      <FieldBox label="캔버스 모서리 둥글기">
        <Slider
          id={`${id}-radius`}
          label="캔버스 모서리 둥글기"
          value={value.canvasBorderRadius}
          min={0}
          max={CANVAS_RADIUS_MAX}
          unit={PX_UNIT}
          disabled={locked}
          onChange={(next) => {
            onChange({ ...value, canvasBorderRadius: next });
          }}
        />
      </FieldBox>

      <FieldBox label="글꼴">
        <SelectField
          id={`${id}-font`}
          aria-label="글꼴"
          value={value.fontFamily}
          disabled={locked}
          onChange={(event) => {
            onChange({ ...value, fontFamily: event.target.value });
          }}
        >
          {FONT_FAMILIES.map((font) => (
            <option key={font} value={font}>
              {font}
            </option>
          ))}
        </SelectField>
      </FieldBox>

      <FieldBox label="글자색">
        <ColorField
          id={`${id}-text`}
          label="글자색"
          value={value.textColor}
          disabled={locked}
          onChange={(next) => {
            onChange({ ...value, textColor: next });
          }}
        />
      </FieldBox>
    </div>
  );
}
