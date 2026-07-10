import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

type Props = {
  /** 주입할 CSS 문자열들 (Vite `?inline` import 결과) */
  styles: string[]
  /** 프레임워크 루트에 부여할 클래스(예: Semantic UI의 "ui" 스코프 등) */
  rootClassName?: string
  children: ReactNode
}

/**
 * 프레임워크 CSS를 Shadow DOM 안에만 주입해 전역 충돌을 차단한다.
 * 명세 외 스타일을 추가하지 않는다.
 */
export function FrameworkScope({ styles, rootClassName, children }: Props) {
  const hostRef = useRef<HTMLDivElement>(null)
  const [mountNode, setMountNode] = useState<HTMLElement | null>(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    const shadow = host.shadowRoot ?? host.attachShadow({ mode: 'open' })
    // 재렌더 대비 초기화
    shadow.innerHTML = ''
    for (const css of styles) {
      const styleEl = document.createElement('style')
      styleEl.textContent = css
      shadow.appendChild(styleEl)
    }
    const mount = document.createElement('div')
    if (rootClassName) mount.className = rootClassName
    shadow.appendChild(mount)
    setMountNode(mount)
    return () => {
      shadow.innerHTML = ''
      setMountNode(null)
    }
  }, [styles, rootClassName])

  return <div ref={hostRef}>{mountNode && createPortal(children, mountNode)}</div>
}
