// 왼쪽 프리셋 레일 — 'Template settings'
//
// [고르면 블록 스택이 통째로 갈린다] 프리셋은 시작점이지 스타일이 아니다. 그래서 캔버스 스타일
// (STYLE 탭이 정한 배경·폰트)은 건드리지 않고 blocks 만 바꾼다 (presets.ts 주석 참조).
import { Card, CardTitle } from '../../../../shared/ui';
import { EMAIL_PRESETS } from './presets';
import type { PresetId } from './presets';
import { presetItemStyle, presetListStyle, railHeadingStyle } from './styles';

interface PresetRailProps {
  readonly value: PresetId;
  readonly disabled?: boolean;
  readonly onSelect: (id: PresetId) => void;
}

export function PresetRail({ value, disabled, onSelect }: PresetRailProps) {
  const locked = disabled === true;

  return (
    <Card aria-labelledby="email-preset-rail-title">
      <CardTitle id="email-preset-rail-title">
        <span style={railHeadingStyle}>템플릿 설정</span>
      </CardTitle>

      <ul style={presetListStyle}>
        {EMAIL_PRESETS.map((preset) => {
          const selected = preset.id === value;
          return (
            <li key={preset.id}>
              <button
                type="button"
                style={presetItemStyle(selected)}
                // 목록 안의 '지금 고른 것' — 선택은 색뿐 아니라 시맨틱으로도 전달한다
                aria-pressed={selected}
                disabled={locked}
                onClick={() => {
                  onSelect(preset.id);
                }}
              >
                {preset.label}
              </button>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
