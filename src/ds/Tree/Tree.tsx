import { useState } from 'react'
import styles from './Tree.module.css'

export type TreeNode = {
  id: string
  label: string
  children?: TreeNode[]
  disabled?: boolean
}

export type TreeProps = {
  nodes: TreeNode[]
  selectedId?: string | null
  onSelect?: (id: string) => void
  defaultExpandedIds?: string[]
}

function ChevronIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 6l6 6-6 6" />
    </svg>
  )
}

function FolderIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </svg>
  )
}

function FileIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
    </svg>
  )
}

type TreeItemProps = {
  node: TreeNode
  level: number
  expandedIds: Set<string>
  selectedId: string | null
  onToggle: (id: string) => void
  onSelect?: (id: string) => void
}

// 재귀 렌더 — 폴더는 chevron + 폴더 아이콘, 리프는 파일 아이콘
function TreeItem({ node, level, expandedIds, selectedId, onToggle, onSelect }: TreeItemProps) {
  const hasChildren = (node.children?.length ?? 0) > 0
  const expanded = expandedIds.has(node.id)
  const selected = node.id === selectedId

  const chevronClass = [
    styles.chevron,
    expanded ? styles.chevronOpen : '',
    hasChildren ? '' : styles.chevronHidden,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <li role="treeitem" aria-expanded={hasChildren ? expanded : undefined} aria-selected={selected}>
      <button
        type="button"
        className={[styles.row, selected ? styles.selected : ''].filter(Boolean).join(' ')}
        disabled={node.disabled}
        style={{ paddingLeft: `calc(var(--ds-spacing-2) + var(--ds-spacing-5) * ${level})` }}
        onClick={() => {
          if (hasChildren) onToggle(node.id)
          onSelect?.(node.id)
        }}
      >
        <span className={chevronClass}>
          <ChevronIcon />
        </span>
        <span className={styles.icon}>{hasChildren ? <FolderIcon /> : <FileIcon />}</span>
        <span className={styles.label}>{node.label}</span>
      </button>
      {hasChildren && expanded && (
        <ul className={styles.group} role="group">
          {node.children?.map((child) => (
            <TreeItem
              key={child.id}
              node={child}
              level={level + 1}
              expandedIds={expandedIds}
              selectedId={selectedId}
              onToggle={onToggle}
              onSelect={onSelect}
            />
          ))}
        </ul>
      )}
    </li>
  )
}

export function Tree({ nodes, selectedId = null, onSelect, defaultExpandedIds = [] }: TreeProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set(defaultExpandedIds))

  const toggle = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <ul className={styles.tree} role="tree">
      {nodes.map((node) => (
        <TreeItem
          key={node.id}
          node={node}
          level={0}
          expandedIds={expandedIds}
          selectedId={selectedId}
          onToggle={toggle}
          onSelect={onSelect}
        />
      ))}
    </ul>
  )
}
