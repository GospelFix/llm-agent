---
name: 현재 작업 및 로드맵
updated: 2026-03-30
---

> 새 작업 시작 전 이 파일을 업데이트하세요.

---

## 현재 작업

### 진행 중
- `.claude/` 디렉토리 구조를 이미지 기준으로 재구성 (agents / rules / skills 분리)

### 완료
- `pages/skills-guide.html` — Claude Skills 가이드 페이지 추가
- `css/skills-guide.css` — 가이드 페이지 전용 스타일
- `js/app.js` — 사이드바 "설정 > Claude Skills" 메뉴 추가
- `.claude/skills/commit`, `review` — 이 프로젝트에 맞게 업데이트
- `.claude/skills/develop.md` — commands → skills 방식으로 마이그레이션

---

## Out of Scope (건드리지 말 것)

- `prompt/` 폴더 개별 규칙 파일 수정 금지
- `config/` 폴더 내용 수정 금지
- `.claude/settings.json` 권한 설정 변경 금지

---

## 다음 작업 후보

- `agents/` 폴더에 프로젝트 전용 에이전트 추가 (code-reviewer, debugger 등)
- `hooks/` 폴더 생성 및 pre-commit 훅 추가
