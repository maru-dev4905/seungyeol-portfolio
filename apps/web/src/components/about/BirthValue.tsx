"use client";

import { useSyncExternalStore } from "react";

type Props = {
  /** 화면에 그대로 보이는 생년월일 글자(예: "2001.03.30") */
  text: string;
  birth: { y: number; m: number; d: number };
};

// 구독할 것이 없다(나이는 페이지를 연 순간의 값이면 충분하다)
const subscribe = () => () => {};

// 만 나이: 올해 - 태어난 해, 올해 생일이 아직 안 지났으면 1을 뺀다(월·일 비교)
function manAge(b: Props["birth"], now: Date): number {
  const before = now.getMonth() + 1 < b.m || (now.getMonth() + 1 === b.m && now.getDate() < b.d);
  return now.getFullYear() - b.y - (before ? 1 : 0);
}

/**
 * 생년월일 + 만 나이("2001.03.30 (만 25세)").
 * 서버 컴포넌트에서 new Date()를 쓰면 Cache Components의 프리렌더가 오류를 낸다(빌드 시각이 HTML에 굳는 것을 막는 규칙).
 * 그래서 나이는 브라우저에서만 계산한다. useSyncExternalStore의 서버 값(getServerSnapshot)은 null이라 서버 HTML에는 생년월일만 들어가고,
 * 하이드레이션 직후 브라우저 값(오늘 기준 나이)으로 바뀐다. 이 방식은 "마운트 후 setState"와 달리 하이드레이션 불일치 경고가 없고,
 * 나이 글자는 같은 줄 끝에 붙을 뿐이라 레이아웃이 밀리지 않는다. JS가 꺼져 있으면 생년월일만 보인다(거짓 나이를 보이지 않는다).
 */
export function BirthValue({ text, birth }: Props) {
  const age = useSyncExternalStore(
    subscribe,
    () => manAge(birth, new Date()),
    () => null,
  );
  return (
    <>
      {text}
      {age !== null && ` (만 ${age}세)`}
    </>
  );
}
