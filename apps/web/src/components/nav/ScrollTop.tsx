"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { getScroller, prefersReducedMotion } from "@/lib/motion";
import styles from "./ScrollTop.module.css";

// 이만큼(px) 내려가면 버튼이 나타난다
const SHOW_AFTER = 480;

/**
 * 맨 위로 가는 원형 버튼. 레이아웃에 한 번만 있고, 스크롤이 SHOW_AFTER를 넘으면 페이드 인 한다(홈은 스크롤이 없어 나타나지 않는다).
 * 위치(CSS): 하단 섹션 알약이 보이면 그 오른쪽 옆, 알약이 없거나 푸터에서 숨으면 화면 하단 가운데(<html data-section-pill>을 SectionPill이 알려 준다).
 * 누르면 Lenis로 부드럽게 맨 위로 간다. 움직임 줄이기·Lenis가 없으면 즉시 이동한다.
 */
export function ScrollTop() {
  const pathname = usePathname();
  const [shown, setShown] = useState(false);

  // 스크롤 위치를 한 프레임에 한 번만 본다. 값이 문턱을 넘나들 때만 상태가 바뀌어 리렌더는 드물다.
  // 경로가 바뀌면 다시 계산한다(페이지를 옮기면 맨 위로 돌아온다)
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      setShown(window.scrollY > SHOW_AFTER);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [pathname]);

  const onClick = () => {
    const scroller = getScroller();
    if (scroller && !prefersReducedMotion()) scroller.scrollTo(0);
    else window.scrollTo({ top: 0, behavior: "auto" });
  };

  const visible = shown && pathname !== "/";
  return (
    <button
      type="button"
      className={`pill ${styles.btn}`}
      data-needs-js
      data-visible={visible || undefined}
      aria-label="맨 위로"
      // 숨겨진 동안은 Tab으로 닿지 않게 한다
      tabIndex={visible ? 0 : -1}
      onClick={onClick}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M8 13V3M3.5 7.5 8 3l4.5 4.5" />
      </svg>
    </button>
  );
}
