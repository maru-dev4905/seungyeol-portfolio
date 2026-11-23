"use client";

import { useRef, type JSX, type ReactNode } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { isHandoffActive } from "@/lib/handoff";
import { prefersReducedMotion, registerGsap } from "@/lib/motion";
import { isTransitionBusy, whenTransitionIdle } from "@/lib/transition-gate";

/**
 * 이미지/커버 블록의 등장 연출: 바깥 틀이 위에서부터 열리듯(clip-path) 나타나고, 안쪽 내용은 1.08배 -> 1배로 줄어든다.
 * 틀이 overflow: hidden이라 확대된 내용이 밖으로 새지 않는다. transform/clip-path/opacity만 움직인다.
 * 서버 HTML·JS 없음·reduced-motion에서는 처음부터 보이는 최종 상태다(숨김은 마운트 후 JS가 건다).
 * aspect: 칸 비율을 직접 정한다(CSS aspect-ratio 값, 예: "16 / 10"). 가로 목업이 세로 칸에 cover로 잘리는 것을 막으려는 것이고, 주면 CSS 클래스의 비율보다 우선한다.
 * handoff: 상세 히어로 칸 표시. HandoffLayer가 이 칸의 위치로 이미지를 내려앉힌다(data-handoff-target).
 */
export function MediaReveal({ children, className, handoff = false, aspect }: { children: ReactNode; className?: string; handoff?: boolean; aspect?: string }): JSX.Element {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    (_context, contextSafe) => {
      const frame = ref.current;
      const inner = frame?.firstElementChild;
      // 이미지 이어받기 전환으로 도착한 히어로(handoff)는 이미 덮고 있는 이미지와 겹치므로 자기 등장 연출을 건너뛴다
      if (!frame || !inner || !contextSafe || prefersReducedMotion() || (handoff && isHandoffActive())) return;
      registerGsap();
      const play = contextSafe(() => {
        const scrollTrigger = { trigger: frame, start: "top 90%", once: true };
        gsap.fromTo(frame, { clipPath: "inset(12% 0% 0% 0%)", opacity: 0 }, { clipPath: "inset(0% 0% 0% 0%)", opacity: 1, duration: 1.2, ease: "power3.out", scrollTrigger });
        gsap.fromTo(inner, { scale: 1.08 }, { scale: 1, duration: 1.6, ease: "power3.out", scrollTrigger });
      });
      // 페이지 전환 연출이 진행 중이면 숨겨 두고 끝난 뒤에 시작한다(lib/transition-gate.ts)
      if (isTransitionBusy()) {
        gsap.set(frame, { clipPath: "inset(12% 0% 0% 0%)", opacity: 0 });
        gsap.set(inner, { scale: 1.08 });
      }
      return whenTransitionIdle(play);
    },
    { scope: ref, revertOnUpdate: true },
  );

  return (
    <div ref={ref} className={className} style={{ overflow: "hidden", aspectRatio: aspect }} data-handoff-target={handoff || undefined}>
      {children}
    </div>
  );
}
