import cssText from './tailwind.generated.css?inline'

// 비교용 컴팩트 쇼케이스 (~360px 셀) — 순수 프레젠테이션, FrameworkScope 없음
// Tailwind JIT scans this file: every class must be a full literal string.
export const css = cssText

export function ButtonShowcase() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700"
      >
        Primary
      </button>
      <button
        type="button"
        className="rounded-lg bg-gray-700 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-gray-800"
      >
        Neutral
      </button>
      <button
        type="button"
        className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-green-700"
      >
        Success
      </button>
      <button
        type="button"
        className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
      >
        Outline
      </button>
      <button
        type="button"
        className="cursor-not-allowed rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white opacity-50"
        disabled
      >
        Disabled
      </button>
    </div>
  )
}

export function AlertShowcase() {
  return (
    <div className="space-y-2">
      <div className="rounded-md border-l-4 border-green-400 bg-green-50 px-3 py-2 text-sm text-green-800" role="alert">
        <span className="font-semibold">Success.</span> Your changes have been saved.
      </div>
      <div className="rounded-md border-l-4 border-red-400 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
        <span className="font-semibold">Error.</span> Something went wrong.
      </div>
    </div>
  )
}

export function CardShowcase() {
  return (
    <div className="max-w-xs rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <h5 className="text-sm font-semibold text-gray-900">Weekly digest</h5>
      <p className="mt-1 text-sm leading-relaxed text-gray-600">
        A summary of activity across your projects, every Monday.
      </p>
      <button
        type="button"
        className="mt-3 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700"
      >
        Enable
      </button>
    </div>
  )
}

export function FormShowcase() {
  // 표준 폼 셀: 라벨 위 배치, w-full 입력, #E5E7EB 보더, 12px 세로 간격, 좌측 정렬 블루(#3D6BFF) Submit
  return (
    <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
      <div>
        <label htmlFor="twShowcaseEmail" className="mb-1.5 block text-[13px] font-semibold text-gray-700">
          Email
        </label>
        <input
          type="email"
          id="twShowcaseEmail"
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-[#3D6BFF] focus:outline-none focus:ring-2 focus:ring-[#3D6BFF]/30"
          placeholder="name@example.com"
        />
      </div>
      <div>
        <label htmlFor="twShowcaseError" className="mb-1.5 block text-[13px] font-semibold text-gray-700">
          에러
        </label>
        {/* 비교 그리드가 formSkinCss를 주입하므로 .skin-error가 에러 보더(#F04452)를 적용한다 */}
        <input
          type="email"
          id="twShowcaseError"
          className="skin-error w-full rounded-lg border border-red-400 px-3 py-2 text-sm shadow-sm"
          defaultValue="invalid-email"
          aria-invalid="true"
        />
        <p className="skin-help skin-help--error">필수 입력 항목입니다</p>
      </div>
      <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
        <input type="checkbox" className="h-4 w-4 rounded accent-[#3D6BFF]" defaultChecked />
        Remember me
      </label>
      <button
        type="submit"
        className="rounded-lg bg-[#3D6BFF] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#2F5BF0] active:bg-[#2450DB] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3D6BFF] focus-visible:ring-offset-2"
      >
        Submit
      </button>
    </form>
  )
}

export function NavbarShowcase() {
  return (
    <nav className="flex items-center gap-1 rounded-lg bg-gray-800 px-3 py-2 shadow-md">
      <span className="mr-3 flex items-center gap-1.5">
        <span className="h-4 w-4 rounded bg-indigo-400"></span>
        <span className="text-sm font-semibold text-white">Acme</span>
      </span>
      <a href="#" className="rounded-md bg-gray-700/60 px-2.5 py-1 text-xs font-medium text-white" onClick={(e) => e.preventDefault()}>
        Home
      </a>
      <a href="#" className="rounded-md px-2.5 py-1 text-xs font-medium text-gray-300 transition-colors hover:bg-gray-700/40 hover:text-white" onClick={(e) => e.preventDefault()}>
        Docs
      </a>
      <a href="#" className="rounded-md px-2.5 py-1 text-xs font-medium text-gray-300 transition-colors hover:bg-gray-700/40 hover:text-white" onClick={(e) => e.preventDefault()}>
        About
      </a>
    </nav>
  )
}
