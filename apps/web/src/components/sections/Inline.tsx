import { Fragment } from "react";
import styles from "./Section.module.css";

/**
 * 한 줄 글 안의 `백틱`을 <code>로 바꾼다. 명령어·파일 이름·환경변수가 문장 속에 섞여 있어
 * 그냥 두면 어디까지가 코드인지 읽기 어렵다. 마크다운 라이브러리 없이 백틱 하나만 지원한다(D-017 남은 질문: 라이브러리 미정).
 * split에 괄호 그룹을 쓰면 잘린 조각(코드 안쪽)이 홀수 번째에 들어온다.
 */
export function Inline({ text, numbers = false }: { text: string; numbers?: boolean }) {
  const parts = text.split(/`([^`]+)`/);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <code key={i} className={styles.code}>
            {part}
          </code>
        ) : (
          <Fragment key={i}>{numbers ? <Numbers text={part} /> : part}</Fragment>
        ),
      )}
    </>
  );
}

// numbers: 글 속의 수치(횟수·개수·%·용량 등 숫자 + 단위)를 굵게 강조한다. 트러블슈팅 "검증" 단계처럼 결과가 숫자로 말하는 글에서 쓴다.
// 코드 조각(백틱 안)은 건드리지 않는다. 숫자만 있고 단위가 없는 것(PR #17의 17 등)도 강조 대상이라 검증 문장에서만 켠다.
function Numbers({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\d[\d.,]*\s?(?:번|개|회|건|%|GB|ms|줄|곳|종|명)?)/).map((p, i) =>
        i % 2 === 1 ? (
          <strong key={i} className={styles.num}>
            {p}
          </strong>
        ) : (
          <Fragment key={i}>{p}</Fragment>
        ),
      )}
    </>
  );
}
