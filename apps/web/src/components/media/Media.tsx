import type { CSSProperties } from "react";
import Image from "next/image";
import type { ProjectMedia, Tint } from "@/lib/projects";
import { tintToken } from "@/lib/tint";
import styles from "./Media.module.css";

type Props = {
  tint: Tint;
  media?: ProjectMedia;
  /** 접근성용 설명. 장식이면 비워 둔다(aria-hidden) */
  alt?: string;
  className?: string;
  /** 자리표시 모서리에 "Sample media" 표시를 달지 */
  label?: boolean;
  /** next/image가 고를 이미지 폭 힌트(예: "(max-width: 768px) 100vw, 50vw"). 이미지일 때만 쓴다 */
  sizes?: string;
  /** 첫 화면에 보이는 이미지면 true(미리 불러온다). 나머지는 lazy */
  priority?: boolean;
  /** object-position(크롭 기준점). 예: "70% 50%" */
  position?: string;
  /** true면 화면 밖·투명 층이어도 바로 받는다(loading="eager"). hover 때 즉시 보여야 하는 홈 배경·썸네일용. preload 링크는 만들지 않는다 */
  eager?: boolean;
};

/**
 * 프로젝트 미디어 한 칸. 홈 썸네일·메뉴 가운데·케이스 스터디 이미지가 모두 이 컴포넌트를 쓴다.
 * - media.video가 있으면 <video autoplay muted loop playsinline>
 * - media.image가 있으면 <img>
 * - 둘 다 없으면 "검정 바탕 + 프로젝트 색조 한 가지" 자리표시(.placeholder)
 * 사이트 주인이 projects.ts에 mp4/이미지 경로만 넣으면 자리표시 대신 그 파일이 나온다.
 * 크기는 부모가 정한다(width/height 100%).
 */
export function Media({ tint, media, alt, className, label = true, sizes = "100vw", priority = false, position, eager = false }: Props) {
  const style = { "--tint": `var(${tintToken(tint)})` } as CSSProperties;
  const decorative = !alt;

  if (media?.video) {
    return (
      <video
        className={`${styles.fill} ${className ?? ""}`}
        src={media.video}
        poster={media.poster}
        autoPlay
        muted
        loop
        playsInline
        aria-hidden={decorative || undefined}
        aria-label={alt}
      />
    );
  }
  if (media?.image) {
    // next/image(fill): 부모 크기를 채우므로 원본 크기를 몰라도 레이아웃이 밀리지 않는다(CLS 없음).
    // fill은 가장 가까운 position 있는 조상을 기준으로 하므로, 부모 조건에 기대지 않게 자체 래퍼(.imageWrap)를 둔다.
    return (
      <span className={`${styles.imageWrap} ${className ?? ""}`}>
        <Image
          className={styles.fill}
          src={media.image}
          alt={alt ?? ""}
          fill
          sizes={sizes}
          priority={priority}
          loading={eager && !priority ? "eager" : undefined}
          style={position ? { objectPosition: position } : undefined}
        />
      </span>
    );
  }
  return (
    <div className={`${styles.placeholder} ${className ?? ""}`} style={style} role={decorative ? undefined : "img"} aria-label={alt} aria-hidden={decorative || undefined}>
      {label && <span className={styles.label}>Sample media</span>}
    </div>
  );
}
