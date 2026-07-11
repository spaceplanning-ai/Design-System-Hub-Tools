import type { ReactNode } from 'react'
import styles from './AdminShell.module.css'
import { Navbar, type NavbarItem } from '../Navbar/Navbar'
import { Sidebar, type SidebarSection } from '../Sidebar/Sidebar'

export type AdminShellProps = {
  brand: string
  navItems: NavbarItem[]
  navValue: string
  onNavChange?: (value: string) => void
  sidebarSections: SidebarSection[]
  sidebarValue: string
  onSidebarChange?: (value: string) => void
  actions?: ReactNode
  children: ReactNode
  /** 본문 영역 패딩 적용 여부 (기본 true) */
  contentPadding?: boolean
}

export function AdminShell({
  brand,
  navItems,
  navValue,
  onNavChange,
  sidebarSections,
  sidebarValue,
  onSidebarChange,
  actions,
  children,
  contentPadding = true,
}: AdminShellProps) {
  const mainClass = [styles.main, contentPadding ? styles.padded : ''].filter(Boolean).join(' ')

  return (
    <div className={styles.shell}>
      <Navbar brand={brand} items={navItems} value={navValue} onChange={onNavChange} actions={actions} />
      <div className={styles.body}>
        <Sidebar sections={sidebarSections} value={sidebarValue} onChange={onSidebarChange} />
        <main className={mainClass}>{children}</main>
      </div>
    </div>
  )
}
