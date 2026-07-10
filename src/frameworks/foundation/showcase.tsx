import cssText from 'foundation-sites/dist/css/foundation.min.css?inline'

/**
 * 크로스 프레임워크 비교 페이지용 대표 스트립.
 * 호출측이 FrameworkScope(styles=[css])로 감싼다 — 여기서는 순수 마크업만 제공.
 * 각 컴포넌트는 약 360px 셀 안에 들어가도록 컴팩트하게 유지한다.
 */
export const css = cssText

export function ButtonShowcase() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
      <button type="button" className="button small" style={{ margin: 0 }}>
        Primary
      </button>
      <button type="button" className="button small secondary" style={{ margin: 0 }}>
        Secondary
      </button>
      <button type="button" className="button small success" style={{ margin: 0 }}>
        Success
      </button>
      <button type="button" className="button small hollow" style={{ margin: 0 }}>
        Hollow
      </button>
      <button type="button" className="button small disabled" style={{ margin: 0 }} disabled>
        Disabled
      </button>
    </div>
  )
}

export function AlertShowcase() {
  return (
    <div style={{ maxWidth: '21rem' }}>
      <div className="callout success" style={{ marginBottom: '0.5rem' }}>
        Changes saved successfully.
      </div>
      <div className="callout alert" style={{ marginBottom: 0 }}>
        Something went wrong. Try again.
      </div>
    </div>
  )
}

export function CardShowcase() {
  return (
    <div className="card" style={{ width: '16rem', marginBottom: 0 }}>
      <div className="card-divider">
        <strong>Card title</strong>
      </div>
      <div className="card-section">
        <p style={{ marginBottom: '0.5rem' }}>
          Quick example text to build on the card title and content.
        </p>
        <button type="button" className="button small" style={{ margin: 0 }}>
          Action
        </button>
      </div>
    </div>
  )
}

export function FormShowcase() {
  return (
    <form onSubmit={(e) => e.preventDefault()}>
      <label>
        Email
        <input type="email" placeholder="name@example.com" style={{ marginBottom: '12px' }} />
      </label>
      <label>
        에러
        <input
          type="email"
          className="skin-error"
          defaultValue="invalid-email"
          style={{ marginBottom: 0 }}
        />
      </label>
      <span className="skin-help skin-help--error" style={{ marginBottom: '12px' }}>
        필수 입력 항목입니다
      </span>
      <label htmlFor="fdShowcaseAgree" style={{ marginBottom: '12px' }}>
        <input id="fdShowcaseAgree" type="checkbox" defaultChecked /> I agree to the terms
      </label>
      <button type="submit" className="button" style={{ margin: 0 }}>
        Submit
      </button>
    </form>
  )
}

export function NavbarShowcase() {
  return (
    <div className="top-bar" style={{ border: '1px solid #e6e6e6', padding: '0.25rem 0.5rem' }}>
      <div className="top-bar-left">
        <ul className="menu">
          <li className="menu-text">Acme</li>
          {['Home', 'Docs', 'About'].map((link, i) => (
            <li className={i === 0 ? 'is-active' : undefined} key={link}>
              <a
                href="#"
                aria-current={i === 0 ? 'page' : undefined}
                onClick={(e) => e.preventDefault()}
              >
                {link}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
