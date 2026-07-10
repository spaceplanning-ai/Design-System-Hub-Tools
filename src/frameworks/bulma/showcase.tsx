import cssText from 'bulma/css/bulma.min.css?inline'

/**
 * 크로스 프레임워크 비교 셀용 컴팩트 쇼케이스.
 * 순수 마크업만 반환하며, 호출부가 FrameworkScope(styles=[css])로 감싼다.
 */
export const css = cssText

export function ButtonShowcase() {
  return (
    <div className="buttons" style={{ width: 360 }}>
      <button type="button" className="button is-primary">
        Primary
      </button>
      <button type="button" className="button is-link">
        Link
      </button>
      <button type="button" className="button is-success">
        Success
      </button>
      <button type="button" className="button is-primary is-outlined">
        Outlined
      </button>
      <button type="button" className="button" disabled>
        Disabled
      </button>
    </div>
  )
}

export function AlertShowcase() {
  return (
    <div style={{ width: 360 }}>
      <div className="notification is-success">
        <strong>Saved.</strong> Your changes are live.
      </div>
      <div className="notification is-danger">
        <strong>Error.</strong> Something went wrong.
      </div>
    </div>
  )
}

export function CardShowcase() {
  return (
    <div className="card" style={{ width: 360 }}>
      <div className="card-content">
        <p className="title is-6" style={{ marginBottom: '0.5rem' }}>
          Card title
        </p>
        <p className="content is-small">A compact Bulma card with a short description.</p>
        <button type="button" className="button is-primary is-small">
          Action
        </button>
      </div>
    </div>
  )
}

export function FormShowcase() {
  // 폭 고정 없이 카드 폭을 채우고, field 블록 간격(0.75rem = 12px)으로 리듬을 통일한다.
  return (
    <form onSubmit={(e) => e.preventDefault()}>
      <div className="field">
        <label className="label" htmlFor="bulmaShowcaseEmail">
          Email
        </label>
        <div className="control">
          <input
            type="email"
            className="input"
            id="bulmaShowcaseEmail"
            placeholder="name@example.com"
          />
        </div>
      </div>
      <div className="field">
        <label className="label" htmlFor="bulmaShowcaseError">
          에러
        </label>
        <div className="control">
          <input
            type="email"
            className="input is-danger"
            id="bulmaShowcaseError"
            defaultValue="invalid-email"
          />
        </div>
        <p className="help is-danger">필수 입력 항목입니다</p>
      </div>
      <div className="field">
        <div className="control">
          <label className="checkbox">
            <input type="checkbox" defaultChecked /> Remember me
          </label>
        </div>
      </div>
      <div className="field">
        <div className="control">
          <button type="submit" className="button is-primary">
            Submit
          </button>
        </div>
      </div>
    </form>
  )
}

export function NavbarShowcase() {
  return (
    <nav
      className="navbar has-shadow"
      style={{ width: 360 }}
      role="navigation"
      aria-label="showcase navigation"
    >
      {/* navbar-brand는 모든 폭에서 가로로 보이므로 링크를 함께 배치 */}
      <div className="navbar-brand">
        <span className="navbar-item">
          <strong>Acme</strong>
        </span>
        <a className="navbar-item is-active">Home</a>
        <a className="navbar-item">Docs</a>
        <a className="navbar-item">About</a>
      </div>
    </nav>
  )
}
