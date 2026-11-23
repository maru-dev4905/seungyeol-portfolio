"use client";

import { useEffect, type RefObject } from "react";
import { isTransitionBusy, whenTransitionIdle } from "@/lib/transition-gate";

/**
 * CSS 애니메이션으로 도는 진입 연출(첫 페인트부터 JS 없이 도는 data-seq 요소)을 페이지 전환 중에는 멈춰 두었다가 끝난 뒤 시작시킨다.
 * 홈(HomeStage)의 순차 등장과 같은 방식이다: 커튼·확대 전환이 진행 중(전환 신호등 켜짐)이면 root에 data-seq-hold를 걸고
 * 이미 돈 애니메이션을 처음으로 되돌려 둔다. 전환이 끝나면 속성을 지워 그때부터 재생한다(CSS가 [data-seq-hold]에서 animation-play-state: paused).
 * 전환이 없으면(직접 진입·새로고침) 아무것도 하지 않아 첫 페인트부터 바로 돈다.
 */
export function useSeqHold(ref: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const el = ref.current;
    if (!el || !isTransitionBusy()) return;
    el.setAttribute("data-seq-hold", "");
    el.getAnimations({ subtree: true }).forEach((a) => {
      a.currentTime = 0;
    });
    const cancel = whenTransitionIdle(() => el.removeAttribute("data-seq-hold"));
    return () => {
      cancel();
      el.removeAttribute("data-seq-hold");
    };
  }, [ref]);
}
