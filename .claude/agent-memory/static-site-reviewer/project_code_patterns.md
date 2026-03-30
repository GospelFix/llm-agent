---
name: GospelFix 코드 패턴 및 컨벤션
description: 이 프로젝트에서 반복적으로 발견된 코드 스타일, 잠재적 이슈 패턴
type: project
---

## CSS 패턴
- CSS 변수 잘 정의됨 (`:root`에 색상, radius, 폰트 토큰)
- 포인트 컬러: `--orange: #FF5500`, `--orange2: #FF6B1A`
- 폰트: 한글 `Pretendard Variable`, 영문 제목 `DM Sans` (CLAUDE.md는 `Bebas Neue`라고 표기하나 실제로는 DM Sans)
- `Bebas Neue`, `Playfair Display`는 hero 타이틀 accent에만 사용 (실제로는 Playfair Display만 accent-playfair 클래스에 사용)
- 인라인 스타일이 render.js의 HTML 템플릿에서 다수 사용됨 (suffixStyle 등) — 반복 이슈
- `::before`/`::after`를 `display: none`으로 재정의하는 패턴 다수 존재 (이전 스타일 잔재): `.hero-noise`, `.stat-card::after`, `.process-item::after`, `.truth-section::before`, `.section-label::before`
- `.portfolio-notice`에서 CSS 변수 대신 하드코딩 색상 사용 (`#fff3e0`, `#ffcc80`, `#e65100`)
- `.contact-btn-kakao`에서 하드코딩 색상 사용 (`#FEE500`, `#111111`)
- `.contact-btn-insta`에서 하드코딩 색상 사용 — 브랜드 컬러라 의도적일 수 있음
- 데스크톱 퍼스트 반응형 (미디어 쿼리 max-width 기준)
- 반응형 브레이크포인트: 1024px, 900px, 768px, 640px, 540px, 480px — 다소 세분화됨
- 클래스 명명: BEM 완전 적용은 아니나, 섹션별 접두사로 일관성 유지 (`.hero-*`, `.stat-*`, `.service-*` 등)
- `.btn-outline`, `.btn-filled`, `.btn-primary`, `.btn-secondary`, `.btn-dark` 등 버튼 클래스 중복 구조 — 공통 베이스 없음
- `.pricing-features li .check { display: none; }` — 렌더링된 HTML의 체크 span을 CSS로 숨기고 `::before`로 대체하는 이중 구조

## JavaScript 패턴
- render.js: 모든 섹션을 innerHTML로 렌더링 — JSON에서 직접 HTML 삽입, XSS 위험
- main.js: siteDataReady 이벤트 기반으로 초기화
- 카운트업 애니메이션, IntersectionObserver, 틸트 효과 등 구현
- contactForm 폼은 HTML에 존재하지 않음 (버튼 방식으로 대체됨) — main.js의 #contact-form 로직은 데드 코드
- scroll 이벤트 리스너 2개 등록 (nav scrolled 토글, active nav 업데이트) — passive: true로 적절히 최적화됨
- 네비게이션 active 표시를 link.style.color 인라인 스타일로 직접 설정 (클래스 방식 권장)
- footer 연도를 JS로 동적 업데이트 (연도 하드코딩 없음 — 좋은 패턴)

## JSON 패턴
- stats.json: suffixStyle을 인라인 스타일 문자열로 전달 — CSS 클래스로 대체 권장
- portfolio.json: link 값이 모두 "#" — 미완성 콘텐츠
- pricing.json: 일부 인라인 스타일이 render.js 내 template literal에 직접 포함됨 (strikeHtml, priceHtml의 style 속성)
- 전반적 JSON 문법은 유효함 (trailing comma 없음, 키 따옴표 사용)

## HTML 패턴
- lang="ko" 설정됨, DOCTYPE 정상
- `<nav>` 시맨틱 태그 사용, `<header>` 없이 nav가 최상단 — 사소한 시맨틱 이슈
- `<main>` 래퍼 없음 — 접근성 랜드마크 부재
- `aria-label` 은 hamburger 버튼에만 적용됨
- 동적으로 생성되는 콘텐츠의 `alt` 텍스트 관리 불가 (JSON 데이터에 alt 필드 없음)
- `<div class="truth-section">` — section 태그를 쓰지 않은 CTA 배너

**Why:** 초기 개발 단계로 일부 콘텐츠/스타일이 완성되지 않은 상태.

**How to apply:** 리뷰 시 위 패턴들을 반복 이슈로 분류하고, 우선순위 높은 것부터 수정 권고.
