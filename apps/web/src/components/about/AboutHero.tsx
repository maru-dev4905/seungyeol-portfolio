"use client";

import { useRef, type CSSProperties } from "react";
import { LoopVideo } from "@/components/media/LoopVideo";
import { Media } from "@/components/media/Media";
import { useSeqHold } from "@/components/motion/useSeqHold";
import { aboutCopy, type HeroSlot } from "@/lib/about";
import styles from "./About.module.css";

// 진입 지연(초). 줄 -> 줄 사이는 스태거(0.08), 사진은 자기 줄이 올라온 뒤 0.4초 늦게 가로로 펼쳐진다
const delay = (s: number) => ({ "--d": `${s}s` }) as CSSProperties;

// 인라인 미디어 한 칸(가로형 8:5, 글자 크기에 비례: 2.64em x 1.65em). 장식이라 스크린 리더에는 숨긴다(aria-hidden)
// 칸은 영상(LoopVideo: 무음 반복, poster 그림 + 화면에 보일 때만 재생) 또는 정지 이미지를 받는다. 데이터는 lib/about.ts의 aboutCopy.heroMedia.
// 이미지는 사이트 주인의 로컬 파일(public/images/seungyeol/), 영상은 public/videos/about/에 있다. 히어로는 첫 화면이라 이미지는 priority(미리 로드).
// 칸의 최종 크기는 처음부터 차지한다(layout shift 없음). 펼쳐지는 모션은 clip-path(왼쪽 -> 오른쪽)라 주변 글자가 밀리지 않는다
function Photo({ slot, tint, shift, d }: { slot: HeroSlot; tint: "indigo" | "red" | "teal"; shift: "up" | "down"; d: number }) {
  return (
    <span className={styles.heroPhoto} data-shift={shift} data-seq style={delay(d)} aria-hidden="true">
      {slot.kind === "video" ? (
        <LoopVideo mp4={slot.mp4} webm={slot.webm} poster={slot.poster} position={slot.position} />
      ) : (
        <Media tint={tint} media={{ image: slot.src }} label={false} sizes="(max-width: 560px) 100px, 290px" priority position={slot.position} />
      )}
    </span>
  );
}

/**
 * 히어로(측정 1440x900): 화면 높이의 80% 이상(min-height 80svh)을 차지하고 내용은 세로 가운데 정렬.
 * 가운데 정렬 초대형 세리프 H1(clamp(56px, 7.4vw, 108px), weight 300) 두 줄. 1440에서 약 106px.
 * 단어 사이에 가로형 8:5 미디어 3칸(영상 2 + 이미지 1, 1440에서 약 281x176)이 글자처럼 끼어 있고, 줄마다 위아래로 조금씩 어긋난다.
 * H1의 읽히는 글은 "Powered by clarity"뿐이다(미디어는 aria-hidden).
 * 좁은 화면(560px 이하)에서는 줄이 넘치지 않게 줄바꿈을 허용한다. "미디어 + 옆 단어"는 묶음(.nb, 줄바꿈 금지)이라 미디어만 외톨이로 남지 않는다.
 *
 * 진입 연출(순수 CSS, 첫 페인트부터 JS 없이 돈다): 줄 마스크 reveal(아래 -> 위) -> 미디어가 왼쪽에서 오른쪽으로 펼쳐짐.
 * 이어서 아래 Profile 블록(RevealGroup, delay)이 서브 텍스트 -> 큰 사진 순으로 나온다.
 * 다른 페이지에서 전환(커튼)으로 들어오는 중이면 전환이 끝난 뒤 시작한다(useSeqHold, 홈 순차 등장과 같은 방식). 움직임 줄이기는 CSS가 연출을 끈다.
 */
export function AboutHero() {
  const [a, b, c] = aboutCopy.heroWords;
  const [m1, m2, m3] = aboutCopy.heroMedia;
  const ref = useRef<HTMLElement>(null);
  useSeqHold(ref);
  return (
    <header ref={ref} className={styles.hero}>
      <h1 className={styles.heroTitle}>
        <span className={styles.heroMask}>
          <span className={styles.heroLine} data-seq style={delay(0.1)}>
            {a}{" "}
            <span className={styles.nb}>
              <Photo slot={m1} tint="indigo" shift="up" d={0.5} /> {b}
            </span>
          </span>
        </span>
        <span className={styles.heroMask}>
          <span className={styles.heroLine} data-seq style={delay(0.18)}>
            <span className={styles.nb}>
              <Photo slot={m2} tint="red" shift="down" d={0.58} /> {c}
            </span>{" "}
            <Photo slot={m3} tint="teal" shift="up" d={0.66} />
          </span>
        </span>
      </h1>
    </header>
  );
}
