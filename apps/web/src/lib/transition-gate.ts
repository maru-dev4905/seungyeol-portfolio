// "페이지 전환 중" 신호등. 전환 연출(이미지 이어받기 면 HandoffLayer, 링크 클릭 때의 페이드 PageFade)이 진행되는 동안 켜져 있다.
// 새 페이지의 등장 연출(Reveal·MediaReveal·CountUp)은 이 신호등이 꺼질 때까지 시작을 미룬다.
// 왜: 새 페이지는 이전 페이지의 퇴장 연출이 끝나기 전에 이미 마운트된다. 그때 바로 등장 연출을 돌리면
//     확대 면(HandoffLayer) 뒤에서 혼자 끝나 버려 사용자는 다 끝난 화면만 보거나, 이전 페이지의 퇴장과 새 페이지의 등장이 한 화면에서 겹친다.
// 의존성이 없는 아주 작은 모듈이다(서버·클라이언트 어디서든 import 가능하고, gsap을 끌고 오지 않는다).

let busy = 0;
const waiters = new Set<() => void>();

/** 전환 연출을 시작한다. 여러 연출이 겹쳐도 되도록 횟수로 센다(모두 끝나야 꺼진다) */
export function beginTransition(): void {
  busy += 1;
}

/** 전환 연출이 끝났다(또는 취소됐다). 마지막 하나가 끝나면 기다리던 등장 연출을 모두 시작시킨다 */
export function endTransition(): void {
  busy = Math.max(0, busy - 1);
  if (busy > 0) return;
  const run = [...waiters];
  waiters.clear();
  run.forEach((fn) => fn());
}

export function isTransitionBusy(): boolean {
  return busy > 0;
}

/** 전환이 없을 때는 cb를 바로, 있으면 끝난 뒤에 부른다. 반환값은 취소 함수(컴포넌트가 정리될 때 부른다) */
export function whenTransitionIdle(cb: () => void): () => void {
  if (busy === 0) {
    cb();
    return () => {};
  }
  waiters.add(cb);
  return () => {
    waiters.delete(cb);
  };
}
