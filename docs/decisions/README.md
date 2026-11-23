# 결정 기록 (Decision Records)

이 사이트를 만들면서 내린 설계 결정과 그 이유를 남기는 폴더다.
목적은 두 가지다.

1. 코드를 **내 말로 설명**할 수 있게 한다. 설명할 수 없는 코드는 머지하지 않는다.
2. 면접에서 "왜 이렇게 했나요?"에 답할 재료, 그리고 포트폴리오 상세 페이지의 재료로 쓴다.

> 디자인·작업 방식의 선택을 시간순으로 풀어 쓴 기록: [우리 선택 역사](../history/design-choices.md)

## 결정 목록

| ID | 결정 | 상태 |
| --- | --- | --- |
| [D-001](./D-001-nest-backend.md) | 포트폴리오에 Nest 백엔드를 두고 관리자 기능을 만든다 | 확정 |
| [D-002](./D-002-common-codes.md) | 스펙·카테고리는 공통 코드 테이블로 관리한다 | 확정 |
| [D-003](./D-003-section-storage.md) | 섹션은 `project_contents` 한 행씩, `body`(md) + `meta`(JSONB) | 확정 (`meta` 이름 미정) |
| [D-004](./D-004-section-type.md) | 섹션 `type`은 문자열 + CHECK | 확정 |
| [D-005](./D-005-zod-shared-schema.md) | JSONB 검증은 zod 공유 스키마로 Nest·Next 양쪽에서 | 확정 |
| [D-006](./D-006-sort-order.md) | 순서 컬럼은 `sort_order` | 일부 미정 (드래그 정렬 방식) |
| [D-007](./D-007-page-structure.md) | 메인과 소개 페이지를 나눈다 | 확정 |
| [D-008](./D-008-rendering-strategy.md) | 방문자 페이지는 SSG·ISR, 관리자는 CSR | 확정 |
| [D-009](./D-009-monorepo.md) | pnpm workspace + Turborepo 모노레포 | 확정 (스코프 `@portfolio`) |
| [D-010](./D-010-figma-scope.md) | 핵심 화면만 Figma로, 관리자는 코드로 바로 | 확정 |
| [D-011](./D-011-design-concept.md) | 그레이니 그라데이션 + 리퀴드 글래스 | 확정 |

| [D-012](./D-012-node-version.md) | Node는 22 LTS로 고정한다 | 확정 |
| [D-013](./D-013-typescript-version.md) | TypeScript는 6.0.x로 모노레포 전체를 맞춘다 | 확정 |
| [D-014](./D-014-schemas-build.md) | schemas 패키지는 tsup으로 ESM만 빌드한다 | 확정 |
| [D-015](./D-015-cache-components.md) | Next의 Cache Components를 켠 채로 간다 | 확정 |

| [D-016](./D-016-styling.md) | 스타일링은 CSS Modules + 전역 디자인 토큰 | 잠정 확정 |
| [D-017](./D-017-detail-page-design.md) | 프로젝트 상세 페이지 디자인 해석과 구현 (샘플) | 샘플 완료, 세부 미정 |

| [D-018](./D-018-dark-grain-shader-and-refraction-glass.md) | 어두운 바탕 + WebGL 그레인 셰이더 배경 + SVG 굴절 글래스 | 일부 미정 (D-017의 파스텔 해석 대체) |

| [D-019](./D-019-redesign-bold-editorial.md) | 리디자인: 시원한 에디토리얼 레이아웃 + 디더링 셰이더 + Lenis/GSAP 모션 | 일부 미정 (D-017 레이아웃, D-018 팔레트·작업 순서 대체) |

| [D-020](./D-020-water-theme-presets-and-chapter-nav.md) | 시안 기준 팔레트, 페이지·프로젝트별 테마 프리셋, 생성형 커버, 글래스 알약 목차 | 일부 미정 (D-019의 팔레트 대체) |

새 결정은 **D-021**부터 이어 붙인다.

## 아직 정하지 않은 것

- [ ] `meta` 컬럼 이름 (`data`, `fields` 등) → D-003
- [ ] 드래그 정렬 방식 A(통째로 다시 매기기) / B(사이값) → D-006
- [ ] 기술 스택으로 목록 필터를 넣을지 → D-007
- [ ] 메인 인터랙션 구체화와 색 팔레트 → D-011
- [ ] 블로그·배움일기 페이지를 둘지 → D-007
- [ ] 서버리스(Vercel)에서 `use cache` 런타임 캐시 동작 확인 (첫 배포 때) → D-015
- [ ] 배경을 CSS로 갈지 WebGL 셰이더로 갈지, `Backdrop`을 레이아웃에 둘지 → D-017
- [ ] `sectionSchema`에 `id`/`title`/`sort_order`를 넣을지 → D-017
- [ ] 마크다운 렌더링 라이브러리 → D-017
- [ ] 다크 모드 지원 여부 → D-016

## 작성 규칙

- 파일 이름은 `D-번호-짧은-영문-이름.md`. 템플릿은 [_template.md](./_template.md).
- 순서는 **배경 → 고민한 선택지 → 결정 → 이유 → 면접 포인트 → 남은 질문**.
- 버린 선택지는 "왜 버렸는지"까지 적는다. 결정보다 탈락 이유가 더 설명하기 어렵다.
- 처음에 틀렸다가 바로잡은 것, 알고 있는 단점은 숨기지 않고 적는다. 면접 포인트가 된다.
- 결정이 바뀌면 지우지 않는다. 상태를 `대체됨(D-0XX)`으로 바꾸고 새 결정을 쓴다.
- 세팅이나 구현 중 막힌 문제는 원인과 해결을 짧게 해당 결정 파일 끝의 "트러블슈팅"에 덧붙인다.
