import type { JSX } from "react";
import type { AvatarKind } from "@/lib/workflow";
import styles from "./Roles.module.css";

// 역할 캐릭터(순수 인라인 SVG, 48x48). 모두 같은 규칙으로 그린다: 선 1.5px, 둥근 끝, 색은 글자색(currentColor)과 포인트 토큰 하나뿐.
// 사람 = 어깨와 둥근 머리(일반 아이콘), AI = 네모난 머리의 로봇(안테나·눈 모양이 역할마다 다름), 외부 리뷰어 = 토끼 귀 모티프, 자동화 = 톱니(AI 아님).
// 장식이라 스크린 리더에는 숨기고(aria-hidden), 이름은 카드의 글이 말한다.

// 톱니 이빨: 중심(24,24)에서 반지름 11~14로 뻗는 짧은 선 8개. 좌표는 소수 둘째 자리로 고정해 서버·클라이언트 출력이 같게 한다
const GEAR_TEETH = Array.from({ length: 8 }, (_, i) => {
  const a = (i * Math.PI) / 4;
  const p = (r: number) => `${(24 + r * Math.cos(a)).toFixed(2)} ${(24 + r * Math.sin(a)).toFixed(2)}`;
  return `M${p(11.5)} L${p(15)}`;
});

function Shape({ kind }: { kind: AvatarKind }): JSX.Element {
  switch (kind) {
    case "human":
      // 머리(원) + 어깨(호). 사람은 로봇과 달리 안테나·눈이 없다
      return (
        <>
          <circle cx="24" cy="17" r="7" />
          <path d="M9 41c0-8.5 6.5-13 15-13s15 4.5 15 13" />
        </>
      );
    case "orchestrator":
      // 둥근 머리 + 갈래 안테나(여럿을 조율) + 눈 둘
      return (
        <>
          <rect x="9" y="18" width="30" height="22" rx="11" />
          <path d="M24 18v-6M24 12l-7-5M24 12l7-5" />
          <circle cx="17" cy="7" r="1.6" className={styles.accent} />
          <circle cx="31" cy="7" r="1.6" className={styles.accent} />
          <circle cx="18" cy="29" r="1.8" className={styles.dot} />
          <circle cx="30" cy="29" r="1.8" className={styles.dot} />
        </>
      );
    case "implementer":
      // 각진 머리 + 코드 괄호 눈(‹ ›) + 짧은 안테나
      return (
        <>
          <rect x="9" y="16" width="30" height="24" rx="5" />
          <path d="M24 16v-5" />
          <circle cx="24" cy="9" r="1.8" className={styles.accent} />
          <path d="M20 25l-4 4 4 4M28 25l4 4-4 4" />
        </>
      );
    case "verifier":
      // 눈 하나(돋보기처럼 큰 눈) + 고리 안테나 + 옆 귀
      return (
        <>
          <rect x="9" y="17" width="30" height="23" rx="8" />
          <circle cx="24" cy="10" r="3" />
          <path d="M24 13v4M5 27v6M43 27v6" />
          <circle cx="24" cy="29" r="6.5" />
          <circle cx="24" cy="29" r="2.2" className={styles.accent} />
        </>
      );
    case "reviewer":
      // 토끼 귀 두 개 + 둥근 얼굴(외부 리뷰어). 귀 모티프만 쓰고 특정 로고는 따라 그리지 않는다
      return (
        <>
          <ellipse cx="17" cy="11" rx="4" ry="9" />
          <ellipse cx="31" cy="11" rx="4" ry="9" />
          <rect x="9" y="22" width="30" height="19" rx="9.5" />
          <circle cx="18.5" cy="31" r="1.7" className={styles.dot} />
          <circle cx="29.5" cy="31" r="1.7" className={styles.dot} />
          <path d="M22 35.5h4" />
        </>
      );
    case "automation":
      // 톱니바퀴: 몸통 원 + 이빨 + 가운데 구멍. 얼굴이 없어 AI가 아닌 규칙 기반임을 보인다
      return (
        <>
          <circle cx="24" cy="24" r="9" />
          <circle cx="24" cy="24" r="3.5" className={styles.accent} />
          {GEAR_TEETH.map((d) => (
            <path key={d} d={d} />
          ))}
        </>
      );
  }
}

export function RoleAvatar({ kind }: { kind: AvatarKind }): JSX.Element {
  return (
    <svg className={styles.avatar} width="48" height="48" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <Shape kind={kind} />
    </svg>
  );
}
