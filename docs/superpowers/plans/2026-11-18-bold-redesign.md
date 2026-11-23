# 리디자인 (셰이더 배경 · 모션 기반 · 메인 · 상세) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. 이 저장소에서는 `portfolio-worker` → `portfolio-verifier` → (통과 시) 다음 Task 순서로 돌리고, 마지막에 `portfolio-doc-writer`를 쓴다 (docs/methodology/subagent-driven-workflow.md).

> **상태 (2026-11-18)**: Task 1은 **완료·검증 통과**. Task 2~5는 사용자 피드백(D-020)으로 `2026-11-18-redesign-v2.md`가 대체한다. 이 파일은 Global Constraints·Review Focus·Task 2(모션 기반)의 상세 명세를 이어서 참조하는 용도로 남긴다.

**Goal:** D-019의 리디자인을 구현한다: 검정 바탕에 주황·파랑·마젠타 곡선이 흐르는 디더링 셰이더 배경, Lenis + GSAP 모션 기반, 시원한 메인 첫 화면, 목차·박스 중첩이 없는 상세 페이지.

**Architecture:** 색은 `globals.css` 토큰에만 정의하고 셰이더가 시작할 때 토큰을 읽어 uniform으로 쓴다(값의 출처가 한 곳). 배경은 서버 컴포넌트 셸(`Backdrop`, CSS 폴백 포함) + 클라이언트 캔버스(`BackdropCanvas`). 모션은 클라이언트 컴포넌트(`SmoothScroll`, `SplitReveal`, `CountUp`, `Reveal`)로 감싸서 서버 컴포넌트 페이지에 끼운다. 스크롤 진행도는 모듈 하나(`scroll-progress`)를 통해 Lenis → 셰이더로 전달한다.

**Tech Stack:** Next.js 16 App Router, CSS Modules, 순수 WebGL2(라이브러리 없음), `lenis`, `gsap`(+ScrollTrigger, SplitText), `@gsap/react`

**Spec:** `docs/decisions/D-019-redesign-bold-editorial.md` (그 안에서 D-018, D-016, D-011을 참조)

## Global Constraints

- 새 의존성은 `lenis`, `gsap`, `@gsap/react` 세 개만 허용한다. 서체 파일(Pretendard)은 저장소 안에 파일로 두는 것이 허용되고 npm 의존성이 아니다. 그 외는 추가하지 않는다. GSAP 설치 전에 `https://gsap.com/community/standard-license/`를 열어 상업적 사용 가능 여부를 확인하고 결과를 보고한다.
- 값(색·반경·글꼴·글래스 값)은 `globals.css`의 `:root` 토큰에만 정의하고 컴포넌트는 `var(--...)`만 쓴다(D-016). 컴포넌트 CSS·TSX에 색 리터럴을 새로 만들지 않는다. GLSL 안의 숫자 상수(노이즈 주파수 등)는 허용하지만 **팔레트 색은 토큰에서 읽는다**(`#rrggbb` 형식 토큰만 사용).
- 글래스(`.glass`)는 D-018 C 값(blur 7px, 굴절 scale 70, `--glass-base: rgba(8,14,18,0.35)`)을 유지하고 화면당 소수만 쓴다. 읽는 면 `.panel`은 본문 단락에만 쓴다.
- 글자 대비 4.5:1 이상(실제 렌더 픽셀 실측). **작은 글자(≈18px 미만)는 밝은 곡선 위에 직접 얹지 않는다**(어두운 영역·`.panel`·`.glass` 위에만). 큰 제목은 곡선 위에 있어도 되지만 실측한다.
- 움직이는 것은 `transform`/`opacity`/WebGL 캔버스뿐이다. 큰 요소에 `filter: blur` 금지.
- `prefers-reduced-motion: reduce`이면 Lenis를 만들지 않고, GSAP 연출은 최종 상태로 즉시 보이며, 셰이더는 한 프레임만 그린다.
- 제목·본문은 **항상 실제 DOM 텍스트**다. JS가 없거나 하이드레이션 전에도 읽혀야 한다(SplitText는 마운트 후에 분할).
- 한글은 `word-break: keep-all`(기존). 서체: 영문 제목 Geist(얇은 굵기 300), 한글 Pretendard 계열, 숫자 강조용 모노/픽셀 서체는 Task 4에서 고른다.
- 이 저장소에는 테스트 러너가 없다. 검증은 `typecheck`, `lint`, `build`, Playwright(헤드리스 Chromium) 스크린샷·측정으로 한다. Playwright는 프로젝트에 설치하지 않고 scratchpad의 `pw/`에서만 쓴다.
- 커밋·푸시는 사용자가 요청할 때만 한다. 새로 쓰는 코드·CSS·GLSL에는 "무엇을, 왜" 한국어 주석을 남긴다(사용자가 한 줄씩 설명할 수 있어야 한다).
- 히어로 문구 등 카피는 `apps/web/src/lib/site.ts`의 상수 한 곳에 둔다. 임시안(설계자의 제안): 제목 `Flow like water.`, 설명 `어디든 적응해 흐르는 프론트엔드 개발자`, 네비 `home / work / about / contact`, CTA `let's talk`. 연락처 주소·링크는 지어내지 않고 `#contact` 앵커로 둔다.

## Review Focus

1. **WebGL 불가·컨텍스트 소실**: 캔버스가 없어도 CSS 폴백 배경과 모든 글자가 그대로 읽혀야 한다 (Task 1에서 WebGL을 끄고 확인).
2. **reduced-motion**: rAF 루프 없음, Lenis 인스턴스 없음, 제목·숫자가 최종 상태로 보임 (Task 1·2·3).
3. **JS 없음·하이드레이션 전**: 히어로 제목과 설명이 SSR HTML에 텍스트로 있고 SplitText 이후에도 같은 텍스트다. 하이드레이션 경고가 콘솔에 없어야 한다 (Task 2·3).
4. **밝은 곡선 위 글자 대비**: 메인(vivid)과 상세에서 스크롤 위치별·시간별 최악 대비 ≥ 4.5 (작은 글자), 큰 제목은 실측값 보고 (Task 3·4).
5. **라우트 이동 누수**: 홈 ↔ 상세를 오가도 `ScrollTrigger.getAll().length`가 누적되지 않고 `gsap.ticker`에 리스너가 쌓이지 않으며 Lenis가 하나만 있다 (Task 2·3).
6. **모바일 390px**: 가로 스크롤 없음, 셰이더 해상도·효과 축소, sticky 네비 정상, FPS 샘플 보고 (Task 1·3·4).

---

### Task 1: 새 팔레트 토큰 + 셰이더 배경 (+ CSS 폴백)

**Files:**
- Modify: `apps/web/src/app/globals.css` (`--paint-*` 토큰 교체, 필요 시 `--accent`)
- Modify: `apps/web/src/components/Backdrop/Backdrop.tsx` (CSS 폴백 + `<BackdropCanvas />`)
- Modify: `apps/web/src/components/Backdrop/Backdrop.module.css` (폴백 색을 새 토큰으로, 캔버스 스타일)
- Create: `apps/web/src/components/Backdrop/BackdropCanvas.tsx`
- Create: `apps/web/src/components/Backdrop/backdrop.frag.ts`
- Create: `apps/web/src/components/Backdrop/webgl.ts`
- Create: `apps/web/src/lib/scroll-progress.ts`

**Interfaces:**
- Produces:
  - 토큰(모두 `#rrggbb`): `--paint-ember`(주황), `--paint-magenta`, `--paint-blue`, `--paint-navy`, `--paint-gold`(작은 하이라이트). 기존 `--paint-teal/cyan/deep/warm`은 삭제하고 사용처를 모두 교체한다. 제안값: ember `#ff6a2b`, magenta `#d9328a`, blue `#2f5bff`, navy `#0b1b4d`, gold `#ffb347`(조정 가능, 대비 실측 후 확정).
  - `Backdrop({ intensity }: { intensity?: "vivid" | "calm" }): JSX.Element` — 시그니처 불변. 서버 컴포넌트, 캔버스는 자식 클라이언트 컴포넌트.
  - `BackdropCanvas({ intensity }: { intensity: "vivid" | "calm" }): JSX.Element` — `"use client"`.
  - `scroll-progress.ts`: `export const scrollProgress: { current: number }` (0~1) 와 `export function setScrollProgress(value: number): void`. Task 1에서는 `BackdropCanvas`가 네이티브 `scroll` 이벤트로 이 값을 갱신하는 임시 연결을 둔다(Task 2에서 Lenis가 대체).
  - `webgl.ts`: `createFullscreenProgram(gl: WebGL2RenderingContext, fragmentSource: string): { program: WebGLProgram; uniforms: Record<string, WebGLUniformLocation | null> } | null` (컴파일 실패 시 `null`), `readPalette(el: Element, names: string[]): [number, number, number][]` (CSS 커스텀 프로퍼티의 `#rrggbb`를 0~1 RGB로).
  - `backdrop.frag.ts`: `export const backdropFragment: string` — uniform: `uTime`, `uResolution`, `uScroll`(0~1), `uIntensity`(calm 0.55, vivid 1.0), `uColors[5]`(ember, magenta, blue, navy, gold).
- Consumes: 없음 (D-018 C 값 `.glass`는 건드리지 않는다)

- [ ] **Step 1: 토큰을 교체하고 빌드가 깨지는 곳을 정리한다**

  `--paint-teal/cyan/deep/warm`을 새 토큰으로 바꾸고 이 토큰을 쓰는 모든 곳(`Backdrop.module.css`, `SiteNav.module.css`의 `.mark` 등)을 새 토큰으로 옮긴다. `grep -rn "paint-teal\|paint-cyan\|paint-deep\|paint-warm" apps/web/src` 결과가 0건이어야 한다.

- [ ] **Step 2: `webgl.ts`를 구현한다**

  `createFullscreenProgram`은 정점 셰이더(화면 전체를 덮는 삼각형 하나, 속성 버퍼 없이 `gl_VertexID` 사용)와 인자로 받은 프래그먼트 소스를 컴파일·링크하고, 실패하면 오류를 `console.warn`으로 남기고 `null`을 반환한다. 모든 `uniform` 위치를 이름으로 조회해 돌려준다. `readPalette`는 `getComputedStyle(el).getPropertyValue(name)`을 trim해 `#rrggbb` 파싱.

- [ ] **Step 3: `backdrop.frag.ts` 프래그먼트 셰이더를 작성한다** (알고리즘은 시그니처가 정하지 않으므로 방향만 고정)

  1. 화면 좌표를 정규화하고, `uTime`·`uScroll`로 천천히 흐르는 **도메인 워핑 사인/노이즈 밴드 2~3개**로 하나의 큰 곡선(휘감는 띠)을 만든다. 스크롤에 따라 띠의 위상이 이동한다.
  2. 띠의 값(0~1)을 `uColors`를 가로지르는 색 램프(navy → blue → magenta → ember → gold, 가장자리는 검정으로 감쇠)에 매핑한다. 바탕은 `--paper`에 가까운 검정이어야 하고 곡선은 화면의 일부만 차지한다(레퍼런스 #8).
  3. **베이어 4×4 순서 디더링**으로 각 채널을 6~8단계로 양자화한다(레퍼런스 #6). 캔버스를 낮은 해상도로 그린 뒤 `image-rendering: pixelated`로 확대하므로 디더 셀이 눈에 보이는 도트가 된다.
  4. **색 점 그레인**: `gl_FragCoord`와 시간 없는 해시로 아주 드문 밝은 점(밝은 곳에서 더 많이, 점 하나는 렌더 픽셀 1개, 색은 팔레트에서 무작위)을 더한다(레퍼런스 #8).
  5. `uIntensity`가 곡선의 밝기·면적을 조절한다(calm은 어둡고 작게).

- [ ] **Step 4: `BackdropCanvas.tsx`를 구현한다**

  `<canvas>`를 `position: fixed; inset: 0; z-index: -1; pointer-events: none`으로 두고(`Backdrop.module.css`), WebGL2 컨텍스트를 얻어 위 프로그램을 쓴다. 규칙: 렌더 스케일 데스크톱 0.5·720px 이하 0.35, 30fps 제한, `document.hidden`이거나 화면 밖(IntersectionObserver)이면 루프 정지, `prefers-reduced-motion`이면 한 프레임만 그리고 루프 없음, `webglcontextlost`를 처리(루프 정지 + 폴백 표시), 리사이즈 처리(렌더 스케일 유지), 언마운트 시 모든 리소스 해제. 첫 프레임을 그린 뒤 캔버스에 `data-ready="true"`를 붙이고 CSS에서 폴백 덩어리 레이어를 숨겨(`display: none`) 두 배경을 동시에 그리지 않는다. WebGL2를 못 얻거나 컴파일에 실패하면 아무것도 바꾸지 않고(폴백이 계속 보임) 끝난다. 임시 스크롤 연결: `scroll` 이벤트에서 `setScrollProgress(scrollY / (scrollHeight - innerHeight))`.

- [ ] **Step 5: 검증**

  Run: `pnpm --filter @portfolio/web typecheck && pnpm --filter @portfolio/web lint && pnpm --filter @portfolio/web build`
  Expected: 에러 0, 라우트 표 `/projects/sample-project ○`, `/projects/[slug] ◐`, `/ ○` 유지.
  Run: `grep -rnE "#[0-9a-fA-F]{3,8}|rgba?\(" apps/web/src --include=*.css --include=*.tsx` (globals.css와 `backdrop.frag.ts` 밖).
  Expected: 0건.
  Playwright로 `/projects/sample-project`(calm)와 `/`(임시 페이지, vivid로 시험하려면 `Backdrop intensity="vivid"`를 쓰는 테스트 페이지는 만들지 말고 `data-intensity`를 주입) 1440·390 스크린샷. Expected: 검정 바탕, 곡선, 디더 도트와 색 점이 보인다.
  WebGL 끄기(`--disable-webgl --disable-gpu` 또는 `getContext` 가로채기)로 다시 찍는다. Expected: CSS 폴백 배경이 보이고 글자가 읽힌다 (Review Focus 1).
  reduced-motion 에뮬레이션: Expected: 캔버스 rAF 호출 없음(스크립트로 `requestAnimationFrame`을 감싸 호출 수 확인), 정지 한 프레임.
  FPS 샘플: 10초간 rAF 간격 평균(데스크톱, 390px 에뮬레이션)을 보고(측정값, 합격선은 없음).
  Task 1 직후 상세 페이지 글자 대비를 새 배경에서 다시 측정(스크롤·시간별, `--ink-3` 포함)해 4.5 미만인 곳을 보고한다.

---

### Task 2: 모션 기반 (Lenis + GSAP)

**Files:**
- Modify: `apps/web/package.json` (+ `pnpm-lock.yaml`): `lenis`, `gsap`, `@gsap/react`
- Create: `apps/web/src/lib/motion.ts`
- Create: `apps/web/src/components/motion/SmoothScroll.tsx`
- Create: `apps/web/src/components/motion/SplitReveal.tsx`
- Create: `apps/web/src/components/motion/CountUp.tsx`
- Create: `apps/web/src/components/motion/Reveal.tsx`
- Modify: `apps/web/src/app/layout.tsx` (`<SmoothScroll />` 한 번 렌더)
- Modify: `apps/web/src/components/Backdrop/BackdropCanvas.tsx` (임시 scroll 이벤트 연결 제거, Task 1의 `scrollProgress`만 읽음)

**Interfaces:**
- Consumes: Task 1의 `scrollProgress` / `setScrollProgress`
- Produces:
  - `motion.ts`: `registerGsap(): void` (ScrollTrigger·SplitText를 한 번만 `gsap.registerPlugin`), `prefersReducedMotion(): boolean`.
  - `SmoothScroll(): null` — `"use client"`. 마운트 시 `prefersReducedMotion()`이면 아무것도 하지 않는다. 아니면 `new Lenis({ autoRaf: false })`, `lenis.on("scroll", ScrollTrigger.update)`, `gsap.ticker.add((t) => lenis.raf(t * 1000))`, `gsap.ticker.lagSmoothing(0)`을 설정하고 `lenis.on("scroll")`에서 `setScrollProgress`를 갱신한다. 언마운트·reduced-motion 변경 시 리스너·티커·Lenis를 모두 해제한다.
  - `SplitReveal(props: { as?: "h1" | "h2" | "h3" | "p"; children: string; className?: string; delay?: number; trigger?: "load" | "scroll" }): JSX.Element` — `"use client"`. SSR에서 `children`을 그대로 텍스트로 렌더. 마운트 후 `document.fonts.ready`를 기다려 SplitText로 **줄 단위 분할 + 마스크**, `yPercent: 110 → 0`, stagger. `useGSAP`으로 정리. reduced-motion이면 분할하지 않는다.
  - `CountUp(props: { to: number; duration?: number; decimals?: number; prefix?: string; suffix?: string; className?: string }): JSX.Element` — `"use client"`. SSR 텍스트는 **최종 값**. 마운트 후 화면에 들어올 때 0에서 `to`까지(ScrollTrigger). reduced-motion이면 최종 값 유지.
  - `Reveal(props: { children: React.ReactNode; y?: number; delay?: number; className?: string }): JSX.Element` — `"use client"`. 화면에 들어올 때 `opacity 0→1, y → 0`. SSR·JS 없음·reduced-motion에서는 보이는 상태.

- [ ] **Step 1: 라이선스를 확인하고 의존성을 설치한다**

  `https://gsap.com/community/standard-license/`를 열어 상업적 사용 가능 여부와 금지 조항을 요약해 보고한다. 이상 없으면 `pnpm --filter @portfolio/web add lenis gsap @gsap/react`. 설치된 정확한 버전을 보고한다(이전 패키지 `@studio-freight/lenis`는 쓰지 않는다).

- [ ] **Step 2: `motion.ts`, `SmoothScroll`을 구현한다**

  GSAP 플러그인 등록은 모듈 전역에서 한 번. `SmoothScroll`은 `useEffect`에서 만들고 cleanup에서 `lenis.destroy()`, `gsap.ticker.remove`, `lenis.off`. reduced-motion 미디어 쿼리의 `change` 이벤트도 처리한다. Lenis가 앵커(`href="#..."`) 이동을 부드럽게 하도록 `anchors: true`를 시험하고, 동작 여부를 보고한다.

- [ ] **Step 3: 세 컴포넌트를 구현한다**

  Interfaces 시그니처대로. 하이드레이션 전에 보이는 텍스트와 분할 후 텍스트가 같아야 한다(분할이 DOM을 바꾸므로 `aria-label`로 원문 유지 또는 `SplitText`의 `aria` 옵션 확인). 하이드레이션 불일치 경고가 없어야 한다.

- [ ] **Step 4: 시험용으로 연결하되 화면 디자인은 바꾸지 않는다**

  `layout.tsx`에 `<SmoothScroll />`. 동작 확인은 상세 페이지의 `h1`(`ProjectHero`)에 임시로 `SplitReveal`을 적용해서 본다(최종 적용은 Task 4). 이 임시 적용도 되돌리지 말고 보고에 적는다.

- [ ] **Step 5: 검증**

  Run: `pnpm --filter @portfolio/web typecheck && pnpm --filter @portfolio/web lint && pnpm --filter @portfolio/web build`
  Expected: 에러 0, 콘솔 하이드레이션 경고 없음.
  Playwright로 확인: (a) 스크롤 시 관성이 있다(`window.scrollY` 샘플이 휠 입력 후 여러 프레임에 걸쳐 수렴), (b) reduced-motion에서 `lenis` 인스턴스 없음·제목 즉시 최종 상태, (c) JS 비활성화(`javaScriptEnabled: false`)에서 제목 텍스트가 HTML에 있음, (d) 홈 ↔ 상세 클라이언트 이동을 5회 반복 후 `ScrollTrigger.getAll().length`가 증가하지 않고 `gsap.ticker`의 리스너가 누적되지 않음, (e) 셰이더 곡선이 스크롤에 따라 이동(스크롤 위치별 스크린샷 비교).

---

### Task 3: 메인 첫 화면

**Files:**
- Create: `apps/web/src/lib/site.ts`
- Modify: `apps/web/src/app/page.tsx` (연결 확인용 코드를 메인 화면으로 교체. `sectionSchema` 연결 확인은 `typecheck`가 이미 보증하므로 제거하되 `@portfolio/schemas`를 쓰는 곳이 `apps/web`에 남아 있는지 보고)
- Create: `apps/web/src/app/page.module.css`
- Modify: `apps/web/src/components/SiteNav/SiteNav.tsx`, `SiteNav.module.css`
- Create: `apps/web/src/components/home/Hero.tsx`, `Hero.module.css`
- Create: `apps/web/src/components/home/WorkList.tsx`, `WorkList.module.css`
- Create: `apps/web/src/components/home/Footer.tsx`, `Footer.module.css`
- Modify: `apps/web/src/app/layout.tsx` (서체: Geist 300 사용 가능하게, Pretendard 로컬 폰트)
- Add: `apps/web/src/app/fonts/` 아래 Pretendard Variable woff2 (라이선스 OFL 확인 후, 출처·라이선스를 파일 옆 주석 또는 README에 기록)

**Interfaces:**
- Consumes: Task 1 `Backdrop`, Task 2 `SplitReveal`, `Reveal`, `SmoothScroll`; `apps/web/src/lib/projects.ts`의 `getProjectSlugs`, `getProject`
- Produces:
  - `site.ts`: `export const siteCopy: { name: string; heroTitle: string; heroSubtitle: string; nav: { label: string; href: string }[]; cta: { label: string; href: string }; footerTitle: string }` (임시안 값은 Global Constraints)
  - `SiteNav(): JSX.Element` — 서버 컴포넌트 셸 + 필요한 클라이언트 부분(스크롤 방향에 따라 숨김/표시)은 `SiteNavClient` 등 하위로. 글래스 알약(`.glass`), 로고, `siteCopy.nav` 링크, 흰 알약 CTA 버튼(`--on-ink`/`--ink` 토큰). 현재 경로 표시(`aria-current`).
  - `Hero(): JSX.Element` — 화면 높이를 꽉 채움(`min-height: 100svh`), 중앙에 `SplitReveal`로 `heroTitle`(h1, `clamp`로 최대 화면 폭의 9vw 안팎, Geist 300), `heroSubtitle` 한 문장, 버튼 하나(`#work`로 이동), 아래에 스크롤 표시(회전·상하 움직임, reduced-motion 시 정지).
  - `WorkList(): Promise<JSX.Element>` — 서버 컴포넌트. 프로젝트마다 풀폭 행: 큰 번호(`01`), 큰 제목, 카테고리·기간, 우측 화살표. 호버 시 행 전체가 반응(글래스 카드 하나가 행 뒤로 떠오르는 방식도 시험해도 되나 글래스는 화면당 소수 제한을 지킨다). `id="work"`. 데이터는 `getProject`(샘플)로 읽는다.
  - `Footer(): JSX.Element` — `id="contact"`, 거대한 `footerTitle`(예: `Let's talk.`) 하나와 링크 자리(실제 주소가 없으므로 비워 두고 보고에 "채울 값" 목록으로 남긴다).

- [ ] **Step 1: 서체를 붙인다**

  Geist는 `next/font/google`에서 가변 굵기 300을 쓸 수 있게 설정, Pretendard Variable woff2를 `next/font/local`로 연결한다(`--font-sans`에서 한글 우선순위). Noto Sans KR 의존은 제거한다. 파일 출처와 라이선스를 확인해 보고한다. 숫자 강조용 서체는 Task 4에서 정한다.

- [ ] **Step 2: `SiteNav`, `Hero`, `WorkList`, `Footer`, `page.tsx`를 만든다**

  각 컴포넌트는 Interfaces대로. 레이아웃은 레퍼런스 #8: 요소가 적고 여백이 크며, 제목은 거대하게, 설명은 한 문장. `page.tsx`는 `<Backdrop intensity="vivid" />`, `<SiteNav />`, `<main>`에 Hero → WorkList → Footer. 작은 글자는 어두운 영역·글래스·패널 위에 둔다.

- [ ] **Step 3: 모션을 입힌다**

  히어로 제목 `SplitReveal`(load), 설명과 버튼 `Reveal`(지연), `WorkList` 행 `Reveal`(scroll), 번호 `CountUp`은 쓰지 않아도 된다. SiteNav의 스크롤 방향 숨김/표시(아래로 스크롤하면 숨고 위로 스크롤하면 나타남, `transform`만 사용, reduced-motion이면 항상 표시). 글래스 버튼 호버(`transform`).

- [ ] **Step 4: 검증**

  Run: `pnpm --filter @portfolio/web typecheck && pnpm --filter @portfolio/web lint && pnpm --filter @portfolio/web build`
  Expected: 에러 0, `/ ○` 유지, `grep` 색 리터럴 0건(규칙 동일).
  Playwright 1440·390 스크린샷과 확인: (a) 히어로 제목이 SSR HTML 텍스트로 존재(JS 끈 상태), (b) 스크롤 위치별·시간별 작은 글자 최악 대비 ≥ 4.5, 큰 제목 대비 실측 보고(vivid), (c) 가로 스크롤 없음, (d) 모바일 FPS 샘플 보고, (e) 홈 ↔ 상세 이동 반복 시 누수 없음(Review Focus 5), (f) reduced-motion에서 모든 텍스트가 즉시 보임, (g) 키보드 탭 이동 시 포커스 링이 보이고 네비 숨김 상태에서도 포커스가 닿으면 나타남.

---

### Task 4: 상세 페이지 리디자인

**Files:**
- Modify: `apps/web/src/app/projects/[slug]/page.tsx`, `page.module.css`
- Modify: `apps/web/src/components/sections/*.tsx`, `Section.module.css` (섹션 5종)
- Modify: `apps/web/src/app/layout.tsx` (숫자 강조용 서체가 필요하면)

**Interfaces:**
- Consumes: Task 2 `SplitReveal`, `CountUp`, `Reveal`; Task 3 `SiteNav`
- Produces: `SectionRenderer`와 섹션 컴포넌트의 **props 시그니처는 유지**한다(`section`, `index`). 페이지의 정적 셸 + `<Suspense>` 구조(D-015)와 `generateStaticParams`는 유지한다.

- [ ] **Step 1: 페이지 구조를 바꾼다**

  좌측 목차(`nav.toc`)와 `.body`의 2열 그리드를 없앤다. 히어로: 큰 제목(`SplitReveal` h1, 최대 화면 폭의 9vw 안팎), 한 문장 요약, 메타 정보는 상세 정보 **한 줄 가로 배열**(라벨 + 값, `.glass`는 정보 카드 하나에만). 섹션은 풀폭 띠로, 섹션 간 큰 여백, 큰 번호 + 큰 제목(`SplitReveal` scroll) + 본문 폭 제한(40em). `.panel`은 본문 단락에만.

- [ ] **Step 2: 섹션 5종을 다시 그린다**

  - markdown: 큰 제목 아래 본문 단락(`.panel` 또는 투명 + 어두운 영역), `Reveal`.
  - troubleshooting: 문제·원인·해결·결과 4행을 풀폭 행으로, 결과 행만 accent 강조.
  - metrics: 어두운 큰 카드(#6), 숫자는 거대하게(숫자 강조용 서체, `CountUp`, 단위는 작게). 숫자가 숫자 문자열인지 확인해 `to`로 변환하고, 숫자가 아니면 `CountUp` 없이 그대로 표시한다.
  - gallery: 큰 이미지, 호버 시 약한 확대(`transform`).
  - video: 풀폭 16:9 프레임.
  글래스는 정보 카드 하나와 네비만 유지하고(화면당 소수), 유리 뒤로 큰 번호·선이 지나가게 배치해서 굴절이 보이게 한다.

- [ ] **Step 3: 숫자 강조용 서체를 고른다**

  후보 2~3개(예: Geist Mono, 픽셀 서체 `next/font/google`에서 쓸 수 있는 것)를 같은 숫자로 렌더해 스크린샷으로 비교하고, 하나를 골라 이유를 보고한다(레퍼런스 #6의 픽셀 숫자 느낌).

- [ ] **Step 4: 검증**

  Run: `pnpm --filter @portfolio/web typecheck && pnpm --filter @portfolio/web lint && pnpm --filter @portfolio/web build`
  Expected: 에러 0, `/projects/sample-project ○`, `/projects/[slug] ◐` 유지, 색 리터럴 0건.
  Playwright 1440·390: (a) 좌측 목차가 없고 가로 스크롤 없음, (b) 섹션 5종이 모두 렌더되고 reduced-motion에서 모든 텍스트가 보임, (c) 스크롤 위치별·시간별 작은 글자 최악 대비 ≥ 4.5, (d) 정보 카드 굴절이 켰을 때와 껐을 때 차이가 이전(평균 차이 1~2)보다 커졌는지 측정 보고, (e) 누수 없음, (f) 메인과 같은 모션 규칙 일관성(스크린샷 비교).

---

### Task 5: 문서 정리와 최종 검증

**Files:**
- Modify (문서 작성자): `docs/decisions/D-017-detail-page-design.md`(상태 `대체됨(D-019)` 한 줄), `D-018`(확정 값·측정·트러블슈팅), `D-019`(확정 서체·팔레트 값, 라이선스 확인 결과, 측정값, 남은 질문), `docs/decisions/README.md`, `docs/history/design-choices.md`(리디자인 구현 장 추가)

- [ ] **Step 1: 전체 검증**

  Run: `pnpm build`
  Expected: schemas → web, api 순서로 통과.
  Playwright로 `/`, `/projects/sample-project`를 1440·390에서 스크롤 끝까지 훑는 최종 스크린샷, LCP(PerformanceObserver)와 FPS 샘플(데스크톱·390px 에뮬레이션)을 측정해 값으로 보고한다. Safari·Firefox는 **확인 못 함**으로 사용자에게 넘긴다(굴절 글래스·Lenis·WebGL2 동작 확인 목록을 적어 줄 것).

- [ ] **Step 2: 문서 작성자를 호출해 위 파일들을 갱신한다**

  Task 1~4의 작업자·검증자 보고를 모아 전달한다. 측정하지 않은 값은 "측정 전", 확인 못 한 것은 "확인 못 함"으로 쓰게 한다.

- [ ] **Step 3: 사용자와 만든 구조를 같이 읽는다**

  특히 `backdrop.frag.ts`(셰이더를 줄 단위로), `BackdropCanvas.tsx`(성능 장치), `SmoothScroll.tsx`(Lenis↔GSAP 연결), `SplitReveal.tsx`, `.glass` 두 `backdrop-filter` 선언.
