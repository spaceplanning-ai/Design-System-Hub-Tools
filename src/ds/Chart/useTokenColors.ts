import { useEffect, useState, type RefObject } from 'react'

const TOKENS = ['primary', 'secondary', 'error', 'success'] as const

/**
 * ThemeScope 내부 요소(ref) 기준으로 CSS 변수(--ds-color-*)를 읽어
 * primary/secondary/error/success 4색 팔레트를 반환한다 (스펙 §9 —
 * documentElement가 아니라 스코프 내부에서 읽어야 프리셋별 값이 잡힌다).
 * 프리셋 전환 시 리렌더는 스토리에서 preset을 key로 전달해 보장한다.
 */
export function useTokenColors(ref: RefObject<HTMLElement | null>): string[] {
  const [colors, setColors] = useState<string[]>([])

  useEffect(() => {
    if (!ref.current) return
    const computed = getComputedStyle(ref.current)
    setColors(TOKENS.map((t) => computed.getPropertyValue(`--ds-color-${t}`).trim()))
  }, [ref])

  return colors
}
