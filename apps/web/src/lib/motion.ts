import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// GSAP 플러그인 등록. 필요한 플러그인만 import해서 번들을 작게 둔다.
// registerPlugin은 여러 번 불러도 안전하지만, 컴포넌트마다 effect에서 부르게 되므로 한 번만 하도록 막아 둔다.
// 서버(SSR)에서는 DOM이 없으므로 등록하지 않는다: 이 함수는 항상 effect(브라우저) 안에서만 부른다.
// SplitText는 여기서 등록하지 않는다: 여기서 import하면 모든 페이지(SmoothScroll도 이 파일을 쓴다)의 번들에 SplitText가 들어간다.
// SplitReveal이 자기 파일에서 import해 SplitText.create 직전에 직접 등록한다.
let registered = false;
export function registerGsap(): void {
  if (registered || typeof window === "undefined") return;
  gsap.registerPlugin(ScrollTrigger);
  registered = true;
}

// "움직임 줄이기" 설정인지. 모션 컴포넌트와 SmoothScroll이 같은 기준을 쓰도록 한 곳에 둔다.
// 서버에서는 판단할 수 없으므로 false(= 서버 HTML은 항상 최종 상태의 텍스트다).
export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// 고정 헤더(54px + 위 12px 여백)에 섹션 제목이 가려지지 않도록 앵커 이동 때 남기는 위쪽 여백(px)
export const ANCHOR_OFFSET = 80;

// Lenis 인스턴스를 다른 컴포넌트(하단 섹션 알약)가 쓸 수 있게 SmoothScroll이 등록해 둔다.
// 움직임 줄이기이거나 아직 만들기 전이면 null -> 호출하는 쪽이 브라우저 기본 스크롤(즉시 이동)로 대신한다.
// stop/start: 드로어가 열린 동안 페이지 스크롤을 잠그고 푸는 데 쓴다(Lenis의 stop/start)
export type Scroller = {
  scrollTo: (target: number | HTMLElement, options?: { offset?: number; immediate?: boolean; force?: boolean }) => void;
  stop: () => void;
  start: () => void;
};
let scroller: Scroller | null = null;
export function setScroller(next: Scroller | null): void {
  scroller = next;
}
export function getScroller(): Scroller | null {
  return scroller;
}

// ------------------------------------------------------------------
// 등장 모션 문법(About·Contact·Works 공통). 값을 여기 한 곳에서만 정하고 컴포넌트는 가져다 쓴다.
// CSS가 직접 도는 곳(히어로 진입, 드로어, 아코디언)은 globals.css의 같은 이름 토큰(--ease-reveal, --dur-enter, --stagger, --distance)을 쓴다.
// 문법: 한 섹션 = 한 타임라인. 구분선(좌->우) -> 라벨 -> 제목 줄(마스크) -> 이미지(clip) -> 본문 -> 목록 행(스태거) 순서로 겹쳐 흐른다.
// ------------------------------------------------------------------
export const MOTION = {
  ease: "power3.out", // 모든 진입 곡선(CSS 쪽 --ease-reveal과 같은 곡선)
  enter: 0.9, // 진입 기본 길이(초)
  line: 1.0, // 제목 줄 마스크 reveal 길이
  rule: 1.2, // 구분선이 그려지는 시간
  media: 1.2, // 이미지 clip 길이
  mediaScale: 1.6, // 이미지 내부 scale 1.08 -> 1
  mediaScaleFrom: 1.08,
  stagger: 0.08, // 줄·행·항목 사이 간격
  distance: 24, // fade-up 이동거리(px)
  start: "top 88%", // 화면 아래에서 12% 올라오면 시작
  // 한 섹션 타임라인 안에서 각 단계가 시작하는 시각(초)
  at: { rule: 0, label: 0.05, line: 0.1, media: 0.2, body: 0.35, item: 0.45 },
} as const;
