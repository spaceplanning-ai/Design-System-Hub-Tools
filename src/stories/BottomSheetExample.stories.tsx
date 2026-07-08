import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Modal } from '../components/organisms';
import { Button, Icon } from '../components/atoms';
import { ListItem } from '../components/molecules';

const meta: Meta = {
  title: 'Examples/바텀시트 BottomSheet',
  parameters: { layout: 'centered' },
};
export default meta;

/** An action sheet: a button opens a bottom-sheet Modal (type B) with a list of actions. */
export const ActionSheet: StoryObj = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button variant="outline" onClick={() => setOpen(true)}>
          게시물 옵션 열기
        </Button>
        <Modal open={open} onClose={() => setOpen(false)} type="B" title="게시물 옵션">
          <div role="list" style={{ margin: '0 calc(var(--tds-space-6) * -1)' }}>
            <ListItem
              role="listitem"
              variant="interactive"
              leading={<Icon name="share" />}
              title="공유하기"
              onClick={() => setOpen(false)}
            />
            <ListItem
              role="listitem"
              variant="interactive"
              leading={<Icon name="edit" />}
              title="수정하기"
              onClick={() => setOpen(false)}
            />
            <ListItem
              role="listitem"
              variant="interactive"
              leading={<Icon name="download" />}
              title="저장하기"
              onClick={() => setOpen(false)}
            />
            <ListItem
              role="listitem"
              variant="interactive"
              leading={<Icon name="trash" />}
              title={<span style={{ color: 'var(--tds-color-danger-solid)' }}>삭제하기</span>}
              onClick={() => setOpen(false)}
            />
          </div>
        </Modal>
      </>
    );
  },
};

/** A filter sheet: selectable options with a sticky apply/cancel footer. */
export const FilterSheet: StoryObj = {
  render: () => {
    const [open, setOpen] = useState(false);
    const [sort, setSort] = useState('recent');
    const options = [
      { value: 'recent', label: '최신순' },
      { value: 'popular', label: '인기순' },
      { value: 'views', label: '조회순' },
      { value: 'comments', label: '댓글순' },
    ];
    return (
      <>
        <Button iconStart={<Icon name="settings" size="sm" />} onClick={() => setOpen(true)}>
          정렬 &amp; 필터
        </Button>
        <Modal
          open={open}
          onClose={() => setOpen(false)}
          type="B"
          title="정렬"
          description="게시물을 어떤 순서로 볼까요?"
          footer={
            <div style={{ display: 'flex', gap: 'var(--tds-space-2)', width: '100%' }}>
              <Button variant="ghost" fullWidth onClick={() => setOpen(false)}>
                취소
              </Button>
              <Button fullWidth onClick={() => setOpen(false)}>
                적용
              </Button>
            </div>
          }
        >
          <div
            role="radiogroup"
            aria-label="정렬 기준"
            style={{ margin: '0 calc(var(--tds-space-6) * -1)' }}
          >
            {options.map((o) => (
              <ListItem
                key={o.value}
                role="radio"
                aria-checked={sort === o.value}
                variant="interactive"
                selected={sort === o.value}
                title={o.label}
                trailing={sort === o.value ? <Icon name="check" /> : undefined}
                onClick={() => setSort(o.value)}
              />
            ))}
          </div>
        </Modal>
      </>
    );
  },
};
