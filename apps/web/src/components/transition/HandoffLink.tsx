"use client";

import type { ComponentProps, MouseEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MOCKUP_RATIO, mockupMedia, startHandoff, visibleQuery, type Handoff } from "@/lib/handoff";
import { prefersReducedMotion } from "@/lib/motion";
import { isTransitionLocked } from "@/lib/transition-machine";
import type { ProjectMedia, Tint } from "@/lib/projects";
import type { SceneShape } from "@/components/scene/shapes";

type Props = Omit<ComponentProps<typeof Link>, "href" | "onClick"> & {
  href: string;
  tint: Tint;
  /** 커지는 이미지(프로젝트 미디어). 목업이 있으면 목업이 커진다(mockupMedia) */
  projectMedia?: ProjectMedia;
  /**
   * 커지기 시작할 이미지 칸을 링크 안에서 찾는 CSS 선택자(없으면 링크 자신). 예: 다음 프로젝트의 이미지 칸
   * 링크 안 -> 가장 가까운 [data-handoff-scope] 안 -> 문서 전체 순서로 찾는다(Works 행의 썸네일은 링크의 형제, 메뉴 알약의 가운데 창은 문서 어딘가). 찾은 요소의 화면 사각형이 마스크의 시작 구멍이 된다.
   */
  source?: string;
  /** 시작 모서리 반경(px) */
  radius?: number;
  /** 도착 후 마무리: 히어로로 내려앉기(기본) / 아래로 빠지기(히어로가 없는 페이지) */
  exit?: Handoff["exit"];
  /** 메뉴 프레임이 이전 페이지를 가리고 있는 상태에서 누르는 링크(메뉴 안). 이동을 연출 시작 시각에 한다(lib/transition-timeline.ts) */
  framed?: boolean;
  /** 그림 대신 셰이더 오브젝트 형태를 커지게 한다(메뉴 창 hover 장면과 같은 것) */
  scene?: SceneShape;
  /** 연출을 시작하기 직전(예: 메뉴 닫기) */
  onStart?: () => void;
};

/** 칸 안의 <img> 원본 비율. 목업이면 고정 비율, 이미지가 없으면(자리표시) 화면 비율 */
function ratioOf(el: Element, media?: ProjectMedia): number {
  if (media?.mockup) return MOCKUP_RATIO;
  const img = el.querySelector("img");
  if (img && img.naturalWidth > 0) return img.naturalWidth / img.naturalHeight;
  return window.innerWidth / window.innerHeight;
}

/** 시작 칸이 보여 주는 그림이 확대 면과 같은 파일일 때만 그 sizes를 넘긴다(다른 그림이면 캐시 재사용이 의미 없다) */
function sizesOf(el: Element, media?: ProjectMedia): string | undefined {
  const img = el.querySelector("img");
  const src = media?.image;
  if (!img || !src || !img.src.includes(encodeURIComponent(src))) return undefined;
  return img.getAttribute("sizes") ?? undefined;
}

/**
 * 홈 알약과 같은 "이미지 이어받기 전환"을 쓰는 링크(다음 프로젝트·Works 행·메뉴 알약·메뉴 내비).
 * 눌린 칸이 마스크로 열려 화면 전체가 된 뒤 상세 페이지의 히어로 자리로 내려앉는다(HandoffLayer).
 * 새 탭 열기(⌘·Ctrl·Shift 클릭)·움직임 줄이기·지금 있는 페이지·칸이 화면에 안 보이는 경우에는 보통 링크처럼 이동한다.
 */
export function HandoffLink({ href, tint, projectMedia, source, radius = 8, exit = "settle", framed, scene, onStart, children, ...rest }: Props) {
  const router = useRouter();

  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    // 다른 전환이 진행 중이면 이 클릭은 무시한다(연타·전환 중 다른 링크. 큐에 쌓지 않는다 -> lib/transition-machine.ts)
    if (isTransitionLocked()) {
      e.preventDefault();
      return;
    }
    // 움직임 줄이기 / 지금 페이지로 가는 링크: 연출 없이 기본 이동(같은 경로면 Next가 아무것도 하지 않는다)
    if (prefersReducedMotion() || href === window.location.pathname) {
      onStart?.();
      return;
    }
    // 링크 안 -> 가장 가까운 [data-handoff-scope] 안 -> 문서 전체 순서로, 화면에 그려진 칸만 찾는다(숨은 이전 페이지 제외)
    const scope = e.currentTarget.closest("[data-handoff-scope]");
    const el = source ? (visibleQuery(source, e.currentTarget) ?? (scope ? visibleQuery(source, scope) : null) ?? visibleQuery(source)) : e.currentTarget;
    const r = el?.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    // 칸이 없거나 화면 밖·0 크기면(터치 기기의 숨은 썸네일 등) 연출 없이 바로 이동
    if (!el || !r || r.width < 2 || r.height < 2 || r.bottom < 0 || r.top > vh || r.right < 0 || r.left > vw) {
      onStart?.();
      return;
    }
    e.preventDefault();
    onStart?.();
    const media = mockupMedia(projectMedia);
    const started = startHandoff({
      href,
      rect: { x: r.x, y: r.y, w: r.width, h: r.height },
      radius,
      tint,
      media,
      // 셰이더 면은 그림이 없으니 시작 칸(창)의 가로세로비를 그대로 쓴다(상자 = 창 비율 -> 두 장면이 겹친다)
      ratio: scene ? r.width / r.height : ratioOf(el, projectMedia),
      framed,
      scene,
      sizes: sizesOf(el, media),
      exit,
    });
    if (!started) router.push(href);
  };

  return (
    // data-handoff-link: 이 링크는 자기 전환 연출(확대 면)이 있으므로 전역 페이드(PageFade)는 이 클릭에 끼어들지 않는다
    <Link href={href} onClick={onClick} data-handoff-link {...rest}>
      {children}
    </Link>
  );
}
