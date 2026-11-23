"use client";

import { useRef, useState, type ReactNode } from "react";
import { Lightbox } from "./Lightbox";

type Props = {
  /** 크게 볼 원본 이미지 주소 */
  url: string;
  alt: string;
  className?: string;
  /** 썸네일 그림(서버에서 그린 Media 등). 링크 안에 들어간다 */
  children: ReactNode;
};

/**
 * 이미지 한 장을 눌러 크게 보는 링크(챕터 이미지용). 갤러리는 여러 장을 넘겨야 해서 GallerySection이 Lightbox를 직접 쓰고,
 * 이 컴포넌트는 한 장짜리다. 서버 컴포넌트(SectionRenderer)가 썸네일(children)을 그려 넘기므로 이미지 최적화는 그대로다.
 * 링크는 원본 주소를 가리키는 <a>: JS가 꺼져 있으면 같은 탭에서 원본 이미지가 열린다(새 창 아님).
 * data-no-fade: PageFade(문서 전체 링크 가로채기)가 이 링크를 "페이지 이동"으로 오해하지 않게 한다.
 */
export function ZoomImage({ url, alt, className, children }: Props) {
  const [open, setOpen] = useState(false);
  const linkRef = useRef<HTMLAnchorElement>(null);

  return (
    <>
      <a
        ref={linkRef}
        href={url}
        className={className}
        data-no-fade
        aria-label={`크게 보기: ${alt}`}
        onClick={(e) => {
          e.preventDefault();
          setOpen(true);
        }}
      >
        {children}
      </a>
      {open && <Lightbox images={[{ url, alt }]} start={0} onClosed={() => setOpen(false)} getOpener={() => linkRef.current} />}
    </>
  );
}
