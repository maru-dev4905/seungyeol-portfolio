import { z } from "zod"

/**
 * 프로젝트 상세의 섹션 하나(project_contents 한 행)의 모양.
 * type 값에 따라 body / meta 모양이 달라지므로 discriminatedUnion을 쓴다. (D-003, D-005)
 */
export const sectionSchema = z.discriminatedUnion("type", [
  // 텍스트·코드 블록: 본문 전체가 md
  z.object({
    type: z.literal("markdown"),
    body: z.string(),
    meta: z.null(),
  }),

  // 트러블슈팅: 구조가 있는 카드. body는 회고 한 줄(선택)
  z.object({
    type: z.literal("troubleshooting"),
    body: z.string().nullable(),
    meta: z.object({
      problem: z.string(),
      cause: z.string(),
      solution: z.string(),
      result: z.string(),
    }),
  }),

  // 임팩트 숫자
  z.object({
    type: z.literal("metrics"),
    body: z.null(),
    meta: z.array(
      z.object({
        label: z.string(),
        value: z.string(),
        unit: z.string(),
      }),
    ),
  }),

  // 갤러리: alt는 접근성을 위해 필수
  z.object({
    type: z.literal("gallery"),
    body: z.null(),
    meta: z.object({
      layout: z.enum(["grid", "slider"]),
      images: z.array(
        z.object({
          url: z.string(),
          alt: z.string().min(1),
        }),
      ),
    }),
  }),

  // 설계 결정(추가): 선택지 중 무엇을 왜 골랐는지. rejected는 "선택하지 않은 방법"(선택)
  z.object({
    type: z.literal("decisions"),
    body: z.string().nullable(),
    meta: z.array(
      z.object({
        title: z.string(),
        reason: z.string(),
        rejected: z.string().optional(),
      }),
    ),
  }),

  // 타임라인(추가): 날짜 + 한 줄 사건
  z.object({
    type: z.literal("timeline"),
    body: z.string().nullable(),
    meta: z.array(z.object({ date: z.string(), text: z.string() })),
  }),

  // 개요 표(추가): 라벨/값 쌍(프로젝트·유형·팀·역할 등)
  z.object({
    type: z.literal("facts"),
    body: z.string().nullable(),
    meta: z.array(z.object({ label: z.string(), value: z.string() })),
  }),

  // 영상: body는 설명(선택)
  z.object({
    type: z.literal("video"),
    body: z.string().nullable(),
    meta: z.object({
      youtubeUrl: z.string(),
    }),
  }),
])

/** 스키마에서 뽑은 타입. 검증 규칙과 타입이 항상 같은 곳에서 나온다. */
export type Section = z.infer<typeof sectionSchema>

/** 섹션 type 목록. Figma 컴포넌트 목록과 짝을 맞출 때 쓴다. (D-010) */
export type SectionType = Section["type"]

/** 프로젝트 종류(추가): kit = 직접 문제를 정의해 만든 도구(Meerkit, Weave), project = 의뢰받은 작업 */
export const projectKindSchema = z.enum(["kit", "project"])
export type ProjectKind = z.infer<typeof projectKindSchema>
