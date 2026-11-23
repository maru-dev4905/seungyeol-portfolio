# D-002 스펙·카테고리는 공통 코드 테이블로 관리한다

- 상태: 확정
- 날짜: 2026-11-17

> 기술 스펙(SPEC)과 프로젝트 종류(CATE)는 `common_codes` 테이블 하나에서 구분자로 나눠 관리한다.

## 배경

스펙과 카테고리는 계속 늘어난다. 늘 때마다 테이블을 고치고 싶지 않다.

## 결정

```
common_codes (id, group_code, code, code_name, description, sort_order, is_used)
UNIQUE (group_code, code)
```

- 스펙은 프로젝트 하나에 여러 개 → `project_specs` 연결 테이블(다대다).
- 카테고리는 프로젝트 하나에 하나 → `projects.category_code_id` 컬럼.

## 이유

- 화면 코드를 고치지 않고 관리자에서 값만 추가하면 된다.
- SI 실무에서 많이 쓰는 패턴이다.

## 알고 있는 단점

카테고리 자리에 SPEC 코드가 들어가도 **FK만으로는 막지 못한다.**
→ 저장할 때 Nest 서비스에서 `group_code`가 맞는지 검사한다.

## 면접 포인트

"공통 코드 테이블의 단점은?"
→ 참조 무결성을 DB가 보장하지 못한다는 점, 그리고 어디서(Nest 서비스) 보완했는지.

## 남은 질문

없음.
