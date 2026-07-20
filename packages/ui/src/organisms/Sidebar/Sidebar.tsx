// Sidebar — 좌측 고정 내비게이션 (organism · contracts/Sidebar.contract.json@1.0.0)
//
// 바깥 <aside>(complementary) 안에 브랜드 슬롯과 <nav aria-label>(navigation)이 들어간다.
// 항목은 잎(링크)이거나 가지(펼치면 하위 링크가 나오는 버튼) 둘 중 하나다.
//
// [이 컴포넌트가 모르는 것] 라우트·권한·활성 판정·nav 트리의 출처. 전부 앱의 사실이라
// sections 는 이미 걸러진 데이터로, 켜질 잎은 activeHref 로, 펼친 가지는 openId 로 들어온다.
// DS 가 그것들을 배우면 이 앱에서만 쓸 수 있는 컴포넌트가 된다 (계약 description 참조).
//
// [라우터를 의존하지 않는다] 진짜 <a href> 를 그려 가운데 클릭·새 탭 열기를 살리고,
// 수식키 없는 왼쪽 클릭에서만 preventDefault 후 onNavigate(href) 를 올린다. onNavigate 가
// 없으면 preventDefault 도 하지 않는다 — 그때는 평범한 링크로 동작하는 것이 옳다.
import { useId } from 'react';
import type { MouseEvent } from 'react';

import { Icon } from '../../atoms/Icon';
import type { SidebarProps } from '../../../generated/types/Sidebar.types';
import './Sidebar.css';

type SidebarSection = SidebarProps['sections'][number];
type SidebarItem = SidebarSection['items'][number];

/**
 * 이 클릭을 SPA 이동으로 가로채도 되는가.
 *
 * 수식키가 눌렸거나 왼쪽 버튼이 아니면 브라우저에 그대로 넘긴다 — Ctrl/Cmd+클릭으로 새 탭을
 * 여는 것은 링크의 기본 계약이고, 그것까지 가로채면 진짜 href 를 그린 의미가 사라진다.
 */
function isPlainLeftClick(event: MouseEvent<HTMLAnchorElement>): boolean {
  return (
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey &&
    !event.defaultPrevented
  );
}

export function Sidebar({
  label,
  sections,
  activeHref = '',
  openId = '',
  brand = null,
  onNavigate,
  onToggle,
}: SidebarProps) {
  const scopeId = useId();

  /** 지금 켜져야 할 링크인가 — 판정은 앱이 끝냈고 여기서는 문자열 비교만 한다 */
  const isActive = (href: string): boolean => href !== '' && href === activeHref;

  /** 활성 링크에만 aria-current 를 붙인다 — exactOptionalPropertyTypes 라 키 자체를 조건부로 편다 */
  const currentAttr = (href: string) =>
    isActive(href) ? ({ 'aria-current': 'page' } as const) : {};

  const linkClassName = (href: string, base: string): string =>
    isActive(href) ? `${base} ${base}--active` : base;

  const handleLinkClick = (href: string) => (event: MouseEvent<HTMLAnchorElement>) => {
    if (onNavigate === undefined || !isPlainLeftClick(event)) return;
    event.preventDefault();
    onNavigate(href);
  };

  const renderIcon = (icon: SidebarItem['icon']) =>
    icon === undefined ? null : <span className="tds-sidebar__icon">{icon}</span>;

  const renderItem = (item: SidebarItem) => {
    // 가지 — 하위 목록을 여닫는 버튼. 열지 닫을지는 DS 가 정하지 않고 id 만 올린다
    if (item.children !== undefined) {
      const open = openId !== '' && item.id === openId;
      const panelId = `${scopeId}-panel-${item.id}`;

      return (
        <>
          <button
            type="button"
            className="tds-sidebar__item tds-sidebar__branch"
            aria-expanded={open}
            // 접혀 있으면 그 id 를 가진 요소가 없으므로 속성 자체를 내린다
            {...(open ? { 'aria-controls': panelId } : {})}
            onClick={() => onToggle?.(item.id)}
          >
            {renderIcon(item.icon)}
            <span className="tds-sidebar__label">{item.label}</span>
            <span className="tds-sidebar__chevron">
              <Icon name={open ? 'chevron-down' : 'chevron-right'} />
            </span>
          </button>

          {/* 접힌 하위 링크는 DOM 에 두지 않는다 — 보이지 않는 것이 탭 순서에 남으면
              키보드 사용자가 허공을 지난다 */}
          {open && (
            <ul id={panelId} className="tds-sidebar__sub-list">
              {item.children.map((child) => (
                <li key={child.id}>
                  <a
                    href={child.href}
                    className={linkClassName(child.href, 'tds-sidebar__sub-item')}
                    {...currentAttr(child.href)}
                    onClick={handleLinkClick(child.href)}
                  >
                    {child.label}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </>
      );
    }

    // 잎 — 아이콘 + 라벨 링크
    const href = item.href ?? '';
    return (
      <a
        href={href}
        className={linkClassName(href, 'tds-sidebar__item')}
        {...currentAttr(href)}
        onClick={handleLinkClick(href)}
      >
        {renderIcon(item.icon)}
        <span className="tds-sidebar__label">{item.label}</span>
      </a>
    );
  };

  return (
    <aside className="tds-sidebar">
      <div className="tds-sidebar__brand">{brand}</div>

      <nav className="tds-sidebar__nav" aria-label={label}>
        {sections.map((section) => (
          <div className="tds-sidebar__section" key={section.id}>
            <h2 className="tds-sidebar__section-title">{section.title}</h2>

            <ul className="tds-sidebar__list">
              {section.items.map((item) => (
                <li key={item.id}>{renderItem(item)}</li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
