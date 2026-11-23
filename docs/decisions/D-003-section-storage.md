# D-003 섹션 저장 방식: body(md) + meta(JSONB)

- 상태: 확정 (`meta` 컬럼 이름만 미정)
- 날짜: 2026-11-17

> 섹션은 `project_contents`에 한 행씩 저장한다. 글은 `body`(md)에, 칸이 나뉜 데이터는 `meta`(JSONB)에 넣는다.

## 배경

프로젝트마다 어떤 섹션이 몇 개, 어떤 순서로 들어갈지 모른다.
트러블슈팅은 카드처럼 구조를 갖춰 보여주고 싶다.

## 고민한 선택지

| 안 | 방식 | 버린 이유 / 채택 |
| --- | --- | --- |
| 섹션별 컬럼 | `projects`에 트러블슈팅·성과 등 컬럼을 나눠 둠 (처음 내 생각) | 같은 섹션을 두 번 못 넣고, 순서를 못 바꾸고, 빈칸이 많고, 새 섹션마다 테이블을 고쳐야 함 |
| A. 전부 md | 1:N + 순서, 내용은 md 덩어리 (시니어 피드백) | 트러블슈팅·성과·갤러리를 구조 있게 그릴 수 없음 |
| **B. md + JSONB** | A에 `meta`(JSONB) 컬럼 추가 | **채택** |

## 결정

```
project_contents (id, project_id, sort_order, type, title, body, meta, created_at, updated_at)
```

| type | body | meta |
| --- | --- | --- |
| markdown (텍스트·코드 블록) | 본문 전체 | 없음 |
| troubleshooting | 회고 한 줄 (선택) | `{ problem, cause, solution, result }` |
| metrics | 없음 | `[{ label, value, unit }]` |
| gallery | 없음 | `{ layout: 'grid' \| 'slider', images: [{ url, alt }] }` (alt 필수) |
| video | 설명 (선택) | `{ youtubeUrl }` |

이미지 파일은 Supabase Storage에 올리고, DB에는 URL만 저장한다.

## 이유

- 1:N이라 같은 종류를 여러 번 넣고 순서도 바꿀 수 있다.
- 보통 섹션은 md만 쓰고, 구조가 필요한 섹션만 `meta`를 쓴다.
- 텍스트와 코드 블록은 md 하나로 합쳤다.

## 면접 포인트

"어떤 값이냐에 따라 나머지 모양이 달라지는" 데이터를 **정규화된 테이블과 JSONB를 섞어** 저장한 이유.
JSONB 안의 검증은 D-005(zod)가 맡는다.

## 남은 질문

- [ ] `meta`는 본래 '부가 정보'라는 뜻이라, 트러블슈팅처럼 **본 내용**을 담는 칸에는 맞지 않는다. `data`, `fields` 등으로 바꿀지 정해야 한다.
