import type { MouseEvent, ReactNode } from "react";
import styles from "./Timeline.module.css";

export type TimelineItem = {
  id: string;
  /** 큰 글자(제목) */
  title: ReactNode;
  /** 제목 아래의 작은 회색 글자(번호·날짜·기간 같은 보조 정보) */
  meta?: ReactNode;
  /** 있으면 항목 전체가 링크(목차로 쓸 때). 없으면 글자만 */
  href?: string;
  /** 현재 항목: 채워진 노드 + 링으로 강조한다. 하나만 true */
  current?: boolean;
};

type Props = {
  items: TimelineItem[];
  /**
   * 크기 변형. toc = 우측 목차(작게, 링크), log = 상세 본문의 날짜 표(본문 글자), display = About 경력(큰 세리프 제목).
   * 같은 시각 언어(세로선 + 원형 노드)를 크기만 바꿔 쓴다
   */
  variant?: "toc" | "log" | "display";
  /** 현재 항목에 달 aria-current 값. 목차는 "location", 일반 목록은 "step" */
  currentValue?: "location" | "step";
  /** 링크 클릭 처리(Lenis 이동 등). 이 함수를 넘기는 부모는 클라이언트 컴포넌트여야 한다 */
  onItemClick?: (item: TimelineItem, index: number, e: MouseEvent<HTMLAnchorElement>) => void;
  /**
   * 스크롤 점등 모드: 노드가 화면 중앙선을 지날 때 차례로 켜지는 것을 부모(클라이언트)가 data 속성으로 제어한다(ScrollTimeline).
   * 부모가 켜 주기 전(JS 없음·움직임 줄이기)에는 CSS 기본값이 "전부 점등"이라 정적 상태로도 다 읽힌다
   */
  scroll?: boolean;
  className?: string;
};

/**
 * 재사용 타임라인: 왼쪽 얇은 세로선 + 항목마다 원형 노드, 오른쪽에 제목과 그 아래 작은 회색 메타.
 *  - 현재 항목은 채워진 노드 + 굵은 링, 나머지는 빈 원 테두리. 전환은 0.3초(CSS transition)
 *  - 현재보다 앞(위) 항목들은 "지나간 항목"이라 노드 테두리와 이어지는 선이 강조색으로 채워진다(진행 표시)
 *  - 상태는 전부 props -> data 속성 -> CSS라 이 컴포넌트에는 훅이 없다(서버 컴포넌트에서도 그대로 쓸 수 있고, JS가 없어도 목록이 보인다)
 */
export function Timeline({ items, variant = "log", currentValue = "step", onItemClick, scroll, className }: Props) {
  const currentAt = items.findIndex((it) => it.current);
  return (
    <ol className={`${styles.timeline} ${className ?? ""}`} data-variant={variant} data-scroll={scroll || undefined}>
      {items.map((it, i) => {
        const body = (
          <>
            <span className={styles.node} aria-hidden="true" data-tl-node />
            <span className={styles.title}>{it.title}</span>
            {it.meta != null && <span className={styles.meta}>{it.meta}</span>}
          </>
        );
        return (
          <li key={it.id} className={styles.item} data-current={it.current || undefined} data-passed={currentAt >= 0 && i < currentAt ? "" : undefined}>
            {it.href ? (
              <a href={it.href} className={styles.body} aria-current={it.current ? currentValue : undefined} onClick={onItemClick ? (e) => onItemClick(it, i, e) : undefined}>
                {body}
              </a>
            ) : (
              <div className={styles.body} aria-current={it.current ? currentValue : undefined}>
                {body}
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
