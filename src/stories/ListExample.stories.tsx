import type { Meta, StoryObj } from '@storybook/react';
import type { ReactNode } from 'react';
import { Card } from '../components/molecules';
import { ListItem } from '../components/molecules';
import { Avatar, Badge, Switch, Icon } from '../components/atoms';

const meta: Meta = {
  title: 'Examples/리스트 List',
  parameters: { layout: 'padded' },
};
export default meta;

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card variant="outlined" padding="none" style={{ overflow: 'hidden' }}>
      <Card.Header title={title} />
      <div role="list">{children}</div>
    </Card>
  );
}

/** Settings toggles, a contacts list, and a notification feed — all from ListItem. */
export const Lists: StoryObj = {
  render: () => (
    <div style={{ display: 'grid', gap: 20, maxWidth: 440 }}>
      <Section title="알림 설정">
        <ListItem
          role="listitem"
          leading={<Icon name="bell" />}
          title="푸시 알림"
          description="새 활동을 즉시 알려드려요"
          trailing={<Switch defaultChecked aria-label="푸시 알림" />}
        />
        <ListItem
          role="listitem"
          leading={<Icon name="mail" />}
          title="이메일 알림"
          description="주간 요약을 메일로"
          trailing={<Switch aria-label="이메일 알림" />}
        />
        <ListItem
          role="listitem"
          leading={<Icon name="moon" />}
          title="다크 모드"
          description="시스템 설정 따르기"
          trailing={<Switch defaultChecked aria-label="다크 모드" />}
        />
      </Section>

      <Section title="연락처">
        {[
          { name: '김하늘', email: 'haneul@example.com', status: 'online' as const },
          { name: '이바다', email: 'bada@example.com', status: 'away' as const },
          { name: '박서준', email: 'seojun@example.com', status: 'offline' as const },
        ].map((p) => (
          <ListItem
            key={p.email}
            role="listitem"
            variant="interactive"
            leading={<Avatar name={p.name} size="sm" status={p.status} />}
            title={p.name}
            description={p.email}
            withChevron
            onClick={() => {}}
          />
        ))}
      </Section>

      <Section title="알림">
        <ListItem
          role="listitem"
          leading={<Icon name="heart" />}
          title="정민호님이 회원님의 글을 좋아합니다"
          description="방금 전"
          trailing={<Badge tone="danger" dot />}
        />
        <ListItem
          role="listitem"
          leading={<Icon name="message-circle" />}
          title="새 댓글 3개"
          description="10분 전"
          trailing={<Badge tone="brand" count={3} />}
        />
        <ListItem
          role="listitem"
          leading={<Icon name="star" />}
          title="이번 주 인기 게시물에 선정되었어요"
          description="2시간 전"
        />
      </Section>
    </div>
  ),
};

/** Type B — comfortable two-line cards with larger media. */
export const ComfortableCards: StoryObj = {
  render: () => (
    <div style={{ display: 'grid', gap: 12, maxWidth: 440 }}>
      {[
        { name: '무선 이어버드', desc: '노이즈 캔슬링 · 재고 24개', price: '₩129,000' },
        { name: '스마트워치', desc: 'GPS · 재고 8개', price: '₩259,000' },
        { name: '기계식 키보드', desc: '적축 · 재고 51개', price: '₩89,000' },
      ].map((p) => (
        <Card key={p.name} variant="outlined" padding="none">
          <ListItem
            type="B"
            variant="interactive"
            leading={<Avatar name={p.name} shape="rounded" />}
            title={p.name}
            description={p.desc}
            trailing={<Badge tone="neutral">{p.price}</Badge>}
            withChevron
            onClick={() => {}}
          />
        </Card>
      ))}
    </div>
  ),
};
