---
name: GospelFix 랜딩 페이지 프로젝트 구조
description: GospelFix 정적 랜딩 페이지의 핵심 구조, 데이터 흐름, 파일 위치 정보
type: project
---

빌드 도구 없는 순수 정적 사이트. GitHub Pages로 배포, Live Server(포트 5502)로 로컬 실행.

실제 파일 경로:
- HTML: `index.html`
- CSS: `assets/css/style.css`, `assets/css/fonts.css`
- JS: `assets/js/render.js`, `assets/js/main.js`
- 데이터: `assets/data/*.json` (ticker, stats, services, portfolio, process, pricing)

CLAUDE.md의 경로 표기(`css/style.css`, `js/render.js`)와 실제 경로(`assets/css/`, `assets/js/`)가 다름 — 주의 필요.

**Why:** 프로젝트 초기 구조에서 assets 폴더 구조로 변경된 것으로 추정.

**How to apply:** 파일 읽기/수정 시 항상 `assets/` 하위 경로 사용.
