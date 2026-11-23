import { Lines } from "@/components/motion/Lines";
import { RevealGroup } from "@/components/motion/RevealGroup";
import { hobbies, hobbyCopy } from "@/lib/about";
import { HobbyTrack } from "./HobbyTrack";
import styles from "./About.module.css";

/**
 * 취미 섹션(Profile 바로 아래, Intro에 속한다. 하단 알약에는 따로 넣지 않는다).
 * Metalab About의 "Diverse perspectives, world-class work" 구성: 검은 바탕, 크기·높이가 제각각인 사진들, 그 위에 걸쳐 놓인 가운데 세리프 헤드라인. 본문 단락은 없다(라벨과 헤드라인만).
 * 차이점: 뒤의 사진들이 고정이 아니라 가로로 아주 천천히 흘러간다(HobbyTrack).
 * 겹친 글자가 읽히도록 사진마다 검정 오버레이(hobbies의 dim)를 덮는다. 문구·사진은 lib/about.ts의 hobbyCopy·hobbies만 고치면 된다.
 * 글 모션은 RevealGroup 규칙(라벨 -> 헤드라인 줄). 사진 트랙은 이 타임라인과 별개로 계속 흐른다.
 * 라벨·헤드라인은 데스크톱·모바일 모두 사진 위에 겹친다.
 */
export function HobbySection() {
  return (
    <RevealGroup as="section" id="hobby" className={styles.hobby} aria-label="Hobby">
      <HobbyTrack items={hobbies} />
      <p className={styles.hobbyTag} data-r="label">
        {hobbyCopy.label}
      </p>
      <Lines as="h2" className={styles.hobbyTitle} lines={hobbyCopy.headline} />
    </RevealGroup>
  );
}
