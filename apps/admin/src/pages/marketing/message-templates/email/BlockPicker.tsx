// 블록 종류 고르기 — + 를 눌렀을 때 뜨는 격자
//
// [목록이 두 벌인 이유] 최상위에서는 모든 종류를 넣을 수 있지만 **컬럼 안**에서는 컨테이너와
// 법적 푸터를 뺀 목록만 내준다(blocks.ts 의 COLUMN_CHILD_KIND_ORDER). 넣게 해 놓고 나중에
// 거부하는 것보다, 처음부터 보여 주지 않는 편이 정직하다.
import { Button, Icon, Modal } from '../../../../shared/ui';
import { BLOCK_KIND_LABEL, BLOCK_KIND_ORDER, COLUMN_CHILD_KIND_ORDER } from './blocks';
import type { EmailBlockKind } from '../types';
import { blockPickerItemStyle, blockPickerStyle } from './styles';
import type { ReactNode } from 'react';

/** 종류마다의 글리프 — Record 라서 블록이 늘면 여기서 타입 에러가 난다 */
const GLYPH: Readonly<Record<EmailBlockKind, ReactNode>> = {
  columns: <Icon name="columns" />,
  heading: <Icon name="heading" />,
  text: <Icon name="text" />,
  button: <Icon name="button" />,
  image: <Icon name="image" />,
  video: <Icon name="video" />,
  list: <Icon name="list" />,
  menu: <Icon name="menu" />,
  social: <Icon name="social" />,
  logo: <Icon name="logo" />,
  avatar: <Icon name="avatar" />,
  divider: <Icon name="divider" />,
  spacer: <Icon name="spacer" />,
  footer: <Icon name="footer" />,
};

interface BlockPickerProps {
  readonly open: boolean;
  /** 컬럼 안에 넣는 중인가 — 참이면 컨테이너·푸터를 뺀 목록을 그린다 */
  readonly insideColumn?: boolean;
  /** 이미 법적 푸터가 있는가 — 참이면 푸터를 목록에서 뺀다(한 통에 하나) */
  readonly footerPresent?: boolean;
  readonly onPick: (kind: EmailBlockKind) => void;
  readonly onClose: () => void;
}

export function BlockPicker({
  open,
  insideColumn,
  footerPresent,
  onPick,
  onClose,
}: BlockPickerProps) {
  if (!open) return null;

  const base: readonly EmailBlockKind[] =
    insideColumn === true ? COLUMN_CHILD_KIND_ORDER : BLOCK_KIND_ORDER;
  const kinds = footerPresent === true ? base.filter((kind) => kind !== 'footer') : base;

  return (
    <Modal
      title="블록 추가"
      onClose={onClose}
      footer={
        <Button variant="secondary" onClick={onClose}>
          취소
        </Button>
      }
    >
      <div style={blockPickerStyle}>
        {kinds.map((kind) => (
          <button
            key={kind}
            type="button"
            style={blockPickerItemStyle}
            onClick={() => {
              onPick(kind);
            }}
          >
            {GLYPH[kind]}
            {BLOCK_KIND_LABEL[kind]}
          </button>
        ))}
      </div>
    </Modal>
  );
}
