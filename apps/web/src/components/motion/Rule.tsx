import type { JSX } from "react";
import styles from "./Motion.module.css";

/** 섹션 전환 구분선. RevealGroup 안에서 왼쪽 -> 오른쪽으로 그려진다. 장식이라 스크린 리더에는 숨긴다 */
export function Rule({ className }: { className?: string }): JSX.Element {
  return <span className={`${styles.rule} ${className ?? ""}`} data-r="rule" aria-hidden="true" />;
}
