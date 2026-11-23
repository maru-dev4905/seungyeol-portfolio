import { cacheLife, cacheTag } from "next/cache";
import type { ProjectKind, Section } from "@portfolio/schemas";
import { PROJECTS } from "./project-data";

/** 챕터에 곁들이는 이미지(선택). 텍스트 챕터(markdown)의 미디어 칸에 쓴다. position은 칸에 맞춰 잘릴 때 남길 기준점 */
export type SectionImage = { src: string; alt: string; position?: string };

/**
 * 섹션 한 행. project_contents에는 type/body/meta 외에 id, title도 있다.
 * Section(zod에서 뽑은 타입)에 id와 title(그리고 선택 image)을 더해서 쓴다.
 */
export type ProjectSection = { id: string; title: string; image?: SectionImage } & Section;

/**
 * 프로젝트 색조. 영상·이미지가 없을 때 홈 배경 셰이더와 미디어 자리표시가 쓰는 "검정 위의 단일 색조"의 이름이다.
 * 실제 색 값은 globals.css의 --tint-* 토큰에 한 번만 있다(D-016). DB 단계에서 공통 코드로 옮긴다(D-002).
 */
export type Tint = "indigo" | "red" | "teal";

/**
 * 프로젝트 미디어(선택). 값이 있으면 셰이더·자리표시 대신 이 파일이 홈 배경/썸네일/케이스 스터디 히어로가 된다.
 * 사이트 주인이 자기 영상(mp4)·이미지를 넣으면 코드 수정 없이 바뀐다(public/ 아래 경로나 URL).
 */
export type ProjectMedia = {
  video?: string;
  poster?: string;
  /** 대표 이미지. 홈 알약 hover 때 화면 전체 배경으로 깔린다 */
  image?: string;
  /**
   * 기기 목업 장면(1920x1200, 16:10 webp). 홈 hover의 작은 썸네일·메뉴 창 미리보기·이미지 이어받기 전환·상세 히어로가 모두 이 그림을 쓴다.
   * 작은 칸에서 커지는 그림과 도착한 히어로가 같은 그림이어야 전환이 끊기지 않기 때문이다(lib/handoff.ts의 mockupMedia).
   */
  mockup?: string;
  /**
   * 홈 hover 썸네일 카드의 비율(CSS aspect-ratio 값, 예: "16 / 10"). 없으면 카드 기본(변형에 따라 3:4 세로 또는 16:10).
   * 가로 목업(모니터 장면)이 세로 카드에 cover로 들어가면 양옆이 크게 잘려서, 프로젝트별로 가로 프레임을 고를 수 있게 둔다.
   */
  aspect?: string;
  /** 홈 hover 배경 위에 덮는 어둠(0~1, 검정 그라디언트의 최대 불투명도). 밝은 배경에서도 흰 글자 대비 4.5:1을 넘기려고 프로젝트마다 측정해 정한다 */
  dim?: number;
};

/**
 * 목록(홈 알약·메뉴 Case Studies)에서 묶는 그룹. featured = 직접 만든 도구 2개(Meerkit, Weave)가 위에서 크게, selected = 나머지 작업.
 * kind(Works 필터의 Kit/Project)와 따로 둔다: 필터 기준과 목록의 위계 기준이 나중에 달라질 수 있어서다.
 */
export type ProjectGroup = "featured" | "selected";

export type ProjectDetail = {
  slug: string;
  /** kit = 직접 문제를 정의해 만든 도구(Meerkit, Weave) / project = 의뢰받은 작업. Works 필터가 이 값으로 나눈다 */
  kind: ProjectKind;
  /** 홈·메뉴 목록의 그룹(위계). 현재는 meerkit·weave만 featured */
  group: ProjectGroup;
  title: string;
  /** 홈 알약·큰 제목에 쓰는 짧은 이름(영문). 긴 title은 케이스 스터디 페이지 제목에 쓴다 */
  shortName: string;
  /** 홈 hover 때 나오는 한 줄 설명(영문, 200자 안팎 이하) */
  tagline: string;
  /** 홈 hover 때 나오는 하단 분류 라벨 */
  productType: string;
  tint: Tint;
  media?: ProjectMedia;
  summary: string;
  /** 상세 첫 화면의 "Project Type" 값(사이트의 Type) */
  category: string;
  company: string;
  role: string;
  /** 기간. 사이트에 적힌 그대로(예: "1 Month", "2026.10 ~ 2026.11"). 정확한 날짜가 없는 작업이 많아 문자열로 둔다 */
  period: string;
  /** 연도(Works 목록의 Year 열). 기존 포트폴리오의 works 목록 값 */
  year: string;
  /** Works 목록 오른쪽 열에 세로로 나열하는 태그(역할·분류) */
  tags: string[];
  specs: string[];
  githubUrl: string | null;
  liveUrl: string | null;
  /** 그 밖의 링크(npm 등). 상세 맨 아래 알약으로 나온다 */
  links?: { label: string; url: string }[];
  sections: ProjectSection[];
};

/** 메인 작업 목록용: 모든 프로젝트. 상세와 같은 이유로 캐시한다(D-015). */
export async function getProjects(): Promise<ProjectDetail[]> {
  "use cache";
  cacheLife("max");
  cacheTag("projects");

  return PROJECTS;
}

/** 빌드할 때 미리 만들어둘 slug 목록. (generateStaticParams가 쓴다) */
export async function getProjectSlugs(): Promise<string[]> {
  return PROJECTS.map((project) => project.slug);
}

/**
 * 프로젝트 하나. 모두에게 같은 데이터이므로 캐시한다. (D-015)
 *
 * - 'use cache' : 이 함수의 결과를 캐시한다. 인자(slug)가 캐시 키가 된다.
 * - cacheLife   : 얼마나 오래 신선한가. 바뀌는 시점은 관리자 저장이므로 길게 둔다.
 * - cacheTag    : 캐시 항목의 이름표. 관리자가 저장하면 updateTag로 이 이름표를 만료시킨다.
 */
export async function getProject(slug: string): Promise<ProjectDetail | null> {
  "use cache";
  cacheLife("max");
  cacheTag("projects", `project:${slug}`);

  return PROJECTS.find((project) => project.slug === slug) ?? null;
}
