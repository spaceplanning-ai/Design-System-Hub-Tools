import cssText from 'semantic-ui-css/semantic.min.css?inline'

// 비교 페이지(FrameworkScope 셀)에서 재사용할 CSS 문자열과 루트 클래스
export const css = cssText
export const rootClassName = 'ui'

// 약 360px 비교 셀에 맞춘 컴팩트 스트립 — 순수 표시용, 상태·필수 props 없음

export function ButtonShowcase() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
      <button type="button" className="ui small primary button">
        Primary
      </button>
      <button type="button" className="ui small secondary button">
        Secondary
      </button>
      <button type="button" className="ui small positive button">
        Positive
      </button>
      <button type="button" className="ui small basic button">
        Basic
      </button>
      <button type="button" className="ui small disabled button" disabled>
        Disabled
      </button>
    </div>
  )
}

export function AlertShowcase() {
  return (
    <div style={{ display: 'grid', gap: '0.5rem' }}>
      <div className="ui positive message">
        <div className="header">Success</div>
        <p>Your changes have been saved.</p>
      </div>
      <div className="ui negative message">
        <div className="header">Error</div>
        <p>Something went wrong.</p>
      </div>
    </div>
  )
}

export function CardShowcase() {
  return (
    <div className="ui card" style={{ maxWidth: '18rem' }}>
      <div className="content">
        <div className="header">Project plan</div>
        <div className="meta">Updated today</div>
        <div className="description">A compact card for the compare grid.</div>
      </div>
      <div className="extra content">
        <button type="button" className="ui small primary button">
          Open
        </button>
      </div>
    </div>
  )
}

export function FormShowcase() {
  return (
    <div className="ui form">
      <div className="field">
        <label htmlFor="suiShowcaseEmail">Email</label>
        <input type="email" id="suiShowcaseEmail" placeholder="name@example.com" />
      </div>
      {/* 소프트 모던 스킨 에러 상태 — 비교 그리드가 formSkinCss를 주입한다 */}
      <div className="error field">
        <label htmlFor="suiShowcaseError">에러</label>
        <input type="text" id="suiShowcaseError" defaultValue="invalid-email" />
        <span className="skin-help skin-help--error">필수 입력 항목입니다</span>
      </div>
      <div className="field">
        {/* jQuery 미로드 — 정적 checked 클래스 + defaultChecked */}
        <div className="ui checked checkbox">
          <input type="checkbox" id="suiShowcaseAgree" defaultChecked />
          <label htmlFor="suiShowcaseAgree">I agree to the terms</label>
        </div>
      </div>
      <button type="button" className="ui primary button">
        Submit
      </button>
    </div>
  )
}

export function NavbarShowcase() {
  return (
    <div className="ui small menu">
      <div className="header item">Acme</div>
      <a className="active item" href="#" onClick={(e) => e.preventDefault()}>
        Home
      </a>
      <a className="item" href="#" onClick={(e) => e.preventDefault()}>
        Docs
      </a>
      <a className="item" href="#" onClick={(e) => e.preventDefault()}>
        About
      </a>
    </div>
  )
}
