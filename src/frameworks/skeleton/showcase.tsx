import normalize from 'normalize.css/normalize.css?inline'
import skeleton from 'skeleton-css/css/skeleton.css?inline'

// 비교 셀(~360px)용 컴팩트 쇼케이스.
// Skeleton 에 없는 컴포넌트(알럿/카드/내비게이션)는 최소한의 CSS 로 흉내낸다.
const emulationCss = `
.sk-showcase .button,
.sk-showcase button,
.sk-showcase input[type="submit"] {
  padding: 0 15px;
  margin-bottom: 0;
}
.sk-alert {
  padding: .75rem 1rem;
  border-radius: 4px;
  margin-bottom: .75rem;
}
.sk-alert:last-child {
  margin-bottom: 0;
}
.sk-alert--success {
  border-left: 4px solid #5CB85C;
  background: #F1F9F1;
  color: #3D8B3D;
}
.sk-alert--danger {
  border-left: 4px solid #D9534F;
  background: #FBEDEC;
  color: #A94442;
}
.sk-card {
  border: 1px solid #E1E1E1;
  border-radius: 4px;
  background: #fff;
  padding: 1.5rem;
}
.sk-card__footer {
  border-top: 1px solid #E1E1E1;
  margin-top: 1rem;
  padding-top: .75rem;
  color: #888;
  font-size: 1.2rem;
}
.sk-navbar {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: .75rem 1rem;
  border-bottom: 1px solid #E1E1E1;
  background: #fff;
}
.sk-navbar a {
  color: #555;
  text-decoration: none;
}
.sk-navbar a.is-active {
  color: #1EAEDB;
  font-weight: 600;
}
`

export const css = [normalize, skeleton, emulationCss].join('\n')

export function ButtonShowcase() {
  return (
    <div className="sk-showcase" style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap' }}>
      <button type="button" className="button-primary">
        Primary
      </button>
      <button type="button" className="button">
        Default
      </button>
      <button type="button" className="button" disabled style={{ opacity: 0.5 }}>
        Disabled
      </button>
    </div>
  )
}

export function AlertShowcase() {
  return (
    <div>
      <div role="alert" className="sk-alert sk-alert--success">
        <strong>All set.</strong> Your profile has been updated.
      </div>
      <div role="alert" className="sk-alert sk-alert--danger">
        <strong>Error.</strong> We could not reach the server.
      </div>
    </div>
  )
}

export function CardShowcase() {
  return (
    <div className="sk-card" style={{ maxWidth: 320 }}>
      <h6 style={{ marginBottom: '.5rem' }}>Quarterly report</h6>
      <p style={{ marginBottom: 0 }}>A lightweight summary of activity this quarter.</p>
      <div className="sk-card__footer">Updated just now</div>
    </div>
  )
}

export function FormShowcase() {
  return (
    <form
      className="sk-showcase"
      style={{ marginBottom: 0 }}
      onSubmit={(e) => e.preventDefault()}
    >
      <label htmlFor="skShowcaseEmail">Email</label>
      <input
        className="u-full-width"
        type="email"
        id="skShowcaseEmail"
        placeholder="name@example.com"
        style={{ marginBottom: 12 }}
      />
      <label htmlFor="skShowcaseError">에러</label>
      <input
        className="u-full-width skin-error"
        type="email"
        id="skShowcaseError"
        defaultValue="invalid-email"
        style={{ marginBottom: 0 }}
      />
      <span className="skin-help skin-help--error" style={{ marginBottom: 12 }}>
        필수 입력 항목입니다
      </span>
      <label style={{ marginBottom: 12 }}>
        <input type="checkbox" defaultChecked />
        <span className="label-body">Subscribe to the newsletter</span>
      </label>
      <input className="button-primary" type="submit" value="Submit" />
    </form>
  )
}

export function NavbarShowcase() {
  return (
    <nav className="sk-navbar">
      <strong>Acme</strong>
      <a href="#" className="is-active" onClick={(e) => e.preventDefault()}>
        Home
      </a>
      <a href="#" onClick={(e) => e.preventDefault()}>
        Docs
      </a>
      <a href="#" onClick={(e) => e.preventDefault()}>
        About
      </a>
    </nav>
  )
}
