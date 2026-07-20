// Menu — 메뉴 버튼 (molecule · contracts/Menu.contract.json@1.0.0)
//
// WAI-ARIA Menu Button 패턴. 트리거(aria-haspopup="menu")를 누르면 role="menu" 팝업이 열리고
// 각 명령은 role="menuitem" 인 <button> 이다.
//
// [키보드 정본은 ActionMenu 였다] 어드민의 두 구현 중 members/components/ActionMenu.tsx 만
// 화살표·Home/End 를 갖고 있었다. 약한 쪽(IntegrationOverflowMenu — 화살표 없음)을 기준으로
// 올리면 승격이 곧 접근성 퇴행이 되므로 강한 쪽을 정본으로 삼았다 (계약 description 참조).
//
// [포커스를 가두지 않는다] 메뉴는 모달이 아니다. Tab 은 팝업을 닫고 문서를 계속 흐른다.
// 트리거로 포커스를 되돌리는 것은 **Escape 로 닫을 때뿐**이다 — 명령 실행으로 닫힐 때 되돌리면
// 그 명령이 연 다이얼로그에서 포커스를 도로 빼앗게 된다.
//
// [포털을 쓰지 않는다] position:absolute 로 트리거 래퍼 안에 그린다. 표 행·툴바와 함께 스크롤해야
// 하고, 리포에 이미 포털이 Storybook 테마 데코레이터를 벗어나는 실결함이 있다(Modal·ConfirmDialog).
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';

import { Icon } from '../../atoms/Icon';
import type { MenuProps } from '../../../generated/types/Menu.types';
import './Menu.css';

/** 항목이 잠겼는가 — disabled 를 직접 주거나 disabledReason 이 있으면 잠긴다 (계약 items 설명) */
function isLocked(item: MenuProps['items'][number]): boolean {
  return item.disabled === true || typeof item.disabledReason === 'string';
}

export function Menu({
  label,
  items,
  align = 'end',
  trigger = 'more-horizontal',
  onSelect,
  onOpenChange,
}: MenuProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLUListElement>(null);
  const menuId = useId();

  /** 열림 상태를 한 곳에서만 바꾼다 — 경로마다 onOpenChange 가 빠지는 자리를 만들지 않는다 */
  const setOpenState = useCallback(
    (next: boolean, refocus: boolean) => {
      setOpen((prev) => {
        if (prev !== next) onOpenChange?.(next);
        return next;
      });
      if (refocus) triggerRef.current?.focus();
    },
    [onOpenChange],
  );

  // 바깥 클릭 — pointerdown 으로 잡아야 메뉴 밖 버튼의 click 이 한 번에 먹는다
  useEffect(() => {
    if (!open) return undefined;

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Node && wrapperRef.current?.contains(target) === true) return;
      setOpenState(false, false);
    };

    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open, setOpenState]);

  // 열리면 첫 항목으로 포커스를 옮긴다 — 잠긴 항목은 포커스 대상에서 빠진다(native disabled)
  useEffect(() => {
    if (!open) return;
    const first = popupRef.current?.querySelector('button:not([disabled])');
    if (first instanceof HTMLElement) first.focus();
  }, [open]);

  const moveFocus = (delta: number, absolute?: 'first' | 'last') => {
    const focusable = Array.from(
      popupRef.current?.querySelectorAll<HTMLButtonElement>('button:not([disabled])') ?? [],
    );
    if (focusable.length === 0) return;

    const current = focusable.findIndex((item) => item === document.activeElement);
    let nextIndex: number;
    if (absolute === 'first') nextIndex = 0;
    else if (absolute === 'last') nextIndex = focusable.length - 1;
    else nextIndex = (current + delta + focusable.length) % focusable.length;

    focusable[nextIndex]?.focus();
  };

  /** 트리거 위에서의 ArrowDown — 곧바로 열고 첫 항목으로 간다 (열림 effect 가 포커스한다) */
  const onTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== 'ArrowDown' || open) return;
    event.preventDefault();
    setOpenState(true, false);
  };

  // 키 처리는 팝업(role=menu)에 붙인다 — 열리면 포커스가 항상 팝업 안에 있으므로 여기로 올라온다.
  // 감싸는 <div> 에 붙이면 비대화형 요소에 핸들러를 다는 셈이라 jsx-a11y 가 막는다.
  const onPopupKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
    switch (event.key) {
      case 'Escape':
        // 바깥(모달 등)이 같은 Esc 를 듣고 함께 닫히지 않도록 여기서 멈춘다
        event.stopPropagation();
        setOpenState(false, true);
        break;
      case 'ArrowDown':
        event.preventDefault();
        moveFocus(1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        moveFocus(-1);
        break;
      case 'Home':
        event.preventDefault();
        moveFocus(0, 'first');
        break;
      case 'End':
        event.preventDefault();
        moveFocus(0, 'last');
        break;
      case 'Tab':
        // 탭 아웃하면 닫는다 — 포커스는 가두지 않고 자연스럽게 흘려보낸다
        setOpenState(false, false);
        break;
      default:
        break;
    }
  };

  return (
    <div ref={wrapperRef} className="tds-menu">
      <button
        ref={triggerRef}
        type="button"
        className={`tds-menu__trigger tds-menu__trigger--${trigger}`}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpenState(!open, false)}
        onKeyDown={onTriggerKeyDown}
      >
        <Icon name="more-horizontal" />
      </button>

      {open && (
        <ul
          ref={popupRef}
          id={menuId}
          className={`tds-menu__popup tds-menu__popup--${align}`}
          role="menu"
          aria-label={label}
          onKeyDown={onPopupKeyDown}
        >
          {items.map((item) => {
            const locked = isLocked(item);
            const danger = item.danger === true;
            const reasonId = `${menuId}-reason-${item.id}`;
            return (
              <li key={item.id} className="tds-menu__row" role="none">
                <button
                  type="button"
                  role="menuitem"
                  className={`tds-menu__item${danger ? ' tds-menu__item--danger' : ''}`}
                  disabled={locked}
                  aria-disabled={locked}
                  // 잠근 이유가 있으면 그 문구를 항목의 설명으로 잇는다 —
                  // 잠긴 버튼만 있으면 왜인지 알 길이 없다
                  aria-describedby={item.disabledReason === undefined ? undefined : reasonId}
                  onClick={() => {
                    setOpenState(false, false);
                    onSelect?.(item.id);
                  }}
                >
                  {item.label}
                </button>
                {item.disabledReason === undefined ? null : (
                  <p id={reasonId} className="tds-menu__reason">
                    {item.disabledReason}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
