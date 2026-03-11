---
name: Current Task
version: 1.0.0
updated: 2026-01-30
---

> 매 작업 시작 전 이 파일을 업데이트하세요!

---

## Goal
Claude Code 규칙 문서 정리 및 일관성 확보
- 프로젝트 파일들의 정체성 통일
- 실제 프로젝트 상태를 정확히 반영
- 재사용 가능한 규칙 저장소 구축

---

## Scope (이번 작업 범위)
- [x] `.claude/CONTEXT.md` 실제 프로젝트 상태에 맞게 수정
- [x] `.claude/TASK.md` 현실적인 작업으로 업데이트
- [x] `CLAUDE.md` (루트) 프로젝트 정보 채우기
- [ ] `ROADMAP.md`와의 정보 불일치 해결 (필요시)

---

## Out of Scope (건드리지 말 것)
- `prompt/` 폴더의 개별 규칙 파일 수정 금지
- `config/` 폴더 내용 수정 금지
- `.claude/settings.json` 권한 설정 변경 금지

---

## Expected Output
- 프로젝트 정체성이 명확하게 정의된 문서들
- 실제 상태와 일치하는 CONTEXT.md
- 실행 가능한 작업이 정의된 TASK.md
- 루트 CLAUDE.md의 프로젝트 정보 완성

---

## Context for AI
- 이 프로젝트는 **실제 서비스가 아닌 "규칙 저장소"**
- README.md의 설명이 가장 정확함: "MVP 컨텍스트 아키텍처"
- 실행 코드는 없으며, 문서만 존재
- 향후 실제 프로젝트에 이 규칙들을 적용할 예정

---

## Done Conditions (완료 기준)
1. ✅ CONTEXT.md가 실제 프로젝트 상태 정확히 반영
2. ✅ TASK.md가 실행 가능한 작업 포함
3. ✅ 루트 CLAUDE.md의 프로젝트명/목적/타겟 채워짐
4. ✅ 모든 문서가 일관된 프로젝트 정체성 표현

---

## Next Steps (향후 작업)

### 옵션 1: 규칙 저장소 계속 발전
- 추가 코딩 규칙 문서화
- 템플릿 파일 정리 및 확장
- 디자인 시스템 상세화

### 옵션 2: 실제 프로젝트 시작
- 기술 스택 선택 (Next.js / Vanilla JS)
- 프로젝트 초기 설정
- CONTEXT.md와 TASK.md를 새 프로젝트에 맞게 재작성

### 옵션 3: ROADMAP.md 통일
- ROADMAP.md의 "상세페이지 신청링크" 작업 검토
- 규칙 저장소와의 관계 정리
