import cssText from 'bootstrap/dist/css/bootstrap.min.css?inline'

/**
 * 크로스 프레임워크 비교 페이지용 대표 스트립.
 * 호출측이 FrameworkScope(styles=[css])로 감싼다 — 여기서는 순수 마크업만 제공.
 * 각 컴포넌트는 약 360px 셀 안에 들어가도록 컴팩트하게 유지한다.
 */
export const css = cssText

export function ButtonShowcase() {
  return (
    <div className="d-flex flex-wrap align-items-center gap-2">
      <button type="button" className="btn btn-primary btn-sm">
        Primary
      </button>
      <button type="button" className="btn btn-secondary btn-sm">
        Secondary
      </button>
      <button type="button" className="btn btn-success btn-sm">
        Success
      </button>
      <button type="button" className="btn btn-outline-primary btn-sm">
        Outline
      </button>
      <button type="button" className="btn btn-primary btn-sm" disabled>
        Disabled
      </button>
    </div>
  )
}

export function AlertShowcase() {
  return (
    <div style={{ maxWidth: '21rem' }}>
      <div className="alert alert-success py-2 mb-2" role="alert">
        Changes saved successfully.
      </div>
      <div className="alert alert-danger py-2 mb-0" role="alert">
        Something went wrong. Try again.
      </div>
    </div>
  )
}

export function CardShowcase() {
  return (
    <div className="card shadow-sm" style={{ width: '16rem' }}>
      <div className="card-body">
        <h6 className="card-title">Card title</h6>
        <p className="card-text small">
          Quick example text to build on the card title and content.
        </p>
        <button type="button" className="btn btn-primary btn-sm">
          Action
        </button>
      </div>
    </div>
  )
}

export function FormShowcase() {
  return (
    <form style={{ width: '100%' }} onSubmit={(e) => e.preventDefault()}>
      <div className="mb-3">
        <label htmlFor="bsShowcaseEmail" className="form-label">
          Email
        </label>
        <input
          type="email"
          className="form-control"
          id="bsShowcaseEmail"
          placeholder="name@example.com"
        />
      </div>
      <div className="mb-3">
        <label htmlFor="bsShowcaseError" className="form-label">
          에러
        </label>
        <input
          type="text"
          className="form-control skin-error"
          id="bsShowcaseError"
          defaultValue="invalid-email"
        />
        <span className="skin-help skin-help--error">필수 입력 항목입니다</span>
      </div>
      <div className="form-check mb-3">
        <input className="form-check-input" type="checkbox" id="bsShowcaseAgree" defaultChecked />
        <label className="form-check-label" htmlFor="bsShowcaseAgree">
          I agree to the terms
        </label>
      </div>
      <button type="submit" className="btn btn-primary">
        Submit
      </button>
    </form>
  )
}

export function NavbarShowcase() {
  return (
    <nav className="navbar navbar-expand bg-body-tertiary border rounded px-2">
      <div className="container-fluid px-1">
        <a className="navbar-brand" href="#" onClick={(e) => e.preventDefault()}>
          Acme
        </a>
        <ul className="navbar-nav me-auto">
          {['Home', 'Docs', 'About'].map((link, i) => (
            <li className="nav-item" key={link}>
              <a
                className={`nav-link${i === 0 ? ' active' : ''}`}
                aria-current={i === 0 ? 'page' : undefined}
                href="#"
                onClick={(e) => e.preventDefault()}
              >
                {link}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}
