---
name: Frontend 코딩 규칙
scope: HTML, CSS, Vanilla JavaScript
updated: 2026-03-30
---

## 작업 흐름

새 기능 개발: 요구사항 파악 → 관련 파일 Read → 구현 → 변경 요약
페이지 생성: `pages/[이름].html` + `css/[이름].css` + `js/[이름].js` 3개 세트

---

## JavaScript

- `'use strict'` 모든 JS 파일 상단 선언 필수
- `const` → `let` 우선, `var` 금지
- 작은따옴표, 세미콜론 필수, `===` / `!==` 사용
- 화살표 함수 우선, async/await 사용
- 전역 변수 최소화 (Store만 IIFE 패턴 예외)
- 함수 구성 순서: 변수선언 → 헬퍼함수 → 초기화 → 실행

## 네이밍

- 변수/함수: `camelCase`
- 상수: `UPPER_SNAKE_CASE`
- 파일: `kebab-case`
- 불린: `is` / `has` / `should` 접두사

## HTML

- 시맨틱 태그 사용 (`main`, `aside`, `nav`, `section`)
- `aria-label`, `alt`, `role` 속성 필수

## CSS

- `css/style.css`의 CSS 변수 반드시 사용 (`--accent-pipe`, `--bg`, `--surface` 등)
- 모바일 우선 반응형, 터치 영역 최소 44px
- 페이지 전용 스타일은 별도 CSS 파일로 분리

## 주석

- 한국어로 작성, 복잡한 로직에만 추가
- 섹션 구분: `/* ─── 섹션명 ─── */`

---

## 절대 금지

- ❌ API 키 하드코딩 (`secrets/` 수정 금지)
- ❌ 기존 코드 무단 삭제 (주석 처리로 대체)
- ❌ 확인 없이 대규모 리팩토링
- ❌ `config/` 내 파일 임의 수정

## 필수 행동

- ✅ 파일 수정 전 해당 파일 먼저 Read
- ✅ 기존 코드 스타일 파악 후 일관성 유지
- ✅ 변경사항 요약 제공
- ✅ 애매한 요구사항은 작업 전 먼저 확인

---

## MVP 원칙

> "완벽보다 동작하는 것"

- 핵심 기능만 구현, 오버엔지니어링 금지
- 요청된 범위만 수정, 관련 없는 코드 건드리지 않기
