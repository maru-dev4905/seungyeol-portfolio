"use client";

import { useEffect, useRef } from "react";
import styles from "./Cursor.module.css";

// 크게 부풀어 오르는 대상: 링크·버튼 등 눌러서 반응하는 요소(글자 입력 칸은 아래 TEXTUAL이라 여기에 없다)
const INTERACTIVE = "a[href], button, [role='button'], summary, label, input[type='button'], input[type='submit'], input[type='checkbox'], input[type='radio']";
// 글자를 입력·선택하는 요소: 여기서는 커스텀 포인터를 숨기고 시스템 커서(I빔 등)를 돌려 준다
const TEXTUAL =
  "textarea, select, [contenteditable]:not([contenteditable='false']), input:not([type='button']):not([type='submit']):not([type='reset']):not([type='checkbox']):not([type='radio']):not([type='range'])";

/**
 * 점 + 링 커스텀 포인터. 점(6px)은 포인터 좌표 그대로(지연 없음 = 핫스팟), 링(30px)은 같은 중심에 얹혀 있다.
 * 시스템 커서는 "커스텀 포인터가 실제로 동작 중일 때만" 숨긴다: html의 data-cursor="on"이 그 깃발이고, globals.css가 이 깃발이 있을 때만 cursor:none을 건다.
 * 깃발이 꺼지는 경우(= 기본 커서가 그대로 보이는 경우):
 *  - JS가 안 돌 때 / 터치·펜(hover: hover + pointer: fine이 아님) / 움직임 줄이기 / 첫 마우스 이동 전
 *  - 글자 입력 요소(input·textarea·select·contenteditable) 위 / iframe 위 / 마우스가 창을 나갔을 때 / 창이 포커스를 잃었을 때
 *
 * 성능: pointermove는 좌표만 저장하고 화면 갱신은 프레임당 rAF 한 번(움직였을 때만 예약). 위치는 translate3d 하나(transform뿐, backdrop-filter 없음).
 * 상태(보임·대상 위·누름·깃발)는 값이 바뀔 때만 속성에 쓴다.
 */
export function Cursor() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const html = document.documentElement;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const enabled = () => fine.matches && !reduce.matches;
    if (!enabled()) return;

    let x = 0;
    let y = 0;
    let raf = 0;
    let visible = false;
    let hover = false;

    // 보임/숨김과 시스템 커서 깃발을 한 곳에서 같이 바꾼다(둘이 어긋나면 커서가 아예 사라지거나 둘 다 보이게 된다)
    const show = (on: boolean) => {
      if (on === visible) return;
      visible = on;
      el.dataset.visible = String(on);
      if (on) html.dataset.cursor = "on";
      else delete html.dataset.cursor;
    };

    // 프레임당 한 번: 마지막으로 본 좌표로 위치만 옮긴다
    const flush = () => {
      raf = 0;
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      if (!enabled()) return show(false);
      const target = e.target as Element | null;
      // 글자 입력 칸·iframe 위에서는 기본 커서를 돌려 준다
      if (target?.closest?.(TEXTUAL) || target?.tagName === "IFRAME") return show(false);
      x = e.clientX;
      y = e.clientY;
      if (!raf) raf = requestAnimationFrame(flush);
      show(true);
      const hit = !!target?.closest?.(INTERACTIVE);
      if (hit !== hover) {
        hover = hit;
        el.dataset.hover = String(hit);
      }
    };
    const hide = () => show(false);
    const onDown = () => (el.dataset.down = "true");
    const onUp = () => (el.dataset.down = "false");
    // 문서를 떠날 때(relatedTarget이 없음)나 iframe으로 들어갈 때만 숨긴다. iframe 안의 이동은 이 문서가 받지 못해 점이 멈추기 때문
    const onOut = (e: MouseEvent) => {
      if (!e.relatedTarget || (e.relatedTarget as Element).tagName === "IFRAME") hide();
    };
    const onVisibility = () => document.hidden && hide();
    // 움직임 줄이기·포인터 종류가 실행 중에 바뀌면 바로 기본 커서로
    const onMedia = () => !enabled() && hide();

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    window.addEventListener("blur", hide);
    document.addEventListener("mouseout", onOut);
    html.addEventListener("mouseleave", hide);
    document.addEventListener("visibilitychange", onVisibility);
    fine.addEventListener("change", onMedia);
    reduce.addEventListener("change", onMedia);

    return () => {
      cancelAnimationFrame(raf);
      hide(); // 깃발을 내린다(안 내리면 포인터가 사라진 채 시스템 커서도 없다)
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("blur", hide);
      document.removeEventListener("mouseout", onOut);
      html.removeEventListener("mouseleave", hide);
      document.removeEventListener("visibilitychange", onVisibility);
      fine.removeEventListener("change", onMedia);
      reduce.removeEventListener("change", onMedia);
    };
  }, []);

  return (
    <div ref={root} className={styles.cursor} aria-hidden="true" data-pointer data-visible="false" data-hover="false" data-down="false">
      <span className={styles.ring} />
      <span className={styles.dot} />
    </div>
  );
}
