import type { CSSProperties, ReactNode } from 'react'

// 참조 디자인 시트 룩(연회색 캔버스 + 흰 카드 + 그룹 레이블) — 쇼케이스 스토리 공용 크롬.
// 인라인 스타일만 사용하므로 Shadow DOM 안팎 어디서든 프레임워크 CSS와 충돌하지 않는다.

const LABEL_STYLE: CSSProperties = {
  margin: '0 0 12px',
  fontSize: 13,
  fontWeight: 600,
  fontFamily: "'Pretendard', 'Inter', system-ui, sans-serif",
  color: '#333D4B',
  letterSpacing: '-0.01em',
}

export function SheetCanvas({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        background: '#F4F6FA',
        padding: 20,
        borderRadius: 16,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: 16,
        alignItems: 'start',
      }}
    >
      {children}
    </div>
  )
}

export function SheetCard({
  title,
  children,
  span = 1,
}: {
  title: string
  children: ReactNode
  /** 넓은 콘텐츠(폼·내비게이션 바)용 그리드 칼럼 스팬 */
  span?: 1 | 2 | 3
}) {
  return (
    <section
      style={{
        gridColumn: span > 1 ? `span ${span}` : undefined,
        background: '#FFFFFF',
        border: '1px solid #E8ECF2',
        borderRadius: 12,
        boxShadow: '0 1px 2px rgba(23, 32, 51, 0.04)',
        padding: 16,
        minWidth: 0,
      }}
    >
      <h4 style={LABEL_STYLE}>{title}</h4>
      {children}
    </section>
  )
}
