import type { ReactNode } from "react";
import { Inline } from "./Inline";
import styles from "./Section.module.css";

// 한글이 한 글자라도 있는지. 원문 사이트에 함께 적힌 영문 번역 문단을 골라 작게 보여 주는 데 쓴다
const HANGUL = /[가-힣]/;

/**
 * 아주 작은 마크다운: 라이브러리를 정하기 전까지 데이터에 필요한 세 가지만 지원한다(D-017 남은 질문).
 *  - 빈 줄 = 문단 구분
 *  - "- " 로 시작하는 줄 = 불릿 목록(연속된 줄을 한 목록으로 묶는다)
 *  - "### " 로 시작하는 줄 = 소제목(h3)
 *  - 한글이 없는 문단 = 원문의 영문 번역. lang="en"과 "EN" 표시를 달아 본문과 구분한다
 * 문장 속 `백틱`은 Inline이 코드로 바꾼다.
 */
export function MarkdownSection({ blocks }: { blocks: string[] }) {
  return (
    <div className={styles.prose}>
      {blocks.map((block, i) => {
        if (!HANGUL.test(block)) {
          return (
            <p key={i} lang="en" className={styles.translation}>
              <span className={styles.translationTag} aria-hidden="true">
                EN
              </span>
              {block}
            </p>
          );
        }
        return <Block key={i} block={block} />;
      })}
    </div>
  );
}

// 문단 하나를 줄 단위로 읽어 p / ul / h3로 나눈다
function Block({ block }: { block: string }) {
  const out: ReactNode[] = [];
  let items: string[] = [];
  // 모아 둔 불릿 줄이 있으면 목록 하나로 내보낸다
  const flush = () => {
    if (items.length === 0) return;
    out.push(
      <ul key={out.length} className={styles.bullets}>
        {items.map((item, i) => (
          <li key={i}>
            <Inline text={item} />
          </li>
        ))}
      </ul>,
    );
    items = [];
  };

  for (const line of block.split("\n")) {
    if (line.startsWith("- ")) {
      items.push(line.slice(2));
      continue;
    }
    flush();
    if (line.startsWith("### ")) {
      out.push(
        <h3 key={out.length} className={styles.subhead}>
          {line.slice(4)}
        </h3>,
      );
    } else if (line.trim()) {
      out.push(
        <p key={out.length}>
          <Inline text={line} />
        </p>,
      );
    }
  }
  flush();
  return <>{out}</>;
}
