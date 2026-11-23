import { Media } from "@/components/media/Media";
import { BirthValue } from "./BirthValue";
import { Lines } from "@/components/motion/Lines";
import { RevealGroup } from "@/components/motion/RevealGroup";
import { Rule } from "@/components/motion/Rule";
import { profile, socialLinks } from "@/lib/about";
import { siteCopy } from "@/lib/site";
import styles from "./About.module.css";

// 히어로 진입(CSS, 약 1.3초)이 끝나 갈 무렵 이어서 시작한다(첫 화면에 이미 보일 때만 적용되는 지연)
const AFTER_HERO = 0.9;

/**
 * Profile 블록(About 히어로 바로 아래, #intro에 속한다). "누구고 뭘 하는 사람인가"를 한 장의 에디토리얼 프로필 카드처럼 보여 준다.
 * 큰 글자·숫자·겹침을 버리고, 여백·정렬·헤어라인·타이포 위계로만 정돈한다(카드 상자 없음).
 *
 * 레이아웃: 12열 그리드. 왼쪽 4열에 3:4 사진 한 장(스크롤하면 위에 붙어 따라온다), 오른쪽 7열(6~12열)에 위에서 아래로
 *   라벨 -> 영문 이름 + 국문 이름 -> 한 줄 문구 -> 정의 목록 4행 -> 요약 -> 링크.
 * 정보 위계: 이름 > 한 줄 문구 > 정의 목록(경력이 첫 화면에 들어오게 요약보다 위) > 요약 > 링크.
 * 모바일: 사진이 위, 정보가 아래 한 열.
 * 모션은 하나의 RevealGroup 타임라인: 구분선 -> 라벨 -> 이름 줄 -> 사진 clip -> 문구 -> 목록 행 스태거 -> 요약·링크. JS 없음·움직임 줄이기에서는 정적이다.
 * 사진: 사이트 주인의 개인 사진(public/images/seungyeol/profile-cap.webp, 594x742). 얼굴이 있는 프로필이라 alt를 둔다.
 */
export function ProfileBlock() {
  return (
    <RevealGroup className={styles.profile} aria-label="Profile" delay={AFTER_HERO}>
      <Rule className={styles.profileRule} />

      <div className={styles.profileGrid}>
        {/* 사진 칸: 3:4 틀. data-r="media"라 RevealGroup이 틀을 위 -> 아래로 열고 안쪽 사진을 1.08 -> 1로 줄인다(약한 clip reveal) */}
        <div className={styles.profilePhoto}>
          <div className={styles.profileFrame} data-r="media">
            <Media
              tint="indigo"
              media={{ image: "/images/seungyeol/profile-cap.webp" }}
              alt="모자를 쓰고 팔목을 보는 이승열의 사진"
              label={false}
              sizes="(max-width: 768px) 80vw, 370px"
              priority
              position="50% 38%"
            />
          </div>
        </div>

        <div className={styles.profileInfo}>
          <p className={styles.profileTag} data-r="label">
            Profile
          </p>

          {/* 영문 이름(메인) + 국문 이름(작게, 같은 기준선) */}
          <div className={styles.profileNameRow}>
            <Lines as="h2" className={styles.profileName} lines={[profile.nameEn]} />
            <p className={styles.profileNameKo} data-r="label" lang="ko">
              {profile.nameKo}
            </p>
          </div>

          <p className={styles.profileHeadline} data-r="body" lang="ko">
            {profile.headline}
          </p>

          {/* 정의 목록: 헤어라인으로만 나눈 4행. dt(라벨)가 왼쪽, dd(값)가 오른쪽 */}
          <dl className={styles.facts}>
            {profile.facts.map((f) => (
              <div key={f.label} className={styles.fact} data-r="item">
                <dt>{f.label}</dt>
                <dd lang="ko">{f.birth ? <BirthValue text={f.value} birth={f.birth} /> : f.value}</dd>
              </div>
            ))}
          </dl>

          <p className={styles.profileSummary} data-r="body" lang="ko">
            {profile.summary}
          </p>

          {/* 링크는 이메일·GitHub 2개만, 알약 */}
          <ul className={styles.profileLinks} data-r="body">
            <li>
              <a className={`pill ${styles.profileLink}`} href={`mailto:${siteCopy.email}`}>
                Email
              </a>
            </li>
            <li>
              <a className={`pill ${styles.profileLink}`} href={socialLinks[0].href} target="_blank" rel="noopener noreferrer">
                {socialLinks[0].label}
                <span className="sr-only"> (새 탭)</span>
              </a>
            </li>
          </ul>
        </div>
      </div>
    </RevealGroup>
  );
}
