"use client";

import { useRef, type JSX } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { prefersReducedMotion, registerGsap } from "@/lib/motion";

/**
 * 스크롤하면 단어가 하나씩 회색 -> 흰색으로 채워지는 선언문.
 * - 단어는 서버에서 <span>으로 나누어 그린다(JS 없이도 전부 흰색 = 읽힌다). 회색(opacity 0.28)은 마운트 후 JS가 건다.
 * - 접근성: 쪼갠 단어 줄은 aria-hidden, 원문 전체는 sr-only <span>으로 한 번 더 둔다(스크린 리더는 원문 한 문장만 읽는다).
 * - 움직임: GSAP ScrollTrigger scrub(스크롤 위치에 묶임). 단어 opacity만 바꾸므로 레이아웃이 안 흔들린다.
 *   움직임 줄이기면 아무것도 걸지 않아 전부 흰색 정적이다.
 * - 정리: useGSAP이 언마운트(페이지 이동) 때 트윈과 ScrollTrigger를 kill/revert 한다.
 */
export function WordFillStatement({ text, className }: { text: string; className?: string }): JSX.Element {
  const ref = useRef<HTMLParagraphElement>(null);
  const words = text.split(/\s+/).filter(Boolean);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || prefersReducedMotion()) return;
      registerGsap();
      const targets = el.querySelectorAll("[data-word]");
      // 각 단어가 길이 2, 시작 간격 1: 이웃 단어가 겹쳐 채워져 끊기지 않고 흐른다
      gsap.fromTo(
        targets,
        { opacity: 0.28 },
        {
          opacity: 1,
          ease: "none",
          duration: 2,
          stagger: 1,
          scrollTrigger: { trigger: el, start: "top 80%", end: "bottom 45%", scrub: true },
        },
      );
    },
    { scope: ref, revertOnUpdate: true },
  );

  return (
    <p ref={ref} className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {words.map((w, i) => (
          <span key={i} data-word>
            {w}
            {i < words.length - 1 ? " " : ""}
          </span>
        ))}
      </span>
    </p>
  );
}
