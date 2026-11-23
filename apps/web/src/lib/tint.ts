import type { Tint } from "@/lib/projects";

// 색조 이름 -> globals.css 토큰 이름. 색 값은 토큰 한 곳에만 있고 여기서는 이름만 이어 준다(D-016).
export const tintToken = (tint: Tint): string => `--tint-${tint}`;
