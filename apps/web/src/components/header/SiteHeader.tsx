"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { prefersReducedMotion } from "@/lib/motion";
import { beginTransition, endTransition } from "@/lib/transition-gate";
import { beginTransitionKind, endTransitionKind, isTransitionLocked, onTransitionCancel } from "@/lib/transition-machine";
import { TL } from "@/lib/transition-timeline";
import { siteCopy } from "@/lib/site";
import { SeoulClock } from "./SeoulClock";
import { MenuOverlay, type MenuProject } from "./MenuOverlay";
import styles from "./SiteHeader.module.css";

// 편지봉투 아이콘. 글자색(currentColor)을 따라가는 선 아이콘이라 색 값을 따로 두지 않는다
function MailIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="m4 7.5 8 6 8-6" />
    </svg>
  );
}

// 메일 버튼 안쪽: 펼쳐질 때 나타나는 글자(왼쪽) + 아이콘(오른쪽, 항상 같은 자리).
// 글자는 aria-hidden이다: 링크의 이름은 aria-label이 정한다(스크린 리더에 두 번 읽히지 않게)
function MailLabel() {
  return (
    <>
      <span className={styles.mailText} aria-hidden="true">
        <span className={styles.mailTextInner}>Get in Touch!</span>
      </span>
      <span className={styles.mailIcon}>
        <MailIcon />
      </span>
    </>
  );
}

// 달(다크 -> 라이트로 바꾸는 버튼) / 해(라이트 -> 다크로 바꾸는 버튼)
function ThemeIcon({ light }: { light: boolean }) {
  return light ? (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  ) : (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5Z" />
    </svg>
  );
}

/**
 * 모든 페이지 공통 헤더(측정 1440x900): 왼쪽 Menu 알약(24,15 / 64x24) / 가운데 워드마크 / 오른쪽 서울 시각, 달 버튼, 메일 버튼.
 * 레이아웃에 한 번만 있으므로 페이지를 옮겨도 시계·메뉴·테마 상태가 유지된다.
 *  - 메뉴 열기: Menu 글자가 위로 슬라이드되며 "Close ✕"가 올라온다(폭 64 -> 77)
 *  - 달 버튼: 홈에서는 메뉴가 열렸을 때만, 그 밖의 페이지에서는 항상 보인다(원본과 같다)
 *  - 스크롤(홈 제외): 헤더가 가운데의 긴 알약 하나로 줄어든다(원본 케이스 스터디의 스크롤 헤더)
 */
export function SiteHeader({ projects }: { projects: MenuProject[] }) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [menuOpen, setMenuOpen] = useState(false);
  const [light, setLight] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const router = useRouter();
  // 항목을 눌러 이동 중(메뉴 프레임이 확대 면과 같은 시간표로 물러난다) = 전환 종류 "nav"
  const [navClose, setNavClose] = useState(false);
  // 로고 -> 홈 "커튼" 전환(종류 "home", lib/transition-machine.ts의 표):
  //   in      = 프레임이 가운데로 모여 화면을 완전히 가린다(옛 페이지는 조각 구멍으로 보이다 사라진다)
  //   arrived = 가린 채 홈으로 이동했고 홈이 첫 프레임을 그리길 기다린다(최소 TL.curtain.holdMs)
  //   out     = 프레임이 열려(물러나) 홈을 드러낸다
  const [curtain, setCurtain] = useState<"in" | "arrived" | "out" | null>(null);
  // 메뉴가 닫혀 있다가 로고로 시작한 커튼인가(true면 덮는 층(목업·형태)을 올리지 않는다: 옛 페이지가 구멍으로 보인다)
  const [bare, setBare] = useState(false);
  const gateHeld = useRef(false); // 커튼이 새 페이지 등장 연출 게이트를 붙잡고 있는가(해제는 한 번만)
  const menuBtnRef = useRef<HTMLButtonElement>(null);

  // 커튼이 켜져 있는 동안 <html data-curtain>: 홈 요소(.content)의 복귀 시각을 CSS가 커튼 시간표로 맞춘다
  useEffect(() => {
    const root = document.documentElement;
    if (curtain) root.dataset.curtain = curtain;
    else delete root.dataset.curtain;
    return () => {
      delete root.dataset.curtain;
    };
  }, [curtain]);

  // 스크롤이 어느 정도 내려가면 알약 하나로 줄인다. 페이지를 옮기면 맨 위로 돌아오므로 다시 계산한다
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 120);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname]);

  // 상태를 <html>의 data 속성으로 내보낸다: 색 토큰(globals.css)이 이 속성을 보고 바뀐다.
  useEffect(() => {
    const root = document.documentElement;
    if (menuOpen) root.dataset.menu = "open";
    else delete root.dataset.menu;
    return () => {
      delete root.dataset.menu;
    };
  }, [menuOpen]);

  // 홈은 항상 어두운 미디어 위에 글자가 올라가므로, 라이트 테마여도 헤더·커서는 흰색을 유지한다(메뉴가 열리면 제외)
  useEffect(() => {
    const root = document.documentElement;
    if (isHome && !menuOpen) root.dataset.surface = "media";
    else delete root.dataset.surface;
    return () => {
      delete root.dataset.surface;
    };
  }, [isHome, menuOpen]);

  useEffect(() => {
    const root = document.documentElement;
    if (light) root.dataset.theme = "light";
    else delete root.dataset.theme;
  }, [light]);

  // 커튼을 끝내거나 취소할 때의 공통 정리: 게이트(새 페이지 등장 연출)·자물쇠를 푼다
  const finishCurtain = () => {
    setCurtain(null);
    setBare(false);
    if (gateHeld.current) {
      gateHeld.current = false;
      endTransition();
    }
    endTransitionKind("home");
  };
  const finishRef = useRef(finishCurtain);
  useEffect(() => {
    finishRef.current = finishCurtain;
  });

  // 뒤로 가기·안전장치로 전환이 취소되면 커튼을 걷고 메뉴를 닫는다. 언마운트될 때도 같은 정리(게이트·자물쇠가 남지 않게)
  useEffect(() => {
    const off = onTransitionCancel(() => {
      if (!gateHeld.current) return; // 커튼 전환이 아니면 할 일 없음
      setMenuOpen(false);
      finishRef.current();
    });
    return () => {
      off();
      if (gateHeld.current) finishRef.current();
    };
  }, []);

  // 페이지 이동이 일어나면: 커튼 중(in)이면 "가린 채 도착"(arrived)으로 넘어가고(메뉴는 아직 닫지 않는다 = 프레임이 열리지 않는다),
  // 그 밖의 이동(알약·메뉴 링크)이면 메뉴를 닫는다. effect 대신 "렌더 중 상태 보정" 방식:
  // 이전 경로를 상태로 들고 있다가 달라진 것을 발견하면 같은 렌더 안에서 바로 반영한다(추가 렌더 없이 한 번에)
  const [prevPath, setPrevPath] = useState(pathname);
  if (prevPath !== pathname) {
    setPrevPath(pathname);
    if (curtain === "in") setCurtain("arrived");
    else if (!curtain) setMenuOpen(false);
  }
  if (menuOpen && navClose && curtain === null) setNavClose(false); // 다시 열리면 일반 열림·닫힘 시간표로 되돌린다

  // 커튼 전환의 시간표(lib/transition-timeline.ts의 TL.curtain, Metalab 실측):
  //   in: 닫힘이 끝난(완전히 가린) 순간 홈으로 이동 -> arrived: 홈이 그려지길 holdMs 기다린 뒤 -> out: 프레임이 열리고, 다 열리면 끝낸다.
  //   끝날 때 게이트를 풀어 홈 요소의 등장이 프레임이 다 물러난 뒤에 시작되게 한다
  useEffect(() => {
    if (curtain === "in") {
      const push = window.setTimeout(() => router.push("/"), TL.curtain.delay + TL.curtain.ms);
      // 안전장치: 이동이 안 되면 프레임을 되돌린다
      const safety = window.setTimeout(() => {
        setMenuOpen(false);
        finishRef.current();
      }, TL.curtain.delay + TL.curtain.ms + 4000);
      return () => {
        window.clearTimeout(push);
        window.clearTimeout(safety);
      };
    }
    if (curtain === "arrived") {
      let raf = 0;
      const t = window.setTimeout(() => {
        // 한 프레임 더: 홈이 숨김에서 풀린 뒤 첫 그림이 올라가야 열릴 때 빈 화면이 보이지 않는다
        raf = requestAnimationFrame(() => {
          setMenuOpen(false);
          setCurtain("out");
        });
      }, TL.curtain.holdMs);
      return () => {
        window.clearTimeout(t);
        cancelAnimationFrame(raf);
      };
    }
    if (curtain === "out") {
      const done = window.setTimeout(() => finishRef.current(), TL.curtain.delay + TL.curtain.ms + 50);
      return () => window.clearTimeout(done);
    }
  }, [curtain, router]);

  // 로고 클릭(모든 페이지, 메뉴가 열려 있든 닫혀 있든 같다): 프레임이 가운데로 모여 화면을 가린 뒤 홈으로 이동하고 열린다.
  // 이미 홈이면 메뉴만 닫는다. 보조키·움직임 줄이기면 보통 링크(메뉴가 열려 있으면 닫는다). 전환 중이면 무시한다
  const goHome = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    if (isTransitionLocked()) {
      e.preventDefault();
      return;
    }
    if (isHome || prefersReducedMotion()) {
      if (isHome) e.preventDefault();
      setMenuOpen(false);
      return;
    }
    if (!beginTransitionKind("home")) return;
    e.preventDefault();
    beginTransition(); // 홈의 등장 연출은 프레임이 다 열릴 때까지 기다린다
    gateHeld.current = true;
    setBare(!menuOpen);
    setNavClose(true);
    setCurtain("in");
    setMenuOpen(true);
  };

  // 메뉴 안 링크(항목·알약)를 눌렀을 때: 프레임이 전환 타임라인 시간표로 물러나게 표시하고 메뉴를 닫는다
  const onNav = () => {
    setNavClose(true);
    setMenuOpen(false);
  };

  const close = () => {
    if (isTransitionLocked()) return; // 전환 중에는 메뉴 입력을 받지 않는다
    setMenuOpen(false);
    menuBtnRef.current?.focus({ preventScroll: true }); // 닫으면 Menu 버튼으로 돌아온다
  };

  const openMenu = () => {
    if (!isTransitionLocked()) setMenuOpen(true);
  };

  const compact = scrolled && !isHome && !menuOpen;
  const showTheme = !isHome || menuOpen;

  return (
    <>
      <header className={styles.header} data-compact={compact || undefined}>
        <div className={styles.bar}>
          <button
            ref={menuBtnRef}
            type="button"
            className={`pill ${styles.menuBtn}`}
            data-needs-js
            data-open={menuOpen || undefined}
            aria-haspopup="dialog"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Close the main navigation menu" : "Open the main navigation menu"}
            onClick={() => (menuOpen ? close() : openMenu())}
          >
            {/* 두 글자를 같은 칸(grid)에 겹쳐 놓고 알약 정중앙에 둔다(글꼴 폭이 달라도 중앙). 열리면 Menu는 위로, Close ✕는 아래에서 올라온다(측정: 23.1px = 줄 높이의 105%) */}
            <span className={styles.label} aria-hidden="true">
              <span className={styles.menuText}>Menu</span>
              <span className={styles.closeText}>
                Close
                <svg className={styles.xIcon} width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2.625 2.625L9.375 9.375M2.625 9.375L9.375 2.625" stroke="currentColor" />
                </svg>
              </span>
            </span>
          </button>

          {/* 로고: 메뉴가 열려 있든 닫혀 있든 같은 커튼 전환이다(goHome). data-handoff-link: 자기 전환이 있으므로 전역 페이드(PageFade)가 끼어들지 않는다 */}
          <Link href="/" className={styles.brand} aria-label={`${siteCopy.name} 홈`} data-handoff-link onClick={goHome}>
            {siteCopy.name}
          </Link>

          <div className={styles.right}>
            <SeoulClock />
            {showTheme && (
              <button
                type="button"
                className={`pill ${styles.round}`}
                data-needs-js
                aria-label={light ? "Turn on dark theme" : "Turn on light theme"}
                onClick={() => setLight((v) => !v)}
              >
                <ThemeIcon light={light} />
              </button>
            )}
            {/* 메일 버튼: 칸(.mailSlot)은 24x24로 고정이고, 버튼은 그 칸의 오른쪽 끝에 붙어 hover·focus 때 왼쪽으로만 늘어난다(옆 시계·달 버튼을 밀지 않는다).
                눌러서 /contact 페이지로 간다(메일 앱을 바로 여는 mailto가 아니다: 복사·메일 보내기 선택지는 그 페이지에 있다). 전환은 일반 링크의 페이드(PageFade) */}
            <span className={styles.mailSlot}>
              <Link href="/contact" className={`pill ${styles.round} ${styles.mail}`} aria-label="연락하기">
                <MailLabel />
              </Link>
            </span>
          </div>
        </div>
      </header>

      <MenuOverlay open={menuOpen} onClose={close} projects={projects} curtain={curtain} bare={bare} navClose={navClose} onNav={onNav} />
    </>
  );
}
