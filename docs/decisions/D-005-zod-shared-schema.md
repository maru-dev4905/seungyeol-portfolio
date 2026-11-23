# D-005 JSONB 검증은 zod 공유 스키마로 Nest·Next 양쪽에서

- 상태: 확정
- 날짜: 2026-11-17

> 섹션 모양은 zod 스키마 하나로 정의하고, Nest(저장)와 Next(폼·화면)가 같이 쓴다.

## 배경

- DB는 JSONB 안을 검사하지 않는다.
- TS 타입은 컴파일할 때만 존재한다.
- 그래서 API 요청처럼 **밖에서 들어오는 데이터는 런타임에 직접 검사**해야 한다.

## 고민한 선택지

- 검증 위치: 한쪽만 / 양쪽
- 양쪽이라면: class-validator(Nest 기본) + TS interface / **zod 공유 스키마**

## 결정

양쪽 검증, zod 공유 스키마. 역할은 다르다.

| 위치 | 하는 일 |
| --- | --- |
| Nest | 요청을 받을 때 `parse()`. 잘못된 데이터가 DB에 들어가는 것을 막는 **진짜 문지기** |
| Next 관리자 폼 | react-hook-form + `zodResolver`로 입력 즉시 에러 표시 (**UX**) |
| Next 화면 | `z.infer`로 뽑은 타입으로 섹션 컴포넌트를 그림 |

```ts
const sectionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("markdown"), body: z.string(), meta: z.null() }),
  z.object({
    type: z.literal("troubleshooting"),
    body: z.string().nullable(),
    meta: z.object({ problem: z.string(), cause: z.string(), solution: z.string(), result: z.string() }),
  }),
  // metrics, gallery, video ...
])
export type Section = z.infer<typeof sectionSchema>
```

## 이유

- `type`에 따라 `meta` 모양이 달라지는 구조를 `z.discriminatedUnion("type", [...])`으로 그대로 표현할 수 있다.
- 규칙을 한 곳에만 적으니 **검증 규칙과 타입이 어긋날 수 없다.**

## 비용 / 주의

- 스키마를 공유하려면 모노레포와 공유 패키지(`packages/schemas`)가 필요하다 → D-009.
- Nest 기본 방식(class-validator)에서 벗어난다.
- zod는 `parse()`를 **호출한 곳에서만** 검사한다. 어디서 부를지도 설계의 일부다.

## 면접 포인트 (내 말로 정리)

DB는 JSONB 안을 검사하지 않고, TS 타입은 컴파일할 때만 존재한다.
그래서 밖에서 들어오는 데이터는 런타임에 zod로 직접 검사한다.
타입은 zod 스키마에서 뽑아 쓰기 때문에 검증 규칙과 타입이 항상 같은 곳에서 나온다.

## 남은 질문

없음.
