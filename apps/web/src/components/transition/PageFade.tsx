"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getScroller, prefersReducedMotion } from "@/lib/motion";
import { beginTransition, endTransition } from "@/lib/transition-gate";
import { beginTransitionKind, cancelTransition, endTransitionKind, isTransitionLocked, onTransitionCancel } from "@/lib/transition-machine";

// 퇴장(페이지 투명) / 입장(다시 보임) 시간. 사용자가 느끼는 전환이 0.4초를 넘지 않게 한다
const OUT_MS = 160;
const IN_MS = 260;
// 새 페이지가 이만큼 안 오면(느린 서버·실패) 투명해진 페이지를 되돌려 화면이 비어 있지 않게 한다
const SAFETY_MS = 4000;

/**
 * 이미지 이어받기(HandoffLink)가 없는 일반 링크 이동(로고·푸터 링크 등)의 "짧은 페이드 아웃 -> 페이드 인".
 * 왜: Next는 페이지를 바꾸는 순간 이전 페이지를 바로 숨기고 새 페이지를 보여 준다. 새 페이지의 등장 연출(Reveal)이 같은 순간 시작되고,
 *     헤더·알약 같은 공통 요소도 그때 같이 바뀌어, 이전 페이지의 퇴장과 새 페이지의 등장이 한 프레임에 겹쳐 "깨진" 느낌이 났다.
 * 순서: 클릭 -> #page가 OUT_MS 동안 투명해짐 -> 그 뒤에 이동(router.push) -> 새 페이지가 마운트되면 맨 위로 즉시 리셋 -> #page가 IN_MS 동안 나타남.
 *       새 페이지의 등장 연출은 transition-gate가 이 페이드가 시작될 때까지 미룬다(퇴장이 끝난 뒤 한 번만 시작).
 * 건드리지 않는 경우(그대로 즉시 이동): 새 탭·보조키 클릭, 같은 페이지·해시 링크, 바깥 링크, 움직임 줄이기, HandoffLink(자기 연출이 있음), 뒤로/앞으로 가기,
 *   data-no-fade 링크(페이지가 아니라 클릭 핸들러가 처리하는 링크: 이미지 라이트박스 썸네일. 가로채면 이미지 주소로 router.push 해 버린다).
 * 화면에는 아무것도 그리지 않는다. #page(레이아웃의 페이지 래퍼) 하나의 opacity만 움직인다(헤더·메뉴는 그 밖에 있어 그대로).
 */
export function PageFade() {
  const router = useRouter();
  const pathname = usePathname();
  // 퇴장 중/이동 대기 중인 이동: 있으면 다음 경로 변경에서 페이드 인을 한다
  const pending = useRef<{ timer: number; safety: number } | null>(null);

  const page = () => document.getElementById("page");

  // 일반 링크 클릭을 문서 전체에서 한 번에 가로챈다(링크 컴포넌트마다 코드를 넣지 않아도 된다)
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || (a.target && a.target !== "_self") || a.hasAttribute("download") || a.closest("[data-handoff-link]") || a.hasAttribute("data-no-fade")) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname === window.location.pathname) return; // 바깥 링크·같은 페이지(해시 포함)
      const el = page();
      if (!el || prefersReducedMotion()) return;
      e.preventDefault();
      // 다른 전환(확대·커튼)이 진행 중이거나 이미 페이드 중이면 이 클릭은 무시한다(상태 기계: 한 번에 하나)
      if (isTransitionLocked() || pending.current || !beginTransitionKind("fade")) return;
      beginTransition(); // 새 페이지의 등장 연출은 페이드 인이 시작될 때까지 기다린다
      el.style.transition = `opacity ${OUT_MS}ms ease-out`;
      el.style.opacity = "0";
      const href = url.pathname + url.search + url.hash;
      pending.current = {
        timer: window.setTimeout(() => router.push(href), OUT_MS),
        // 안전장치: 이동이 안 끝나면 되돌린다
        safety: window.setTimeout(() => {
          if (!pending.current) return;
          pending.current = null;
          el.style.transition = `opacity ${IN_MS}ms ease-out`;
          el.style.opacity = "1";
          endTransition();
          endTransitionKind("fade");
        }, SAFETY_MS),
      };
    };
    document.addEventListener("click", onClick, true); // 캡처: 링크 컴포넌트(Next Link)의 onClick보다 먼저 본다
    return () => document.removeEventListener("click", onClick, true);
  }, [router]);

  // 경로가 바뀌어 새 페이지가 마운트되면: 맨 위로 즉시 리셋 -> 페이드 인. 그리기 전에 처리하려고 레이아웃 effect다
  useLayoutEffect(() => {
    const p = pending.current;
    if (!p) return;
    pending.current = null;
    window.clearTimeout(p.timer);
    window.clearTimeout(p.safety);
    // 스크롤을 즉시 0으로 맞추고 Lenis의 목표값도 같이 0으로 맞춘다(이전 페이지의 관성이 새 페이지를 끌고 가지 않게)
    window.scrollTo(0, 0);
    getScroller()?.scrollTo(0, { immediate: true, force: true });
    const el = page();
    // 다음 프레임에 페이드 인 시작 + 등장 연출 허용. 한 프레임 늦추는 이유: 새 페이지가 투명한 채로 먼저 한 번 그려져야 전환이 보인다
    // (정리 함수로 취소하지 않는다: 도중에 또 이동해도 반드시 endTransition이 불려야 신호등이 켜진 채 남지 않는다)
    requestAnimationFrame(() => {
      if (el) {
        el.style.transition = `opacity ${IN_MS}ms ease-out`;
        el.style.opacity = "1";
        window.setTimeout(() => {
          el.style.transition = "";
          el.style.opacity = "";
        }, IN_MS + 50);
      }
      endTransition();
      endTransitionKind("fade"); // 입력을 다시 받는다
    });
  }, [pathname]);

  // 뒤로 가기·안전장치로 취소되면 투명해진 페이지를 되돌리고 대기 중인 이동·타이머를 정리한다. 언마운트 때도 같은 정리
  useEffect(() => {
    const undo = () => {
      const p = pending.current;
      if (!p) return;
      pending.current = null;
      window.clearTimeout(p.timer);
      window.clearTimeout(p.safety);
      const el = page();
      if (el) {
        el.style.transition = "";
        el.style.opacity = "";
      }
      endTransition();
    };
    const off = onTransitionCancel(undo);
    window.addEventListener("popstate", cancelTransition);
    return () => {
      off();
      window.removeEventListener("popstate", cancelTransition);
      undo();
      endTransitionKind("fade");
    };
  }, []);

  return null;
}
