/**
 * 섹션 제목 데이터는 "한국어 · English" 꼴이다(예: "왜 만들었나 · Problem", "트러블슈팅 01 · PR #17").
 * 화면에서는 한국어를 큰 제목으로, 뒤쪽을 작은 보조 라벨로 쓰므로 가운뎃점 기준으로 나눈다. 가운뎃점이 없으면 sub는 null.
 */
export function splitTitle(title: string): { main: string; sub: string | null } {
  const at = title.indexOf(" · ");
  if (at < 0) return { main: title, sub: null };
  return { main: title.slice(0, at), sub: title.slice(at + 3) };
}
