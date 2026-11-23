"use client";

import { useRef, type JSX } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { MOTION, prefersReducedMotion, registerGsap } from "@/lib/motion";
import { whenTransitionIdle } from "@/lib/transition-gate";

type Props = {
  to: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  group?: boolean; // 천 단위 쉼표(1,240). 서버 HTML의 최종 값과 같은 형식으로 올라간다
  delay?: number; // 시작 지연(초). 같은 섹션의 다른 등장 모션 뒤에 이어 시작하게 한다
  className?: string;
};

/**
 * 숫자가 화면에 들어올 때 0에서 to까지 올라간다.
 * 서버 HTML의 텍스트는 최종 값이다(JS 없음·reduced-motion에서도 정답이 보인다).
 *
 * React가 그린 텍스트 노드의 값(nodeValue)만 직접 바꾼다. 요소를 통째로 바꾸면 React가 가진 노드와 어긋나기 때문이다.
 * cleanup(숨겨진 페이지·언마운트)에서는 최종 값으로 되돌리고 ScrollTrigger를 정리한다(useGSAP이 revert).
 */
export function CountUp({ to, duration = 1.6, decimals = 0, prefix = "", suffix = "", group = false, delay = 0, className }: Props): JSX.Element {
  const ref = useRef<HTMLSpanElement>(null);
  const format = (n: number) =>
    `${prefix}${group ? n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) : n.toFixed(decimals)}${suffix}`;

  useGSAP(
    (_context, contextSafe) => {
      const node = ref.current?.firstChild;
      if (!node || !contextSafe || prefersReducedMotion()) return;
      registerGsap();

      const final = format(to);
      const state = { v: 0 };
      node.nodeValue = format(0); // 들어오기 전에는 0으로 시작해 값이 튀지 않게 한다
      // 페이지 전환 연출이 진행 중이면 0으로 둔 채 기다렸다가 끝난 뒤에 시작한다(lib/transition-gate.ts)
      // 지연은 첫 화면에 이미 보이는 숫자에만 적용한다(나중에 스크롤해서 만나는 숫자가 0에서 멈춰 기다리지 않게)
      const startDelay = node.parentElement && node.parentElement.getBoundingClientRect().top < window.innerHeight * 0.9 ? delay : 0;
      const play = contextSafe(() => {
        gsap.to(state, {
          v: to,
          duration,
          delay: startDelay,
          ease: MOTION.ease, // 등장 모션 문법과 같은 곡선
          onUpdate: () => {
            node.nodeValue = format(state.v);
          },
          scrollTrigger: { trigger: ref.current, start: "top 90%", once: true },
        });
      });
      const cancel = whenTransitionIdle(play);

      return () => {
        cancel();
        node.nodeValue = final; // 정리될 때 최종 값 복원
      };
    },
    { scope: ref, dependencies: [to, duration, decimals, prefix, suffix, group, delay], revertOnUpdate: true },
  );

  return (
    <span ref={ref} className={className}>
      {format(to)}
    </span>
  );
}
