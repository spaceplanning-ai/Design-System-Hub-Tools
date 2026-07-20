// Panel — 곁 영역 껍데기 (molecule · contracts/Panel.contract.json@1.0.0)
//
// <aside>(complementary) 안에 블록들을 세로로 쌓고, notice 를 주면 맨 아래에 위쪽 구분선으로
// 갈린 안내 영역을 붙인다. 그것이 전부다 — 안에 무엇이 들어오는지 이 컴포넌트는 모른다.
//
// [이름이 왜 FilterRail 이 아닌가] 앱에서의 이름은 FilterRail 이었으나 소비처 12곳 중 2곳은
// 필터를 담지 않는다(권한 화면의 역할 목록 · 상품 폼의 섹션 내비게이션). 껍데기가 실제로 아는
// 것은 '곁에 서는 세로 스택 + 아래 안내문' 뿐이고 '필터' 는 가장 흔한 내용물의 이름이었다.
// Layout 계층의 이름은 배치에서 온다 (계약 description 참조).
//
// [폭을 갖지 않는다] 좌측 레일이 몇 칸을 차지할지는 그 화면의 격자가 정한다. 껍데기가 폭을
// 박으면 격자와 두 곳에서 싸운다 — Sidebar 가 폭을 소유하는 것과 반대인 이유는 그쪽이 앱 셸의
// 고정 크롬이고 이쪽은 본문 격자의 한 칸이기 때문이다.
import type { PanelProps } from '../../../generated/types/Panel.types';
import './Panel.css';

export function Panel({ children, notice = null }: PanelProps) {
  return (
    <aside className="tds-panel">
      {children}

      {/* 안내문이 없으면 구분선과 여백까지 함께 사라진다 — 빈 영역이 남으면 아래가 떠 보인다.
          <div> 인 이유: 안내는 문단 여럿일 수 있고(운영진 그룹·역할·로그는 세 문단),
          <p> 로 감싸면 문단 안에 문단이 들어가 브라우저가 태그를 강제로 닫는다. */}
      {notice !== null && notice !== undefined && <div className="tds-panel__notice">{notice}</div>}
    </aside>
  );
}
