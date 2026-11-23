"use client";

import { useRef, type ElementType, type JSX, type ReactNode } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { MOTION, prefersReducedMotion, registerGsap } from "@/lib/motion";
import { whenTransitionIdle } from "@/lib/transition-gate";

type Props = {
  children: ReactNode;
  /** 바깥 태그(section/header/footer/div). 섹션 자체를 그룹으로 쓸 때 */
  as?: ElementType;
  className?: string;
  id?: string;
  "aria-label"?: string;
  /** 처음 화면에 이미 보이는 그룹의 시작 지연(초). 히어로 진입이 끝난 뒤 이어 시작하게 한다 */
  delay?: number;
};

/**
 * 한 섹션 = 한 타임라인. 안쪽의 data-r 표시 요소를 정해진 순서로 한 번에 재생한다(하나의 ScrollTrigger).
 *   rule  구분선  왼쪽 -> 오른쪽으로 그려짐(scaleX)
 *   label 라벨    fade-up
 *   line  제목 줄  마스크 reveal(Lines 컴포넌트가 만든다), 줄마다 stagger
 *   media 이미지  clip-path 위 -> 아래로 열리며 안쪽 scale 1.08 -> 1
 *   body  본문    fade-up
 *   item  목록 행  fade-up + stagger
 * 값은 전부 lib/motion.ts의 MOTION 토큰. transform/opacity/clip-path만 움직인다.
 * 서버 HTML·JS 없음·움직임 줄이기에서는 모두 최종 상태다(숨김은 마운트 후 JS가 건다).
 * 페이지 전환 연출 중이면 숨겨 두고 끝난 뒤에 시작한다(transition-gate). 그룹끼리 겹쳐 쓰지 않는다(안쪽 data-r이 이중으로 움직이므로).
 */
export function RevealGroup({ children, as: Tag = "div", className, id, delay = 0, "aria-label": ariaLabel }: Props): JSX.Element {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    (_context, contextSafe) => {
      const root = ref.current;
      if (!root || !contextSafe || prefersReducedMotion()) return;
      registerGsap();

      const pick = (k: string) => Array.from(root.querySelectorAll<HTMLElement>(`[data-r="${k}"]`));
      const rules = pick("rule");
      const labels = pick("label");
      const lines = pick("line");
      const medias = pick("media");
      const bodies = pick("body");
      const items = pick("item");
      const fades = [...labels, ...bodies, ...items];
      const { distance: y, ease } = MOTION;

      // 먼저 처음 상태로 숨긴다(트리거가 발동하기 전에 최종 상태가 번쩍 보이지 않게)
      // (빈 목록에 gsap을 부르면 "target not found" 경고가 나므로 있을 때만 건다)
      if (rules.length) gsap.set(rules, { scaleX: 0 });
      if (lines.length) gsap.set(lines, { yPercent: 110 });
      if (fades.length) gsap.set(fades, { opacity: 0, y });
      medias.forEach((m) => {
        gsap.set(m, { clipPath: "inset(0% 0% 100% 0%)" });
        if (m.firstElementChild) gsap.set(m.firstElementChild, { scale: MOTION.mediaScaleFrom });
      });

      // 지금 화면에 이미 보이는 그룹(첫 화면)만 delay를 적용한다: 히어로 진입 뒤에 이어지게
      const inView = root.getBoundingClientRect().top < window.innerHeight * 0.88;

      const play = contextSafe(() => {
        const tl = gsap.timeline({
          delay: inView ? delay : 0,
          defaults: { ease, duration: MOTION.enter },
          scrollTrigger: { trigger: root, start: MOTION.start, once: true },
          // 끝나면 인라인 값을 지워 hover 전환·sticky 등 CSS와 겹치지 않게 한다
          onComplete: () => {
            const done = [...rules, ...lines, ...fades, ...medias, ...medias.map((m) => m.firstElementChild).filter((n): n is Element => !!n)];
            if (done.length) gsap.set(done, { clearProps: "opacity,transform,clipPath" });
          },
        });
        const { at } = MOTION;
        if (rules.length) tl.to(rules, { scaleX: 1, duration: MOTION.rule }, at.rule);
        if (labels.length) tl.to(labels, { opacity: 1, y: 0, stagger: MOTION.stagger }, at.label);
        if (lines.length) tl.to(lines, { yPercent: 0, duration: MOTION.line, stagger: MOTION.stagger }, at.line);
        medias.forEach((m) => {
          tl.to(m, { clipPath: "inset(0% 0% 0% 0%)", duration: MOTION.media }, at.media);
          if (m.firstElementChild) tl.to(m.firstElementChild, { scale: 1, duration: MOTION.mediaScale }, at.media);
        });
        if (bodies.length) tl.to(bodies, { opacity: 1, y: 0, stagger: MOTION.stagger }, at.body);
        if (items.length) tl.to(items, { opacity: 1, y: 0, stagger: MOTION.stagger }, at.item);
      });
      return whenTransitionIdle(play); // 반환값 = 취소 함수(시작 전에 정리되면 대기 취소)
    },
    { scope: ref, dependencies: [delay], revertOnUpdate: true },
  );

  return (
    <Tag ref={ref} id={id} className={className} aria-label={ariaLabel}>
      {children}
    </Tag>
  );
}
