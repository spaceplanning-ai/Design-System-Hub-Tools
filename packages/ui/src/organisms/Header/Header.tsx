// Header — 콘텐츠 영역 상단 바 (organism · contracts/Header.contract.json@1.0.0)
//
// <header> 하나가 banner 랜드마크가 된다. 왼쪽에 눈썹 문구 + 화면 제목(<h1>), 오른쪽에 메타 슬롯.
//
// [이 컴포넌트가 <h1> 을 소유한다] 어드민의 화면 130여 개가 자기 제목을 그리지 않고 여기에
// 맡긴다(IA-02). 그래서 title 은 슬롯이 아니라 string 이다 — 화면이 자기 <h1> 을 또 그리면
// 문서에 h1 이 둘이 된다.
//
// [이 컴포넌트가 모르는 것] 제목이 어느 라우트에서 유도됐는지, 오늘이 며칠인지, 누가 로그인해
// 있는지. 전부 앱의 사실이라 결과만 받는다 — meta 가 node 슬롯인 이유다.
import type { HeaderProps } from '../../../generated/types/Header.types';
import './Header.css';

export function Header({ title, eyebrow = '', meta = null }: HeaderProps) {
  return (
    <header className="tds-header">
      <div className="tds-header__titles">
        {/* 빈 문자열이면 <p> 자체를 그리지 않는다 — 빈 줄을 남기면 제목이 아래로 밀린다.
            눈썹은 제목이 아니므로 <p> 다. <h2> 로 만들면 스크린리더 제목 목록이
            브랜드 이름으로 오염된다 */}
        {eyebrow === '' ? null : <p className="tds-header__eyebrow">{eyebrow}</p>}
        <h1 className="tds-header__title">{title}</h1>
      </div>

      {meta === null ? null : <div className="tds-header__meta">{meta}</div>}
    </header>
  );
}
