import type { ReactNode } from "react";
import type { ProjectSection, Tint } from "@/lib/projects";
import { Media } from "@/components/media/Media";
import { ZoomImage } from "@/components/media/ZoomImage";
import { Reveal } from "@/components/motion/Reveal";
import { DecisionsSection } from "./DecisionsSection";
import { FactsSection } from "./FactsSection";
import { GallerySection } from "./GallerySection";
import { Inline } from "./Inline";
import { MarkdownSection } from "./MarkdownSection";
import { MetricsSection } from "./MetricsSection";
import styles from "./Section.module.css";
import { TimelineSection } from "./TimelineSection";
import { TroubleshootingSection } from "./TroubleshootingSection";
import { VideoSection } from "./VideoSection";
import { splitTitle } from "./title";

function assertNever(value: never): never {
  throw new Error(`처리하지 않은 섹션 type: ${JSON.stringify(value)}`);
}

type Troubleshooting = Extract<ProjectSection, { type: "troubleshooting" }>;

/**
 * 본문 블록 = 목차 한 줄. 대부분 섹션 하나가 블록 하나지만,
 * 연달아 나오는 트러블슈팅 섹션(데이터에서는 건마다 한 행)은 "트러블슈팅" 블록 하나로 묶는다.
 * 그래야 목차가 "트러블슈팅 01, 02, 03 ..."으로 길어지지 않고, 카드 여러 장을 한 자리에서 비교하며 읽을 수 있다.
 */
export type Block =
  | { kind: "section"; id: string; label: string; section: ProjectSection }
  | { kind: "troubleshooting"; id: string; label: string; items: Troubleshooting[] };

export function toBlocks(sections: ProjectSection[]): Block[] {
  const blocks: Block[] = [];
  for (const s of sections) {
    const last = blocks.at(-1);
    if (s.type === "troubleshooting") {
      if (last?.kind === "troubleshooting") last.items.push(s);
      else blocks.push({ kind: "troubleshooting", id: "troubleshooting", label: "트러블슈팅", items: [s] });
    } else {
      blocks.push({ kind: "section", id: s.id, label: splitTitle(s.title).main, section: s });
    }
  }
  return blocks;
}

/**
 * 섹션 type -> 리드(제목 아래 한 문장)와 본문.
 * zod의 discriminatedUnion에서 뽑은 타입이라 switch가 case마다 section 모양을 자동으로 좁혀주고,
 * 섹션 type을 하나 추가하면 assertNever가 컴파일 에러로 알려준다. (D-004, D-005, D-010)
 *  - markdown: 첫 문단이 리드, 나머지가 읽는 글. 챕터 이미지는 글 아래 한 번만 둔다(같은 그림이 페이지에 두 번 나오지 않게)
 *  - 그 밖의 type: body(짧은 질문형 문장, 예: "언제 무엇이 일어났는가")가 리드, meta가 본문
 */
function pieces(section: ProjectSection, tint: Tint): { lead: string | null; body: ReactNode; wide?: boolean } {
  switch (section.type) {
    case "markdown": {
      const [first, ...rest] = section.body.split(/\n{2,}/);
      return {
        lead: first,
        body: (
          <>
            {rest.length > 0 && <MarkdownSection blocks={rest} />}
            {section.image && (
              <figure className={styles.figure}>
                {/* 누르면 원본을 크게 보는 라이트박스(링크 안의 Media는 alt가 비어 있어도 링크의 aria-label이 설명한다) */}
                <ZoomImage url={section.image.src} alt={section.image.alt} className={`${styles.figureFrame} ${styles.zoomLink}`}>
                  <Media tint={tint} media={{ image: section.image.src }} sizes="(max-width: 768px) 100vw, 720px" position={section.image.position} />
                </ZoomImage>
                <figcaption className={styles.caption}>{section.image.alt}</figcaption>
              </figure>
            )}
          </>
        ),
      };
    }
    case "troubleshooting":
      // 보통은 toBlocks가 묶어서 TroubleshootingBlock으로 가지만, 단독으로 와도 카드 한 장으로 그린다
      return { lead: null, body: <TroubleshootingSection section={section} /> };
    case "metrics":
      return { lead: section.body, body: <MetricsSection section={section} /> };
    case "decisions":
      // 조용한 행 목록(트러블슈팅과 같은 문법)이라 본문 폭 안에서 읽는다
      return { lead: section.body, body: <DecisionsSection section={section} /> };
    case "timeline":
      return { lead: section.body, body: <TimelineSection section={section} /> };
    case "facts":
      return { lead: section.body, body: <FactsSection section={section} /> };
    case "gallery":
      // 갤러리는 본문 폭보다 넓게(오른쪽 여백까지) 써서 화면 캡처가 작아지지 않게 한다
      return { lead: section.body, body: <GallerySection section={section} tint={tint} />, wide: true };
    case "video":
      return { lead: section.body, body: <VideoSection section={section} /> };
    default:
      return assertNever(section);
  }
}

type Props = { block: Block; index: number; tint: Tint };

/**
 * 본문 블록 하나: 번호·영문 라벨(작게) -> 한국어 제목(h2) -> 리드 -> 본문.
 * 모든 블록이 같은 문법이라 어디서부터 읽어도 위계가 같다. 블록 사이 간격과 구분선은 CSS가 일정하게 준다.
 * 등장 모션은 블록 전체에 짧은 fade + 12px 이동 한 번만(Reveal, 움직임 줄이기·JS 없음이면 처음부터 보인다).
 * scroll-margin-top(CSS)으로 #앵커 이동 때 고정 헤더에 제목이 가리지 않는다.
 */
export function SectionRenderer({ block, index, tint }: Props) {
  const no = String(index + 1).padStart(2, "0");
  const titleId = `${block.id}-heading`;

  if (block.kind === "troubleshooting") {
    return (
      <section id={block.id} className={styles.block} aria-labelledby={titleId}>
        <Reveal y={12}>
          <Head no={no} sub="Troubleshooting" title={block.label} titleId={titleId} lead={`실제로 겪은 문제 ${block.items.length}건을 증상, 원인, 해결, 검증 순서로 적었습니다.`} />
          <div className={`${styles.blockBody} ${styles.cards}`}>
            {block.items.map((s) => (
              <TroubleshootingSection key={s.id} section={s} />
            ))}
          </div>
        </Reveal>
      </section>
    );
  }

  const { section } = block;
  const { main, sub } = splitTitle(section.title);
  const p = pieces(section, tint);

  return (
    <section id={section.id} className={styles.block} data-wide={p.wide || undefined} aria-labelledby={titleId}>
      <Reveal y={12}>
        <Head no={no} sub={sub} title={main} titleId={titleId} lead={p.lead} />
        <div className={styles.blockBody}>{p.body}</div>
      </Reveal>
    </section>
  );
}

function Head({ no, sub, title, titleId, lead }: { no: string; sub: string | null; title: string; titleId: string; lead: string | null }) {
  return (
    <header className={styles.head}>
      <p className={styles.eyebrow}>
        <span className={styles.eyebrowNo}>{no}</span>
        {sub && <span lang="en">{sub}</span>}
      </p>
      <h2 id={titleId} className={styles.title}>
        {title}
      </h2>
      {lead && (
        <p className={styles.lead}>
          <Inline text={lead} />
        </p>
      )}
    </header>
  );
}
