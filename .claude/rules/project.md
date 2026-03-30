---
name: 프로젝트 컨텍스트
updated: 2026-03-30
---

## 프로젝트 개요

- **프로젝트명**: llm-agent (LLM 멀티에이전트 파이프라인 도구)
- **목적**: 비개발자도 LLM 멀티에이전트 파이프라인을 설계·실행할 수 있는 도구
- **유형**: 빌드 도구 없는 순수 정적 사이트 (Vanilla JS)

---

## 기술 스택

- HTML5, CSS3, Vanilla JavaScript (ES6+)
- 빌드 도구 없음 — 브라우저에서 직접 실행
- 상태 관리: `Store` (localStorage, KEY = `mas_state`) — `js/store.js`
- Multi-provider AI 지원: Claude / OpenAI / 커스텀(OpenAI-compatible)

---

## 파일 구조

```
index.html             # 파이프라인 메인 페이지
pages/                 # 서브 페이지
css/                   # 스타일 (style.css 공통 + 페이지별)
js/
├── store.js           # 상태 관리 (IIFE 패턴)
├── app.js             # 사이드바·공통 초기화 (모든 페이지 로드)
├── pipeline.js        # 파이프라인 실행 + API 키 UI
├── agents.js          # 에이전트 설정
├── pipeline-editor.js # 커스텀 파이프라인 편집기
└── settings.js        # 설정 페이지
data/                  # JSON 데이터
.claude/
├── agents/            # 에이전트 정의
├── rules/             # 코딩 규칙 (이 폴더)
├── skills/            # 슬래시 커맨드
└── settings.json      # 권한 설정
```

---

## 핵심 설계 결정

- `detectProvider(model)` — 모델명 기반 provider 감지 (`claude-*` / `gpt-*` / 나머지→custom)
- `callAI(prompt, model)` — Store에서 apiKeys 직접 읽음
- 스텝별 provider 키 없으면 해당 스텝만 목업 모드로 실행
- CSS 변수: `--accent-pipe(빨강)` / `--accent-dev(초록)` / `--accent-pm(주황)` / `--accent-design(보라)`
