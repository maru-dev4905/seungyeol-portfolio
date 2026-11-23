"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import type { ProjectSection, Tint } from "@/lib/projects";
import { Lightbox } from "@/components/media/Lightbox";
import { Media } from "@/components/media/Media";
import styles from "./Section.module.css";

type Props = { section: Extract<ProjectSection, { type: "gallery" }>; tint: Tint };

/**
 * 화면 갤러리: 2열 격자(모바일 1열), 칸마다 같은 비율(4:3)로 잘라 위쪽(object-position top)을 보여 주고 아래에 캡션.
 * 원본 이미지가 가로·세로로 제각각(전체 페이지 캡처 등)이라 비율을 통일해 격자를 정돈하고, 전체는 눌러서 크게 본다.
 *
 * 크게 보기 = 공용 Lightbox(components/media/Lightbox.tsx): UI 모달(role="dialog"), 포커스 트랩·Esc·좌우 키·스크롤 잠금·썸네일로 포커스 복귀.
 *  - 썸네일은 원본 주소를 가리키는 <a>라서 JS가 꺼져 있으면 같은 탭에서 원본 이미지가 열린다(새 창 아님)
 *  - data-no-fade: PageFade(문서 전체 링크 가로채기)가 이 링크를 "페이지 이동"으로 가로채 이미지 주소로 router.push 하던 것이 예전 버그의 원인이었다
 */
export function GallerySection({ section, tint }: Props) {
  const images = section.meta.images;
  // 열려 있는 이미지 번호(null = 닫힘). 닫을 때 포커스를 돌려줄 썸네일 링크는 번호별로 ref에 모아 둔다
  const [open, setOpen] = useState<number | null>(null);
  const links = useRef<(HTMLAnchorElement | null)[]>([]);

  // 이미지가 아직 없으면 프로젝트 색조 자리표시로 칸을 채운다
  if (images.length === 0) {
    return (
      <div className={styles.placeholderFrame}>
        <Media tint={tint} />
      </div>
    );
  }

  return (
    <>
      <ul className={styles.gallery}>
        {images.map((image, i) => (
          <li key={image.url}>
            <figure className={styles.shot}>
              <a
                ref={(el) => {
                  links.current[i] = el;
                }}
                href={image.url}
                className={styles.shotLink}
                data-no-fade
                aria-label={`크게 보기: ${image.alt}`}
                onClick={(e) => {
                  e.preventDefault();
                  setOpen(i);
                }}
              >
                {/* next/image(fill): 칸이 aspect-ratio로 크기를 정해 두므로 이미지가 늦게 와도 레이아웃이 밀리지 않는다(CLS 없음). 설명은 아래 캡션이 하므로 alt는 비운다 */}
                <Image className={styles.shotImg} src={image.url} alt="" fill sizes="(max-width: 768px) 100vw, 45vw" />
              </a>
              <figcaption className={styles.caption}>{image.alt}</figcaption>
            </figure>
          </li>
        ))}
      </ul>

      {open !== null && <Lightbox images={images} start={open} onClosed={() => setOpen(null)} getOpener={(i) => links.current[i]} />}
    </>
  );
}
