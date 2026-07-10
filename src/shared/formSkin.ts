// 소프트 모던 폼 스킨 (토스/무신사풍) — 오너 참조 디자인 지시(2026-07-10).
// FrameworkScope의 styles 배열에서 프레임워크 CSS "뒤에" 추가해 Shadow DOM 안에서만
// 폼 컨트롤을 재스킨한다. 색값은 tokens/toss.json 팔레트를 미러링한 고정값이다
// (프레임워크 스코프는 noDsTheme이라 --ds-* 변수가 없다).
//
// 상태 표기용 공용 클래스 (모든 프레임워크에서 동일하게 사용):
//   .skin-error / .skin-success        → 인풋에 직접 부여하는 상태 보더
//   .skin-help / .skin-help--error / .skin-help--success → 헬퍼 메시지 텍스트

export const formSkinCss = `
/* ── 텍스트 계열 컨트롤 공통 ── */
input[type='text'], input[type='email'], input[type='password'], input[type='search'],
input[type='number'], input[type='tel'], input[type='url'], input[type='date'],
select, textarea,
.form-control, .form-select, .input, .textarea {
  font-family: 'Pretendard', -apple-system, 'Inter', system-ui, sans-serif !important;
  font-size: 15px !important;
  color: #191F28 !important;
  background: #F7F8FA !important;
  border: 1.5px solid transparent !important;
  border-radius: 10px !important;
  padding: 11px 14px !important;
  height: auto !important;
  line-height: 1.45 !important;
  box-shadow: none !important;
  outline: none !important;
  transition: background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease !important;
}
select { padding-right: 34px !important; }
textarea, .textarea { min-height: 88px; resize: vertical; }

::placeholder { color: #B0B8C1 !important; opacity: 1 !important; }

/* 포커스: 흰 배경 + 블루 보더 + 소프트 링 */
input:focus, select:focus, textarea:focus,
.form-control:focus, .form-select:focus, .input:focus, .textarea:focus,
.input.is-focused, .is-focused {
  background: #FFFFFF !important;
  border-color: #3D6BFF !important;
  box-shadow: 0 0 0 3px rgba(61, 107, 255, 0.12) !important;
}

/* 비활성/읽기전용 */
input:disabled, select:disabled, textarea:disabled,
.form-control:disabled, .input[disabled] {
  background: #F2F4F6 !important;
  color: #B0B8C1 !important;
  -webkit-text-fill-color: #B0B8C1;
  border-color: transparent !important;
  cursor: not-allowed;
}
input[readonly]:not([type='checkbox']):not([type='radio']),
.form-control[readonly] {
  background: #F2F4F6 !important;
  border-color: transparent !important;
}

/* ── 에러 상태 (프레임워크별 훅 + 공용 .skin-error) ── */
input.skin-error, textarea.skin-error, select.skin-error,
.form-control.is-invalid, input.is-invalid,
.input.is-danger, .textarea.is-danger,
input.is-invalid-input, textarea.is-invalid-input,
.ui.form .field.error input, .ui.form .field.error textarea, .ui.form .field.error select,
input[aria-invalid='true'], textarea[aria-invalid='true'] {
  background: #FFFFFF !important;
  border-color: #F04452 !important;
}
input.skin-error:focus, .form-control.is-invalid:focus, .input.is-danger:focus,
input.is-invalid-input:focus, .ui.form .field.error input:focus,
input[aria-invalid='true']:focus {
  box-shadow: 0 0 0 3px rgba(240, 68, 82, 0.12) !important;
}

/* ── 정상(성공) 상태 ── */
input.skin-success, textarea.skin-success, select.skin-success,
.form-control.is-valid, input.is-valid,
.input.is-success, .textarea.is-success,
.ui.form .field.success input {
  background: #FFFFFF !important;
  border-color: #00C471 !important;
}
input.skin-success:focus, .form-control.is-valid:focus, .input.is-success:focus {
  box-shadow: 0 0 0 3px rgba(0, 196, 113, 0.12) !important;
}

/* ── 헬퍼 메시지 ── */
.skin-help {
  display: block;
  margin-top: 6px;
  font-family: 'Pretendard', -apple-system, 'Inter', system-ui, sans-serif;
  font-size: 12px;
  line-height: 1.4;
  color: #8B95A1;
}
.skin-help--error { color: #F04452; }
.skin-help--success { color: #00C471; }

/* 프레임워크 자체 피드백 텍스트도 같은 팔레트로 통일 */
.invalid-feedback, .form-error, .help.is-danger { color: #F04452 !important; font-size: 12px !important; }
.valid-feedback, .help.is-success { color: #00C471 !important; font-size: 12px !important; }
.ui.form .error .pointing.label, .ui.pointing.label, .ui.pointing.red.label {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  color: #F04452 !important;
  padding: 6px 0 0 !important;
  margin: 0 !important;
  font-size: 12px !important;
}
.ui.pointing.label::before { display: none !important; }

/* ── 필드 라벨(상단 고정형) ── */
.form-label, .bulma-skin-label, .label:not(.checkbox):not(.radio),
.ui.form .field > label, .input-field > label, .sk-field-label {
  font-family: 'Pretendard', -apple-system, 'Inter', system-ui, sans-serif !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  color: #4E5968 !important;
  margin-bottom: 6px !important;
}
label { font-family: 'Pretendard', -apple-system, 'Inter', system-ui, sans-serif; color: #333D4B; }

/* ── 체크박스/라디오: 브라우저 렌더 + 블루 액센트 ── */
input[type='checkbox'], input[type='radio'] {
  accent-color: #3D6BFF;
  width: 18px;
  height: 18px;
}

/* ── Materialize 보정: 언더라인+플로팅 라벨 → 라벨 상단 고정 박스형 ── */
.input-field { margin-top: 0 !important; }
.input-field > label,
.input-field > label.active {
  position: static !important;
  transform: none !important;
  display: block;
  pointer-events: auto;
}
.input-field input, .input-field textarea { margin-bottom: 0 !important; }

/* ── Semantic 보정: 필드 간격을 12px 리듬으로 ── */
.ui.form .field { margin-bottom: 12px !important; }
.ui.form .field:last-child { margin-bottom: 0 !important; }
`
