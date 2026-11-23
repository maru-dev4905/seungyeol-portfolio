"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { prefersReducedMotion } from "@/lib/motion";
import styles from "./Media.module.css";

type Props = {
  /** H.264 mp4(모든 브라우저). 먼저 시도한다 */
  mp4: string;
  /** VP9 webm(mp4를 못 여는 브라우저용 보조) */
  webm?: string;
  /** 첫 프레임 그림(webp). 재생 전·재생하지 않을 때·영상이 실패했을 때 계속 보인다 */
  poster: string;
  /** object-position(크롭 기준점) */
  position?: string;
  className?: string;
};

/**
 * 무음 반복 영상(장식). About 히어로의 인라인 칸 같은 "움직이는 사진"용이다.
 *  - muted + loop + playsInline. autoplay 속성 대신 JS가 재생을 맡는다: 화면에 보일 때만 play(), 화면 밖이거나 탭이 가려지면 pause()
 *    (보이지 않는 영상이 CPU·배터리를 쓰지 않게). preload="metadata"라 처음에는 메타데이터와 poster만 받는다.
 *  - 움직임 줄이기(prefers-reduced-motion)면 재생하지 않고 poster만 보인다. JS가 꺼져 있어도 poster만 보인다.
 *  - 영상을 못 불러오면(onError) poster 그림으로 바꿔 그 자리를 유지한다.
 *  - 크기는 부모가 정한다(width/height 100%, object-fit: cover). 부모가 aspect-ratio로 칸을 잡아 두므로 레이아웃이 밀리지 않는다.
 *  - 장식이라 aria-hidden, 키보드 포커스도 받지 않는다.
 */
export function LoopVideo({ mp4, webm, poster, position, className }: Props) {
  const ref = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);
  // 서버 HTML에는 poster 그림만 넣고 <video>는 브라우저에서(하이드레이션 뒤) 얹는다.
  // 이유: JS가 꺼진 브라우저는 <video>에 재생 컨트롤을 자동으로 붙여 장식 영상이 플레이어처럼 보이기 때문(스크립트가 없으면 컨트롤 표시가 규격).
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    let inView = false;

    // 지금 상태(보임 + 탭 활성 + 움직임 줄이기 아님)에 맞춰 재생/정지한다
    const sync = () => {
      if (inView && !document.hidden && !prefersReducedMotion()) {
        video.play().catch(() => {}); // 자동 재생이 막혀도(저전력 모드 등) poster가 남아 있으니 조용히 넘긴다
      } else {
        video.pause();
      }
    };
    const io = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        sync();
      },
      { threshold: 0.01 },
    );
    io.observe(video);
    document.addEventListener("visibilitychange", sync);
    mq.addEventListener("change", sync);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
      mq.removeEventListener("change", sync);
      video.pause();
    };
  }, [mounted, failed]);

  const objectPosition = position ? { objectPosition: position } : undefined;
  return (
    <>
      {/* 바닥 층: poster 그림. 서버 HTML·JS 없음·움직임 줄이기·영상 실패 때 이것이 보인다. 영상이 위에 같은 그림(poster)으로 겹치므로 갈아 끼울 때 깜박이지 않는다 */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className={`${styles.fill} ${className ?? ""}`} src={poster} alt="" style={objectPosition} />
      {mounted && !failed && (
        <video
          ref={ref}
          className={`${styles.fill} ${styles.overlay} ${className ?? ""}`}
          poster={poster}
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
          tabIndex={-1}
          style={objectPosition}
        >
          {/* 소스 로딩 오류는 <source>마다 따로 온다(video로 올라오지 않는다). 마지막 소스까지 실패해야 poster 그림으로 바꾼다 */}
          <source src={mp4} type="video/mp4" onError={webm ? undefined : () => setFailed(true)} />
          {webm && <source src={webm} type="video/webm; codecs=vp9" onError={() => setFailed(true)} />}
        </video>
      )}
    </>
  );
}
