---
name: review
description: 최근 변경된 HTML, CSS, JS 파일을 llm.agent 프로젝트 기준으로 코드 품질 검토합니다
argument-hint: "[파일명 또는 모듈명 - 생략 시 전체 검토]"
user-invocable: true
---

llm.agent 프로젝트의 코드 품질 리뷰를 수행합니다.

## 리뷰 대상

$ARGUMENTS가 있으면 해당 파일/모듈만 검토합니다.
없으면 아래 파일 전체를 검토합니다:

**JS 모듈**
- `js/store.js` — localStorage 상태 관리 (IIFE 패턴)
- `js/app.js` — 사이드바 렌더링 및 공통 초기화
- `js/pipeline.js` — 파이프라인 실행 및 API 키 UI
- `js/agents.js` — 에이전트 설정 페이지
- `js/pipeline-editor.js` — 커스텀 파이프라인 편집기
- `js/settings.js` — 설정 페이지

**HTML / CSS**
- `index.html` + `css/style.css` — 공통 레이아웃 및 변수
- `pages/*.html` — 각 페이지 마크업

## 프로젝트 컨텍스트

- 빌드 도구 없는 순수 정적 사이트 (Vanilla JS)
- 상태 관리: `Store` (localStorage, KEY = `mas_state`)
- Multi-provider AI 지원: Claude / OpenAI / 커스텀(OpenAI-compatible)
- `'use strict'` + const/let + 화살표 함수 + 한국어 주석 필수
- CSS 변수: `--accent-pipe(빨강)` / `--accent-dev(초록)` / `--accent-pm(주황)` / `--accent-design(보라)`

## 리뷰 체크포인트

1. **보안** — API 키 노출 여부, XSS 취약점
2. **상태 관리** — Store 읽기/쓰기 패턴 준수 여부
3. **접근성** — aria-label, 시맨틱 태그, alt 속성
4. **반응형** — 모바일 레이아웃, 햄버거 메뉴 동작
5. **코드 스타일** — 컨벤션(camelCase, UPPER_SNAKE_CASE, 한국어 주석) 준수
