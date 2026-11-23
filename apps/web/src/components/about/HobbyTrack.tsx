"use client";

import { useEffect, useRef, type CSSProperties, type JSX } from "react";
import Image from "next/image";
import type { Hobby } from "@/lib/about";
import { prefersReducedMotion } from "@/lib/motion";
import styles from "./About.module.css";

// 흐르는 속도(px/초). 아주 느리게: 사진 한 장(약 400px)이 지나가는 데 16초쯤 걸린다
const SPEED = 24;

/**
 * 취미 사진이 가로로 천천히 흘러가는 무한 트랙.
 * 사진 목록을 두 번 이어 붙여 두고(앞 묶음 = 원본, 뒤 묶음 = 복제) 트랙을 왼쪽으로 민다. 앞 묶음 한 칸 길이(period)만큼 밀리면 0으로 되돌린다.
 * 뒤 묶음이 앞 묶음과 똑같아서 되돌리는 순간에도 화면은 변하지 않는다(끊김·점프 없음).
 * 움직임은 transform(translate3d)만 쓴다. requestAnimationFrame에서 "지난 시간 x 속도"만큼 옮기므로 프레임이 흔들려도 속도가 같다.
 * 멈추는 때: 움직임 줄이기(처음부터 정지, 첫 묶음이 그대로 보인다) / 탭이 안 보일 때 / 트랙이 화면 밖일 때(헛돌지 않게).
 * 서버 HTML·JS 없음에서는 정지한 첫 묶음이 보인다. 복제 묶음은 같은 사진이라 스크린 리더에는 숨긴다(aria-hidden, alt 없음).
 */
export function HobbyTrack({ items }: { items: readonly Hobby[] }): JSX.Element {
  const trackRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || prefersReducedMotion()) return;

    let x = 0; // 현재 위치(0 이하, px)
    let last: number | null = null; // 직전 프레임 시각. null이면 다음 프레임은 시간만 기록하고 움직이지 않는다
    let raf = 0;
    let onScreen = false;

    // 앞 묶음 한 칸 길이 = 복제 묶음 첫 사진의 왼쪽 - 원본 첫 사진의 왼쪽(소수점까지 재서 되돌릴 때 어긋나지 않게).
    // 매 프레임 재면 낭비라 한 번 재 두고, 트랙 크기가 바뀔 때(창 크기 변경)만 다시 잰다
    let p = 0;
    const measure = () => {
      const a = track.children[0]?.getBoundingClientRect().left ?? 0;
      const b = track.children[items.length]?.getBoundingClientRect().left ?? 0;
      p = b - a;
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(track);

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (last === null) {
        last = now;
        return;
      }
      // 탭을 오래 떠났다 돌아와도 한 번에 튀지 않게 한 프레임에 최대 50ms만 진행한다
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      x -= SPEED * dt;
      if (p > 0 && -x >= p) x += p;
      track.style.transform = `translate3d(${x}px, 0, 0)`;
    };

    const sync = () => {
      const run = onScreen && !document.hidden;
      if (run && !raf) {
        last = null;
        raf = requestAnimationFrame(tick);
      } else if (!run && raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };

    const io = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      sync();
    });
    io.observe(track.parentElement ?? track);
    document.addEventListener("visibilitychange", sync);

    return () => {
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", sync);
      cancelAnimationFrame(raf);
      track.style.transform = "";
    };
  }, [items.length]);

  // 같은 목록을 두 번 그린다. 칸마다 크기·위치·어둡기는 CSS 변수로 넘기고 모양은 CSS가 정한다
  const rows = [...items.map((h) => ({ h, copy: false })), ...items.map((h) => ({ h, copy: true }))];
  return (
    <div className={styles.hobbyViewport}>
      <ul ref={trackRef} className={styles.hobbyTrack} data-hobby-track>
        {rows.map(({ h, copy }, i) => (
          <li
            key={i}
            className={styles.hobbyItem}
            aria-hidden={copy || undefined}
            style={{ "--ratio": h.ratio, "--h": h.h, "--top": h.top, "--dim": h.dim } as CSSProperties}
          >
            {/* fill: 칸 크기가 CSS로 정해져 있어 레이아웃이 밀리지 않는다. 칸 폭은 섹션 높이(최대 약 700px) x 비율이라 400px 안팎 */}
            <Image src={h.src} alt={copy ? "" : h.alt} fill sizes="(max-width: 768px) 280px, 420px" className={styles.hobbyImg} />
            <span className={styles.hobbyDim} aria-hidden="true" />
          </li>
        ))}
      </ul>
    </div>
  );
}
