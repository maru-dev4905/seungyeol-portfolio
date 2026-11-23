# 어두운 토큰 · CSS 폴백 배경 · 굴절 글래스 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** D-018의 1단계: 사이트의 색 토큰을 어두운 바탕으로 바꾸고, CSS 폴백 배경과 SVG 굴절 `.glass`를 만들어 `/projects/sample-project`에 적용한다.

**Architecture:** 값은 `globals.css` 토큰 한 곳에서 바꾸고(D-016), 컴포넌트 CSS에 박혀 있던 밝은 색 리터럴은 토큰으로 옮긴다. 굴절은 숨은 SVG 필터 하나(`GlassFilters`)를 레이아웃에 한 번 두고 `.glass`가 `backdrop-filter: url(#...)`로 참조한다. 지원하지 않는 브라우저는 선언이 무시되어 블러로 남는다.

**Tech Stack:** Next.js 16 App Router, CSS Modules, 순수 CSS/SVG (새 의존성 없음)

**Spec:** `docs/decisions/D-018-dark-grain-shader-and-refraction-glass.md`

## Global Constraints

- 새 npm 의존성을 추가하지 않는다.
- 값(색·반경·글꼴)은 `globals.css`의 `:root` 토큰에만 정의하고 컴포넌트는 `var(--...)`만 쓴다 (D-016). 컴포넌트 CSS에 색 리터럴을 새로 만들지 않는다.
- 글래스 요소는 화면당 소수(상세 페이지는 네비게이션 + 정보 패널 2개)로 유지한다 (D-011).
- 움직이는 것은 `transform`뿐이고 `filter: blur`는 큰 요소에 쓰지 않는다. `prefers-reduced-motion`이면 배경이 멈춘다.
- 글자 대비 4.5:1 이상 (본문·보조 글자가 `.panel`과 `.glass` 위에서).
- `Backdrop`의 props(`intensity?: "vivid" | "calm"`)는 바꾸지 않는다 (2단계 셰이더가 같은 인터페이스를 쓴다).
- 이 저장소에 테스트 러너가 없으므로 검증은 `typecheck`, `lint`, `build`, 헤드리스 Chromium 스크린샷으로 한다.
- 커밋·푸시는 사용자가 요청할 때만 한다 (HANDOFF 규칙 5). 이 계획에는 커밋 단계를 넣지 않았다.
- 작업이 끝나면 만든 구조를 사용자와 같이 읽는다. 막힌 문제는 D-018 "트러블슈팅"에 기록한다.

## Review Focus

1. Safari·Firefox처럼 굴절 `backdrop-filter`를 못 쓰는 브라우저: 선언이 무시되어도 블러 유리와 글자가 그대로 읽혀야 한다 (Task 3에서 `@supports`와 선언 순서로 확인).
2. 가장 밝은 빛 덩어리 아래에 놓인 유리·패널 위 글자: 대비가 4.5:1 아래로 떨어지지 않아야 한다 (Task 1·4 대비 측정).
3. `prefers-reduced-motion: reduce`: 배경 덩어리가 멈추고 화면은 여전히 어둡고 읽혀야 한다 (Task 2).
4. 모바일 폭(390px): 덩어리 수 축소, 정보 패널 2열, 굴절이 레이아웃을 깨지 않아야 한다 (Task 4 스크린샷).
5. `GlassFilters`의 필터 `id`가 문서에 한 번만 있어야 한다. 레이아웃에서 한 번만 렌더하므로 페이지 이동 후에도 중복이 없어야 한다 (Task 3).

---

### Task 1: 어두운 토큰과 컴포넌트 색 리터럴 정리

**Files:**
- Modify: `apps/web/src/app/globals.css` (`:root` 토큰, `.glass`, `.panel`, `color-scheme`)
- Modify: `apps/web/src/app/projects/[slug]/page.module.css` (`.spec`, `.link`, `.link:hover`, `.linkPrimary`, `.linkPrimary:hover`, `.bar`)
- Modify: `apps/web/src/components/sections/Section.module.css` (`.step[data-key="result"]`, `.video`)
- Modify: `apps/web/src/components/SiteNav/SiteNav.module.css` (`.mark`, `.where`)

**Interfaces:**
- Produces (토큰, 이후 Task가 사용): `--paper`, `--ink`, `--ink-2`, `--ink-3`, `--accent`, `--hairline`, `--paint-teal`, `--paint-cyan`, `--paint-deep`, `--paint-warm`, `--surface-chip`, `--surface-chip-hover`, `--surface-accent-soft`, `--surface-sunken`, `--on-ink` (반전 버튼 위 글자색), `--glow` (테두리 빛). 기존 `--paint-peach/lilac/sky/mint`는 삭제하고 사용처를 새 토큰으로 바꾼다.

- [ ] **Step 1: `:root`를 어두운 값으로 교체한다**

  `color-scheme: dark`. 제안 팔레트(만들어 보고 조정 가능, 이 값은 설계자의 제안이다): `--paper: #06090c`, `--ink: #f2f6f8`, `--ink-2: #b7c3ca`, `--ink-3: #8896a0`, `--accent: #7fe3d6`, `--hairline: rgba(255,255,255,0.12)`, `--paint-teal: #1c8f97`, `--paint-cyan: #8fe9e0`, `--paint-deep: #123f66`, `--paint-warm: #ff8a4c`. `--surface-*`는 흰색 알파 4~14% 범위, `--surface-accent-soft`는 `--accent`의 알파 10%.

- [ ] **Step 2: `.glass`와 `.panel`을 어두운 표면으로 바꾼다**

  `.glass`: 배경은 흰색 알파 8%→3% 그라데이션, `backdrop-filter: blur(24px) saturate(160%)`, 테두리 `1px solid rgba(255,255,255,0.18)`, 안쪽 위 가장자리 `inset 0 1px 0 var(--glow)`. 그림자는 어둡게. `@supports not` 폴백은 `rgba(20,28,34,0.9)`. `.panel`: 배경 `rgba(12,18,24,0.72)`, 블러 없음, 테두리 `rgba(255,255,255,0.1)`.

- [ ] **Step 3: 컴포넌트 CSS의 밝은 색 리터럴을 토큰으로 옮긴다**

  `rgba(255,255,255,…)`, `#fff`, `#2b2a33`, `var(--ink)` 배경에 `#fff` 글자 같은 값을 `--surface-*`, `--on-ink`로 교체한다. `.step[data-key="result"]` 배경은 `--surface-accent-soft`. `.mark`의 그라데이션은 `--paint-cyan → --paint-teal → --paint-deep`. `.linkPrimary`는 밝은 `--ink` 배경에 `--on-ink`(어두운 글자). 이 세 파일에서 `rgba(255, 255, 255`와 `#fff`로 grep했을 때 `.glass`/`.panel`/토큰 정의 밖에 남는 게 없어야 한다.

- [ ] **Step 4: 검증**

  Run: `pnpm --filter @portfolio/web typecheck && pnpm --filter @portfolio/web lint`
  Expected: 에러 0.
  Run: `grep -rnE "#fff|rgba\(255, ?255, ?255" apps/web/src --include=*.css`
  Expected: 결과가 `globals.css`의 토큰·`.glass`·`.panel` 정의 줄에만 있다.

- [ ] **Step 5: 대비를 숫자로 확인한다**

  임시 스크립트(스크래치 디렉터리)로 WCAG 상대 휘도 대비를 계산해 `--ink`, `--ink-2`, `--ink-3`, `--accent`가 `--paper`와 `.panel`이 `--paint-cyan`(가장 밝은 빛) 위에 얹혔을 때의 합성색 위에서 모두 4.5:1 이상인지 출력한다.
  Expected: 모든 쌍이 ≥ 4.5. 미달이면 해당 토큰을 조정한다.

---

### Task 2: 어두운 CSS 폴백 `Backdrop`

**Files:**
- Modify: `apps/web/src/components/Backdrop/Backdrop.module.css`
- Modify: `apps/web/src/components/Backdrop/Backdrop.tsx` (덩어리 색 클래스 이름이 바뀌면 맞춘다)

**Interfaces:**
- Consumes: Task 1의 `--paper`, `--paint-teal`, `--paint-cyan`, `--paint-deep`, `--paint-warm`
- Produces: `Backdrop({ intensity }: { intensity?: "vivid" | "calm" })` 시그니처는 그대로. `data-intensity` 속성 규약(`vivid`/`calm`)도 그대로.

- [ ] **Step 1: 덩어리 4개를 어두운 팔레트로 바꾼다**

  `.b1`은 `--paint-cyan`(작고 밝은 중심 빛), `.b2`는 `--paint-teal`(큰 본체), `.b3`은 `--paint-deep`, `.b4`는 `--paint-warm`(작고 흐리게, 팔레트 시험용). 크기·애니메이션(transform만)은 기존 구조를 유지한다. 덩어리 하나가 화면 가장자리에서 **어두운 영역이 남도록** 배치한다(이미지의 "검은 바탕 + 한 덩어리 빛").

- [ ] **Step 2: 그레인을 어두운 바탕에서 보이게 바꾼다**

  `mix-blend-mode: multiply`는 검은 바탕에서 보이지 않는다. 그레인 SVG 색을 밝은 입자로 바꾸고 `mix-blend-mode: overlay` 또는 `soft-light`로 합성한다. 불투명도는 `calm`이 `vivid`보다 낮다. 밝기 가중은 CSS로 정확히 낼 수 없으므로(셰이더에서 처리, D-018) 여기서는 근사만 한다.

- [ ] **Step 3: `calm`과 모바일과 reduced-motion 규칙을 유지한다**

  `.root[data-intensity="calm"] .blob { opacity }`는 어두운 바탕에서 읽히는 값(0.5 안팎)으로 조정한다. 720px 이하에서 `.b4` 숨김과 느린 애니메이션, `prefers-reduced-motion`에서 `animation: none`을 유지한다.

- [ ] **Step 4: 검증**

  Run: `pnpm --filter @portfolio/web typecheck && pnpm --filter @portfolio/web lint`
  Expected: 에러 0.
  Run: `pnpm --filter @portfolio/web dev` 후 `http://localhost:3000/projects/sample-project` 데스크톱(1440px) 스크린샷.
  Expected: 어두운 바탕에 청록 빛이 번지고 그레인이 눈에 보이며, 글자가 읽힌다. 브라우저 설정에서 reduced-motion을 켜고 다시 열었을 때 덩어리가 움직이지 않는다.

---

### Task 3: SVG 굴절 `.glass`

**Files:**
- Create: `apps/web/src/components/Glass/GlassFilters.tsx`
- Modify: `apps/web/src/app/layout.tsx` (`<body>` 안에 `<GlassFilters />`를 한 번 렌더)
- Modify: `apps/web/src/app/globals.css` (`.glass`에 굴절 선언 추가)

**Interfaces:**
- Produces: `GlassFilters(): JSX.Element` — 서버 컴포넌트, props 없음. 문서에 `id="glass-refraction"`인 `<filter>`를 가진 보이지 않는 `<svg>` 하나를 만든다. `.glass`가 이 id를 참조한다.
- Consumes: Task 1의 `.glass`

- [ ] **Step 1: `GlassFilters`를 만든다**

  `<svg width="0" height="0" aria-hidden="true" focusable="false" style={{position:"absolute"}}>` 안에 `<filter id="glass-refraction" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">`. `display: none`은 쓰지 않는다(필터가 동작하지 않는 브라우저가 있다). 필터 구성은 `feImage`(굴절 맵) → `feDisplacementMap`(`in="SourceGraphic"`, `in2`=맵, `scale` 20~40 범위에서 조정, `xChannelSelector="R"`, `yChannelSelector="G"`). 굴절 맵은 `preserveAspectRatio="none"`으로 요소 크기에 늘어나는 SVG data URI이고, **중앙은 중립색(128,128)이라 왜곡이 없고 가장자리 띠에서만 R·G 채널이 치우치게** 만든다(rounded-rect 가장자리 그라데이션). 맵이 요소 비율에 따라 늘어나므로 네비게이션(알약)과 정보 패널(둥근 사각형) 두 곳에서 모두 가장자리가 자연스러운지 눈으로 보고 `scale`과 띠 두께를 맞춘다. 이 부분은 D-018의 "굴절 맵 방식" 미정 항목이므로, 가장자리 맵이 안 맞으면 `feTurbulence` 대안을 시험하고 결과를 D-018 "트러블슈팅"에 기록한다.

- [ ] **Step 2: `layout.tsx`에 한 번만 렌더한다**

  `<body>` 첫 자식으로 `<GlassFilters />`. 페이지가 아니라 레이아웃에 두는 이유(페이지 이동 시 중복 id 방지)를 컴포넌트 위 주석 한 줄로 남긴다.

- [ ] **Step 3: `.glass`에 굴절을 점진적 향상으로 추가한다**

  블러 선언(`backdrop-filter: blur(24px) saturate(160%)`)을 먼저 쓰고, 바로 아래에 굴절을 포함한 선언(`backdrop-filter: url(#glass-refraction) blur(…) saturate(…)`)을 덧붙인다. 지원하지 않는 브라우저는 뒤 선언을 파싱 단계에서 버리고 앞 선언을 쓴다. `-webkit-backdrop-filter`는 블러 선언 쪽에만 둔다. `@supports not (backdrop-filter…)` 폴백은 그대로 둔다. `.glass` 안쪽 글자는 필터 영향을 받지 않아야 한다(필터는 요소 뒤 배경에만 적용된다).

- [ ] **Step 4: 검증**

  Run: `pnpm --filter @portfolio/web typecheck && pnpm --filter @portfolio/web lint && pnpm --filter @portfolio/web build`
  Expected: 에러 0, `/projects/sample-project ○`, `/projects/[slug] ◐` 유지(D-017).
  Run: dev 서버에서 헤드리스 Chromium 스크린샷(데스크톱), 같은 위치에서 `.glass`의 `backdrop-filter`를 DevTools로 `blur`만 남겼을 때와 비교.
  Expected: 굴절 선언이 있을 때 유리 가장자리에서 배경이 휘어 보이고 글자는 휘지 않는다.
  Run: 브라우저에서 `document.querySelectorAll('#glass-refraction').length`
  Expected: `1`. 홈 → 상세 이동 후에도 `1`.
  Safari·Firefox는 사용자가 직접 열어 블러 유리로 읽히는지 확인한다(이 환경에서는 검증할 수 없음, 결과를 사용자에게 요청).

---

### Task 4: 상세 샘플 전체 확인과 기록

**Files:**
- Modify: `apps/web/src/app/projects/[slug]/page.module.css`, `apps/web/src/components/sections/Section.module.css` (확인 중 어색한 곳만)
- Modify: `docs/decisions/D-018-dark-grain-shader-and-refraction-glass.md` (확정된 팔레트, 굴절 맵 방식, 트러블슈팅)
- Modify: `docs/decisions/D-017-detail-page-design.md` (상태 줄에 "배경·색 해석은 D-018이 대체" 한 줄)
- Modify: `docs/decisions/README.md` (D-018 상태 갱신, 남은 질문 정리)

**Interfaces:**
- Consumes: Task 1~3 결과

- [ ] **Step 1: 데스크톱 1440px, 모바일 390px 스크린샷을 찍는다**

  `/projects/sample-project` 전체. 본문 `.panel` 섹션 5종(markdown, troubleshooting, metrics, gallery, video)이 모두 읽히는지, 목차와 칩과 링크 버튼이 어두운 바탕에서 어색하지 않은지 본다. 모바일에서 정보 패널 2열과 한 열 본문이 유지되는지 본다.

- [ ] **Step 2: 어색한 곳을 고치고 대비를 다시 측정한다**

  Task 1 Step 5의 스크립트를 다시 돌려 모두 ≥ 4.5를 확인한다.

- [ ] **Step 3: 결정 기록을 갱신한다**

  D-018: 확정한 팔레트 값, 굴절 맵 방식과 `scale`, 막혔던 문제(원인→해결), 브라우저 확인 결과. D-017: 위 한 줄. README: D-018 상태와 "메인 인터랙션 구체화와 색 팔레트" 항목 갱신.

- [ ] **Step 4: 최종 검증**

  Run: `pnpm build`
  Expected: schemas → web, api 순서로 통과.
  그리고 사용자와 변경한 파일(특히 `GlassFilters.tsx`, `.glass`의 두 `backdrop-filter` 선언 순서, `Backdrop.module.css`)을 같이 읽는다.
