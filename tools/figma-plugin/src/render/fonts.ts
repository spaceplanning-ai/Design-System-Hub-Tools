/**
 * 폰트 적재 — **모든 실행(①②③)이 각자 처음에 호출한다.**
 *
 * [실제 Figma 로그가 알려 준 것]
 *   in appendChild: unloaded font "Pretendard SemiBold"
 *   [바인딩 실패] Info Glyph.fontWeight: unloaded font "Noto Sans Symbols2 Regular"
 *
 * 두 줄이 같은 뿌리다. Figma 텍스트 노드는 **문자마다 폰트가 갈린다**:
 *  - createText() 가 만든 노드는 문서 기본 폰트로 태어난다(파일마다 다르다 — Pretendard SemiBold 등).
 *  - 우리가 Inter 를 지정해도, Inter 에 글리프가 없는 문자(한글 '대시보드', 기호 '‹ › ✕ ⓘ')는
 *    런타임에 **다른 폰트로 폴백**된다. 그 폴백 폰트는 아무도 로드한 적이 없다.
 *  - 그 뒤로 그 노드에 하는 모든 쓰기(fontWeight 바인딩·fontSize·appendChild·재부모화)가
 *    "unloaded font …" 로 throw 한다.
 *
 * [왜 실행마다 다시 부르는가] 플러그인 메시지(①②③)는 각각 별개의 호출이고 **폰트 로드 상태는
 * 이어지지 않는다**. ②가 로드했으니 ③도 되겠지 하고 가정한 것이 ③의 중단 원인이었다.
 * (자기 검사 기록을 figma.root 플러그인 데이터로 넘겨야 했던 것과 같은 이유다.)
 */

/** 조립·문서가 실제로 지정하는 폰트 — 여기 없는 스타일을 쓰면 그 자리에서 터진다 */
const PRIMARY_FAMILIES: ReadonlyArray<{ family: string; styles: readonly string[] }> = [
  // Figma 기본 탑재. 라틴·숫자 본문
  { family: 'Inter', styles: ['Regular', 'Medium', 'Semi Bold', 'Bold'] },
  // 이 디자인 시스템의 타이포 토큰이 지정하는 한글 본문 폰트.
  // 스타일 표기가 Inter 와 다르다(SemiBold — 공백 없음). 문서 기본 폰트가 이것인 파일이 있어
  // (실제 로그의 "Pretendard SemiBold") 전 스타일을 미리 잡아 둔다.
  { family: 'Pretendard', styles: ['Regular', 'Medium', 'SemiBold', 'Bold'] },
];

/**
 * 폴백 후보 — 우리가 **지정하지 않아도** Figma 가 글리프를 찾아 끌어오는 폰트들.
 * 한글·기호 문자가 있는 레이어에서 실제로 관측됐다(로그의 Noto Sans Symbols2 / Noto Sans).
 * 설치돼 있지 않은 것은 조용히 건너뛴다 — 있는 것만 잡아 두면 된다.
 */
const FALLBACK_FAMILIES: ReadonlyArray<{ family: string; styles: readonly string[] }> = [
  { family: 'Noto Sans', styles: ['Regular', 'Medium', 'Bold'] },
  { family: 'Noto Sans KR', styles: ['Regular', 'Medium', 'Bold'] },
  { family: 'Noto Sans Symbols', styles: ['Regular', 'Medium'] },
  { family: 'Noto Sans Symbols2', styles: ['Regular'] },
  { family: 'Roboto', styles: ['Regular', 'Medium', 'Bold'] },
  { family: 'Apple SD Gothic Neo', styles: ['Regular', 'Medium', 'Bold'] },
  { family: 'Malgun Gothic', styles: ['Regular', 'Bold'] },
];

export interface LoadedFonts {
  /** 본문에 쓸 폰트 — 실제로 **로드에 성공한** 것만 돌려준다. 하나도 없으면 null */
  primary: FontName | null;
  /** 문서 기본 폰트 (createText 가 물려주는 것). 로드 실패면 null */
  documentDefault: FontName | null;
  /** 로드에 성공한 전체 목록 — 'family|style' */
  loaded: ReadonlySet<string>;
}

function key(font: FontName): string {
  return `${font.family}|${font.style}`;
}

/**
 * 문서 기본 폰트를 알아내 로드한다 — 무엇인지는 노드를 만들어 봐야 안다.
 * 프로브는 성공/실패 어느 쪽이든 반드시 걷어낸다(캔버스에 빈 텍스트가 쌓이지 않게).
 */
async function loadDocumentDefault(log: string[], loaded: Set<string>): Promise<FontName | null> {
  const probe = figma.createText();
  try {
    const font = probe.fontName;
    if (font === figma.mixed) return null;
    await figma.loadFontAsync(font);
    loaded.add(key(font));
    return font;
  } catch (error) {
    log.push(
      `[문서 기본 폰트 로드 실패] ${error instanceof Error ? error.message : String(error)}`,
    );
    return null;
  } finally {
    probe.remove();
  }
}

/**
 * 이 실행에서 쓸 폰트를 전부 로드한다.
 *
 * 개별 실패는 치명적이지 않다(그 폰트가 이 환경에 없을 뿐이다) — 건너뛰고 계속한다.
 * 대신 **무엇이 로드됐는지 돌려준다**: 호출자는 성공한 폰트만 노드에 지정해야 한다.
 * 로드하지 않은 폰트를 지정하는 것 자체가 "unloaded font" 예외의 원인이다.
 */
export async function loadAllFonts(log: string[]): Promise<LoadedFonts> {
  const loaded = new Set<string>();
  const documentDefault = await loadDocumentDefault(log, loaded);

  const tryLoad = async (family: string, style: string): Promise<FontName | null> => {
    const font: FontName = { family, style };
    if (loaded.has(key(font))) return font;
    try {
      await figma.loadFontAsync(font);
      loaded.add(key(font));
      return font;
    } catch {
      return null;
    }
  };

  const primaries: FontName[] = [];
  for (const spec of PRIMARY_FAMILIES) {
    for (const style of spec.styles) {
      const font = await tryLoad(spec.family, style);
      if (font !== null) primaries.push(font);
    }
  }

  // 폴백 후보 — 지정하지는 않지만 Figma 가 글리프를 찾아 끌어올 수 있는 폰트들.
  // 한글·기호가 든 레이어에서 실제로 관측된 실패 원인이라 **미리** 잡아 둔다.
  let fallbacks = 0;
  for (const spec of FALLBACK_FAMILIES) {
    for (const style of spec.styles) {
      if ((await tryLoad(spec.family, style)) !== null) fallbacks += 1;
    }
  }

  const primary =
    primaries.find((f) => f.family === 'Inter' && f.style === 'Regular') ??
    primaries[0] ??
    documentDefault;

  if (primary === null || primary === undefined) {
    log.push(
      '[경고] 쓸 수 있는 폰트를 하나도 로드하지 못했습니다 — 텍스트는 기본 폰트로 남습니다.',
    );
  }
  log.push(
    `폰트 로드 — 본문 ${String(primaries.length)}종 · 폴백 ${String(fallbacks)}종 · ` +
      `문서 기본 ${documentDefault === null ? '실패' : `${documentDefault.family} ${documentDefault.style}`}`,
  );

  return { primary: primary ?? null, documentDefault, loaded };
}

/** 이 폰트가 이번 실행에서 로드됐는가 — 지정 전에 반드시 확인한다 */
export function isLoaded(fonts: LoadedFonts, font: FontName): boolean {
  return fonts.loaded.has(key(font));
}

/**
 * 원하는 스타일 중 **로드된 것**을 고른다. 없으면 primary 로 물러선다.
 * (Inter 는 'Semi Bold', Pretendard 는 'SemiBold' 처럼 같은 굵기라도 표기가 다르다)
 */
export function pickStyle(
  fonts: LoadedFonts,
  family: string,
  styles: readonly string[],
): FontName | null {
  for (const style of styles) {
    const font: FontName = { family, style };
    if (isLoaded(fonts, font)) return font;
  }
  return fonts.primary;
}

/**
 * 토큰의 font-weight 값 → Figma 스타일명 후보를 **굵은 쪽부터 순서대로**.
 *
 * 후보가 여러 개인 이유는 **같은 굵기의 표기가 패밀리마다 다르기 때문**이다:
 * Inter 는 'Semi Bold'(공백 있음), Pretendard 는 'SemiBold'(공백 없음). 어느 쪽이 설치돼
 * 있는지는 파일·환경마다 다르므로 둘 다 시도하고, 없으면 한 단계 아래 굵기로 물러선다
 * (600 을 못 찾으면 Bold 보다 Medium 이 원래 의도에 가깝다).
 */
export function styleCandidatesForWeight(weight: number): readonly string[] {
  if (weight >= 700) return ['Bold', 'SemiBold', 'Semi Bold', 'Medium', 'Regular'];
  if (weight >= 600) return ['SemiBold', 'Semi Bold', 'Bold', 'Medium', 'Regular'];
  if (weight >= 500) return ['Medium', 'SemiBold', 'Semi Bold', 'Regular'];
  return ['Regular'];
}

/**
 * 이 굵기로 실제로 쓸 수 있는 폰트를 고른다 — **로드된 것만** 돌려준다.
 *
 * [왜 이 함수가 필요한가] Figma 텍스트의 굵기는 `fontWeight` 필드가 아니라 `fontName.style`
 * 이 정한다. 굵기 Variable 을 바인딩해도 그 스타일이 미로드면 `unloaded font "…"` 로 던지고,
 * 던지지 않더라도 노드는 Regular 로 남는다. 그래서 노드를 만들 때 스타일을 직접 고른다.
 *
 * 패밀리는 **primary 와 같은 것을 먼저** 본다 — 굵기 하나 때문에 레이어마다 패밀리가 갈리면
 * 라이브러리가 뒤죽박죽으로 보인다. 같은 패밀리에 그 굵기가 없을 때만 다른 패밀리로 넘어간다.
 * 어느 쪽에도 없으면 null 이 아니라 primary 를 돌려준다 — **미로드 폰트를 지정하는 것보다
 * 굵기가 틀린 편이 낫다**(지정 자체가 예외의 원인이다).
 */
export function fontForWeight(fonts: LoadedFonts, weight: number): FontName | null {
  const candidates = styleCandidatesForWeight(weight);
  const families: string[] = [];
  if (fonts.primary !== null) families.push(fonts.primary.family);
  for (const spec of PRIMARY_FAMILIES) {
    if (families.indexOf(spec.family) < 0) families.push(spec.family);
  }
  for (const family of families) {
    for (const style of candidates) {
      const font: FontName = { family, style };
      if (isLoaded(fonts, font)) return font;
    }
  }
  return fonts.primary;
}
