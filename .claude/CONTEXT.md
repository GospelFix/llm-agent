---
name: Project Context
version: 1.0.0
updated: 2026-01-30
---

## Overview
- **프로젝트명**: Claude Code MVP 규칙 저장소
- **목적**: Claude Code 개발 시 사용할 코드 컨벤션, 규칙, 프롬프트 템플릿 정리
- **타겟**: Claude Code를 활용한 MVP 개발자
- **유형**: 메타 프로젝트 (코드 규칙 정의 및 문서화)

---

## Tech Stack
- **문서화**: Markdown
- **버전 관리**: Git
- **규칙 적용 대상**: HTML5, CSS3, Vanilla JavaScript (ES6+)
- **향후 확장 가능**: Next.js, React, TypeScript 등

---

## Architecture

```
.claude/                  # Claude Code 설정
├── CONTEXT.md            # 프로젝트 컨텍스트
├── TASK.md               # 현재 작업
├── CLAUDE.md             # 코드 스타일 가이드
├── RULES.md              # Claude 행동 규칙
└── settings.json         # 권한 설정

config/                   # 기술 스택 정의
├── mvp-stack.yaml        # 기술 스택 상세
└── design-system.md      # 디자인 시스템

prompt/                   # 개발 규칙 (15개 파일)
├── architecture-prompt.md
├── code-checklist.md
├── code-safety.md
├── code-structure.md
├── comments-documentation.md
├── css-rules.md
├── formatting-guide.md
├── html-rules.md
├── javascript-rules.md
├── mock-data-rules.md
├── naming-conventions.md
├── review-checklist.md
└── templates.md
```

---

## Key Decisions
- 실행 코드 없이 규칙만 정의 (문서 기반)
- MVP 개발 시 참조할 표준 컨벤션 제공
- 모바일 퍼스트 반응형 디자인 규칙 적용
- 보안, 접근성, 성능 최적화 규칙 포함
- 한국어 주석 및 문서화 표준 적용

---

## File Structure

### `.claude/` - Claude Code 설정
Claude Code가 프로젝트를 이해하고 작업하는 데 필요한 메타 정보

### `config/` - 기술 스택 정의
적용할 기술 스택과 디자인 시스템 정의

### `prompt/` - 개발 규칙
HTML, CSS, JavaScript 등 각 영역별 상세 코딩 규칙

---

## Usage

### 새 프로젝트 시작 시
1. 이 규칙 저장소 복제
2. 프로젝트 정보에 맞게 CONTEXT.md, TASK.md 수정
3. 필요한 규칙 파일만 선택적으로 활용

### 개발 중
1. `.claude/CLAUDE.md` - 코드 스타일 가이드 참조
2. `prompt/[관련-규칙].md` - 상세 규칙 확인
3. `config/design-system.md` - 디자인 토큰 활용
