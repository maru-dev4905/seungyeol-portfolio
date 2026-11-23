"use client";

import { useId, useState, type CSSProperties, type JSX } from "react";
import { memoryCaption, memoryTree, type MemoryNode } from "@/lib/workflow";
import styles from "./Memory.module.css";

// 메모리 파일 트리(에디터·터미널의 파일 탐색기 모양). 폴더는 버튼(Enter/Space, aria-expanded)으로 접고 편다.
// 서버 HTML은 전부 펼친 상태라 JS가 없어도 모든 파일과 설명이 읽힌다(접힘 상태는 마운트 뒤 클릭으로만 생긴다).
// 구조는 중첩 목록(ul/li): 접힌 폴더의 자식 목록은 hidden이라 화면과 스크린 리더 모두에서 빠진다.

// 폴더 앞 화살표(펼치면 아래를 향한다: CSS가 돌린다)와 폴더·파일 아이콘. 순수 SVG, 선 1.25px
function Chevron(): JSX.Element {
  return (
    <svg className={styles.chev} width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
      <path d="M4 2.5 7.5 6 4 9.5" />
    </svg>
  );
}

function Icon({ dir, open }: { dir: boolean; open: boolean }): JSX.Element {
  return (
    <svg className={styles.icon} width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" focusable="false">
      {dir ? (
        open ? (
          <path d="M1.5 11.5v-8h4l1.5 1.5h5v1.5M1.5 11.5l1.8-5h9.7l-1.8 5z" />
        ) : (
          <path d="M1.5 3.5h4L7 5h5.5v6.5h-11z" />
        )
      ) : (
        <path d="M3 1.5h5.5l3 3v8H3zM8.5 1.5v3h3" />
      )}
    </svg>
  );
}

function Item({ node, depth, closed, toggle, uid }: { node: MemoryNode; depth: number; closed: ReadonlySet<string>; toggle: (id: string) => void; uid: string }): JSX.Element {
  const dir = !!node.children; // 접고 펴는 폴더(자식이 있다)
  const folder = dir || !!node.dir; // 폴더 아이콘으로 보이는 항목(빈 폴더 포함)
  const isOpen = !closed.has(node.id);
  const listId = `${uid}-${node.id}`;
  return (
    <li>
      <div className={styles.row} style={{ "--depth": depth } as CSSProperties}>
        {dir ? (
          <button type="button" className={styles.name} aria-expanded={isOpen} aria-controls={listId} onClick={() => toggle(node.id)}>
            <Chevron />
            <Icon dir open={isOpen} />
            <span>{node.name}</span>
          </button>
        ) : (
          <span className={styles.name}>
            <span className={styles.chevGap} aria-hidden="true" />
            <Icon dir={folder} open={false} />
            <span>{node.name}</span>
          </span>
        )}
        {/* 오른쪽 회색 주석: `# 담는 것 — 기록하는 쪽` (코드의 주석처럼) */}
        <span className={styles.note}>
          <span aria-hidden="true"># </span>
          <span className={styles.what}>{node.what}</span>
          {node.who && <span> — {node.who}</span>}
        </span>
      </div>
      {dir && (
        <ul id={listId} hidden={!isOpen}>
          {node.children!.map((c) => (
            <Item key={c.id} node={c} depth={depth + 1} closed={closed} toggle={toggle} uid={uid} />
          ))}
        </ul>
      )}
    </li>
  );
}

export function MemoryTree(): JSX.Element {
  const uid = useId();
  // 접힌 폴더 id의 집합. 기본은 비어 있다(모두 펼침)
  const [closed, setClosed] = useState<ReadonlySet<string>>(new Set());
  const toggle = (id: string) =>
    setClosed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <figure className={styles.term}>
      <div className={styles.bar} aria-hidden="true">
        <i />
        <i />
        <i />
        <span>memory</span>
      </div>
      <ul className={styles.tree} aria-label="메모리 파일 트리">
        <Item node={memoryTree} depth={0} closed={closed} toggle={toggle} uid={uid} />
      </ul>
      {/* 터미널 느낌의 한 줄 캡션 */}
      <figcaption className={styles.caption}>
        <span className={styles.prompt} aria-hidden="true">
          $
        </span>
        {memoryCaption}
      </figcaption>
    </figure>
  );
}
