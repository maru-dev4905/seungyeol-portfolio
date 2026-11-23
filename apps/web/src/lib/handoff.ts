import type { ProjectMedia, Tint } from "@/lib/projects";
import { beginTransition, endTransition } from "@/lib/transition-gate";
import { beginTransitionKind, endTransitionKind, type TransitionKind } from "@/lib/transition-machine";
import type { SceneShape } from "@/components/scene/shapes";

// 목록의 이미지(홈 알약 썸네일·메뉴 창·Works 행 썸네일·다음 프로젝트)를 눌렀을 때, 그 이미지가 화면 전체로 커진 뒤
// 상세 페이지의 히어로 이미지 자리로 내려앉도록 "이어 주는" 아주 작은 신호 전달기.
// 눌린 쪽(발신)은 이동하면 사라지므로, 연출은 레이아웃에 있는 HandoffLayer가 맡는다.
// 둘은 서로를 모르고 이 모듈로만 이어진다(React 컨텍스트·라이브러리가 필요 없다).
export type Handoff = {
  href: string;
  /** 커지기 시작하는 이미지 칸의 화면 좌표(px). 이 사각형이 처음 "구멍(마스크)"이 된다 */
  rect: { x: number; y: number; w: number; h: number };
  /** 시작 모서리 반경(px). 커지면서 0으로 */
  radius?: number;
  tint: Tint;
  media?: ProjectMedia;
  /** 그림의 가로/세로 비율. 이 비율의 상자를 칸에 cover로 맞추면, 칸 안의 object-fit: cover 그림과 픽셀 단위로 같아진다 */
  ratio?: number;
  /**
   * 도착 후 마무리 방식.
   * settle = 새 페이지의 히어로 칸([data-handoff-target])으로 내려앉는다(프로젝트 상세)
   * slide  = 아래로 미끄러져 빠지며 새 페이지를 드러낸다(메뉴에서 Works·About으로 갈 때. 영상 21.4~21.7초)
   * (로고 -> 홈은 이 연출이 아니라 헤더의 "커튼"(프레임이 가운데로 모였다 열림)이다 -> lib/transition-machine.ts)
   */
  exit?: "settle" | "slide";
  /** 메뉴 프레임이 이전 페이지를 가리고 있다(메뉴에서 누름). true면 이동을 t=0에 하고, 아니면 확대가 끝난 뒤 한다 -> lib/transition-timeline.ts */
  framed?: boolean;
  /** 그림 대신 셰이더 오브젝트(메뉴 창의 Works·About·홈 hover 장면)를 커지게 한다 */
  scene?: SceneShape;
  /**
   * 시작 칸의 <img sizes> 값. 확대 면이 같은 sizes로 한 장을 더 그리면 브라우저가 이미 받은 파일(캐시)을 그대로 써서
   * 첫 프레임부터 그림이 보인다. 화면 크기(100vw) 파일은 면이 화면을 다 덮은 뒤에 받아 그 위에 얹는다.
   */
  sizes?: string;
};

/** 목업 장면 이미지의 비율(n11_mockups.py가 모두 1920x1200으로 만든다) */
export const MOCKUP_RATIO = 1920 / 1200;

/**
 * 전환·썸네일·히어로가 보여 줄 그림: 목업이 있으면 목업, 없으면 원래 미디어.
 * 커지기 시작하는 칸과 도착한 히어로가 같은 그림이어야 하므로, 이 그림을 쓰는 곳은 모두 이 함수를 거친다.
 */
export function mockupMedia(media?: ProjectMedia): ProjectMedia | undefined {
  return media?.mockup ? { image: media.mockup } : media;
}

/**
 * 같은 선택자가 여러 개일 때 "지금 화면에 그려진" 첫 요소를 고른다.
 * 왜: Cache Components(React Activity)는 이전 페이지를 display:none으로 숨긴 채 DOM에 남겨 둔다.
 * querySelector만 쓰면 숨은 페이지의 히어로(크기 0)를 집어 0x0 사각형으로 내려앉는 뒤틀림이 생긴다.
 */
export function visibleQuery<T extends Element = HTMLElement>(selector: string, root: ParentNode = document): T | null {
  for (const el of root.querySelectorAll<T & Element>(selector)) {
    if (el.getClientRects().length > 0) return el;
  }
  return null;
}

let listener: ((h: Handoff) => void) | null = null;
// 지금 진행 중인 이어받기 전환의 종류(상태 기계의 자물쇠 종류). 메뉴에서 눌렀으면 nav, 아니면 enter
let active: TransitionKind | null = null;
// 새 페이지 등장 연출을 붙잡고 있는 신호등을 아직 풀지 않았는가(풀기는 한 번만)
let gateHeld = false;

export function onHandoff(fn: (h: Handoff) => void): () => void {
  listener = fn;
  return () => {
    if (listener === fn) listener = null;
  };
}

/** 연출 중인가. 상세 페이지의 히어로가 자기 등장 연출을 건너뛸지 정할 때도 쓴다 */
export function isHandoffActive(): boolean {
  return active !== null;
}

/**
 * 새 페이지의 등장 연출(Reveal 등)을 시작시킨다. 타임라인의 ENTER 시작 시각에 부른다 -> 확대 면이 걷히는 것과 같은 시각에 등장이 시작된다.
 * (연출이 완전히 끝날 때까지 기다리지 않는다: 그러면 면이 다 걷힌 뒤에야 등장해 사이에 빈 시간이 생긴다)
 */
export function releaseHandoffGate(): void {
  if (!gateHeld) return;
  gateHeld = false;
  endTransition();
}

/** HandoffLayer가 연출을 마치거나(정상) 취소하면(뒤로 가기 등) 부른다 */
export function endHandoff(): void {
  if (!active) return; // 이미 끝난 연출을 또 끝내도 신호등 횟수가 어긋나지 않게
  const kind = active;
  active = null;
  releaseHandoffGate(); // 아직 안 풀었다면(취소 등) 여기서 푼다
  endTransitionKind(kind); // 상태 기계의 자물쇠도 푼다(입력을 다시 받는다)
}

/**
 * 연출을 시작한다. 받는 쪽(HandoffLayer)이 없으면 false -> 호출한 쪽이 그냥 이동한다.
 * 다른 전환(커튼·페이드 포함)이 이미 진행 중이면 true만 돌려주고 무시한다(연달아 눌러도 한 번만 시작, 큐에 쌓지 않는다).
 */
export function startHandoff(h: Handoff): boolean {
  if (!listener) return false;
  const kind: TransitionKind = h.framed ? "nav" : "enter";
  if (!beginTransitionKind(kind)) return true;
  active = kind;
  gateHeld = true;
  beginTransition(); // 연출이 끝날 때까지 새 페이지의 등장 연출을 미룬다(transition-gate)
  listener(h);
  return true;
}
