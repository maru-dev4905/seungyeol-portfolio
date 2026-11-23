import type { ProjectSection } from "@/lib/projects";
import styles from "./Section.module.css";

type Props = { section: Extract<ProjectSection, { type: "video" }> };

// 유튜브 주소에서 영상 id만 뽑는다. (watch?v=ID 와 youtu.be/ID 둘 다)
function getYoutubeId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "youtu.be") return parsed.pathname.slice(1) || null;
    return parsed.searchParams.get("v");
  } catch {
    return null;
  }
}

/** 영상: 본문 폭 16:9 칸(.video가 비율을 정하고 iframe이 칸을 채운다). */
export function VideoSection({ section }: Props) {
  const id = getYoutubeId(section.meta.youtubeUrl);
  if (!id) return null;

  return (
    <div className={styles.video}>
      <iframe
        // 쿠키를 쓰지 않는 도메인으로 임베드한다
        src={`https://www.youtube-nocookie.com/embed/${id}`}
        title="프로젝트 영상"
        loading="lazy"
        allow="accelerometer; encrypted-media; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
