import type { MouseEvent } from 'react'
import cssText from 'materialize-css/dist/css/materialize.min.css?inline'

// 비교 셀(~360px)용 컴팩트 쇼케이스. FrameworkScope 없이 순수 마크업만 제공한다.
export const css = cssText

// 데모 링크 이동 방지
const noNav = (e: MouseEvent) => e.preventDefault()

export function ButtonShowcase() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
      <button type="button" className="btn">
        Default
      </button>
      <button type="button" className="btn teal">
        Teal
      </button>
      <button type="button" className="btn red">
        Red
      </button>
      <button type="button" className="btn-flat">
        Flat
      </button>
      <button type="button" className="btn disabled" disabled>
        Disabled
      </button>
    </div>
  )
}

export function AlertShowcase() {
  return (
    <div style={{ maxWidth: '340px' }}>
      <div
        className="card-panel green lighten-4 green-text text-darken-3"
        role="alert"
        style={{ padding: '12px 16px', margin: '0 0 8px' }}
      >
        Deploy succeeded — all checks passed.
      </div>
      <div
        className="card-panel red lighten-4 red-text text-darken-3"
        role="alert"
        style={{ padding: '12px 16px', margin: 0 }}
      >
        Build failed — see the error log.
      </div>
    </div>
  )
}

export function CardShowcase() {
  return (
    <div className="card" style={{ maxWidth: '320px', margin: 0 }}>
      <div className="card-content">
        <span className="card-title">Weekly digest</span>
        <p>Three new components shipped this week.</p>
      </div>
      <div className="card-action">
        <a href="#" onClick={noNav}>
          Read more
        </a>
      </div>
    </div>
  )
}

export function FormShowcase() {
  return (
    // 셀 폭(~330px)을 그대로 채운다. 폼 스킨(비교 그리드에서 주입)이 라벨을 상단 고정(static)으로
    // 바꾸므로 float 헤드룸 패딩은 불필요, 라벨을 인풋 앞에 배치한다. active는 시맨틱 유지용.
    <div>
      <div className="input-field" style={{ margin: '0 0 12px' }}>
        <label htmlFor="mzShowcaseEmail" className="active">
          Email
        </label>
        <input id="mzShowcaseEmail" type="email" defaultValue="jane@example.com" />
      </div>
      <div className="input-field" style={{ margin: '0 0 12px' }}>
        <label htmlFor="mzShowcaseError" className="active">
          에러
        </label>
        <input id="mzShowcaseError" type="email" className="skin-error" defaultValue="invalid-email" />
        <span className="skin-help skin-help--error">필수 입력 항목입니다</span>
      </div>
      <p style={{ margin: '0 0 12px' }}>
        <label>
          <input type="checkbox" defaultChecked />
          <span>Remember me</span>
        </label>
      </p>
      <button type="button" className="btn">
        Submit
      </button>
    </div>
  )
}

export function NavbarShowcase() {
  return (
    <nav style={{ height: '48px', lineHeight: '48px' }}>
      <div className="nav-wrapper teal">
        <a
          href="#"
          className="brand-logo"
          style={{ paddingLeft: '12px', fontSize: '1.3rem' }}
          onClick={noNav}
        >
          Acme
        </a>
        <ul className="right">
          <li className="active">
            <a href="#" onClick={noNav}>
              Home
            </a>
          </li>
          <li>
            <a href="#" onClick={noNav}>
              Docs
            </a>
          </li>
          <li>
            <a href="#" onClick={noNav}>
              About
            </a>
          </li>
        </ul>
      </div>
    </nav>
  )
}
