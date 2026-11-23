"use client";

import { useEffect, useLayoutEffect, useRef, type CSSProperties, type JSX } from "react";
import { prefersReducedMotion } from "@/lib/motion";
import { whenTransitionIdle } from "@/lib/transition-gate";
import { roles, type Role } from "@/lib/workflow";
import { RoleAvatar } from "./RoleAvatar";
import styles from "./Roles.module.css";

// 조직도(역할 트리). 데이터(lib/workflow.ts의 roles)의 parent로 트리를 만들고, 의미 있는 중첩 목록(ul/li)으로 마크업한다.
// 연결선·간격은 CSS(의사 요소)가 그리는 장식이라 스크린 리더는 목록의 중첩 구조로 "누가 누구 아래인지"를 안다.
// 모션: 스크롤로 화면에 들어오면 위에서 아래로 선이 그려지고 노드가 나타난다. 숨김 상태(data-motion="pending")는 마운트 뒤 JS가 건다 ->
//   서버 HTML·JS 없음·움직임 줄이기에서는 처음부터 완성된 정적 트리다.

type TreeNode = Role & { kids: TreeNode[] };

function buildTree(list: readonly Role[]): TreeNode {
  const byId = new Map<string, TreeNode>(list.map((r) => [r.id, { ...r, kids: [] }]));
  let root: TreeNode | undefined;
  for (const n of byId.values()) {
    if (n.parent === null) root = n;
    else byId.get(n.parent)?.kids.push(n);
  }
  if (!root) throw new Error("roles에 최상단(parent: null) 노드가 없습니다");
  return root;
}

function Node({ n, depth, i }: { n: TreeNode; depth: number; i: number }): JSX.Element {
  // depth = 등장 지연(위에서 아래로 한 단계씩), i = 같은 단계 안의 형제 순서(조금씩 어긋나게). 둘 다 CSS 변수로 넘긴다
  const style = { "--depth": depth, "--i": i } as CSSProperties;
  return (
    <li className={styles.node} data-side={n.side || undefined} data-gate={n.gate ? "" : undefined} style={style}>
      {n.gate && <span className={styles.gate}>{n.gate}</span>}
      <div className={styles.card} data-kind={n.avatar}>
        <RoleAvatar kind={n.avatar} />
        <div className={styles.cardHead}>
          <h4 className={styles.roleName}>{n.name}</h4>
          <p className={styles.runsAs}>{n.runsAs}</p>
        </div>
        <p className={styles.roleSummary}>{n.summary}</p>
        <p className={styles.roleConstraint}>
          <span className={styles.constraintLabel}>제약</span> {n.constraint}
        </p>
      </div>
      {n.kids.length > 0 && (
        <ul className={styles.kids} style={{ "--depth": depth } as CSSProperties} data-gate-kids={n.kids.length === 1 && n.kids[0].gate ? "" : undefined}>
          {n.kids.map((k, j) => (
            <Node key={k.id} n={k} depth={depth + 1} i={j} />
          ))}
        </ul>
      )}
    </li>
  );
}

export function RolesOrgChart(): JSX.Element {
  const rootRef = useRef<HTMLDivElement>(null);
  const tree = buildTree(roles);

  // 숨김 상태를 걸고(마운트 직후, 그리기 전) 화면에 들어오면 "go"로 바꿔 CSS 전환이 돌게 한다
  useLayoutEffect(() => {
    const el = rootRef.current;
    if (!el || prefersReducedMotion()) return;
    el.dataset.motion = "pending";
    return () => {
      delete el.dataset.motion;
    };
  }, []);

  useEffect(() => {
    const el = rootRef.current;
    if (!el || prefersReducedMotion()) return;
    let cancel = () => {};
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        // 페이지 전환 연출이 끝난 뒤에 시작한다(다른 등장 모션과 같은 규칙)
        cancel = whenTransitionIdle(() => {
          el.dataset.motion = "go";
        });
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.05 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancel();
    };
  }, []);

  return (
    <div ref={rootRef} className={styles.org}>
      <ul className={styles.tree}>
        <Node n={tree} depth={0} i={0} />
      </ul>
    </div>
  );
}
