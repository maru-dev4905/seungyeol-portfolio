"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
// Lenis 권장 기본 CSS(스크롤 잠금·iframe 포인터 처리 등)
import "lenis/dist/lenis.css";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ANCHOR_OFFSET, prefersReducedMotion, registerGsap, setScroller } from "@/lib/motion";

// 검증 전용 훅: 빌드할 때 NEXT_PUBLIC_MOTION_DEBUG=1 이거나 개발 서버(next dev)면 window.__motion에 내부 상태를 노출한다.
// (Playwright가 Lenis 개수·ScrollTrigger 개수·활성 트윈 수를 페이지 왕복마다 셀 수 있게 하려는 것. 프로덕션 빌드에는 포함되지 않는다.)
const DEBUG = process.env.NEXT_PUBLIC_MOTION_DEBUG === "1" || process.env.NODE_ENV === "development";

/**
 * 사이트 전체의 부드러운 스크롤(Lenis)을 한 번만 만든다. 화면에는 아무것도 그리지 않는다.
 * 루트 레이아웃에 한 번 있으므로 페이지 이동으로 다시 만들어지지 않는다
 * (Next가 이전 페이지를 숨긴 채 보관해도 레이아웃은 하나다).
 *
 * 움직임 줄이기(prefers-reduced-motion)이면 Lenis를 만들지 않고 브라우저 기본 스크롤을 그대로 쓴다.
 */
export function SmoothScroll() {
  const lenisRef = useRef<Lenis | null>(null);
  const pathname = usePathname();

  // 페이지가 바뀌면 이전 페이지에서 하던 관성 스크롤을 끊는다.
  // 재현: 휠로 스크롤한 직후(관성 중) 이동하면, Lenis가 이전 페이지의 목표 위치(예 2500px)로 새 페이지를 계속 끌고 가
  // 새 페이지가 맨 위가 아니라 중간에서 멈췄다(이미지 이어받기의 히어로 칸도 화면 밖으로 밀렸다).
  // stop()은 속도·목표를 지금 위치로 초기화(reset)하고, 바로 start()로 다시 켠다. 그 뒤 Next가 맞춘 스크롤(맨 위 / 뒤로 가기 복원)을
  // Lenis가 네이티브 scroll 이벤트로 그대로 받아들인다. 레이아웃 effect라 그리기 전에, Next의 스크롤 처리보다 먼저 실행된다
  useLayoutEffect(() => {
    const lenis = lenisRef.current;
    if (!lenis) return;
    lenis.stop();
    lenis.start();
    // 짧은 페이지로 오면 브라우저가 스크롤을 잘라 내며(clamp) scroll 이벤트를 한 번 더 보낸다. 이때 위치 변화(속도)가 0이면
    // Lenis는 isScrolling을 "native"로 바꾸고 되돌리는 타이머를 걸지 않아 <html>에 lenis-scrolling 클래스가 계속 남는다(왕복 테스트에서 발견).
    // 두 프레임 뒤에도 그 상태면 한 번 더 초기화한다
    let raf = requestAnimationFrame(() => {
      raf = requestAnimationFrame(() => {
        if (lenis.isScrolling === "native" && lenis.velocity === 0) {
          lenis.stop();
          lenis.start();
        }
      });
    });
    return () => cancelAnimationFrame(raf);
  }, [pathname]);

  useEffect(() => {
    registerGsap();
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    let teardown: (() => void) | null = null;

    // 현재 설정에 맞는 스크롤 방식을 켠다. 설정이 바뀌면(change 이벤트) 이전 것을 정리하고 다시 켠다.
    const setup = () => {
      teardown?.();
      teardown = null;

      if (prefersReducedMotion()) return;

      // autoRaf: false -> Lenis가 자기 rAF를 돌리지 않는다. 대신 아래에서 GSAP 티커가 매 프레임 lenis.raf를 부른다.
      // 왜: Lenis(스크롤 위치)와 GSAP(ScrollTrigger)이 같은 프레임 시계를 써야 위치가 어긋나 떨리지 않는다.
      // anchors -> <a href="#id"> 클릭을 Lenis가 가로채 부드럽게 이동한다. (touch는 기본값인 네이티브 유지: syncTouch 꺼짐)
      // anchors의 offset: 고정 헤더에 가려지지 않게 앵커 도착 위치를 위에서 ANCHOR_OFFSET만큼 띄운다(About의 'View career' 같은 #링크용)
      const lenis = new Lenis({ autoRaf: false, anchors: { offset: -ANCHOR_OFFSET } });
      setScroller(lenis); // 하단 섹션 알약이 lenis.scrollTo로 이동할 수 있게 공유한다
      lenisRef.current = lenis;

      // Lenis가 스크롤할 때마다 ScrollTrigger에게 위치를 알린다(트리거가 Lenis의 가상 위치를 따라가도록)
      const onLenisScroll = () => ScrollTrigger.update();
      lenis.on("scroll", onLenisScroll);

      // GSAP 티커의 시간(초)을 Lenis가 쓰는 밀리초로 바꿔 넘긴다. remove를 위해 함수를 변수에 둔다.
      const onTick = (time: number) => lenis.raf(time * 1000);
      gsap.ticker.add(onTick);
      // 탭이 느려져 프레임이 밀려도 GSAP이 시간을 "건너뛰지" 않게 한다(건너뛰면 Lenis 위치와 어긋난다)
      gsap.ticker.lagSmoothing(0);

      if (DEBUG) {
        const w = window as unknown as { __motion?: Record<string, unknown> };
        w.__motion = {
          gsap,
          ScrollTrigger,
          lenis,
          lenisAlive: ((w.__motion?.lenisAlive as number) ?? 0) + 1,
        };
      }

      teardown = () => {
        setScroller(null);
        lenisRef.current = null;
        lenis.off("scroll", onLenisScroll);
        gsap.ticker.remove(onTick);
        gsap.ticker.lagSmoothing(500, 33); // GSAP 기본값으로 되돌린다
        lenis.destroy();
        if (DEBUG) {
          const w = window as unknown as { __motion?: Record<string, unknown> };
          if (w.__motion) {
            w.__motion.lenisAlive = (w.__motion.lenisAlive as number) - 1;
            w.__motion.lenis = null;
          }
        }
      };
    };

    setup();
    mq.addEventListener("change", setup);
    return () => {
      mq.removeEventListener("change", setup);
      teardown?.();
    };
  }, []);

  return null;
}
