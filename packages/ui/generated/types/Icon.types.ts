// AUTO-GENERATED from contracts/Icon.contract.json@1.0.0 — DO NOT EDIT (pnpm codegen)
// 레벨: atom · 카테고리: Media · 상태: beta

/** `Icon.name` 허용 값 (계약이 유일한 원천) */
export type IconName = 'align-bottom' | 'align-center' | 'align-left' | 'align-middle' | 'align-right' | 'align-top' | 'arrow-left' | 'avatar' | 'bar-chart' | 'bell' | 'box' | 'briefcase' | 'building' | 'button' | 'chevron-down' | 'chevron-left' | 'chevron-right' | 'close' | 'collapse-left' | 'collapse-right' | 'columns' | 'desktop' | 'divider' | 'download' | 'eye' | 'file-text' | 'footer' | 'heading' | 'headset' | 'image' | 'layout-grid' | 'list' | 'lock' | 'logo' | 'megaphone' | 'menu' | 'mic' | 'mobile' | 'more-horizontal' | 'pencil' | 'plus' | 'plus-circle' | 'redo' | 'scroll-text' | 'search' | 'send' | 'settings' | 'shopping-bag' | 'social' | 'spacer' | 'sparkle' | 'sparkles' | 'text' | 'trash' | 'undo' | 'upload' | 'users' | 'video' | 'x-circle';

/** `Icon.size` 허용 값 (계약이 유일한 원천) */
export type IconSize = 'inherit' | 'sm' | 'md' | 'lg';

/** 계약에 선언된 상호작용 상태 */
export type IconState = 'default';

/**
 * 단색 선 아이콘 — 24 그리드 stroke 아이콘 59종을 name 으로 고른다. 모양의 정본은 packages/ui 의 Icon 구현과 apps/admin 의 인라인 SVG 아이콘이며, codegen 이 거기서 SVG 를 추출해 Figma 에서 진짜 벡터 노드로 만든다 — 사본을 손으로 유지하지 않는다. 색은 currentColor 로 부모를 따르고, 크기만 토큰으로 고정한다. 비대화형 표시 전용 — 클릭 이벤트를 갖지 않으며 버튼이 필요하면 Button 안에 넣는다.
 */
export interface IconProps {
  /**
   * 그릴 아이콘. 값 집합은 앱·DS 의 실제 아이콘 구현에서 codegen 이 전수 추출한 것이며(손으로 적은 목록이 아니다), 구현에 아이콘이 늘면 자동으로 따라온다
   */
  name: IconName;
  /**
   * 사각 크기. inherit(기본)=1.25em 으로 부모 font-size 를 따라간다 — 아이콘은 대개 텍스트 옆에 서므로 글자와 함께 커지는 것이 기본값이다(승격 전 apps/admin 의 동작과 동일). sm=space.4 · md=space.5 · lg=space.6 은 텍스트 문맥 밖에서 크기를 고정해야 할 때 쓴다. 색은 어느 경우에도 currentColor 로 부모를 따른다
   * @default "inherit"
   */
  size?: IconSize;
  /**
   * 접근 가능한 이름. 비우면 장식으로 간주해 aria-hidden 처리한다(인접 텍스트가 의미를 제공하는 경우). 값을 주면 role=img 와 aria-label 이 붙는다
   * @default ""
   */
  label?: string;
}
