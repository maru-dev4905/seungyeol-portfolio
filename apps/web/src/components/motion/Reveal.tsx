"use client";

import { useRef, type JSX, type ReactNode } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { MOTION, prefersReducedMotion, registerGsap } from "@/lib/motion";
import { isTransitionBusy, whenTransitionIdle } from "@/lib/transition-gate";

type Props = {
  children: ReactNode;
  y?: number; // 시작 위치(px). 아래에서 이만큼 떨어진 곳에서 올라온다
  delay?: number;
  className?: string;
};

/**
 * 화면에 들어올 때 opacity 0->1, y -> 0 으로 나타난다. transform/opacity만 움직인다.
 * 서버 HTML·JS 없음·reduced-motion에서는 처음부터 보이는 상태다(숨김은 마운트 후 JS가 건다).
 * 숨겨진 페이지에서는 useGSAP이 cleanup에서 트윈·ScrollTrigger를 revert해 인라인 스타일도 원래대로 돌려 둔다.
 */
export function Reveal({ children, y = MOTION.distance, delay = 0, className }: Props): JSX.Element {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    (_context, contextSafe) => {
      const el = ref.current;
      if (!el || !contextSafe || prefersReducedMotion()) return;
      registerGsap();
      const play = contextSafe(() => {
        gsap.fromTo(
          el,
          { opacity: 0, y },
          { opacity: 1, y: 0, duration: MOTION.enter, ease: MOTION.ease, delay, scrollTrigger: { trigger: el, start: MOTION.start, once: true } },
        );
      });
      // 페이지 전환 연출(확대 면·페이드)이 진행 중이면, 먼저 숨겨만 두고 연출이 끝난 뒤에 시작한다.
      // (바로 돌리면 이전 페이지의 퇴장과 겹치거나 확대 면 뒤에서 혼자 끝난다 -> lib/transition-gate.ts)
      if (isTransitionBusy()) gsap.set(el, { opacity: 0, y });
      return whenTransitionIdle(play); // 반환값 = 취소 함수: 시작 전에 정리되면 대기를 취소한다
    },
    { scope: ref, dependencies: [y, delay], revertOnUpdate: true },
  );

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
