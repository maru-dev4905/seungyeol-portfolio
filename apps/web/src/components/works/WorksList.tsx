"use client";

import { useState } from "react";
import { Media } from "@/components/media/Media";
import { HandoffLink } from "@/components/transition/HandoffLink";
import { mockupMedia } from "@/lib/handoff";
import type { ProjectMedia, Tint } from "@/lib/projects";
import styles from "./Works.module.css";

// 목록 한 행에 필요한 값만 서버에서 넘겨 받는다(직렬화 가능한 값만)
export type WorkRow = {
  slug: string;
  kind: "kit" | "project";
  name: string;
  description: string;
  tags: string[];
  tint: Tint;
  media?: ProjectMedia;
};

type Filter = "All" | "Kit" | "Project";
const FILTERS: Filter[] = ["All", "Kit", "Project"];

/**
 * Works 대표 목록(Metalab /work 레이아웃): "Filter By:" + 알약 필터, 그 아래 1px 구분선으로 나뉜 행.
 * 행 = 이름 | 설명 | (hover 때 열리는 240x160 썸네일) | 태그 | "View project".
 * 행 전체가 하나의 링크다(이름의 ::after가 행을 덮는다). 필터는 클라이언트 상태이고, 알약 버튼은 data-needs-js라
 * JS가 없으면 숨고 필터가 "All"이라 7개가 모두 보인다.
 */
export function WorksList({ rows }: { rows: WorkRow[] }) {
  const [filter, setFilter] = useState<Filter>("All");
  const shown = rows.filter((r) => filter === "All" || (filter === "Kit" ? r.kind === "kit" : r.kind === "project"));

  return (
    <>
      <nav className={styles.filterNav} aria-label="Filter works" data-needs-js>
        <p className={styles.filterLabel}>Filter By:</p>
        <div className={styles.chips}>
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              className={`pill ${styles.chip}`}
              aria-pressed={filter === f}
              data-active={filter === f}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </nav>
      <p className="sr-only" role="status">
        {shown.length} works
      </p>

      <ul className={styles.rows}>
        {shown.map((r) => (
          <li key={r.slug} className={styles.row} data-handoff-scope>
            <h2 className={styles.name}>
              {/* 행을 누르면 hover로 열린 썸네일(240x160)이 마스크로 열려 상세 히어로로 이어진다 */}
              <HandoffLink href={`/projects/${r.slug}`} tint={r.tint} projectMedia={r.media} source="[data-handoff-src]" className={styles.rowLink}>
                {r.name}
              </HandoffLink>
            </h2>
            <p className={styles.desc}>{r.description}</p>
            <div className={styles.thumb} aria-hidden="true" data-handoff-src>
              <Media tint={r.tint} media={mockupMedia(r.media)} label={false} sizes="(max-width: 768px) 100vw, 240px" />
            </div>
            <ul className={styles.tags} aria-label="Scope">
              {r.tags.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
            <span className={styles.view} aria-hidden="true">
              View project
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}
