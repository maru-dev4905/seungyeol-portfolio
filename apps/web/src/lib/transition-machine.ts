// 페이지 전환 "상태 기계". 전환이 여러 곳(헤더의 커튼, HandoffLayer, PageFade)에 흩어져 서로의 상태를 몰라 꼬이던 것을,
// "지금 어떤 전환이 진행 중인가"를 한 곳(이 모듈)에 두고 모든 입력(메뉴 버튼·로고·메뉴 링크·알약·일반 링크)이 먼저 이 자물쇠를 묻게 해서 푼다.
//
// 전환은 정확히 5종이다(메뉴 열기·닫기는 자물쇠 없이 CSS 상태 하나(data-open)가 전부라 전환 종류에 넣지 않는다 = 연타해도 "지금 값에서" 되돌아간다).
//
// | 종류  | 시작 입력                      | 단계(시간은 lib/transition-timeline.ts)                                                          | 이동(push)                | 게이트(새 페이지 등장) 해제 시각        | 자물쇠 해제         |
// |-------|--------------------------------|--------------------------------------------------------------------------------------------------|---------------------------|------------------------------------------|---------------------|
// | menu  | Menu 버튼, 메일 버튼           | 열림: 덮는 층(홈=구멍/상세=목업/그 외=형태)이 아래서 올라옴 + 프레임 4조각 .23s+.71s -> 내용 .47s~ | 없음                      | 없음(페이지가 그대로 있다)               | 없음(자물쇠 안 씀)  |
// | nav   | 메뉴의 Works·About·알약        | OUT 0~900ms(창 -> 전체 확대, 프레임 조각 같이 물러남) -> ENTER 900~1800ms(걷힘·새 페이지 등장)    | t=0(프레임이 가리는 중)   | ENTER 시작(900ms)                        | 면이 걷힌 뒤        |
// | home  | 로고(메뉴 열림/닫힘 무관)      | IN 170+400ms(프레임이 가운데로 모여 화면 전체를 가림) -> 가린 채 이동·대기(>=140ms) -> OUT 170+400ms(열림) | IN이 끝난 시각(완전히 가림) | OUT이 끝난 시각 + 50ms(홈 요소는 그 뒤)  | OUT이 끝난 뒤       |
// | enter | 홈 알약, Works 행, 다음 프로젝트 | OUT 0~900ms(썸네일 -> 전체 확대) -> 이동 -> ENTER 900~1800ms(히어로로 내려앉음)                   | OUT이 끝난 시각(전체 덮음) | ENTER 시작(도착 + OUT 끝)                | 내려앉기가 끝난 뒤  |
// | fade  | 일반 링크(푸터·Works 링크 등)  | 페이지가 160ms 투명 -> 이동 -> 260ms 나타남(PageFade)                                             | 160ms                     | 페이드 인 시작                           | 페이드 인 시작      |
//
// 규칙:
//  - 한 번에 하나만 진행한다. 진행 중에 들어온 입력(연타·다른 링크·Menu 버튼)은 무시한다(큐에 쌓지 않는다 -> 끝난 뒤 뒤늦게 실행되는 일이 없다).
//  - 브라우저 뒤로/앞으로 가기는 사용자의 의도가 우선이라 진행 중인 전환을 취소(cancelTransition)하고 자물쇠를 푼다.
//  - 각 전환의 주인(HandoffLayer·SiteHeader·PageFade)은 언마운트될 때 반드시 endTransitionKind를 불러 자물쇠가 남지 않게 한다.
//  - 안전장치: 어떤 이유로든 SAFETY_MS 안에 끝나지 않으면 자물쇠를 강제로 푼다(영원히 입력이 막히는 일이 없게).
// 의존성이 없는 아주 작은 모듈이다(서버·클라이언트 어디서든 import 가능).

export type TransitionKind = "nav" | "home" | "enter" | "fade";

const SAFETY_MS = 12000;

let current: TransitionKind | null = null;
let safety = 0;
const cancelers = new Set<() => void>();

/** 지금 진행 중인 전환(없으면 null) */
export function activeTransition(): TransitionKind | null {
  return current;
}

/** 입력을 받아도 되는가. false면 호출한 쪽은 입력을 무시한다 */
export function isTransitionLocked(): boolean {
  return current !== null;
}

/** 전환을 시작한다. 이미 진행 중이면 false(호출한 쪽은 입력을 무시한다) */
export function beginTransitionKind(kind: TransitionKind): boolean {
  if (current !== null) return false;
  current = kind;
  if (typeof window !== "undefined") {
    window.clearTimeout(safety);
    safety = window.setTimeout(cancelTransition, SAFETY_MS);
  }
  return true;
}

/** 전환이 끝났다. 시작한 종류와 같을 때만 푼다(늦게 도착한 옛 전환의 정리가 새 전환을 풀지 않게) */
export function endTransitionKind(kind: TransitionKind): void {
  if (current !== kind) return;
  current = null;
  if (typeof window !== "undefined") window.clearTimeout(safety);
}

/** 전환의 주인이 "취소되면 이렇게 정리한다"를 등록한다(뒤로 가기·안전장치). 반환값은 등록 해제 */
export function onTransitionCancel(fn: () => void): () => void {
  cancelers.add(fn);
  return () => {
    cancelers.delete(fn);
  };
}

/** 진행 중인 전환을 모두 취소한다: 주인들이 자기 정리를 하고, 자물쇠를 푼다 */
export function cancelTransition(): void {
  if (current === null) return;
  [...cancelers].forEach((fn) => fn());
  current = null;
  if (typeof window !== "undefined") window.clearTimeout(safety);
}
