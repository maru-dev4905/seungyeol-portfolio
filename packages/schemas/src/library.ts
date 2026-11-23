import { z } from "zod"

/**
 * Library(써 보려고 모아 두는 라이브러리·플러그인) 항목 하나의 모양.
 * 지금은 apps/web의 데이터 파일이 이 스키마로 검증하고, 관리자 페이지가 생기면 같은 스키마로 DB 입력을 검증한다.
 */

/** 분류. 영문 라벨은 화면(apps/web/src/lib/library.ts)에서 따로 붙인다(스키마는 값만 안다) */
export const libraryCategorySchema = z.enum([
  "animation",
  "ui",
  "state",
  "form",
  "data",
  "framework",
  "tooling",
  "testing",
  "other",
])
export type LibraryCategory = z.infer<typeof libraryCategorySchema>

/** 상태: used = 써봄, planned = 써볼 예정, watching = 관심. 표시 순서도 이 배열 순서다 */
export const libraryStatusSchema = z.enum(["used", "planned", "watching"])
export type LibraryStatus = z.infer<typeof libraryStatusSchema>

export const libraryItemSchema = z.object({
  // URL·키로 쓰는 slug(소문자·숫자·하이픈)
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "id는 소문자·숫자·하이픈만 쓴다"),
  name: z.string().min(1),
  // 공식 소개를 한국어로 풀이한 한 줄
  tagline: z.string().min(1),
  category: libraryCategorySchema,
  status: libraryStatusSchema,
  // 공식 사이트. 외부 링크라 https만 받는다
  url: z.url({ protocol: /^https$/ }),
  // npm 패키지명(예: "gsap", "@playwright/test")
  npm: z.string().min(1).optional(),
  // 사용자 본인이 쓴 한 줄 코멘트. 없으면 화면에 아무것도 나오지 않는다
  note: z.string().min(1).optional(),
  // 모은 날짜 YYYY-MM-DD
  addedAt: z.iso.date(),
})

/** 스키마에서 뽑은 타입 */
export type LibraryItem = z.infer<typeof libraryItemSchema>
