import type { CSSProperties } from "react";

// 페이지 전환의 "단일 타임라인" 상수. 확대 면(HandoffLayer), 메뉴 프레임 조각(MenuOverlay.module.css), 새 페이지 진입(Reveal 등을 푸는 시점),
// 홈 요소의 복귀 페이드가 모두 여기 값만 쓴다(CSS는 <html>에 실리는 --tl-* 변수로 읽는다 = timelineCssVars).
//
// 원인(측정, 이전 구현): 프레임 조각은 지연 0.21s + 0.83s + 곡선 A, 확대 면은 지연 0.18s + 1.05s + 곡선 B, 이동은 확대가 끝난 뒤 0.15s 대기,
// 새 페이지 진입은 도착 후 0.37s 대기 + 1.0s(곡선 C)였다. 세 구간이 시작·길이·곡선이 모두 달라 끝나는 시각이 어긋나고 사이에 빈 시간이 생겼다.
// 해결: 두 구간으로 나누고 각 구간의 모든 요소가 같은 (지연, 길이, 곡선)을 쓴다.
//
//   t = 0 클릭
//   OUT   0 ~ 900ms  : 프레임 조각이 물러나는 것 = 확대 면이 창에서 화면 전체로 커지는 것(조각 안쪽 가장자리와 면 가장자리가 같은 진행도라 항상 맞닿는다)
//   ENTER 900 ~ 1800 : 새 페이지 진입 = 확대 면이 걷히는 것(내려앉기·아래로 빠지기·녹아 사라지기) = 새 페이지 요소 등장(게이트 해제) = 홈 요소 복귀
//                      OUT이 끝나는 바로 그 프레임에 시작한다(사이 대기 없음, 겹침 없음)
//   이동(router.push): 프레임이 가리고 있을 때(메뉴에서)는 t=0에 한다(새 페이지가 가려진 채 준비된다). 가리는 게 없을 때는 OUT 끝에 한다.
export const TL = {
  out: { delay: 0, ms: 900, ease: "cubic-bezier(0.65, 0, 0.35, 1)" },
  enter: { ms: 900, ease: "cubic-bezier(0.215, 0.61, 0.355, 1)" }, // GSAP power3.out(Reveal·MediaReveal이 쓰는 곡선)과 같다
  /**
   * 로고 -> 홈 "커튼"(닫힘 -> 이동 -> 열림). Metalab 실측(/work/nike, /about 각 1회 이상, 클릭 0ms 기준, 프레임 조각 진행도 p):
   *   라우팅 42~62ms(옛 페이지는 조각 구멍으로 계속 보임) / 닫힘 지연 약 170ms + 약 400ms(p=0.5는 약 380ms, 완전히 가려지는 시각 약 580ms)
   *   / 가린 채 대기 약 800ms(새 페이지 준비) / 열림 약 1400ms 시작, 약 410ms(p=0.5는 약 1580ms) / 열림 곡선도 닫힘과 거의 같은 in-out
   * 최소제곱 맞춤: 닫힘 cubic-bezier(.68,.05,.35,.92), 열림 cubic-bezier(.54,.16,.37,.87) -> 둘의 중간값 하나로 쓴다.
   * holdMs: 새 페이지가 도착한 뒤 가린 채 기다리는 최소 시간(홈 배경이 첫 프레임을 그리고 나서 열리게 한다)
   */
  curtain: { delay: 170, ms: 400, ease: "cubic-bezier(0.62, 0.1, 0.36, 0.9)", holdMs: 140 },
  /** 내려앉은 뒤 아래 히어로(같은 그림)로 넘겨 주는 짧은 겹침. 타임라인 구간이 아니라 이음매 */
  handoverMs: 120,
} as const;

/** CSS가 같은 값을 읽도록 <html style>에 싣는다(루트 레이아웃에서 한 번) */
export const timelineCssVars = {
  "--tl-out-ms": `${TL.out.ms}ms`,
  "--tl-out-delay": `${TL.out.delay}ms`,
  "--tl-out-ease": TL.out.ease,
  "--tl-enter-ms": `${TL.enter.ms}ms`,
  "--tl-enter-ease": TL.enter.ease,
  "--tl-curtain-ms": `${TL.curtain.ms}ms`,
  "--tl-curtain-delay": `${TL.curtain.delay}ms`,
  "--tl-curtain-ease": TL.curtain.ease,
} as CSSProperties;
