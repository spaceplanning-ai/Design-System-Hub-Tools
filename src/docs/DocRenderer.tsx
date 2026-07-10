import { useEffect, useRef, useState, type ReactNode } from 'react'
import docsContent from '../../docs/docs-content.json'
import { ThemeScope } from '../shared/ThemeScope'
import { Button } from '../ds/Button/Button'
import { TextField } from '../ds/TextField/TextField'
import { Card } from '../ds/Card/Card'
import { Alert } from '../ds/Alert/Alert'
import { Badge } from '../ds/Badge/Badge'
import { SocialLoginButton } from '../ds/SocialLoginButton/SocialLoginButton'
import { DsChart } from '../ds/Chart/DsChart'

type Block = {
  type: string
  text?: string
  tokens?: string[]
  sizes?: string[]
  component?: string
  id?: string
}

// 문구 하드코딩 금지(§0-12) — 모든 텍스트는 docs/docs-content.json에서만 나온다.
const DEMOS: Record<string, ReactNode> = {
  Button: <Button variant="primary" size="md" label="Button" />,
  TextField: <TextField label="Email" placeholder="name@example.com" />,
  Card: <Card title="Card title">This is a sample card.</Card>,
  Alert: <Alert variant="error" label="This is a warning message." showIcon />,
  Badge: <Badge variant="primary" size="md" label="Badge" />,
  SocialLoginButton: <SocialLoginButton provider="kakao" size="md" />,
  DsChart: <DsChart type="line" dataset="revenue" title="Revenue" />,
}

function TokenSwatch({ token }: { token: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [hex, setHex] = useState('')

  useEffect(() => {
    if (!ref.current) return
    const value = getComputedStyle(ref.current).getPropertyValue(`--ds-color-${token}`).trim()
    setHex(value.toUpperCase())
  }, [token])

  return (
    <div ref={ref} style={{ fontFamily: 'var(--ds-font-family)' }}>
      <div
        style={{
          width: 120,
          height: 80,
          borderRadius: 'var(--ds-radius-md)',
          background: `var(--ds-color-${token})`,
          border: '1px solid rgba(0, 0, 0, 0.08)',
        }}
      />
      <div style={{ fontSize: 'var(--ds-font-size-xs)', marginTop: 4 }}>
        {token} {hex}
      </div>
    </div>
  )
}

function renderBlock(block: Block, index: number): ReactNode {
  switch (block.type) {
    case 'heading':
      return (
        <h2
          key={index}
          style={{
            fontFamily: 'var(--ds-font-family)',
            fontSize: 'var(--ds-font-size-xl)',
            fontWeight: 'var(--ds-font-weight-bold)' as never,
            color: 'var(--ds-color-text)',
            margin: 0,
          }}
        >
          {block.text}
        </h2>
      )
    case 'paragraph':
      return (
        <p
          key={index}
          style={{
            fontFamily: 'var(--ds-font-family)',
            fontSize: 'var(--ds-font-size-md)',
            color: 'var(--ds-color-text)',
            margin: 0,
            lineHeight: 1.6,
          }}
        >
          {block.text}
        </p>
      )
    case 'callout':
      return (
        <div
          key={index}
          style={{
            fontFamily: 'var(--ds-font-family)',
            fontSize: 'var(--ds-font-size-md)',
            color: 'var(--ds-color-text)',
            borderLeft: '4px solid var(--ds-color-primary)',
            padding: 'var(--ds-spacing-3) var(--ds-spacing-4)',
            background: 'rgba(0, 0, 0, 0.03)',
            borderRadius: 'var(--ds-radius-sm)',
          }}
        >
          {block.text}
        </div>
      )
    case 'colorGrid':
      return (
        <div key={index} style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          {(block.tokens ?? []).map((token) => (
            <TokenSwatch key={token} token={token} />
          ))}
        </div>
      )
    case 'typeScale':
      return (
        <div key={index} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {(block.sizes ?? []).map((size) => (
            <div
              key={size}
              style={{
                fontFamily: 'var(--ds-font-family)',
                fontSize: `var(--ds-font-size-${size})`,
                color: 'var(--ds-color-text)',
              }}
            >
              {size} — 가나다 ABC 123
            </div>
          ))}
        </div>
      )
    case 'componentDemo': {
      const demo = block.component ? DEMOS[block.component] : null
      if (!demo) return null
      return (
        <div key={index} style={{ padding: 'var(--ds-spacing-2) 0' }}>
          {demo}
        </div>
      )
    }
    case 'table': {
      const def = block.id
        ? (docsContent.tables as Record<string, { columns: string[]; rows: string[][] }>)[block.id]
        : undefined
      if (!def) return null
      return (
        <table
          key={index}
          style={{
            fontFamily: 'var(--ds-font-family)',
            fontSize: 'var(--ds-font-size-sm)',
            color: 'var(--ds-color-text)',
            borderCollapse: 'collapse',
          }}
        >
          <thead>
            <tr>
              {def.columns.map((col) => (
                <th
                  key={col}
                  style={{
                    textAlign: 'left',
                    borderBottom: '2px solid rgba(0, 0, 0, 0.15)',
                    padding: '8px 12px',
                  }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {def.rows.map((row, r) => (
              <tr key={r}>
                {row.map((cell, c) => (
                  <td
                    key={c}
                    style={{ borderBottom: '1px solid rgba(0, 0, 0, 0.08)', padding: '8px 12px' }}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )
    }
    default:
      return null
  }
}

export function DocRenderer({ sectionId }: { sectionId: string }) {
  const section = docsContent.sections.find((s) => s.id === sectionId)
  if (!section) return null
  // 독립 MDX 페이지는 preview 데코레이터(ThemeScope)를 타지 않으므로 직접 감싼다.
  // 문서 사이트 기본 프리셋 = toss (G1).
  return (
    <ThemeScope preset="toss">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 800 }}>
        {(section.blocks as Block[]).map(renderBlock)}
      </div>
    </ThemeScope>
  )
}
