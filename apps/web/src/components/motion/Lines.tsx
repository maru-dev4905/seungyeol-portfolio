import type { JSX, ReactNode } from "react";
import styles from "./Motion.module.css";

type Props = {
  /** 제목을 줄 단위로 나눈 조각들. 줄마다 마스크를 씌워 RevealGroup이 아래에서 위로 드러낸다 */
  lines: readonly ReactNode[];
  /** 제목 태그(h1/h2). 글꼴·크기는 className이 정한다 */
  as?: "h1" | "h2";
  className?: string;
};

/**
 * 제목 줄 마스크 reveal의 마크업. 줄마다 [overflow:hidden 마스크 > data-r="line" 안쪽] 구조다.
 * 서버 HTML에는 글이 그대로 있고(움직임은 RevealGroup이 마운트 후에 건다) JS 없음·움직임 줄이기에서는 정적이다.
 * 줄은 display:block이라 스크린 리더도 줄 단위로 끊어 읽는다. RevealGroup 안에서만 움직인다.
 */
export function Lines({ lines, as: Tag = "h2", className }: Props): JSX.Element {
  return (
    <Tag className={className}>
      {lines.map((line, i) => (
        <span key={i} className={styles.mask}>
          <span className={styles.lineIn} data-r="line">
            {line}
          </span>
        </span>
      ))}
    </Tag>
  );
}
